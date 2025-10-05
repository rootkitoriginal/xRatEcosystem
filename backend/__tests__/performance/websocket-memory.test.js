const http = require('http');
const { io: ioClient } = require('socket.io-client');
const { SocketService } = require('../../src/websocket');
const { generateAccessToken } = require('../../src/utils/jwt');

/**
 * WebSocket Memory Management & Leak Detection
 * Tests memory usage patterns and identifies potential memory leaks
 */
describe('WebSocket Memory Management', () => {
  let httpServer;
  let socketService;
  let mockRedisClient;
  let testToken;
  const PORT = 30002;

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

    httpServer = http.createServer();
    
    mockRedisClient = {
      rPush: jest.fn().mockResolvedValue(true),
      expire: jest.fn().mockResolvedValue(true),
      lRange: jest.fn().mockResolvedValue([]),
      del: jest.fn().mockResolvedValue(true),
    };

    testToken = generateAccessToken({ userId: 'test-user-id' });
    socketService = new SocketService(httpServer, mockRedisClient);

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
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  // Helper to get memory usage
  const getMemoryUsage = () => {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed / 1024 / 1024, // MB
      heapTotal: usage.heapTotal / 1024 / 1024,
      external: usage.external / 1024 / 1024,
      rss: usage.rss / 1024 / 1024,
    };
  };

  // Force garbage collection if available
  const forceGC = () => {
    if (global.gc) {
      global.gc();
    }
  };

  describe('Memory Usage During Extended Sessions', () => {
    test('should not leak memory during long-running connections', async () => {
      forceGC();
      const initialMemory = getMemoryUsage();
      
      const clients = [];
      const connectionCount = 50;
      const sessionDuration = 5000; // 5 seconds

      // Create long-running connections
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

      const afterConnectionMemory = getMemoryUsage();
      
      // Keep connections alive
      await new Promise((resolve) => setTimeout(resolve, sessionDuration));

      const duringSessionMemory = getMemoryUsage();

      // Disconnect all
      clients.forEach((client) => client.disconnect());
      await new Promise((resolve) => setTimeout(resolve, 1000));

      forceGC();
      await new Promise((resolve) => setTimeout(resolve, 500));

      const afterDisconnectMemory = getMemoryUsage();

      // Memory should not grow unbounded
      const memoryGrowth = duringSessionMemory.heapUsed - afterConnectionMemory.heapUsed;
      const memoryReclaimed = duringSessionMemory.heapUsed - afterDisconnectMemory.heapUsed;

      console.log('📊 Memory Usage:');
      console.log(`  Initial: ${initialMemory.heapUsed.toFixed(2)} MB`);
      console.log(`  After Connect: ${afterConnectionMemory.heapUsed.toFixed(2)} MB`);
      console.log(`  During Session: ${duringSessionMemory.heapUsed.toFixed(2)} MB`);
      console.log(`  After Disconnect: ${afterDisconnectMemory.heapUsed.toFixed(2)} MB`);
      console.log(`  Growth during session: ${memoryGrowth.toFixed(2)} MB`);
      console.log(`  Reclaimed after disconnect: ${memoryReclaimed.toFixed(2)} MB`);

      // Memory growth during session should be minimal (< 10MB)
      expect(Math.abs(memoryGrowth)).toBeLessThan(10);
    }, 30000);

    test('should maintain stable memory with repeated connect/disconnect cycles', async () => {
      const cycles = 20;
      const connectionsPerCycle = 10;
      const memorySnapshots = [];

      forceGC();
      memorySnapshots.push(getMemoryUsage().heapUsed);

      for (let cycle = 0; cycle < cycles; cycle++) {
        const clients = [];

        // Create connections
        for (let i = 0; i < connectionsPerCycle; i++) {
          const client = ioClient(`http://localhost:${PORT}`, {
            auth: { token: testToken },
            reconnection: false,
          });

          await new Promise((resolve) => {
            client.on('connect', resolve);
          });

          clients.push(client);
        }

        // Brief activity
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Disconnect
        clients.forEach((client) => client.disconnect());
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Snapshot memory every 5 cycles
        if (cycle % 5 === 0) {
          forceGC();
          await new Promise((resolve) => setTimeout(resolve, 100));
          memorySnapshots.push(getMemoryUsage().heapUsed);
        }
      }

      // Check memory trend
      const firstSnapshot = memorySnapshots[0];
      const lastSnapshot = memorySnapshots[memorySnapshots.length - 1];
      const memoryGrowth = lastSnapshot - firstSnapshot;

      console.log('📊 Memory Snapshots (MB):', memorySnapshots.map(m => m.toFixed(2)));
      console.log(`📈 Total memory growth: ${memoryGrowth.toFixed(2)} MB`);

      // Memory growth should be minimal (< 20MB over many cycles)
      expect(memoryGrowth).toBeLessThan(20);
    }, 60000);
  });

  describe('Event Listener Memory Management', () => {
    test('should clean up event listeners on disconnect', async () => {
      const client = ioClient(`http://localhost:${PORT}`, {
        auth: { token: testToken },
        reconnection: false,
      });

      await new Promise((resolve) => {
        client.on('connect', resolve);
      });

      // Add multiple event listeners
      const eventHandlers = [
        'data:update',
        'notification',
        'user:status',
        'system:health',
      ];

      eventHandlers.forEach((event) => {
        client.on(event, () => {});
      });

      const socketId = client.id;
      
      // Verify connection exists
      const connectedBefore = socketService.connectedUsers.size > 0;
      expect(connectedBefore).toBe(true);

      // Disconnect
      client.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify cleanup
      let hasCleanedUp = true;
      socketService.connectedUsers.forEach((sockets) => {
        if (sockets.has(socketId)) {
          hasCleanedUp = false;
        }
      });

      expect(hasCleanedUp).toBe(true);
      console.log('✅ Event listeners cleaned up after disconnect');
    }, 15000);

    test('should not accumulate listeners with repeated connections', async () => {
      const iterations = 30;
      
      for (let i = 0; i < iterations; i++) {
        const client = ioClient(`http://localhost:${PORT}`, {
          auth: { token: testToken },
          reconnection: false,
        });

        await new Promise((resolve) => {
          client.on('connect', resolve);
        });

        // Add event listeners
        client.on('data:update', () => {});
        client.on('notification', () => {});

        // Disconnect immediately
        client.disconnect();
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Force cleanup
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check that resources are cleaned up
      const stats = socketService.getStats();
      
      // Should have minimal active connections
      expect(stats.totalConnections).toBeLessThan(5);
      console.log(`✅ After ${iterations} iterations, only ${stats.totalConnections} connections remain`);
    }, 30000);
  });

  describe('Room Membership Memory Management', () => {
    test('should clean up room memberships on disconnect', async () => {
      const clients = [];
      const roomCount = 10;
      const clientsPerRoom = 5;

      // Create clients and join multiple rooms
      for (let i = 0; i < clientsPerRoom; i++) {
        const client = ioClient(`http://localhost:${PORT}`, {
          auth: { token: testToken },
          reconnection: false,
        });

        await new Promise((resolve) => {
          client.on('connect', resolve);
        });

        // Join multiple rooms
        for (let j = 0; j < roomCount; j++) {
          client.emit('room:join', { room: `test-room-${j}` });
        }

        clients.push(client);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const roomsBefore = socketService.userRooms.size;
      expect(roomsBefore).toBeGreaterThan(0);

      // Disconnect all clients
      clients.forEach((client) => client.disconnect());
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const roomsAfter = socketService.userRooms.size;

      // Rooms should be cleaned up
      expect(roomsAfter).toBeLessThan(roomsBefore);
      console.log(`✅ Room cleanup: ${roomsBefore} → ${roomsAfter} memberships`);
    }, 20000);

    test('should handle memory efficiently with many room joins/leaves', async () => {
      forceGC();
      const initialMemory = getMemoryUsage().heapUsed;

      const client = ioClient(`http://localhost:${PORT}`, {
        auth: { token: testToken },
        reconnection: false,
      });

      await new Promise((resolve) => {
        client.on('connect', resolve);
      });

      // Rapidly join and leave rooms
      const operations = 100;
      for (let i = 0; i < operations; i++) {
        client.emit('room:join', { room: `room-${i % 10}` });
        
        if (i % 2 === 0) {
          client.emit('room:leave', { room: `room-${(i - 2) % 10}` });
        }
        
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      forceGC();
      const afterMemory = getMemoryUsage().heapUsed;
      const memoryGrowth = afterMemory - initialMemory;

      client.disconnect();

      console.log(`📊 Memory growth after ${operations} room operations: ${memoryGrowth.toFixed(2)} MB`);
      
      // Memory growth should be minimal
      expect(memoryGrowth).toBeLessThan(5);
    }, 30000);
  });

  describe('Message Queue Memory Usage', () => {
    test('should not leak memory with message queuing', async () => {
      forceGC();
      const initialMemory = getMemoryUsage().heapUsed;

      const messageCount = 1000;
      
      // Queue many messages
      for (let i = 0; i < messageCount; i++) {
        await socketService.queueNotification('test-user-id', {
          type: 'test',
          message: `Test notification ${i}`,
          timestamp: Date.now(),
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      forceGC();
      const afterQueueMemory = getMemoryUsage().heapUsed;
      const memoryGrowth = afterQueueMemory - initialMemory;

      console.log(`📊 Memory growth after queuing ${messageCount} messages: ${memoryGrowth.toFixed(2)} MB`);

      // Memory growth should be reasonable (< 10MB for 1000 messages)
      expect(memoryGrowth).toBeLessThan(10);
    }, 20000);

    test('should handle memory efficiently during high-volume broadcasting', async () => {
      const clients = [];
      const clientCount = 20;

      // Create multiple clients
      for (let i = 0; i < clientCount; i++) {
        const client = ioClient(`http://localhost:${PORT}`, {
          auth: { token: testToken },
          reconnection: false,
        });

        await new Promise((resolve) => {
          client.on('connect', resolve);
        });

        clients.push(client);
      }

      forceGC();
      const beforeBroadcast = getMemoryUsage().heapUsed;

      // Broadcast many messages
      const broadcastCount = 200;
      for (let i = 0; i < broadcastCount; i++) {
        socketService.io.emit('test:message', {
          id: i,
          data: `Broadcast message ${i}`,
          timestamp: Date.now(),
        });
        
        if (i % 50 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      forceGC();
      const afterBroadcast = getMemoryUsage().heapUsed;
      const memoryGrowth = afterBroadcast - beforeBroadcast;

      // Cleanup
      clients.forEach((client) => client.disconnect());

      console.log(`📊 Memory growth during ${broadcastCount} broadcasts: ${memoryGrowth.toFixed(2)} MB`);

      // Memory growth should be reasonable
      expect(memoryGrowth).toBeLessThan(15);
    }, 30000);
  });

  describe('Garbage Collection Performance', () => {
    test('should allow garbage collection after disconnections', async () => {
      const iterations = 5;
      const clientsPerIteration = 20;
      const memorySnapshots = [];

      for (let iter = 0; iter < iterations; iter++) {
        const clients = [];

        // Create connections
        for (let i = 0; i < clientsPerIteration; i++) {
          const client = ioClient(`http://localhost:${PORT}`, {
            auth: { token: testToken },
            reconnection: false,
          });

          await new Promise((resolve) => {
            client.on('connect', resolve);
          });

          clients.push(client);
        }

        // Disconnect
        clients.forEach((client) => client.disconnect());
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Force GC and measure
        forceGC();
        await new Promise((resolve) => setTimeout(resolve, 200));
        memorySnapshots.push(getMemoryUsage().heapUsed);
      }

      console.log('📊 Memory after each iteration (MB):', 
        memorySnapshots.map(m => m.toFixed(2)));

      // Memory should stabilize (last snapshot shouldn't be much higher than first)
      const firstSnapshot = memorySnapshots[0];
      const lastSnapshot = memorySnapshots[memorySnapshots.length - 1];
      const memoryDrift = lastSnapshot - firstSnapshot;

      console.log(`📈 Memory drift: ${memoryDrift.toFixed(2)} MB`);

      // Memory drift should be minimal (< 10MB)
      expect(Math.abs(memoryDrift)).toBeLessThan(10);
    }, 45000);
  });

  describe('Connection Object Cleanup', () => {
    test('should fully clean up connection objects', async () => {
      const clients = [];
      const connectionCount = 30;

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

      const socketIdsBefore = Array.from(socketService.rateLimiters.keys());
      expect(socketIdsBefore.length).toBeGreaterThan(0);

      // Disconnect all
      clients.forEach((client) => client.disconnect());
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Check that socket IDs are cleaned up from rate limiters
      const socketIdsAfter = Array.from(socketService.rateLimiters.keys());
      
      // Most should be cleaned up
      expect(socketIdsAfter.length).toBeLessThan(socketIdsBefore.length);
      
      console.log(`✅ Connection cleanup: ${socketIdsBefore.length} → ${socketIdsAfter.length} rate limiters`);
    }, 20000);
  });
});
