// Mock logger before requiring authorization
jest.mock('../../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  stream: {
    write: jest.fn(),
  },
}));

const {
  ROOM_PERMISSIONS,
  ROLE_HIERARCHY,
  hasRole,
  parseRoomId,
  canJoinRoom,
  canBroadcastToRoom,
  getUserAuthorizedRooms,
  auditRoomAccess,
} = require('../../../src/websocket/authorization');

describe('WebSocket Authorization', () => {
  describe('ROLE_HIERARCHY', () => {
    it('should define role hierarchy', () => {
      expect(ROLE_HIERARCHY.admin).toBe(100);
      expect(ROLE_HIERARCHY.moderator).toBe(50);
      expect(ROLE_HIERARCHY.user).toBe(10);
      expect(ROLE_HIERARCHY.guest).toBe(0);
    });
  });

  describe('ROOM_PERMISSIONS', () => {
    it('should define permission types', () => {
      expect(ROOM_PERMISSIONS.PUBLIC).toBe('public');
      expect(ROOM_PERMISSIONS.PRIVATE).toBe('private');
      expect(ROOM_PERMISSIONS.ROLE_BASED).toBe('role-based');
      expect(ROOM_PERMISSIONS.OWNER_ONLY).toBe('owner-only');
    });
  });

  describe('hasRole', () => {
    it('should return true for equal roles', () => {
      expect(hasRole('user', 'user')).toBe(true);
      expect(hasRole('admin', 'admin')).toBe(true);
    });

    it('should return true for higher roles', () => {
      expect(hasRole('admin', 'user')).toBe(true);
      expect(hasRole('admin', 'moderator')).toBe(true);
      expect(hasRole('moderator', 'user')).toBe(true);
    });

    it('should return false for lower roles', () => {
      expect(hasRole('user', 'admin')).toBe(false);
      expect(hasRole('user', 'moderator')).toBe(false);
      expect(hasRole('guest', 'user')).toBe(false);
    });

    it('should handle unknown roles as guest level', () => {
      expect(hasRole('unknown', 'user')).toBe(false);
      expect(hasRole('admin', 'unknown')).toBe(true);
    });
  });

  describe('parseRoomId', () => {
    it('should parse data room as PUBLIC', () => {
      const result = parseRoomId('data:users');
      expect(result.type).toBe('data');
      expect(result.entity).toBe('data');
      expect(result.identifier).toBe('users');
      expect(result.permission).toBe(ROOM_PERMISSIONS.PUBLIC);
    });

    it('should parse notifications as OWNER_ONLY', () => {
      const result = parseRoomId('notifications:user123');
      expect(result.type).toBe('notifications');
      expect(result.permission).toBe(ROOM_PERMISSIONS.OWNER_ONLY);
    });

    it('should parse admin rooms as ROLE_BASED', () => {
      const result = parseRoomId('admin:metrics');
      expect(result.type).toBe('admin');
      expect(result.permission).toBe(ROOM_PERMISSIONS.ROLE_BASED);
    });

    it('should parse chat rooms as PUBLIC', () => {
      const result = parseRoomId('chat:room123');
      expect(result.type).toBe('chat');
      expect(result.permission).toBe(ROOM_PERMISSIONS.PUBLIC);
    });

    it('should handle room IDs with filters', () => {
      const result = parseRoomId('data:users:status:active');
      expect(result.type).toBe('data');
      expect(result.filters).toEqual(['status', 'active']);
    });

    it('should handle malformed room IDs', () => {
      const result = parseRoomId('singlepart');
      expect(result.type).toBe('unknown');
      expect(result.permission).toBe(ROOM_PERMISSIONS.PUBLIC);
    });
  });

  describe('canJoinRoom', () => {
    const mockUser = {
      _id: 'user123',
      username: 'testuser',
      role: 'user',
    };

    it('should allow public room access', () => {
      const result = canJoinRoom(mockUser, 'data:users');
      expect(result.authorized).toBe(true);
    });

    it('should allow owner to join OWNER_ONLY room', () => {
      const result = canJoinRoom(mockUser, 'notifications:user123');
      expect(result.authorized).toBe(true);
    });

    it('should deny non-owner from OWNER_ONLY room', () => {
      const result = canJoinRoom(mockUser, 'notifications:otheruser');
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain('owner only');
    });

    it('should allow invited user to PRIVATE room', () => {
      const options = { invitedUsers: ['user123'] };
      const result = canJoinRoom(mockUser, 'messages:private123', options);
      expect(result.authorized).toBe(true);
    });

    it('should deny uninvited user from PRIVATE room', () => {
      const options = { invitedUsers: ['otheruser'] };
      const result = canJoinRoom(mockUser, 'messages:private123', options);
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain('private room');
    });

    it('should allow admin to join ROLE_BASED admin room', () => {
      const adminUser = { ...mockUser, role: 'admin' };
      const result = canJoinRoom(adminUser, 'admin:metrics');
      expect(result.authorized).toBe(true);
    });

    it('should deny regular user from ROLE_BASED admin room', () => {
      const result = canJoinRoom(mockUser, 'admin:metrics');
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain('admin role required');
    });

    it('should allow moderator to join moderator room', () => {
      const modUser = { ...mockUser, role: 'moderator' };
      const result = canJoinRoom(modUser, 'moderator:reports');
      expect(result.authorized).toBe(true);
    });

    it('should deny invalid user', () => {
      const result = canJoinRoom(null, 'data:users');
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain('Invalid user');
    });

    it('should deny user without _id', () => {
      const invalidUser = { username: 'test' };
      const result = canJoinRoom(invalidUser, 'data:users');
      expect(result.authorized).toBe(false);
    });
  });

  describe('canBroadcastToRoom', () => {
    const mockUser = {
      _id: 'user123',
      username: 'testuser',
      role: 'user',
    };

    it('should allow admin to broadcast to data rooms', () => {
      const adminUser = { ...mockUser, role: 'admin' };
      const result = canBroadcastToRoom(adminUser, 'data:users');
      expect(result.authorized).toBe(true);
    });

    it('should deny regular user from broadcasting to data rooms', () => {
      const result = canBroadcastToRoom(mockUser, 'data:users');
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain('admin role required');
    });

    it('should allow broadcast to non-data rooms if user can join', () => {
      const result = canBroadcastToRoom(mockUser, 'chat:room123');
      expect(result.authorized).toBe(true);
    });

    it('should inherit join restrictions', () => {
      const result = canBroadcastToRoom(mockUser, 'notifications:otheruser');
      expect(result.authorized).toBe(false);
    });
  });

  describe('getUserAuthorizedRooms', () => {
    it('should return authorized rooms for regular user', () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        role: 'user',
      };
      const rooms = getUserAuthorizedRooms(mockUser, 'data');
      expect(rooms).toContain('data:data');
      expect(rooms).toContain('notifications:user123');
      expect(rooms).toContain('messages:user123');
      expect(rooms.length).toBeGreaterThan(0);
    });

    it('should include admin rooms for admin users', () => {
      const adminUser = {
        _id: 'admin123',
        username: 'admin',
        role: 'admin',
      };
      const rooms = getUserAuthorizedRooms(adminUser, 'data');
      expect(rooms).toContain('admin:metrics');
      expect(rooms).toContain('admin:logs');
    });

    it('should include moderator rooms for moderators', () => {
      const modUser = {
        _id: 'mod123',
        username: 'moderator',
        role: 'moderator',
      };
      const rooms = getUserAuthorizedRooms(modUser, 'data');
      expect(rooms).toContain('moderator:reports');
    });

    it('should handle filters in room IDs', () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        role: 'user',
      };
      const rooms = getUserAuthorizedRooms(mockUser, 'data', { status: 'active' });
      expect(rooms[0]).toContain('status:active');
    });
  });

  describe('auditRoomAccess', () => {
    const mockUser = {
      _id: 'user123',
      username: 'testuser',
      role: 'user',
    };

    it('should audit granted access', () => {
      const logger = require('../../../src/config/logger');
      auditRoomAccess(mockUser, 'data:users', true);
      expect(logger.info).toHaveBeenCalledWith(
        'Room access audit: GRANTED',
        expect.objectContaining({
          userId: 'user123',
          username: 'testuser',
          roomId: 'data:users',
          authorized: true,
        })
      );
    });

    it('should audit denied access with reason', () => {
      const logger = require('../../../src/config/logger');
      auditRoomAccess(mockUser, 'admin:metrics', false, 'Insufficient permissions');
      expect(logger.warn).toHaveBeenCalledWith(
        'Room access audit: DENIED',
        expect.objectContaining({
          userId: 'user123',
          roomId: 'admin:metrics',
          authorized: false,
          reason: 'Insufficient permissions',
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with toString() _id', () => {
      const mockUser = {
        _id: { toString: () => 'user123' },
        username: 'testuser',
        role: 'user',
      };
      const result = canJoinRoom(mockUser, 'notifications:user123');
      expect(result.authorized).toBe(true);
    });

    it('should handle missing role as default user', () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
      };
      const result = canJoinRoom(mockUser, 'data:users');
      expect(result.authorized).toBe(true);
    });

    it('should handle empty options object', () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        role: 'user',
      };
      const result = canJoinRoom(mockUser, 'data:users', {});
      expect(result.authorized).toBe(true);
    });
  });
});
