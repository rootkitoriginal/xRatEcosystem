const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * WebSocket Service
 * Manages real-time communication using Socket.IO
 */
class SocketService {
  constructor(httpServer, redisClient) {
    this.io = null;
    this.redisClient = redisClient;
    this.connectedUsers = new Map(); // userId -> Set of socket IDs
    this.userRooms = new Map(); // socketId -> Set of rooms
    this.rateLimiters = new Map(); // socketId -> { count, resetTime }
    
    this.initialize(httpServer);
  }

  /**
   * Initialize Socket.IO server
   */
  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          logger.warn('WebSocket connection attempt without token', {
            socketId: socket.id,
            ip: socket.handshake.address,
          });
          return next(new Error('Authentication required'));
        }

        // Verify JWT token
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.userId).select('-password -refreshToken');

        if (!user) {
          logger.warn('WebSocket connection attempt with invalid user', {
            socketId: socket.id,
            userId: decoded.userId,
          });
          return next(new Error('User not found'));
        }

        // Attach user to socket
        socket.user = user;
        logger.info('WebSocket authenticated', {
          socketId: socket.id,
          userId: user._id.toString(),
          username: user.username,
        });

        next();
      } catch (error) {
        logger.error('WebSocket authentication error', {
          socketId: socket.id,
          error: error.message,
        });
        next(new Error('Authentication failed'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('WebSocket service initialized', {
      service: 'websocket',
    });
  }

  /**
   * Handle new socket connection
   */
  handleConnection(socket) {
    const userId = socket.user._id.toString();

    // Track connected user
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId).add(socket.id);
    this.userRooms.set(socket.id, new Set());

    logger.info('WebSocket client connected', {
      socketId: socket.id,
      userId,
      username: socket.user.username,
      totalConnections: this.io.engine.clientsCount,
    });

    // Emit user online status
    this.broadcastUserStatus(userId, 'online');

    // Send queued notifications for this user
    this.sendQueuedNotifications(userId, socket.id);

    // Subscribe to data updates
    socket.on('data:subscribe', (data) => this.handleDataSubscribe(socket, data));

    // Handle notification read
    socket.on('notification:read', (data) => this.handleNotificationRead(socket, data));

    // Handle user typing
    socket.on('user:typing', (data) => this.handleUserTyping(socket, data));

    // Handle disconnection
    socket.on('disconnect', () => this.handleDisconnection(socket));

    // Send connection confirmation
    socket.emit('connected', {
      socketId: socket.id,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle data subscription
   */
  handleDataSubscribe(socket, data) {
    if (!this.checkRateLimit(socket.id)) {
      socket.emit('error', { message: 'Rate limit exceeded' });
      return;
    }

    const { entity, filters } = data;
    const roomName = this.buildRoomName(entity, filters);

    // Join room
    socket.join(roomName);
    this.userRooms.get(socket.id).add(roomName);

    logger.info('Socket subscribed to data', {
      socketId: socket.id,
      userId: socket.user._id.toString(),
      entity,
      room: roomName,
    });

    socket.emit('data:subscribed', {
      entity,
      filters,
      room: roomName,
    });
  }

  /**
   * Handle notification read
   */
  handleNotificationRead(socket, data) {
    if (!this.checkRateLimit(socket.id)) {
      return;
    }

    const { notificationId } = data;

    logger.info('Notification marked as read', {
      socketId: socket.id,
      userId: socket.user._id.toString(),
      notificationId,
    });

    // Acknowledge notification read
    socket.emit('notification:read:ack', { notificationId });
  }

  /**
   * Handle user typing event
   */
  handleUserTyping(socket, data) {
    if (!this.checkRateLimit(socket.id)) {
      return;
    }

    const { roomId } = data;
    const userId = socket.user._id.toString();

    // Broadcast to room (except sender)
    socket.to(roomId).emit('user:typing', {
      userId,
      username: socket.user.username,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle socket disconnection
   */
  handleDisconnection(socket) {
    const userId = socket.user._id.toString();

    // Remove from connected users
    if (this.connectedUsers.has(userId)) {
      this.connectedUsers.get(userId).delete(socket.id);
      if (this.connectedUsers.get(userId).size === 0) {
        this.connectedUsers.delete(userId);
        // User is completely offline
        this.broadcastUserStatus(userId, 'offline');
      }
    }

    // Clean up rooms
    this.userRooms.delete(socket.id);

    // Clean up rate limiter
    this.rateLimiters.delete(socket.id);

    logger.info('WebSocket client disconnected', {
      socketId: socket.id,
      userId,
      totalConnections: this.io.engine.clientsCount,
    });
  }

  /**
   * Broadcast data update to subscribers
   */
  broadcastDataUpdate(entity, data) {
    const roomName = this.buildRoomName(entity);
    
    this.io.to(roomName).emit('data:updated', {
      entity,
      data,
      timestamp: new Date().toISOString(),
    });

    logger.debug('Data update broadcasted', {
      entity,
      room: roomName,
      dataId: data.id || data._id,
    });
  }

  /**
   * Send notification to specific user
   */
  sendNotificationToUser(userId, notification) {
    const socketIds = this.connectedUsers.get(userId);
    
    if (!socketIds || socketIds.size === 0) {
      // User is offline, queue notification
      this.queueNotification(userId, notification);
      return;
    }

    // Send to all user's connections
    socketIds.forEach((socketId) => {
      this.io.to(socketId).emit('notification', {
        ...notification,
        timestamp: new Date().toISOString(),
      });
    });

    logger.info('Notification sent to user', {
      userId,
      type: notification.type,
      connections: socketIds.size,
    });
  }

  /**
   * Broadcast user online/offline status
   */
  broadcastUserStatus(userId, status) {
    this.io.emit('user:online', {
      userId,
      status,
      timestamp: new Date().toISOString(),
    });

    logger.debug('User status broadcasted', {
      userId,
      status,
    });
  }

  /**
   * Broadcast system health metrics
   */
  broadcastSystemHealth(metrics) {
    this.io.emit('system:health', {
      status: 'ok',
      metrics,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Queue notification for offline user (using Redis)
   */
  async queueNotification(userId, notification) {
    if (!this.redisClient) {
      logger.warn('Redis not available for notification queuing', { userId });
      return;
    }

    try {
      const queueKey = `notifications:queue:${userId}`;
      const notificationData = JSON.stringify({
        ...notification,
        queuedAt: new Date().toISOString(),
      });

      await this.redisClient.rPush(queueKey, notificationData);
      // Set expiry for 7 days
      await this.redisClient.expire(queueKey, 7 * 24 * 60 * 60);

      logger.info('Notification queued for offline user', {
        userId,
        type: notification.type,
      });
    } catch (error) {
      logger.error('Failed to queue notification', {
        userId,
        error: error.message,
      });
    }
  }

  /**
   * Retrieve and send queued notifications to user
   */
  async sendQueuedNotifications(userId, socketId) {
    if (!this.redisClient) {
      return;
    }

    try {
      const queueKey = `notifications:queue:${userId}`;
      const notifications = await this.redisClient.lRange(queueKey, 0, -1);

      if (notifications.length > 0) {
        notifications.forEach((notifStr) => {
          const notification = JSON.parse(notifStr);
          this.io.to(socketId).emit('notification', notification);
        });

        // Clear the queue
        await this.redisClient.del(queueKey);

        logger.info('Queued notifications sent', {
          userId,
          count: notifications.length,
        });
      }
    } catch (error) {
      logger.error('Failed to send queued notifications', {
        userId,
        error: error.message,
      });
    }
  }

  /**
   * Build room name from entity and filters
   */
  buildRoomName(entity, filters = {}) {
    if (Object.keys(filters).length === 0) {
      return `data:${entity}`;
    }
    const filterStr = Object.entries(filters)
      .map(([key, value]) => `${key}:${value}`)
      .join(':');
    return `data:${entity}:${filterStr}`;
  }

  /**
   * Check rate limit for socket
   * Allows 100 messages per minute per connection
   */
  checkRateLimit(socketId) {
    const now = Date.now();
    const limit = 100;
    const windowMs = 60000; // 1 minute

    if (!this.rateLimiters.has(socketId)) {
      this.rateLimiters.set(socketId, { count: 1, resetTime: now + windowMs });
      return true;
    }

    const limiter = this.rateLimiters.get(socketId);

    if (now > limiter.resetTime) {
      // Reset window
      limiter.count = 1;
      limiter.resetTime = now + windowMs;
      return true;
    }

    if (limiter.count >= limit) {
      logger.warn('WebSocket rate limit exceeded', {
        socketId,
        count: limiter.count,
      });
      return false;
    }

    limiter.count++;
    return true;
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.io.engine.clientsCount,
      connectedUsers: this.connectedUsers.size,
      activeRooms: this.io.sockets.adapter.rooms.size,
    };
  }

  /**
   * Disconnect all clients and cleanup
   */
  async shutdown() {
    logger.info('Shutting down WebSocket service...');
    
    this.io.disconnectSockets();
    this.connectedUsers.clear();
    this.userRooms.clear();
    this.rateLimiters.clear();
    
    logger.info('WebSocket service shutdown complete');
  }
}

module.exports = SocketService;
