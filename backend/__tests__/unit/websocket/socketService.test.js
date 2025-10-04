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
});
