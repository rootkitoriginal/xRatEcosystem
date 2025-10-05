const http = require('http');
const { SocketService } = require('../../../src/websocket');

describe('SocketService Unit Tests', () => {
  let socketService;
  let httpServer;
  let mockRedisClient;

  beforeAll(() => {
    // Create a real HTTP server for Socket.IO to attach to
    httpServer = http.createServer();
  });

  afterAll(async () => {
    // Give time for all async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (httpServer) {
      await new Promise((resolve) => {
        httpServer.close(resolve);
      });
    }
  });

  beforeEach(() => {
    // Mock Redis client
    mockRedisClient = {
      rPush: jest.fn().mockResolvedValue(true),
      expire: jest.fn().mockResolvedValue(true),
      lRange: jest.fn().mockResolvedValue([]),
      del: jest.fn().mockResolvedValue(true),
    };
  });

  afterEach(async () => {
    if (socketService) {
      await socketService.shutdown();
    }
  });

  describe('Initialization', () => {
    test('should initialize with HTTP server and Redis client', () => {
      expect(() => {
        socketService = new SocketService(httpServer, mockRedisClient);
      }).not.toThrow();

      expect(socketService.io).toBeDefined();
      expect(socketService.redisClient).toBe(mockRedisClient);
    });

    test('should initialize empty connection maps', () => {
      socketService = new SocketService(httpServer, mockRedisClient);

      expect(socketService.connectedUsers).toBeInstanceOf(Map);
      expect(socketService.userRooms).toBeInstanceOf(Map);
      expect(socketService.rateLimiters).toBeInstanceOf(Map);
      expect(socketService.connectedUsers.size).toBe(0);
    });
  });

  describe('Room Management', () => {
    beforeEach(() => {
      socketService = new SocketService(httpServer, mockRedisClient);
    });

    test('should build room name from entity', () => {
      const roomName = socketService.buildRoomName('users');
      expect(roomName).toBe('data:users');
    });

    test('should build room name with filters', () => {
      const filters = { status: 'active', role: 'admin' };
      const roomName = socketService.buildRoomName('users', filters);
      expect(roomName).toContain('data:users');
      expect(roomName).toContain('status:active');
      expect(roomName).toContain('role:admin');
    });

    test('should build consistent room names', () => {
      const filters = { id: '123' };
      const roomName1 = socketService.buildRoomName('products', filters);
      const roomName2 = socketService.buildRoomName('products', filters);
      expect(roomName1).toBe(roomName2);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      socketService = new SocketService(httpServer, mockRedisClient);
    });

    test('should allow first request', () => {
      const socketId = 'test-socket-1';
      const result = socketService.checkRateLimit(socketId);
      expect(result).toBe(true);
    });

    test('should track request count', () => {
      const socketId = 'test-socket-2';

      for (let i = 0; i < 50; i++) {
        socketService.checkRateLimit(socketId);
      }

      const limiter = socketService.rateLimiters.get(socketId);
      expect(limiter.count).toBe(50);
    });

    test('should enforce rate limit', () => {
      const socketId = 'test-socket-3';

      // Send 100 requests (limit)
      for (let i = 0; i < 100; i++) {
        const result = socketService.checkRateLimit(socketId);
        expect(result).toBe(true);
      }

      // 101st request should be denied
      const result = socketService.checkRateLimit(socketId);
      expect(result).toBe(false);
    });

    test('should reset rate limit after window', () => {
      const socketId = 'test-socket-4';

      // Use up limit
      for (let i = 0; i < 100; i++) {
        socketService.checkRateLimit(socketId);
      }

      // Manually set reset time to past
      const limiter = socketService.rateLimiters.get(socketId);
      limiter.resetTime = Date.now() - 1000;

      // Should allow again
      const result = socketService.checkRateLimit(socketId);
      expect(result).toBe(true);
    });
  });

  describe('Notification Queuing', () => {
    beforeEach(() => {
      socketService = new SocketService(httpServer, mockRedisClient);
    });

    test('should queue notification for offline user', async () => {
      const userId = 'user-123';
      const notification = {
        type: 'info',
        message: 'Test notification',
      };

      await socketService.queueNotification(userId, notification);

      expect(mockRedisClient.rPush).toHaveBeenCalledWith(
        `notifications:queue:${userId}`,
        expect.stringContaining('Test notification')
      );
      expect(mockRedisClient.expire).toHaveBeenCalled();
    });

    test('should handle Redis unavailability gracefully', async () => {
      socketService.redisClient = null;

      await expect(
        socketService.queueNotification('user-123', { type: 'info', message: 'test' })
      ).resolves.not.toThrow();
    });

    test('should handle queuing errors gracefully', async () => {
      mockRedisClient.rPush.mockRejectedValue(new Error('Redis error'));

      await expect(
        socketService.queueNotification('user-123', { type: 'info', message: 'test' })
      ).resolves.not.toThrow();
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      socketService = new SocketService(httpServer, mockRedisClient);
    });

    test('should provide connection statistics', () => {
      const stats = socketService.getStats();

      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('connectedUsers');
      expect(stats).toHaveProperty('activeRooms');
      expect(typeof stats.totalConnections).toBe('number');
      expect(typeof stats.connectedUsers).toBe('number');
      expect(typeof stats.activeRooms).toBe('number');
    });

    test('should track connected users count', () => {
      const stats = socketService.getStats();
      expect(stats.connectedUsers).toBe(0);

      // Simulate user connections
      socketService.connectedUsers.set('user-1', new Set(['socket-1']));
      socketService.connectedUsers.set('user-2', new Set(['socket-2', 'socket-3']));

      const newStats = socketService.getStats();
      expect(newStats.connectedUsers).toBe(2);
    });
  });

  describe('Shutdown', () => {
    beforeEach(() => {
      socketService = new SocketService(httpServer, mockRedisClient);
    });

    test('should clear all data structures on shutdown', async () => {
      // Add some data
      socketService.connectedUsers.set('user-1', new Set(['socket-1']));
      socketService.userRooms.set('socket-1', new Set(['room-1']));
      socketService.rateLimiters.set('socket-1', { count: 10, resetTime: Date.now() });

      await socketService.shutdown();

      expect(socketService.connectedUsers.size).toBe(0);
      expect(socketService.userRooms.size).toBe(0);
      expect(socketService.rateLimiters.size).toBe(0);
    });
  });

  describe('buildRoomName', () => {
    beforeEach(() => {
      socketService = new SocketService(httpServer, mockRedisClient);
    });

    test('should build basic room name without filters', () => {
      const roomName = socketService.buildRoomName('users');
      expect(roomName).toBe('data:users');
    });

    test('should build room name with single filter', () => {
      const filters = { status: 'active' };
      const roomName = socketService.buildRoomName('users', filters);
      expect(roomName).toBe('data:users:status:active');
    });

    test('should build room name with multiple filters', () => {
      const filters = { status: 'active', type: 'admin' };
      const roomName = socketService.buildRoomName('users', filters);
      expect(roomName).toBe('data:users:status:active:type:admin');
    });

    test('should handle empty filters object', () => {
      const roomName = socketService.buildRoomName('users', {});
      expect(roomName).toBe('data:users');
    });
  });

  describe('checkRateLimit', () => {
    beforeEach(() => {
      socketService = new SocketService(httpServer, mockRedisClient);
      // Mock Date.now to have consistent timing in tests
      jest.spyOn(Date, 'now').mockReturnValue(1000000);
    });

    afterEach(() => {
      Date.now.mockRestore();
    });

    test('should allow first request from new socket', () => {
      const result = socketService.checkRateLimit('socket-1');
      expect(result).toBe(true);

      const limiter = socketService.rateLimiters.get('socket-1');
      expect(limiter.count).toBe(1);
      expect(limiter.resetTime).toBe(1000000 + 60000);
    });

    test('should allow requests within limit', () => {
      // First request
      socketService.checkRateLimit('socket-1');

      // Second request
      const result = socketService.checkRateLimit('socket-1');
      expect(result).toBe(true);

      const limiter = socketService.rateLimiters.get('socket-1');
      expect(limiter.count).toBe(2);
    });

    test('should deny requests when limit exceeded', () => {
      // Set up socket at limit
      socketService.rateLimiters.set('socket-1', {
        count: 100,
        resetTime: 1000000 + 60000,
      });

      const result = socketService.checkRateLimit('socket-1');
      expect(result).toBe(false);
    });

    test('should reset limit after time window expires', () => {
      // Set up socket at limit
      socketService.rateLimiters.set('socket-1', {
        count: 100,
        resetTime: 1000000 + 60000,
      });

      // Advance time past reset window
      Date.now.mockReturnValue(1000000 + 60001);

      const result = socketService.checkRateLimit('socket-1');
      expect(result).toBe(true);

      const limiter = socketService.rateLimiters.get('socket-1');
      expect(limiter.count).toBe(1);
      expect(limiter.resetTime).toBe(1000000 + 60001 + 60000);
    });
  });

  describe('broadcastDataUpdate', () => {
    beforeEach(() => {
      socketService = new SocketService(httpServer, mockRedisClient);
      // Mock the Socket.IO emit methods
      socketService.io.to = jest.fn().mockReturnValue({
        emit: jest.fn(),
      });
    });

    test('should broadcast data update without broadcaster', () => {
      const entity = 'users';
      const data = { id: '123', name: 'Test User' };

      socketService.broadcastDataUpdate(entity, data);

      expect(socketService.io.to).toHaveBeenCalledWith('data:users');
      expect(socketService.io.to().emit).toHaveBeenCalledWith('data:updated', {
        entity: 'users',
        data: { id: '123', name: 'Test User' },
        timestamp: expect.any(String),
      });
    });

    test('should handle broadcaster authorization - unauthorized', () => {
      const entity = 'users';
      const data = { id: '123', name: 'Test User' };
      const broadcaster = { _id: 'user-1', username: 'testuser', role: 'user' };

      // Test unauthorized broadcast (user role trying to broadcast to data room)
      socketService.broadcastDataUpdate(entity, data, broadcaster);

      // Should not broadcast since user role cannot broadcast to data rooms
      expect(socketService.io.to).not.toHaveBeenCalled();
    });

    test('should handle broadcaster authorization - authorized', () => {
      const entity = 'users';
      const data = { id: '123', name: 'Test User' };
      const broadcaster = { _id: 'admin-1', username: 'admin', role: 'admin' };

      // Test authorized broadcast (admin role can broadcast to data room)
      socketService.broadcastDataUpdate(entity, data, broadcaster);

      expect(socketService.io.to).toHaveBeenCalledWith('data:users');
      expect(socketService.io.to().emit).toHaveBeenCalledWith('data:updated', {
        entity: 'users',
        data: { id: '123', name: 'Test User' },
        timestamp: expect.any(String),
      });
    });
  });

  describe('sendNotificationToUser', () => {
    beforeEach(() => {
      socketService = new SocketService(httpServer, mockRedisClient);
      socketService.io.to = jest.fn().mockReturnValue({
        emit: jest.fn(),
      });
    });

    test('should send notification to online user', () => {
      const userId = 'user-1';
      const notification = { type: 'info', message: 'Test notification' };

      // Set user as online
      socketService.connectedUsers.set(userId, new Set(['socket-1', 'socket-2']));

      socketService.sendNotificationToUser(userId, notification);

      expect(socketService.io.to).toHaveBeenCalledWith('socket-1');
      expect(socketService.io.to).toHaveBeenCalledWith('socket-2');
      expect(socketService.io.to().emit).toHaveBeenCalledWith('notification', {
        type: 'info',
        message: 'Test notification',
        timestamp: expect.any(String),
      });
    });

    test('should queue notification for offline user', () => {
      const userId = 'user-offline';
      const notification = { type: 'info', message: 'Test notification' };

      // Mock queueNotification method
      socketService.queueNotification = jest.fn();

      socketService.sendNotificationToUser(userId, notification);

      expect(socketService.queueNotification).toHaveBeenCalledWith(userId, notification);
      expect(socketService.io.to).not.toHaveBeenCalled();
    });
  });

  describe('broadcastUserStatus', () => {
    beforeEach(() => {
      socketService = new SocketService(httpServer, mockRedisClient);
      socketService.io.emit = jest.fn();
    });

    test('should broadcast user online status', () => {
      const userId = 'user-1';
      const status = 'online';

      socketService.broadcastUserStatus(userId, status);

      expect(socketService.io.emit).toHaveBeenCalledWith('user:online', {
        userId: 'user-1',
        status: 'online',
        timestamp: expect.any(String),
      });
    });

    test('should broadcast user offline status', () => {
      const userId = 'user-1';
      const status = 'offline';

      socketService.broadcastUserStatus(userId, status);

      expect(socketService.io.emit).toHaveBeenCalledWith('user:online', {
        userId: 'user-1',
        status: 'offline',
        timestamp: expect.any(String),
      });
    });
  });

  describe('broadcastSystemHealth', () => {
    beforeEach(() => {
      socketService = new SocketService(httpServer, mockRedisClient);
      socketService.io.emit = jest.fn();
    });

    test('should broadcast system health metrics', () => {
      const metrics = {
        cpu: { usage: 45.2 },
        memory: { used: 1024, total: 2048 },
        uptime: 3600,
      };

      socketService.broadcastSystemHealth(metrics);

      expect(socketService.io.emit).toHaveBeenCalledWith('system:health', {
        status: 'ok',
        metrics: {
          cpu: { usage: 45.2 },
          memory: { used: 1024, total: 2048 },
          uptime: 3600,
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe('Connection Management', () => {
    let mockSocket;

    beforeEach(() => {
      socketService = new SocketService(httpServer, mockRedisClient);

      // Mock socket object
      mockSocket = {
        id: 'socket-123',
        user: { _id: 'user-456', username: 'testuser' },
        on: jest.fn(),
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
      };

      // Mock Socket.IO methods
      socketService.io.engine = { clientsCount: 5 };
      socketService.io.emit = jest.fn();

      // Mock sendQueuedNotifications and broadcastUserStatus methods
      socketService.sendQueuedNotifications = jest.fn();
      socketService.broadcastUserStatus = jest.fn();
    });

    test('should handle new connection correctly', () => {
      socketService.handleConnection(mockSocket);

      // Should track the user
      expect(socketService.connectedUsers.has('user-456')).toBe(true);
      expect(socketService.connectedUsers.get('user-456').has('socket-123')).toBe(true);

      // Should initialize user rooms
      expect(socketService.userRooms.has('socket-123')).toBe(true);

      // Should broadcast online status
      expect(socketService.broadcastUserStatus).toHaveBeenCalledWith('user-456', 'online');

      // Should send queued notifications
      expect(socketService.sendQueuedNotifications).toHaveBeenCalledWith('user-456', 'socket-123');

      // Should set up event listeners
      expect(mockSocket.on).toHaveBeenCalledWith('data:subscribe', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('room:join', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('room:leave', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));

      // Should emit connection confirmation
      expect(mockSocket.emit).toHaveBeenCalledWith('connected', {
        socketId: 'socket-123',
        userId: 'user-456',
        timestamp: expect.any(String),
      });
    });

    test('should handle multiple connections from same user', () => {
      const mockSocket2 = {
        id: 'socket-789',
        user: { _id: 'user-456', username: 'testuser' },
        on: jest.fn(),
        emit: jest.fn(),
      };

      // First connection
      socketService.handleConnection(mockSocket);
      // Second connection from same user
      socketService.handleConnection(mockSocket2);

      // Should track both sockets for the same user
      expect(socketService.connectedUsers.get('user-456').size).toBe(2);
      expect(socketService.connectedUsers.get('user-456').has('socket-123')).toBe(true);
      expect(socketService.connectedUsers.get('user-456').has('socket-789')).toBe(true);
    });

    test('should handle disconnection correctly', () => {
      // First connect the socket
      socketService.handleConnection(mockSocket);

      // Mock broadcastUserStatus for disconnect
      socketService.broadcastUserStatus = jest.fn();

      // Now disconnect
      socketService.handleDisconnection(mockSocket);

      // Should remove socket from connected users
      expect(socketService.connectedUsers.get('user-456')).toBeFalsy();

      // Should remove user rooms
      expect(socketService.userRooms.has('socket-123')).toBe(false);

      // Should broadcast offline status
      expect(socketService.broadcastUserStatus).toHaveBeenCalledWith('user-456', 'offline');
    });

    test('should handle disconnection with multiple connections', () => {
      const mockSocket2 = {
        id: 'socket-789',
        user: { _id: 'user-456', username: 'testuser' },
        on: jest.fn(),
        emit: jest.fn(),
      };

      // Connect both sockets
      socketService.handleConnection(mockSocket);
      socketService.handleConnection(mockSocket2);

      // Mock broadcastUserStatus for disconnect
      socketService.broadcastUserStatus = jest.fn();

      // Disconnect one socket
      socketService.handleDisconnection(mockSocket);

      // User should still be connected with remaining socket
      expect(socketService.connectedUsers.get('user-456').has('socket-789')).toBe(true);
      expect(socketService.connectedUsers.get('user-456').has('socket-123')).toBe(false);

      // Should NOT broadcast offline status (user still has active connections)
      expect(socketService.broadcastUserStatus).not.toHaveBeenCalled();
    });
  });
});
