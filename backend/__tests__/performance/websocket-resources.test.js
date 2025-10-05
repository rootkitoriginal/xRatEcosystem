const http = require('http');
const { io: ioClient } = require('socket.io-client');
const { SocketService } = require('../../src/websocket');
const { generateAccessToken } = require('../../src/utils/jwt');
const os = require('os');

/**
 * WebSocket Resource Exhaustion Testing
 * Tests system behavior under resource constraints and exhaustion scenarios
 */
describe('WebSocket Resource Exhaustion Testing', () => {
  let httpServer;
  let socketService;
  let mockRedisClient;
  let testToken;
  const PORT = 30004;

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

  // Helper to get CPU usage
  const getCPUUsage = () => {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    return {
      idle: totalIdle / cpus.length,
      total: totalTick / cpus.length,
      usage: 100 - (100 * totalIdle) / totalTick,
    };
  };

  describe('CPU Usage Under High Event Load', () => {
    test('should maintain reasonable CPU usage with many connections', async () => {
      const clients = [];
      const clientCount = 50;

      // Measure baseline CPU
      const cpuBefore = getCPUUsage();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create connections with active messaging
      for (let i = 0; i < clientCount; i++) {
        const client = ioClient(`http://localhost:${PORT}`, {
          auth: { token: testToken },
          reconnection: false,
        });

        await new Promise((resolve) => {
          client.on('connect', resolve);
        });

        // Send periodic messages
        const interval = setInterval(() => {
          if (client.connected) {
            client.emit('test:cpu', { index: i, timestamp: Date.now() });
          }
        }, 100);

        client.testInterval = interval;
        clients.push(client);
      }

      // Let activity run
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const cpuDuring = getCPUUsage();

      // Cleanup
      clients.forEach((client) => {
        clearInterval(client.testInterval);
        client.disconnect();
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const cpuAfter = getCPUUsage();

      console.log('📊 CPU Usage:');
      console.log(`  Before: ${cpuBefore.usage.toFixed(2)}%`);
      console.log(`  During load: ${cpuDuring.usage.toFixed(2)}%`);
      console.log(`  After: ${cpuAfter.usage.toFixed(2)}%`);

      // CPU should not pin at 100%
      expect(cpuDuring.usage).toBeLessThan(95);
    }, 45000);

    test('should handle CPU-intensive broadcasting operations', async () => {
      const clients = [];
      const clientCount = 30;

      // Create clients
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

      // Intensive broadcasting
      const broadcastCount = 500;
      const startTime = Date.now();

      for (let i = 0; i < broadcastCount; i++) {
        socketService.io.emit('cpu:intensive', {
          index: i,
          data: Array(100).fill(Math.random()),
        });
        
        // Small delay to allow processing
        if (i % 50 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }

      const duration = Date.now() - startTime;
      
      // Cleanup
      clients.forEach((client) => client.disconnect());

      console.log(`📊 Intensive broadcast completed in ${duration}ms`);
      
      // Should complete in reasonable time
      expect(duration).toBeLessThan(30000);
    }, 45000);
  });

  describe('Memory Exhaustion Recovery', () => {
    test('should recover gracefully from memory pressure', async () => {
      const clients = [];
      const memoryPressureClient = 50;

      // Create connections
      for (let i = 0; i < memoryPressureClient; i++) {
        const client = ioClient(`http://localhost:${PORT}`, {
          auth: { token: testToken },
          reconnection: false,
        });

        await new Promise((resolve) => {
          client.on('connect', resolve);
        });

        clients.push(client);
      }

      // Simulate memory pressure with large messages
      const largePayload = 'x'.repeat(100 * 1024); // 100KB per message
      const messageCount = 100;

      for (let i = 0; i < messageCount; i++) {
        socketService.io.emit('memory:pressure', {
          index: i,
          payload: largePayload,
        });
        
        if (i % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      // System should still be responsive
      const stats = socketService.getStats();
      expect(stats).toBeDefined();
      expect(stats.totalConnections).toBeGreaterThan(0);

      // Cleanup
      clients.forEach((client) => client.disconnect());
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log('✅ Recovered from memory pressure successfully');
    }, 45000);

    test('should handle out-of-memory-like conditions', async () => {
      const clients = [];
      const clientCount = 20;

      // Create clients
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

      // Send very large payloads rapidly
      try {
        const veryLargePayload = 'x'.repeat(1024 * 1024); // 1MB
        
        for (let i = 0; i < 50; i++) {
          socketService.io.emit('oom:test', {
            index: i,
            payload: veryLargePayload,
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.log('Expected error during OOM simulation:', error.message);
      }

      // Cleanup
      clients.forEach((client) => client.disconnect());

      // Service should still be accessible after stress
      const stats = socketService.getStats();
      expect(stats).toBeDefined();

      console.log('✅ System remained stable during OOM-like conditions');
    }, 45000);
  });

  describe('File Descriptor Limit Testing', () => {
    test('should handle many concurrent connections without FD exhaustion', async () => {
      const clients = [];
      const targetConnections = 200;
      let connectionFailures = 0;

      // Attempt many connections
      for (let i = 0; i < targetConnections; i++) {
        try {
          const client = ioClient(`http://localhost:${PORT}`, {
            auth: { token: testToken },
            reconnection: false,
            timeout: 5000,
          });

          const connected = await new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(false), 3000);
            
            client.on('connect', () => {
              clearTimeout(timeout);
              resolve(true);
            });
            
            client.on('connect_error', () => {
              clearTimeout(timeout);
              resolve(false);
            });
          });

          if (connected) {
            clients.push(client);
          } else {
            connectionFailures++;
          }
        } catch (error) {
          connectionFailures++;
        }

        // Small delay between connections
        if (i % 20 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      const successRate = ((targetConnections - connectionFailures) / targetConnections) * 100;

      console.log('📊 File Descriptor Test:');
      console.log(`  Target connections: ${targetConnections}`);
      console.log(`  Successful: ${clients.length}`);
      console.log(`  Failed: ${connectionFailures}`);
      console.log(`  Success rate: ${successRate.toFixed(2)}%`);

      // Cleanup
      clients.forEach((client) => {
        if (client.connected) {
          client.disconnect();
        }
      });

      // Should handle most connections
      expect(successRate).toBeGreaterThanOrEqual(85);
    }, 60000);
  });

  describe('Redis Connection Pool Exhaustion', () => {
    test('should handle Redis unavailability gracefully', async () => {
      // Temporarily make Redis fail
      const originalRPush = mockRedisClient.rPush;
      mockRedisClient.rPush = jest.fn().mockRejectedValue(new Error('Redis connection lost'));

      const clients = [];
      const clientCount = 10;

      // Create connections
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

      // Try to queue notifications (should fail but not crash)
      const queuePromises = [];
      for (let i = 0; i < 20; i++) {
        queuePromises.push(
          socketService.queueNotification('test-user', {
            type: 'test',
            message: `Test ${i}`,
          })
        );
      }

      await Promise.allSettled(queuePromises);

      // Service should still be operational
      const stats = socketService.getStats();
      expect(stats).toBeDefined();

      // Cleanup
      clients.forEach((client) => client.disconnect());
      mockRedisClient.rPush = originalRPush;

      console.log('✅ Handled Redis connection failures gracefully');
    }, 30000);

    test('should handle Redis timeout scenarios', async () => {
      // Make Redis operations slow
      mockRedisClient.rPush = jest.fn().mockImplementation(() => {
        return new Promise((resolve) => setTimeout(() => resolve(true), 2000));
      });

      const client = ioClient(`http://localhost:${PORT}`, {
        auth: { token: testToken },
        reconnection: false,
      });

      await new Promise((resolve) => {
        client.on('connect', resolve);
      });

      // Queue notifications despite slow Redis
      const startTime = Date.now();
      
      await socketService.queueNotification('test-user', {
        type: 'test',
        message: 'Slow Redis test',
      });

      const duration = Date.now() - startTime;

      client.disconnect();

      console.log(`📊 Redis timeout handling: ${duration}ms`);
      
      // Should eventually complete
      expect(duration).toBeLessThan(5000);

      // Restore mock
      mockRedisClient.rPush = jest.fn().mockResolvedValue(true);
    }, 30000);
  });

  describe('Network Bandwidth Saturation', () => {
    test('should handle network saturation with large data transfers', async () => {
      const clients = [];
      const clientCount = 10;

      // Create clients
      for (let i = 0; i < clientCount; i++) {
        const client = ioClient(`http://localhost:${PORT}`, {
          auth: { token: testToken },
          reconnection: false,
          maxHttpBufferSize: 5e6, // 5MB
        });

        await new Promise((resolve) => {
          client.on('connect', resolve);
        });

        client.receivedBytes = 0;
        client.on('bandwidth:test', (data) => {
          client.receivedBytes += data.payload.length;
        });

        clients.push(client);
      }

      // Send large payloads to simulate bandwidth saturation
      const payloadSize = 100 * 1024; // 100KB
      const messageCount = 50;
      const totalDataSent = payloadSize * messageCount * clientCount;

      const startTime = Date.now();

      for (let i = 0; i < messageCount; i++) {
        const payload = 'x'.repeat(payloadSize);
        socketService.io.emit('bandwidth:test', {
          index: i,
          payload,
        });
        
        if (i % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
      const duration = Date.now() - startTime;

      const totalReceived = clients.reduce((sum, c) => sum + c.receivedBytes, 0);
      const throughputMBps = (totalReceived / 1024 / 1024) / (duration / 1000);

      console.log('📊 Bandwidth Saturation Test:');
      console.log(`  Total sent: ${(totalDataSent / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Total received: ${(totalReceived / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Duration: ${duration}ms`);
      console.log(`  Throughput: ${throughputMBps.toFixed(2)}MB/s`);

      // Cleanup
      clients.forEach((client) => client.disconnect());

      // Should transfer significant data
      expect(totalReceived).toBeGreaterThan(totalDataSent * 0.5);
    }, 45000);
  });

  describe('Graceful Degradation Under Load', () => {
    test('should degrade gracefully when overwhelmed', async () => {
      const clients = [];
      const clientCount = 100;
      const messageCount = 100;

      // Create many clients
      for (let i = 0; i < clientCount; i++) {
        const client = ioClient(`http://localhost:${PORT}`, {
          auth: { token: testToken },
          reconnection: false,
        });

        await new Promise((resolve) => {
          client.on('connect', resolve);
        });

        client.receivedCount = 0;
        client.on('degradation:test', () => {
          client.receivedCount++;
        });

        clients.push(client);
      }

      // Overwhelm with messages
      for (let i = 0; i < messageCount; i++) {
        socketService.io.emit('degradation:test', { index: i });
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Calculate delivery statistics
      const deliveryCounts = clients.map((c) => c.receivedCount);
      const avgDelivery = deliveryCounts.reduce((a, b) => a + b, 0) / clients.length;
      const minDelivery = Math.min(...deliveryCounts);
      const maxDelivery = Math.max(...deliveryCounts);

      console.log('📊 Graceful Degradation:');
      console.log(`  Clients: ${clientCount}`);
      console.log(`  Messages sent: ${messageCount}`);
      console.log(`  Avg received: ${avgDelivery.toFixed(1)}`);
      console.log(`  Min received: ${minDelivery}`);
      console.log(`  Max received: ${maxDelivery}`);

      // Cleanup
      clients.forEach((client) => client.disconnect());

      // Should maintain some level of service
      expect(avgDelivery).toBeGreaterThan(messageCount * 0.3);
      console.log('✅ System degraded gracefully under extreme load');
    }, 60000);
  });

  describe('System Stability After Resource Exhaustion', () => {
    test('should remain stable after stress test cycles', async () => {
      const cycles = 3;

      for (let cycle = 0; cycle < cycles; cycle++) {
        const clients = [];
        const clientCount = 50;

        // Stress cycle
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

        // Activity
        for (let i = 0; i < 100; i++) {
          socketService.io.emit('stability:test', { cycle, index: i });
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        // Cleanup
        clients.forEach((client) => client.disconnect());
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Verify system is still operational
        const stats = socketService.getStats();
        expect(stats).toBeDefined();

        console.log(`✅ Cycle ${cycle + 1}/${cycles} completed successfully`);
      }

      console.log('✅ System remained stable through all stress cycles');
    }, 60000);
  });
});
