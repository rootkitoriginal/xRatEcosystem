const http = require('http');
const { io: ioClient } = require('socket.io-client');
const { SocketService } = require('../../src/websocket');
const { generateAccessToken } = require('../../src/utils/jwt');

/**
 * WebSocket Message Throughput & Latency Testing
 * Tests high-frequency messaging, large payloads, and broadcasting performance
 */
describe('WebSocket Message Throughput Testing', () => {
  let httpServer;
  let socketService;
  let mockRedisClient;
  let testToken;
  const PORT = 30003;

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

  describe('High-Frequency Message Broadcasting', () => {
    test('should handle 1000 rapid broadcasts', async () => {
      const client = ioClient(`http://localhost:${PORT}`, {
        auth: { token: testToken },
        reconnection: false,
      });

      await new Promise((resolve) => {
        client.on('connect', resolve);
      });

      const messageCount = 1000;
      const receivedMessages = [];

      // Listen for messages
      client.on('test:burst', (data) => {
        receivedMessages.push(data);
      });

      const startTime = Date.now();

      // Broadcast rapidly
      for (let i = 0; i < messageCount; i++) {
        socketService.io.emit('test:burst', {
          id: i,
          timestamp: Date.now(),
        });
      }

      // Wait for messages to be received
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const endTime = Date.now();
      const duration = endTime - startTime;
      const throughput = (messageCount / duration) * 1000; // messages per second

      client.disconnect();

      console.log('📊 Throughput Test Results:');
      console.log(`  Sent: ${messageCount} messages`);
      console.log(`  Received: ${receivedMessages.length} messages`);
      console.log(`  Duration: ${duration}ms`);
      console.log(`  Throughput: ${throughput.toFixed(0)} msg/sec`);

      // Should receive most messages (allowing for some loss under extreme load)
      expect(receivedMessages.length).toBeGreaterThanOrEqual(messageCount * 0.9);
    }, 30000);

    test('should maintain low latency under high load', async () => {
      const clients = [];
      const clientCount = 10;
      const messagesPerClient = 50;

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

      const latencies = [];

      // Each client sends messages and measures round-trip time
      const messagePromises = clients.map((client, clientIndex) => {
        return new Promise((resolve) => {
          let receivedCount = 0;

          client.on('test:echo', (data) => {
            const latency = Date.now() - data.sentAt;
            latencies.push(latency);
            receivedCount++;

            if (receivedCount === messagesPerClient) {
              resolve();
            }
          });

          // Send messages
          for (let i = 0; i < messagesPerClient; i++) {
            setTimeout(() => {
              const sentAt = Date.now();
              // Echo back through server
              socketService.io.to(client.id).emit('test:echo', { 
                sentAt,
                clientIndex,
                messageIndex: i 
              });
            }, i * 10);
          }
        });
      });

      await Promise.all(messagePromises);

      // Calculate statistics
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      const minLatency = Math.min(...latencies);

      // Cleanup
      clients.forEach((client) => client.disconnect());

      console.log('📊 Latency Statistics:');
      console.log(`  Average: ${avgLatency.toFixed(2)}ms`);
      console.log(`  Min: ${minLatency}ms`);
      console.log(`  Max: ${maxLatency}ms`);
      console.log(`  Total messages: ${latencies.length}`);

      // Average latency should be reasonable (< 100ms)
      expect(avgLatency).toBeLessThan(100);
    }, 45000);
  });

  describe('Large Payload Message Handling', () => {
    test('should handle 1MB+ message payloads', async () => {
      const client = ioClient(`http://localhost:${PORT}`, {
        auth: { token: testToken },
        reconnection: false,
        maxHttpBufferSize: 5e6, // 5MB
      });

      await new Promise((resolve) => {
        client.on('connect', resolve);
      });

      // Generate large payload (1MB)
      const largeData = 'x'.repeat(1024 * 1024); // 1MB string
      let received = false;

      client.on('large:payload', (data) => {
        received = true;
        expect(data.payload.length).toBe(largeData.length);
      });

      // Send large payload
      socketService.io.to(client.id).emit('large:payload', {
        payload: largeData,
        size: largeData.length,
      });

      await new Promise((resolve) => setTimeout(resolve, 3000));

      client.disconnect();

      expect(received).toBe(true);
      console.log(`✅ Successfully transmitted ${(largeData.length / 1024 / 1024).toFixed(2)}MB payload`);
    }, 30000);

    test('should handle multiple large payloads sequentially', async () => {
      const client = ioClient(`http://localhost:${PORT}`, {
        auth: { token: testToken },
        reconnection: false,
        maxHttpBufferSize: 10e6, // 10MB
      });

      await new Promise((resolve) => {
        client.on('connect', resolve);
      });

      const payloadSize = 500 * 1024; // 500KB
      const payloadCount = 5;
      const receivedPayloads = [];

      client.on('large:sequential', (data) => {
        receivedPayloads.push(data.index);
      });

      const startTime = Date.now();

      // Send multiple large payloads
      for (let i = 0; i < payloadCount; i++) {
        const payload = 'x'.repeat(payloadSize);
        socketService.io.to(client.id).emit('large:sequential', {
          index: i,
          payload,
          size: payload.length,
        });
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));

      const duration = Date.now() - startTime;
      const totalMB = (payloadSize * payloadCount) / 1024 / 1024;
      const throughputMBps = totalMB / (duration / 1000);

      client.disconnect();

      console.log('📊 Large Payload Sequential Test:');
      console.log(`  Total data: ${totalMB.toFixed(2)}MB`);
      console.log(`  Duration: ${duration}ms`);
      console.log(`  Throughput: ${throughputMBps.toFixed(2)}MB/s`);
      console.log(`  Received: ${receivedPayloads.length}/${payloadCount} payloads`);

      expect(receivedPayloads.length).toBe(payloadCount);
    }, 45000);
  });

  describe('Message Queue Overflow Scenarios', () => {
    test('should handle message queue overflow gracefully', async () => {
      const client = ioClient(`http://localhost:${PORT}`, {
        auth: { token: testToken },
        reconnection: false,
      });

      await new Promise((resolve) => {
        client.on('connect', resolve);
      });

      const overflowMessageCount = 10000;
      let receivedCount = 0;

      client.on('overflow:test', () => {
        receivedCount++;
      });

      // Flood with messages
      const startTime = Date.now();
      for (let i = 0; i < overflowMessageCount; i++) {
        socketService.io.to(client.id).emit('overflow:test', { index: i });
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
      const duration = Date.now() - startTime;

      client.disconnect();

      const deliveryRate = (receivedCount / overflowMessageCount) * 100;

      console.log('📊 Message Overflow Test:');
      console.log(`  Sent: ${overflowMessageCount} messages`);
      console.log(`  Received: ${receivedCount} messages`);
      console.log(`  Delivery rate: ${deliveryRate.toFixed(2)}%`);
      console.log(`  Duration: ${duration}ms`);

      // Should handle overflow without crashing (may lose some messages)
      expect(receivedCount).toBeGreaterThan(0);
    }, 30000);

    test('should prioritize message delivery under queue pressure', async () => {
      const clients = [];
      const clientCount = 5;

      // Create clients
      for (let i = 0; i < clientCount; i++) {
        const client = ioClient(`http://localhost:${PORT}`, {
          auth: { token: testToken },
          reconnection: false,
        });

        await new Promise((resolve) => {
          client.on('connect', resolve);
        });

        client.receivedCount = 0;
        client.on('priority:test', () => {
          client.receivedCount++;
        });

        clients.push(client);
      }

      // Send many messages to all clients
      const messageCount = 1000;
      for (let i = 0; i < messageCount; i++) {
        socketService.io.emit('priority:test', { index: i });
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const deliveryRates = clients.map((c) => (c.receivedCount / messageCount) * 100);
      
      clients.forEach((client, index) => {
        client.disconnect();
        console.log(`  Client ${index}: ${client.receivedCount}/${messageCount} (${deliveryRates[index].toFixed(1)}%)`);
      });

      // All clients should receive most messages
      deliveryRates.forEach((rate) => {
        expect(rate).toBeGreaterThanOrEqual(80);
      });
    }, 30000);
  });

  describe('Room Broadcasting Performance', () => {
    test('should broadcast to 100+ users in same room efficiently', async () => {
      const clients = [];
      const clientCount = 100;
      const roomName = 'performance-test-room';

      // Create clients and join room
      for (let i = 0; i < clientCount; i++) {
        const client = ioClient(`http://localhost:${PORT}`, {
          auth: { token: testToken },
          reconnection: false,
        });

        await new Promise((resolve) => {
          client.on('connect', resolve);
        });

        // Join room
        client.emit('room:join', { room: roomName });
        
        client.receivedCount = 0;
        client.on('room:broadcast', () => {
          client.receivedCount++;
        });

        clients.push(client);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Broadcast to room
      const broadcastCount = 50;
      const startTime = Date.now();

      for (let i = 0; i < broadcastCount; i++) {
        socketService.io.to(roomName).emit('room:broadcast', {
          index: i,
          timestamp: Date.now(),
        });
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      const duration = Date.now() - startTime;

      const totalExpectedDeliveries = clientCount * broadcastCount;
      const totalActualDeliveries = clients.reduce((sum, c) => sum + c.receivedCount, 0);
      const deliveryRate = (totalActualDeliveries / totalExpectedDeliveries) * 100;

      console.log('📊 Room Broadcasting Test:');
      console.log(`  Clients: ${clientCount}`);
      console.log(`  Broadcasts: ${broadcastCount}`);
      console.log(`  Expected deliveries: ${totalExpectedDeliveries}`);
      console.log(`  Actual deliveries: ${totalActualDeliveries}`);
      console.log(`  Delivery rate: ${deliveryRate.toFixed(2)}%`);
      console.log(`  Duration: ${duration}ms`);

      // Cleanup
      clients.forEach((client) => client.disconnect());

      // Should deliver most messages
      expect(deliveryRate).toBeGreaterThanOrEqual(90);
    }, 60000);

    test('should handle cross-room message delivery', async () => {
      const roomCount = 5;
      const clientsPerRoom = 10;
      const rooms = {};

      // Create rooms with clients
      for (let r = 0; r < roomCount; r++) {
        const roomName = `room-${r}`;
        rooms[roomName] = [];

        for (let c = 0; c < clientsPerRoom; c++) {
          const client = ioClient(`http://localhost:${PORT}`, {
            auth: { token: testToken },
            reconnection: false,
          });

          await new Promise((resolve) => {
            client.on('connect', resolve);
          });

          client.emit('room:join', { room: roomName });
          
          client.receivedMessages = [];
          client.on('room:message', (data) => {
            client.receivedMessages.push(data);
          });

          rooms[roomName].push(client);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Send messages to each room
      const messagesPerRoom = 10;
      for (const roomName of Object.keys(rooms)) {
        for (let i = 0; i < messagesPerRoom; i++) {
          socketService.io.to(roomName).emit('room:message', {
            room: roomName,
            index: i,
          });
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify isolation
      let correctIsolation = true;
      for (const [roomName, clients] of Object.entries(rooms)) {
        for (const client of clients) {
          // Each client should only receive messages from its room
          const wrongRoomMessages = client.receivedMessages.filter(
            (msg) => msg.room !== roomName
          );
          
          if (wrongRoomMessages.length > 0) {
            correctIsolation = false;
            console.log(`❌ Client in ${roomName} received ${wrongRoomMessages.length} wrong messages`);
          }
        }
      }

      // Cleanup
      for (const clients of Object.values(rooms)) {
        clients.forEach((client) => client.disconnect());
      }

      expect(correctIsolation).toBe(true);
      console.log('✅ Cross-room message isolation verified');
    }, 60000);
  });

  describe('Message Serialization Performance', () => {
    test('should handle complex object serialization efficiently', async () => {
      const client = ioClient(`http://localhost:${PORT}`, {
        auth: { token: testToken },
        reconnection: false,
      });

      await new Promise((resolve) => {
        client.on('connect', resolve);
      });

      const complexObject = {
        id: 'test-123',
        nested: {
          level1: {
            level2: {
              level3: {
                data: Array(100).fill({ value: 'test', number: Math.random() }),
              },
            },
          },
        },
        arrays: [
          Array(50).fill('string'),
          Array(50).fill(123),
          Array(50).fill({ key: 'value' }),
        ],
        metadata: {
          timestamp: Date.now(),
          version: '1.0.0',
          tags: ['tag1', 'tag2', 'tag3'],
        },
      };

      let received = false;
      client.on('complex:object', (data) => {
        received = true;
        expect(data).toHaveProperty('id');
        expect(data).toHaveProperty('nested');
      });

      const startTime = Date.now();
      socketService.io.to(client.id).emit('complex:object', complexObject);
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const duration = Date.now() - startTime;

      client.disconnect();

      expect(received).toBe(true);
      console.log(`✅ Complex object serialized and transmitted in ${duration}ms`);
    }, 15000);
  });
});
