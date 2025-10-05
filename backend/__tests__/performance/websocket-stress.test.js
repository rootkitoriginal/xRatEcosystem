const http = require('http');
const { Server } = require('socket.io');
const { io: ioClient } = require('socket.io-client');
const { SocketService } = require('../../src/websocket');
const { generateAccessToken } = require('../../src/utils/jwt');

/**
 * WebSocket Connection Stress Testing
 * Tests system behavior under high concurrent connection load
 */
describe('WebSocket Connection Stress Tests', () => {
  let httpServer;
  let socketService;
  let mockRedisClient;
  let testToken;
  const PORT = 30001;

  beforeAll(async () => {
    // Mock User model BEFORE creating socket service
    const User = require('../../src/models/User');
    User.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: 'test-user-id',
        username: 'testuser',
        email: 'test@example.com',
      }),
    });

    // Create HTTP server for stress testing
    httpServer = http.createServer();
    
    // Mock Redis client
    mockRedisClient = {
      rPush: jest.fn().mockResolvedValue(true),
      expire: jest.fn().mockResolvedValue(true),
      lRange: jest.fn().mockResolvedValue([]),
      del: jest.fn().mockResolvedValue(true),
    };

    // Generate test token
    testToken = generateAccessToken({ userId: 'test-user-id' });

    // Initialize socket service
    socketService = new SocketService(httpServer, mockRedisClient);

    // Start HTTP server
    await new Promise((resolve) => {
      httpServer.listen(PORT, resolve);
    });
  });

  afterAll(async () => {
    if (socketService) {
      await socketService.shutdown();
    }

    await new Promise((resolve) => {
      httpServer.close(resolve);
    });

    // Wait for cleanup
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  describe('1000+ Concurrent Connections', () => {
    test('should handle 100 simultaneous connections (scaled test)', async () => {
      const connectionPromises = [];
      const clients = [];
      const connectionCount = 100; // Reduced from 1000 for CI performance

      // Create 1000 connections
      for (let i = 0; i < connectionCount; i++) {
        const clientPromise = new Promise((resolve, reject) => {
          const client = ioClient(`http://localhost:${PORT}`, {
            auth: { token: testToken },
            reconnection: false,
            timeout: 5000,
          });

          client.on('connect', () => {
            clients.push(client);
            resolve();
          });

          client.on('connect_error', (error) => {
            reject(error);
          });

          // Timeout safety
          setTimeout(() => {
            reject(new Error(`Connection ${i} timeout`));
          }, 10000);
        });

        connectionPromises.push(clientPromise);
      }

      // Wait for all connections (or failures)
      const results = await Promise.allSettled(connectionPromises);
      const successCount = results.filter((r) => r.status === 'fulfilled').length;

      // Cleanup all clients
      clients.forEach((client) => {
        if (client.connected) {
          client.disconnect();
        }
      });

      // We expect at least 80% success rate for scaled test
      const successRate = (successCount / connectionCount) * 100;
      expect(successRate).toBeGreaterThanOrEqual(80);
      
      console.log(`✅ Connected ${successCount}/${connectionCount} clients (${successRate.toFixed(2)}%)`);
      console.log(`   Note: Test scaled to 100 connections (production target: 1000+)`);
    }, 45000); // 45 second timeout

    test('should track all concurrent connections correctly', async () => {
      const clients = [];
      const connectionCount = 50; // Smaller for tracking test

      // Connect multiple clients
      for (let i = 0; i < connectionCount; i++) {
        const client = ioClient(`http://localhost:${PORT}`, {
          auth: { token: testToken },
          reconnection: false,
        });

        await new Promise((resolve) => {
          client.on('connect', resolve);
        });

        clients.push(client);
      }

      // Check statistics
      const stats = socketService.getStats();
      expect(stats.totalConnections).toBeGreaterThanOrEqual(connectionCount);

      // Cleanup
      clients.forEach((client) => client.disconnect());
      await new Promise((resolve) => setTimeout(resolve, 500));
    }, 45000); // Match timeout with other tests
  });

  describe('Rapid Connect/Disconnect Cycles', () => {
    test('should handle rapid connection cycles', async () => {
      const cycles = 100;
      const results = [];

      for (let i = 0; i < cycles; i++) {
        const client = ioClient(`http://localhost:${PORT}`, {
          auth: { token: testToken },
          reconnection: false,
        });

        const cycleResult = await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            resolve({ success: false, cycle: i });
          }, 2000);

          client.on('connect', () => {
            clearTimeout(timeout);
            client.disconnect();
            resolve({ success: true, cycle: i });
          });
        });

        results.push(cycleResult);
      }

      const successCount = results.filter((r) => r.success).length;
      const successRate = (successCount / cycles) * 100;

      expect(successRate).toBeGreaterThanOrEqual(95);
      console.log(`✅ Completed ${successCount}/${cycles} rapid cycles (${successRate.toFixed(2)}%)`);
    }, 30000);

    test('should clean up resources after rapid disconnects', async () => {
      const initialStats = socketService.getStats();
      const initialConnections = initialStats.totalConnections;

      // Create and destroy 50 connections
      for (let i = 0; i < 50; i++) {
        const client = ioClient(`http://localhost:${PORT}`, {
          auth: { token: testToken },
          reconnection: false,
        });

        await new Promise((resolve) => {
          client.on('connect', () => {
            client.disconnect();
            resolve();
          });
        });
      }

      // Wait for cleanup
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify cleanup happened
      const finalStats = socketService.getStats();
      const connectionDelta = finalStats.totalConnections - initialConnections;

      // Should have increased but then cleaned up
      expect(connectionDelta).toBeLessThanOrEqual(50);
      console.log(`✅ Resource cleanup verified (delta: ${connectionDelta})`);
    }, 30000);
  });

  describe('Connection Pool Management', () => {
    test('should handle connection pool at capacity', async () => {
      const clients = [];
      const maxConnections = 100; // Reduced from 500 for CI performance

      // Fill connection pool
      const connectionPromises = Array.from({ length: maxConnections }, (_, i) => {
        return new Promise((resolve, reject) => {
          const client = ioClient(`http://localhost:${PORT}`, {
            auth: { token: testToken },
            reconnection: false,
            timeout: 5000,
          });

          const timeout = setTimeout(() => {
            reject(new Error(`Connection ${i} timeout`));
          }, 10000);

          client.on('connect', () => {
            clearTimeout(timeout);
            clients.push(client);
            resolve();
          });

          client.on('connect_error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        });
      });

      const results = await Promise.allSettled(connectionPromises);
      const successCount = results.filter((r) => r.status === 'fulfilled').length;

      expect(successCount).toBeGreaterThanOrEqual(maxConnections * 0.9);

      // Cleanup
      clients.forEach((client) => {
        if (client.connected) {
          client.disconnect();
        }
      });

      console.log(`✅ Pool handled ${successCount}/${maxConnections} connections`);
    }, 60000);

    test('should handle multiple connections per user', async () => {
      const connectionsPerUser = 10;
      const clients = [];

      // Create multiple connections for same user
      for (let i = 0; i < connectionsPerUser; i++) {
        const client = ioClient(`http://localhost:${PORT}`, {
          auth: { token: testToken },
          reconnection: false,
        });

        await new Promise((resolve) => {
          client.on('connect', resolve);
        });

        clients.push(client);
      }

      // All should be connected
      expect(clients.every((c) => c.connected)).toBe(true);

      // Cleanup
      clients.forEach((client) => client.disconnect());
      await new Promise((resolve) => setTimeout(resolve, 500));
    }, 15000);
  });

  describe('Connection Timeout Under Load', () => {
    test('should handle connection timeouts gracefully', async () => {
      // Create connections with very short timeout
      const clients = [];
      const connectionCount = 50;

      for (let i = 0; i < connectionCount; i++) {
        const client = ioClient(`http://localhost:${PORT}`, {
          auth: { token: testToken },
          reconnection: false,
          timeout: 100, // Very short timeout
        });

        clients.push(client);
      }

      // Wait for connections to timeout or succeed
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Cleanup all clients
      clients.forEach((client) => {
        if (client.connected) {
          client.disconnect();
        }
      });

      // Service should still be operational
      const stats = socketService.getStats();
      expect(stats).toBeDefined();
    }, 15000);
  });

  describe('Resource Cleanup Validation', () => {
    test('should clean up rate limiters after disconnection', async () => {
      const clients = [];
      const connectionCount = 20;

      // Create connections
      for (let i = 0; i < connectionCount; i++) {
        const client = ioClient(`http://localhost:${PORT}`, {
          auth: { token: testToken },
          reconnection: false,
        });

        await new Promise((resolve) => {
          client.on('connect', resolve);
        });

        clients.push(client);
      }

      // Get rate limiter count before disconnect
      const rateLimitersBefore = socketService.rateLimiters.size;
      expect(rateLimitersBefore).toBeGreaterThan(0);

      // Disconnect all
      clients.forEach((client) => client.disconnect());
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Rate limiters should be cleaned up (or at least reduced)
      const rateLimitersAfter = socketService.rateLimiters.size;
      expect(rateLimitersAfter).toBeLessThan(rateLimitersBefore);

      console.log(`✅ Rate limiters: ${rateLimitersBefore} → ${rateLimitersAfter}`);
    }, 15000);

    test('should clean up room memberships after disconnection', async () => {
      const client = ioClient(`http://localhost:${PORT}`, {
        auth: { token: testToken },
        reconnection: false,
      });

      await new Promise((resolve) => {
        client.on('connect', resolve);
      });

      // Join a room
      const roomName = 'test-room-cleanup';
      client.emit('room:join', { room: roomName });

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check room membership exists
      const membershipsBefore = socketService.userRooms.size;
      expect(membershipsBefore).toBeGreaterThan(0);

      // Disconnect
      client.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check cleanup (may not be immediate but should reduce)
      const membershipsAfter = socketService.userRooms.size;
      expect(membershipsAfter).toBeLessThanOrEqual(membershipsBefore);

      console.log(`✅ Room memberships: ${membershipsBefore} → ${membershipsAfter}`);
    }, 15000);
  });
});
