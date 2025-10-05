const logger = require('../config/logger');

/**
 * WebSocket Authorization Service
 * Manages room access permissions and user authorization
 */

/**
 * Room permission types
 */
const ROOM_PERMISSIONS = {
  PUBLIC: 'public', // Anyone can join
  PRIVATE: 'private', // Only invited users
  ROLE_BASED: 'role-based', // Based on user roles
  OWNER_ONLY: 'owner-only', // Only resource owner
};

/**
 * User roles hierarchy
 */
const ROLE_HIERARCHY = {
  admin: 100,
  moderator: 50,
  user: 10,
  guest: 0,
};

/**
 * Check if user has required role
 * @param {string} userRole - User's role
 * @param {string} requiredRole - Required role
 * @returns {boolean}
 */
function hasRole(userRole, requiredRole) {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
}

/**
 * Parse room ID to determine type and permissions
 * Room ID format: entity:id or entity:filter:value
 * Examples:
 * - data:users (public data subscription)
 * - chat:room123 (chat room)
 * - notifications:userId (private notifications)
 * - admin:metrics (role-based access)
 */
function parseRoomId(roomId) {
  const parts = roomId.split(':');

  if (parts.length < 2) {
    return {
      type: 'unknown',
      entity: parts[0],
      permission: ROOM_PERMISSIONS.PUBLIC,
    };
  }

  const [entity, identifier, ...filters] = parts;

  // Define permission rules based on entity type
  const permissionRules = {
    // Public data subscriptions
    data: ROOM_PERMISSIONS.PUBLIC,

    // Private user-specific rooms
    notifications: ROOM_PERMISSIONS.OWNER_ONLY,
    messages: ROOM_PERMISSIONS.PRIVATE,

    // Role-based rooms
    admin: ROOM_PERMISSIONS.ROLE_BASED,
    moderator: ROOM_PERMISSIONS.ROLE_BASED,

    // Chat rooms (can be public or private)
    chat: ROOM_PERMISSIONS.PUBLIC,
  };

  return {
    type: entity,
    entity,
    identifier,
    filters: filters.length > 0 ? filters : null,
    permission: permissionRules[entity] || ROOM_PERMISSIONS.PUBLIC,
  };
}

/**
 * Check if user can join a specific room
 * @param {object} user - User object with _id, role, etc.
 * @param {string} roomId - Room identifier
 * @param {object} options - Additional options (invited users, owner, etc.)
 * @returns {object} - { authorized, reason }
 */
function canJoinRoom(user, roomId, options = {}) {
  if (!user || !user._id) {
    logger.warn('Authorization check failed: invalid user', { roomId });
    return {
      authorized: false,
      reason: 'Invalid user',
    };
  }

  const userId = user._id.toString();
  const userRole = user.role || 'user';
  const roomInfo = parseRoomId(roomId);

  logger.debug('Checking room authorization', {
    userId,
    username: user.username,
    roomId,
    roomType: roomInfo.type,
    permission: roomInfo.permission,
  });

  // Check based on permission type
  switch (roomInfo.permission) {
    case ROOM_PERMISSIONS.PUBLIC:
      // Anyone can join public rooms
      return { authorized: true };

    case ROOM_PERMISSIONS.OWNER_ONLY: {
      // Check if user is the owner (identifier matches userId)
      const isOwner = roomInfo.identifier === userId;

      if (!isOwner) {
        logger.warn('Room access denied: owner only', {
          userId,
          roomId,
          expectedOwner: roomInfo.identifier,
        });
        return {
          authorized: false,
          reason: 'Access denied: owner only',
        };
      }

      return { authorized: true };
    }

    case ROOM_PERMISSIONS.PRIVATE: {
      // Check if user is owner or in invited list
      const isOwner = roomInfo.identifier === userId;
      const isInvited = options.invitedUsers?.includes(userId);

      if (!isOwner && !isInvited) {
        logger.warn('Room access denied: private room', {
          userId,
          roomId,
          hasInvitedList: !!options.invitedUsers,
        });
        return {
          authorized: false,
          reason: 'Access denied: private room',
        };
      }

      return { authorized: true };
    }

    case ROOM_PERMISSIONS.ROLE_BASED: {
      // Check if user has required role
      const requiredRole = roomInfo.entity; // 'admin' or 'moderator'

      if (!hasRole(userRole, requiredRole)) {
        logger.warn('Room access denied: insufficient role', {
          userId,
          roomId,
          userRole,
          requiredRole,
        });
        return {
          authorized: false,
          reason: `Access denied: ${requiredRole} role required`,
        };
      }

      return { authorized: true };
    }

    default:
      // Default to denying access for unknown permission types
      logger.warn('Room access denied: unknown permission type', {
        userId,
        roomId,
        permission: roomInfo.permission,
      });
      return {
        authorized: false,
        reason: 'Access denied: unknown permission type',
      };
  }
}

/**
 * Check if user can broadcast to a room
 * (stricter than joining)
 */
function canBroadcastToRoom(user, roomId, options = {}) {
  const joinCheck = canJoinRoom(user, roomId, options);

  if (!joinCheck.authorized) {
    return joinCheck;
  }

  // Additional checks for broadcasting
  const roomInfo = parseRoomId(roomId);
  const userRole = user.role || 'user';

  // For data rooms, only admins can broadcast
  if (roomInfo.type === 'data' && !hasRole(userRole, 'admin')) {
    logger.warn('Broadcast denied: insufficient permissions for data room', {
      userId: user._id.toString(),
      roomId,
      userRole,
    });
    return {
      authorized: false,
      reason: 'Broadcast denied: admin role required for data rooms',
    };
  }

  return { authorized: true };
}

/**
 * Get rooms user has access to based on filters
 * @param {object} user - User object
 * @param {string} entity - Entity type (e.g., 'data', 'chat')
 * @param {object} filters - Room filters
 * @returns {array} - List of room IDs user can access
 */
function getUserAuthorizedRooms(user, entity, filters = {}) {
  const userId = user._id.toString();
  const rooms = [];

  // Public data rooms
  if (entity === 'data') {
    const filterStr = Object.entries(filters)
      .map(([key, value]) => `${key}:${value}`)
      .join(':');
    const roomId = filterStr ? `data:${entity}:${filterStr}` : `data:${entity}`;
    rooms.push(roomId);
  }

  // User's private rooms
  rooms.push(`notifications:${userId}`);
  rooms.push(`messages:${userId}`);

  // Role-based rooms
  const userRole = user.role || 'user';
  if (hasRole(userRole, 'admin')) {
    rooms.push('admin:metrics');
    rooms.push('admin:logs');
  }
  if (hasRole(userRole, 'moderator')) {
    rooms.push('moderator:reports');
  }

  return rooms;
}

/**
 * Audit room access attempt
 */
function auditRoomAccess(user, roomId, authorized, reason) {
  const logData = {
    userId: user._id.toString(),
    username: user.username,
    userRole: user.role,
    roomId,
    authorized,
    timestamp: new Date().toISOString(),
  };

  if (!authorized) {
    logData.reason = reason;
    logger.warn('Room access audit: DENIED', logData);
  } else {
    logger.info('Room access audit: GRANTED', logData);
  }
}

module.exports = {
  ROOM_PERMISSIONS,
  ROLE_HIERARCHY,
  hasRole,
  parseRoomId,
  canJoinRoom,
  canBroadcastToRoom,
  getUserAuthorizedRooms,
  auditRoomAccess,
};
