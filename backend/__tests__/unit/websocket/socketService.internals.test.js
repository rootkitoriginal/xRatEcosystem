const http = require('http');
const { Server } = require('socket.io');
const { SocketService } = require('../../../src/websocket');

// Mock dependencies
jest.mock('../../../src/websocket/validators', () => ({
  validateEvent: jest.fn().mockReturnValue({
    valid: true,
    sanitizedData: {},
  }),
  sanitizeObject: jest.fn((data) => data),
}));

jest.mock('../../../src/websocket/authorization', () => ({
  canJoinRoom: jest.fn().mockReturnValue({ authorized: true }),
  canBroadcastToRoom: jest.fn().mockReturnValue({ authorized: true }),
  auditRoomAccess: jest.fn(),
}));

jest.mock('../../../src/models/User', () => ({
  findById: jest.fn(),
}));

describe('SocketService Internal Methods Testing', () => {
  let socketService;
  let httpServer;
  let mockRedisClient;

  beforeAll(() => {
    httpServer = http.createServer();
    // Increase max listeners to avoid warnings during tests
    httpServer.setMaxListeners(50);
  });

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (httpServer) {
      await new Promise((resolve) => {
        httpServer.close(resolve);
      });
    }
  });

  beforeEach(() => {
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
      socketService = null;
    }
  });

  describe('Phase A: Server Lifecycle Management', () => {
    describe('Server Initialization Edge Cases', () => {
      test('should initialize with default CORS configuration', () => {
        const originalEnv = process.env.FRONTEND_URL;
        delete process.env.FRONTEND_URL;

        socketService = new SocketService(httpServer, mockRedisClient);

        expect(socketService.io).toBeDefined();
        expect(socketService.io._opts.cors.origin).toBe('http://localhost:5173');
        expect(socketService.io._opts.cors.credentials).toBe(true);

        process.env.FRONTEND_URL = originalEnv;
      });

      test('should initialize with custom CORS configuration from environment', () => {
        const originalEnv = process.env.FRONTEND_URL;
        process.env.FRONTEND_URL = 'https://custom-frontend.com';

        socketService = new SocketService(httpServer, mockRedisClient);

        expect(socketService.io._opts.cors.origin).toBe('https://custom-frontend.com');

        process.env.FRONTEND_URL = originalEnv;
      });

      test('should initialize with correct ping/pong timeouts', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        expect(socketService.io._opts.pingTimeout).toBe(60000);
        expect(socketService.io._opts.pingInterval).toBe(25000);
      });

      test('should initialize all internal Maps', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        expect(socketService.connectedUsers).toBeInstanceOf(Map);
        expect(socketService.userRooms).toBeInstanceOf(Map);
        expect(socketService.rateLimiters).toBeInstanceOf(Map);
        expect(socketService.connectedUsers.size).toBe(0);
        expect(socketService.userRooms.size).toBe(0);
        expect(socketService.rateLimiters.size).toBe(0);
      });

      test('should store Redis client reference', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        expect(socketService.redisClient).toBe(mockRedisClient);
      });

      test('should initialize Socket.IO server instance', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        expect(socketService.io).toBeInstanceOf(Server);
      });

      test('should automatically call initialize during construction', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        // Verify that initialize was called by checking io is set
        expect(socketService.io).not.toBeNull();
        expect(socketService.io).toBeDefined();
      });
    });

    describe('Server Shutdown with Active Connections', () => {
      test('should clear all connection maps on shutdown', async () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        // Simulate some active connections
        socketService.connectedUsers.set('user1', new Set(['socket1']));
        socketService.userRooms.set('socket1', new Set(['room1']));
        socketService.rateLimiters.set('socket1', { count: 5, resetTime: Date.now() });

        await socketService.shutdown();

        expect(socketService.connectedUsers.size).toBe(0);
        expect(socketService.userRooms.size).toBe(0);
        expect(socketService.rateLimiters.size).toBe(0);
      });

      test('should disconnect all sockets on shutdown', async () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const disconnectSpy = jest.spyOn(socketService.io, 'disconnectSockets');

        await socketService.shutdown();

        expect(disconnectSpy).toHaveBeenCalled();
      });

      test('should handle shutdown when no connections exist', async () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        await expect(socketService.shutdown()).resolves.not.toThrow();
      });

      test('should handle multiple shutdown calls gracefully', async () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        await socketService.shutdown();
        await expect(socketService.shutdown()).resolves.not.toThrow();
      });
    });

    describe('HTTP Server Integration', () => {
      test('should attach to provided HTTP server', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        // Socket.IO should be attached to the HTTP server
        expect(socketService.io).toBeDefined();
        expect(socketService.io.httpServer).toBe(httpServer);
      });

      test('should work with different HTTP server instances', () => {
        const altHttpServer = http.createServer();
        socketService = new SocketService(altHttpServer, mockRedisClient);

        expect(socketService.io.httpServer).toBe(altHttpServer);

        altHttpServer.close();
      });
    });

    describe('CORS Configuration Validation', () => {
      test('should have credentials enabled for CORS', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        expect(socketService.io._opts.cors.credentials).toBe(true);
      });

      test('should handle various CORS origin formats', () => {
        const testOrigins = [
          'http://localhost:3000',
          'https://example.com',
          'http://192.168.1.1:8080',
        ];

        testOrigins.forEach((origin) => {
          const originalEnv = process.env.FRONTEND_URL;
          process.env.FRONTEND_URL = origin;

          const testService = new SocketService(httpServer, mockRedisClient);
          expect(testService.io._opts.cors.origin).toBe(origin);

          testService.shutdown();
          process.env.FRONTEND_URL = originalEnv;
        });
      });
    });

    describe('Middleware Execution Order', () => {
      test('should register authentication middleware', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        // Socket.IO stores middleware in _nsps
        const defaultNamespace = socketService.io._nsps.get('/');
        expect(defaultNamespace).toBeDefined();
      });

      test('should register connection event handler', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const defaultNamespace = socketService.io._nsps.get('/');
        // Connection handler is registered through io.on('connection')
        expect(defaultNamespace._events.connection).toBeDefined();
      });
    });
  });

  describe('Phase B: Protocol-Level Testing', () => {
    describe('Socket.IO Configuration', () => {
      test('should configure ping timeout correctly', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        expect(socketService.io._opts.pingTimeout).toBe(60000);
      });

      test('should configure ping interval correctly', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        expect(socketService.io._opts.pingInterval).toBe(25000);
      });

      test('should have engine.io accessible', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        expect(socketService.io.engine).toBeDefined();
      });
    });

    describe('Connection Metadata Management', () => {
      test('should track connection count via engine', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const stats = socketService.getStats();
        expect(stats).toHaveProperty('totalConnections');
        expect(stats.totalConnections).toBe(0);
      });

      test('should expose clientsCount from engine', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        expect(socketService.io.engine.clientsCount).toBeDefined();
        expect(typeof socketService.io.engine.clientsCount).toBe('number');
      });
    });
  });

  describe('Phase C: Namespace & Room Internals', () => {
    describe('Namespace Management', () => {
      test('should have default namespace accessible', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const defaultNamespace = socketService.io._nsps.get('/');
        expect(defaultNamespace).toBeDefined();
        expect(defaultNamespace.name).toBe('/');
      });

      test('should have namespace adapter', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const defaultNamespace = socketService.io._nsps.get('/');
        expect(defaultNamespace.adapter).toBeDefined();
      });

      test('should track rooms via namespace adapter', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const stats = socketService.getStats();
        expect(stats).toHaveProperty('activeRooms');
      });
    });

    describe('Room Adapter Internals', () => {
      test('should use memory adapter by default', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const defaultNamespace = socketService.io._nsps.get('/');
        expect(defaultNamespace.adapter).toBeDefined();
        expect(defaultNamespace.adapter.rooms).toBeInstanceOf(Map);
      });

      test('should have sids map in adapter', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const defaultNamespace = socketService.io._nsps.get('/');
        expect(defaultNamespace.adapter.sids).toBeDefined();
        expect(defaultNamespace.adapter.sids).toBeInstanceOf(Map);
      });

      test('should expose rooms map through adapter', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        expect(socketService.io.sockets.adapter.rooms).toBeDefined();
        expect(socketService.io.sockets.adapter.rooms).toBeInstanceOf(Map);
      });
    });

    describe('Room Name Building', () => {
      test('should build room name without filters', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const roomName = socketService.buildRoomName('users');
        expect(roomName).toBe('data:users');
      });

      test('should build room name with single filter', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const roomName = socketService.buildRoomName('users', { status: 'active' });
        expect(roomName).toContain('data:users');
        expect(roomName).toContain('status:active');
      });

      test('should build room name with multiple filters', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const roomName = socketService.buildRoomName('products', {
          category: 'electronics',
          status: 'available',
        });
        expect(roomName).toContain('data:products');
        expect(roomName).toContain('category:electronics');
        expect(roomName).toContain('status:available');
      });

      test('should build consistent room names with same filters', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const room1 = socketService.buildRoomName('items', { id: '123' });
        const room2 = socketService.buildRoomName('items', { id: '123' });
        expect(room1).toBe(room2);
      });

      test('should handle empty filters object', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const roomName = socketService.buildRoomName('data', {});
        expect(roomName).toBe('data:data');
      });

      test('should handle filters with special characters', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const roomName = socketService.buildRoomName('users', { 'user-type': 'admin' });
        expect(roomName).toContain('user-type:admin');
      });
    });
  });

  describe('Phase D: Connection State Management', () => {
    describe('Connection Tracking', () => {
      test('should initialize empty user tracking', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        expect(socketService.connectedUsers.size).toBe(0);
      });

      test('should track multiple sockets per user', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const userId = 'user-123';
        socketService.connectedUsers.set(userId, new Set(['socket-1', 'socket-2', 'socket-3']));

        expect(socketService.connectedUsers.get(userId).size).toBe(3);
      });

      test('should track rooms per socket', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        socketService.userRooms.set('socket-1', new Set(['room-a', 'room-b']));

        expect(socketService.userRooms.get('socket-1').size).toBe(2);
      });

      test('should handle user with no active sockets', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const userId = 'user-456';
        const sockets = socketService.connectedUsers.get(userId);

        expect(sockets).toBeUndefined();
      });
    });

    describe('Socket Metadata', () => {
      test('should maintain rate limiter per socket', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const socketId = 'test-socket';
        const result = socketService.checkRateLimit(socketId);

        expect(result).toBe(true);
        expect(socketService.rateLimiters.has(socketId)).toBe(true);
      });

      test('should store rate limit metadata', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const socketId = 'test-socket';
        socketService.checkRateLimit(socketId);

        const limiter = socketService.rateLimiters.get(socketId);
        expect(limiter).toHaveProperty('count');
        expect(limiter).toHaveProperty('resetTime');
      });

      test('should increment rate limit count', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const socketId = 'test-socket';
        socketService.checkRateLimit(socketId);
        socketService.checkRateLimit(socketId);
        socketService.checkRateLimit(socketId);

        const limiter = socketService.rateLimiters.get(socketId);
        expect(limiter.count).toBe(3);
      });

      test('should reset rate limit after time window', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const socketId = 'test-socket';

        // First check creates the limiter
        socketService.checkRateLimit(socketId);
        const limiter = socketService.rateLimiters.get(socketId);

        // Manually expire the window
        limiter.resetTime = Date.now() - 1000;

        // Next check should reset
        socketService.checkRateLimit(socketId);
        const updatedLimiter = socketService.rateLimiters.get(socketId);

        expect(updatedLimiter.count).toBe(1);
      });

      test('should enforce rate limit maximum', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const socketId = 'test-socket';

        // Simulate reaching the limit
        const limiter = { count: 100, resetTime: Date.now() + 60000 };
        socketService.rateLimiters.set(socketId, limiter);

        const result = socketService.checkRateLimit(socketId);
        expect(result).toBe(false);
      });
    });

    describe('Disconnection Cleanup', () => {
      test('should provide cleanup mechanism for rate limiters', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const socketId = 'cleanup-test';
        socketService.rateLimiters.set(socketId, { count: 1, resetTime: Date.now() });

        expect(socketService.rateLimiters.has(socketId)).toBe(true);

        socketService.rateLimiters.delete(socketId);
        expect(socketService.rateLimiters.has(socketId)).toBe(false);
      });

      test('should provide cleanup mechanism for user rooms', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const socketId = 'cleanup-test';
        socketService.userRooms.set(socketId, new Set(['room1']));

        expect(socketService.userRooms.has(socketId)).toBe(true);

        socketService.userRooms.delete(socketId);
        expect(socketService.userRooms.has(socketId)).toBe(false);
      });
    });
  });

  describe('Phase E: Advanced Server Features', () => {
    describe('Server Metrics and Monitoring', () => {
      test('should provide connection statistics', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const stats = socketService.getStats();

        expect(stats).toHaveProperty('totalConnections');
        expect(stats).toHaveProperty('connectedUsers');
        expect(stats).toHaveProperty('activeRooms');
      });

      test('should track total connections through engine', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const stats = socketService.getStats();
        expect(typeof stats.totalConnections).toBe('number');
        expect(stats.totalConnections).toBeGreaterThanOrEqual(0);
      });

      test('should track unique connected users', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        socketService.connectedUsers.set('user1', new Set(['socket1']));
        socketService.connectedUsers.set('user2', new Set(['socket2']));

        const stats = socketService.getStats();
        expect(stats.connectedUsers).toBe(2);
      });

      test('should track active rooms count', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const stats = socketService.getStats();
        expect(typeof stats.activeRooms).toBe('number');
        expect(stats.activeRooms).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Engine.IO Configuration', () => {
      test('should expose engine.io instance', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        expect(socketService.io.engine).toBeDefined();
      });

      test('should have engine clientsCount property', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        expect(socketService.io.engine).toHaveProperty('clientsCount');
      });
    });

    describe('Resource Management', () => {
      test('should cleanup rate limiters on shutdown', async () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        socketService.rateLimiters.set('socket1', { count: 5, resetTime: Date.now() });
        socketService.rateLimiters.set('socket2', { count: 10, resetTime: Date.now() });

        await socketService.shutdown();

        expect(socketService.rateLimiters.size).toBe(0);
      });

      test('should cleanup user tracking on shutdown', async () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        socketService.connectedUsers.set('user1', new Set(['socket1']));
        socketService.connectedUsers.set('user2', new Set(['socket2']));

        await socketService.shutdown();

        expect(socketService.connectedUsers.size).toBe(0);
      });

      test('should cleanup room tracking on shutdown', async () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        socketService.userRooms.set('socket1', new Set(['room1']));
        socketService.userRooms.set('socket2', new Set(['room2']));

        await socketService.shutdown();

        expect(socketService.userRooms.size).toBe(0);
      });
    });

    describe('Server Instance Management', () => {
      test('should maintain reference to Socket.IO server', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        expect(socketService.io).toBeInstanceOf(Server);
      });

      test('should maintain reference to Redis client', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        expect(socketService.redisClient).toBe(mockRedisClient);
      });

      test('should handle Redis client being null', () => {
        socketService = new SocketService(httpServer, null);

        expect(socketService.redisClient).toBeNull();
      });
    });
  });

  describe('Integration: Complete Lifecycle Tests', () => {
    test('should handle complete initialization and shutdown cycle', async () => {
      socketService = new SocketService(httpServer, mockRedisClient);

      expect(socketService.io).toBeDefined();

      await socketService.shutdown();

      expect(socketService.connectedUsers.size).toBe(0);
    });

    test('should handle multiple initialization cycles', async () => {
      // First cycle
      socketService = new SocketService(httpServer, mockRedisClient);
      await socketService.shutdown();

      // Second cycle
      socketService = new SocketService(httpServer, mockRedisClient);
      expect(socketService.io).toBeDefined();
      await socketService.shutdown();

      // Third cycle
      socketService = new SocketService(httpServer, mockRedisClient);
      expect(socketService.io).toBeDefined();
    });

    test('should maintain clean state after shutdown and re-initialization', async () => {
      socketService = new SocketService(httpServer, mockRedisClient);

      // Add some state
      socketService.connectedUsers.set('user1', new Set(['socket1']));
      socketService.userRooms.set('socket1', new Set(['room1']));

      await socketService.shutdown();

      // Re-initialize
      socketService = new SocketService(httpServer, mockRedisClient);

      expect(socketService.connectedUsers.size).toBe(0);
      expect(socketService.userRooms.size).toBe(0);
      expect(socketService.rateLimiters.size).toBe(0);
    });
  });

  describe('Additional Internal Method Coverage', () => {
    describe('Authentication Middleware Internals', () => {
      test('should have authentication middleware registered', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const namespace = socketService.io._nsps.get('/');
        expect(namespace._fns).toBeDefined();
        expect(namespace._fns.length).toBeGreaterThan(0);
      });

      test('should process middleware stack on connections', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const namespace = socketService.io._nsps.get('/');
        expect(namespace._fns).toBeInstanceOf(Array);
      });
    });

    describe('Connection Handler Registration', () => {
      test('should have connection event listener registered', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const namespace = socketService.io._nsps.get('/');
        expect(namespace._events).toHaveProperty('connection');
      });

      test('should handle connection events through registered handler', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const namespace = socketService.io._nsps.get('/');
        const connectionHandlers = namespace._events.connection;

        expect(connectionHandlers).toBeDefined();
      });
    });

    describe('Rate Limiting Edge Cases', () => {
      test('should handle concurrent rate limit checks', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const socketId = 'concurrent-test';

        // Simulate concurrent checks
        const results = [];
        for (let i = 0; i < 10; i++) {
          results.push(socketService.checkRateLimit(socketId));
        }

        expect(results.every((r) => r === true)).toBe(true);
        expect(socketService.rateLimiters.get(socketId).count).toBe(10);
      });

      test('should handle rate limit at exact boundary', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const socketId = 'boundary-test';

        // Set to exactly at limit
        socketService.rateLimiters.set(socketId, { count: 99, resetTime: Date.now() + 60000 });

        const result = socketService.checkRateLimit(socketId);
        expect(result).toBe(true);
        expect(socketService.rateLimiters.get(socketId).count).toBe(100);

        // Next one should fail
        const nextResult = socketService.checkRateLimit(socketId);
        expect(nextResult).toBe(false);
      });

      test('should handle rate limit with expired timestamp', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const socketId = 'expired-test';

        // Set expired timestamp
        socketService.rateLimiters.set(socketId, { count: 100, resetTime: 0 });

        const result = socketService.checkRateLimit(socketId);
        expect(result).toBe(true);
        expect(socketService.rateLimiters.get(socketId).count).toBe(1);
      });
    });

    describe('Room Name Building Edge Cases', () => {
      test('should handle room names with numeric filters', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const roomName = socketService.buildRoomName('items', { id: 123, quantity: 456 });
        expect(roomName).toContain('id:123');
        expect(roomName).toContain('quantity:456');
      });

      test('should handle room names with boolean filters', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const roomName = socketService.buildRoomName('users', { active: true });
        expect(roomName).toContain('active:true');
      });

      test('should handle room names with null values', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const roomName = socketService.buildRoomName('items', { owner: null });
        expect(roomName).toContain('owner:null');
      });

      test('should handle room names with undefined in filters', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const roomName = socketService.buildRoomName('data', { field: undefined });
        expect(roomName).toContain('field:undefined');
      });

      test('should handle very long entity names', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const longEntity = 'a'.repeat(100);
        const roomName = socketService.buildRoomName(longEntity);
        expect(roomName).toBe(`data:${longEntity}`);
      });

      test('should handle room names with many filters', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const manyFilters = {
          filter1: 'value1',
          filter2: 'value2',
          filter3: 'value3',
          filter4: 'value4',
          filter5: 'value5',
        };

        const roomName = socketService.buildRoomName('entity', manyFilters);
        expect(roomName).toContain('data:entity');
        expect(roomName).toContain('filter1:value1');
        expect(roomName).toContain('filter5:value5');
      });
    });

    describe('Stats Collection Edge Cases', () => {
      test('should return valid stats with no connections', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const stats = socketService.getStats();

        expect(stats.totalConnections).toBe(0);
        expect(stats.connectedUsers).toBe(0);
        expect(stats.activeRooms).toBeGreaterThanOrEqual(0);
      });

      test('should track multiple users with multiple sockets each', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        socketService.connectedUsers.set('user1', new Set(['socket1', 'socket2']));
        socketService.connectedUsers.set('user2', new Set(['socket3', 'socket4', 'socket5']));
        socketService.connectedUsers.set('user3', new Set(['socket6']));

        const stats = socketService.getStats();
        expect(stats.connectedUsers).toBe(3);
      });

      test('should handle stats when Redis client is null', () => {
        const serviceWithoutRedis = new SocketService(httpServer, null);

        const stats = serviceWithoutRedis.getStats();

        expect(stats).toHaveProperty('totalConnections');
        expect(stats).toHaveProperty('connectedUsers');
        expect(stats).toHaveProperty('activeRooms');

        serviceWithoutRedis.shutdown();
      });
    });

    describe('Connection Map Operations', () => {
      test('should handle adding multiple sockets for same user', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const userId = 'multi-socket-user';

        if (!socketService.connectedUsers.has(userId)) {
          socketService.connectedUsers.set(userId, new Set());
        }

        socketService.connectedUsers.get(userId).add('socket1');
        socketService.connectedUsers.get(userId).add('socket2');
        socketService.connectedUsers.get(userId).add('socket3');

        expect(socketService.connectedUsers.get(userId).size).toBe(3);
      });

      test('should handle removing specific socket from user', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const userId = 'test-user';
        socketService.connectedUsers.set(userId, new Set(['socket1', 'socket2', 'socket3']));

        socketService.connectedUsers.get(userId).delete('socket2');

        expect(socketService.connectedUsers.get(userId).size).toBe(2);
        expect(socketService.connectedUsers.get(userId).has('socket2')).toBe(false);
      });

      test('should handle removing last socket from user', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const userId = 'single-socket-user';
        socketService.connectedUsers.set(userId, new Set(['only-socket']));

        socketService.connectedUsers.get(userId).delete('only-socket');

        expect(socketService.connectedUsers.get(userId).size).toBe(0);
      });

      test('should handle adding multiple rooms to socket', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const socketId = 'multi-room-socket';
        socketService.userRooms.set(socketId, new Set());

        socketService.userRooms.get(socketId).add('room1');
        socketService.userRooms.get(socketId).add('room2');
        socketService.userRooms.get(socketId).add('room3');

        expect(socketService.userRooms.get(socketId).size).toBe(3);
      });
    });

    describe('Server Configuration Validation', () => {
      test('should have Socket.IO server attached to HTTP server', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        expect(socketService.io.httpServer).toBe(httpServer);
      });

      test('should have default namespace configured', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        const namespaces = Array.from(socketService.io._nsps.keys());
        expect(namespaces).toContain('/');
      });

      test('should have sockets property accessible', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        expect(socketService.io.sockets).toBeDefined();
        expect(socketService.io.sockets.adapter).toBeDefined();
      });

      test('should have engine property with initial state', () => {
        socketService = new SocketService(httpServer, mockRedisClient);

        expect(socketService.io.engine).toBeDefined();
        expect(socketService.io.engine.clientsCount).toBe(0);
      });
    });
  });
});
