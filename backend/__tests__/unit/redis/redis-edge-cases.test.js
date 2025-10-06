/**
 * Redis Connection Edge Cases & Failover Testing
 * Comprehensive testing for Redis connection resilience, failover scenarios,
 * and connection edge cases as per Issue #52
 */

const { SocketService } = require('../../../src/websocket');
const DataService = require('../../../src/services/dataService');
const HealthService = require('../../../src/health/healthService');
const http = require('http');

// Mock the websocket validators and authorization modules
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

describe('Redis Connection Edge Cases & Failover Testing', () => {
  describe('Phase A: Connection Resilience Testing', () => {
    describe('Connection Failure Scenarios', () => {
      test('should handle Redis server unavailable on startup', () => {
        const httpServer = http.createServer();
        const nullRedisClient = null;

        const socketService = new SocketService(httpServer, nullRedisClient);

        expect(socketService.redisClient).toBeNull();
        expect(socketService.io).toBeDefined();

        httpServer.close();
      });

      test('should handle Redis connection loss during active operations', async () => {
        const mockRedisClient = {
          isOpen: true,
          rPush: jest.fn().mockRejectedValue(new Error('Connection lost')),
          expire: jest.fn().mockRejectedValue(new Error('Connection lost')),
        };

        const httpServer = http.createServer();
        const socketService = new SocketService(httpServer, mockRedisClient);

        // Attempt to queue notification during connection loss
        await socketService.queueNotification('user-123', {
          type: 'info',
          message: 'Test notification',
        });

        expect(mockRedisClient.rPush).toHaveBeenCalled();
        // Should not crash, error should be handled gracefully

        httpServer.close();
      });

      test('should handle network partition scenarios', async () => {
        const mockRedisClient = {
          isOpen: true,
          rPush: jest.fn().mockImplementation(() => {
            return new Promise((resolve, reject) => {
              // Simulate network timeout
              setTimeout(() => reject(new Error('ETIMEDOUT')), 100);
            });
          }),
        };

        const httpServer = http.createServer();
        const socketService = new SocketService(httpServer, mockRedisClient);

        await socketService.queueNotification('user-123', {
          type: 'info',
          message: 'Test notification',
        });

        expect(mockRedisClient.rPush).toHaveBeenCalled();
        // Should handle timeout gracefully

        httpServer.close();
      });

      test('should handle Redis server restart during operations', async () => {
        let isConnected = true;
        const mockRedisClient = {
          get isOpen() {
            return isConnected;
          },
          lRange: jest.fn().mockImplementation(() => {
            if (!isConnected) {
              return Promise.reject(new Error('Redis connection closed'));
            }
            return Promise.resolve([]);
          }),
        };

        const httpServer = http.createServer();
        const socketService = new SocketService(httpServer, mockRedisClient);

        // Simulate Redis restart
        isConnected = false;

        await socketService.sendQueuedNotifications('user-123', 'socket-123');

        // Should handle gracefully without crashing
        expect(mockRedisClient.lRange).toHaveBeenCalled();

        httpServer.close();
      });

      test('should handle connection timeout during health check', async () => {
        const mockRedisClient = {
          isOpen: true,
          ping: jest.fn().mockImplementation(() => {
            return new Promise((resolve, reject) => {
              setTimeout(() => reject(new Error('Connection timeout')), 100);
            });
          }),
        };

        const healthService = new HealthService(null, mockRedisClient);
        const result = await healthService.checkRedis();

        expect(result.status).toBe('error');
        expect(result.message).toBe('Connection timeout');
        expect(result.latency).toBeNull();
      });

      test('should handle DNS resolution failures for Redis host', async () => {
        const mockRedisClient = {
          isOpen: false,
          ping: jest.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND')),
        };

        const healthService = new HealthService(null, mockRedisClient);
        const result = await healthService.checkRedis();

        expect(result.status).toBe('error');
        expect(result.message).toBe('Redis not connected');
      });
    });

    describe('Connection State Management', () => {
      test('should detect when Redis client is not initialized', async () => {
        const dataService = new DataService(null);

        const cached = await dataService.getFromCache('test-key');
        expect(cached).toBeNull();

        const setResult = await dataService.setInCache('test-key', { data: 'value' });
        expect(setResult).toBe(false);

        await dataService.invalidateCache('test-id', 'user-123');
        // Should complete without errors
      });

      test('should detect when Redis connection is closed', async () => {
        const mockRedisClient = {
          isOpen: false,
          get: jest.fn(),
          set: jest.fn(),
          del: jest.fn(),
        };

        const dataService = new DataService(mockRedisClient);

        const cached = await dataService.getFromCache('test-key');
        expect(cached).toBeNull();
        expect(mockRedisClient.get).not.toHaveBeenCalled();
      });

      test('should handle rapid connection state changes', async () => {
        let connectionState = false;
        const mockRedisClient = {
          get isOpen() {
            // Toggle connection state on each access
            connectionState = !connectionState;
            return connectionState;
          },
          get: jest.fn().mockResolvedValue(JSON.stringify({ data: 'value' })),
          set: jest.fn().mockResolvedValue('OK'),
        };

        const dataService = new DataService(mockRedisClient);

        // First call - connection toggles to true
        const result1 = await dataService.getFromCache('test-key');
        // Second call - connection toggles to false
        const result2 = await dataService.setInCache('test-key', { data: 'value' });

        // Should handle state changes gracefully
        expect(result1).toEqual({ data: 'value' });
        expect(result2).toBe(false);
      });
    });

    describe('Automatic Reconnection', () => {
      test('should continue operations after reconnection', async () => {
        let connectionAttempt = 0;
        const mockRedisClient = {
          isOpen: true,
          get: jest.fn().mockImplementation(() => {
            connectionAttempt++;
            if (connectionAttempt === 1) {
              return Promise.reject(new Error('Connection lost'));
            }
            return Promise.resolve(null);
          }),
        };

        const dataService = new DataService(mockRedisClient);

        // First attempt fails
        const result1 = await dataService.getFromCache('test-key');
        expect(result1).toBeNull();

        // Second attempt succeeds (simulating reconnection)
        const result2 = await dataService.getFromCache('test-key');
        expect(result2).toBeNull();
        expect(mockRedisClient.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Phase B: Operation Timeout & Retry Logic', () => {
    describe('Command Timeout Scenarios', () => {
      test('should handle slow Redis responses', async () => {
        const mockRedisClient = {
          isOpen: true,
          get: jest.fn().mockImplementation(() => {
            return new Promise((resolve) => {
              // Simulate slow response
              setTimeout(() => resolve(null), 200);
            });
          }),
        };

        const dataService = new DataService(mockRedisClient);
        const startTime = Date.now();

        await dataService.getFromCache('test-key');

        const duration = Date.now() - startTime;
        // Allow small timing variance (190ms instead of 200ms)
        expect(duration).toBeGreaterThanOrEqual(190);
        expect(mockRedisClient.get).toHaveBeenCalled();
      });

      test('should handle operation timeout', async () => {
        const mockRedisClient = {
          isOpen: true,
          ping: jest.fn().mockImplementation(() => {
            return new Promise((resolve, reject) => {
              setTimeout(() => reject(new Error('Operation timeout')), 50);
            });
          }),
        };

        const healthService = new HealthService(null, mockRedisClient);
        const result = await healthService.checkRedis();

        expect(result.status).toBe('error');
        expect(result.message).toBe('Operation timeout');
      });

      test('should handle concurrent operation timeouts', async () => {
        const mockRedisClient = {
          isOpen: true,
          get: jest.fn().mockImplementation(() => {
            return new Promise((resolve, reject) => {
              setTimeout(() => reject(new Error('Timeout')), 100);
            });
          }),
        };

        const dataService = new DataService(mockRedisClient);

        const promises = [
          dataService.getFromCache('key-1'),
          dataService.getFromCache('key-2'),
          dataService.getFromCache('key-3'),
        ];

        const results = await Promise.all(promises);

        expect(results).toEqual([null, null, null]);
        expect(mockRedisClient.get).toHaveBeenCalledTimes(3);
      });
    });

    describe('Queue Overflow Scenarios', () => {
      test('should handle large notification queue', async () => {
        const largeQueue = Array.from({ length: 1000 }, (_, i) =>
          JSON.stringify({ type: 'info', message: `Notification ${i}` })
        );

        const mockRedisClient = {
          isOpen: true,
          lRange: jest.fn().mockResolvedValue(largeQueue),
          del: jest.fn().mockResolvedValue(1),
        };

        const httpServer = http.createServer();
        const socketService = new SocketService(httpServer, mockRedisClient);
        socketService.io.to = jest.fn().mockReturnValue({ emit: jest.fn() });

        await socketService.sendQueuedNotifications('user-123', 'socket-123');

        expect(mockRedisClient.lRange).toHaveBeenCalled();
        expect(socketService.io.to).toHaveBeenCalled();
        expect(mockRedisClient.del).toHaveBeenCalled();

        httpServer.close();
      });

      test('should handle queue operation during high memory pressure', async () => {
        const mockRedisClient = {
          isOpen: true,
          rPush: jest.fn().mockRejectedValue(new Error('OOM command not allowed when used memory')),
          expire: jest.fn().mockResolvedValue(1),
        };

        const httpServer = http.createServer();
        const socketService = new SocketService(httpServer, mockRedisClient);

        await socketService.queueNotification('user-123', {
          type: 'info',
          message: 'Test notification',
        });

        expect(mockRedisClient.rPush).toHaveBeenCalled();
        // Should handle OOM error gracefully

        httpServer.close();
      });
    });

    describe('Operation Cancellation', () => {
      test('should handle operation cancellation during timeout', async () => {
        let operationCancelled = false;
        const mockRedisClient = {
          isOpen: true,
          get: jest.fn().mockImplementation(() => {
            return new Promise((_resolve, reject) => {
              setTimeout(() => {
                operationCancelled = true;
                reject(new Error('Operation cancelled'));
              }, 100);

              // Cleanup would happen here in real implementation
            });
          }),
        };

        const dataService = new DataService(mockRedisClient);
        await dataService.getFromCache('test-key');

        expect(operationCancelled).toBe(true);
      });
    });
  });

  describe('Phase C: Failover & High Availability', () => {
    describe('Master-Slave Failover Scenarios', () => {
      test('should handle master failure and failover to replica', async () => {
        let useMaster = true;
        const mockRedisClient = {
          isOpen: true,
          get: jest.fn().mockImplementation((_key) => {
            if (useMaster) {
              // First call - master fails
              useMaster = false;
              return Promise.reject(
                new Error('READONLY You cannot write against a read only replica')
              );
            }
            // Second call - successfully failed over to new master
            return Promise.resolve(null);
          }),
        };

        const dataService = new DataService(mockRedisClient);

        // First attempt triggers failover
        const result1 = await dataService.getFromCache('test-key');
        expect(result1).toBeNull();

        // Second attempt uses new master
        const result2 = await dataService.getFromCache('test-key');
        expect(result2).toBeNull();
      });

      test('should maintain data consistency during failover', async () => {
        const mockRedisClient = {
          isOpen: true,
          set: jest
            .fn()
            .mockResolvedValueOnce('OK') // First write succeeds
            .mockRejectedValueOnce(new Error('Connection lost')) // Failover happens
            .mockResolvedValueOnce('OK'), // Write after failover succeeds
        };

        const dataService = new DataService(mockRedisClient);

        await dataService.setInCache('key-1', { data: 'value-1' });
        await dataService.setInCache('key-2', { data: 'value-2' });
        await dataService.setInCache('key-3', { data: 'value-3' });

        expect(mockRedisClient.set).toHaveBeenCalledTimes(3);
      });
    });

    describe('Connection Pool Management', () => {
      test('should handle connection pool exhaustion', async () => {
        const mockRedisClient = {
          isOpen: true,
          get: jest.fn().mockRejectedValue(new Error('Connection pool exhausted')),
        };

        const dataService = new DataService(mockRedisClient);

        const result = await dataService.getFromCache('test-key');
        expect(result).toBeNull();
        expect(mockRedisClient.get).toHaveBeenCalled();
      });

      test('should handle concurrent connections limit', async () => {
        let activeConnections = 0;
        const maxConnections = 5;

        const mockRedisClient = {
          isOpen: true,
          get: jest.fn().mockImplementation(() => {
            activeConnections++;
            if (activeConnections > maxConnections) {
              return Promise.reject(new Error('Too many connections'));
            }
            return Promise.resolve(null).finally(() => {
              activeConnections--;
            });
          }),
        };

        const dataService = new DataService(mockRedisClient);

        // Create more connections than the limit
        const promises = Array.from({ length: 10 }, (_, i) => dataService.getFromCache(`key-${i}`));

        await Promise.all(promises);

        // Some operations should fail due to connection limit
        expect(mockRedisClient.get).toHaveBeenCalledTimes(10);
      });
    });

    describe('Automatic Recovery Testing', () => {
      test('should detect and recover from transient failures', async () => {
        let failureCount = 0;
        const mockRedisClient = {
          isOpen: true,
          ping: jest.fn().mockImplementation(() => {
            failureCount++;
            if (failureCount <= 2) {
              return Promise.reject(new Error('Transient failure'));
            }
            return Promise.resolve('PONG');
          }),
        };

        const healthService = new HealthService(null, mockRedisClient);

        // First two attempts fail
        const result1 = await healthService.checkRedis();
        expect(result1.status).toBe('error');

        const result2 = await healthService.checkRedis();
        expect(result2.status).toBe('error');

        // Third attempt succeeds (recovered)
        const result3 = await healthService.checkRedis();
        expect(result3.status).toBe('connected');
      });
    });
  });

  describe('Phase D: Data Persistence & Recovery', () => {
    describe('Queue Persistence', () => {
      test('should handle partial queue retrieval', async () => {
        const mockRedisClient = {
          isOpen: true,
          lRange: jest
            .fn()
            .mockResolvedValue([
              JSON.stringify({ type: 'info', message: 'Message 1' }),
              '{ invalid json',
              JSON.stringify({ type: 'warning', message: 'Message 2' }),
            ]),
          del: jest.fn().mockResolvedValue(1),
        };

        const httpServer = http.createServer();
        const socketService = new SocketService(httpServer, mockRedisClient);
        socketService.io.to = jest.fn().mockReturnValue({ emit: jest.fn() });

        await socketService.sendQueuedNotifications('user-123', 'socket-123');

        // Should handle invalid JSON gracefully and continue with valid messages
        expect(mockRedisClient.lRange).toHaveBeenCalled();

        httpServer.close();
      });

      test('should handle data recovery after connection loss', async () => {
        let connectionLost = true;
        const mockRedisClient = {
          isOpen: true,
          lRange: jest.fn().mockImplementation(() => {
            if (connectionLost) {
              connectionLost = false;
              return Promise.reject(new Error('Connection lost'));
            }
            // After recovery, data is still available
            return Promise.resolve([
              JSON.stringify({ type: 'info', message: 'Persisted message' }),
            ]);
          }),
        };

        const httpServer = http.createServer();
        const socketService = new SocketService(httpServer, mockRedisClient);
        socketService.io.to = jest.fn().mockReturnValue({ emit: jest.fn() });

        // First attempt fails
        await socketService.sendQueuedNotifications('user-123', 'socket-123');

        // Second attempt succeeds with persisted data
        await socketService.sendQueuedNotifications('user-123', 'socket-123');

        expect(mockRedisClient.lRange).toHaveBeenCalledTimes(2);
        expect(socketService.io.to).toHaveBeenCalled();

        httpServer.close();
      });
    });

    describe('Transaction Handling', () => {
      test('should handle partial operation completion', async () => {
        const mockRedisClient = {
          isOpen: true,
          rPush: jest.fn().mockResolvedValue(1),
          expire: jest.fn().mockRejectedValue(new Error('Connection lost')),
        };

        const httpServer = http.createServer();
        const socketService = new SocketService(httpServer, mockRedisClient);

        await socketService.queueNotification('user-123', {
          type: 'info',
          message: 'Test notification',
        });

        // rPush succeeded but expire failed
        expect(mockRedisClient.rPush).toHaveBeenCalled();
        expect(mockRedisClient.expire).toHaveBeenCalled();
        // Should handle gracefully

        httpServer.close();
      });

      test('should handle queue deletion failure after send', async () => {
        const mockRedisClient = {
          isOpen: true,
          lRange: jest
            .fn()
            .mockResolvedValue([JSON.stringify({ type: 'info', message: 'Test message' })]),
          del: jest.fn().mockRejectedValue(new Error('Failed to delete')),
        };

        const httpServer = http.createServer();
        const socketService = new SocketService(httpServer, mockRedisClient);
        socketService.io.to = jest.fn().mockReturnValue({ emit: jest.fn() });

        await socketService.sendQueuedNotifications('user-123', 'socket-123');

        expect(mockRedisClient.lRange).toHaveBeenCalled();
        expect(socketService.io.to).toHaveBeenCalled();
        expect(mockRedisClient.del).toHaveBeenCalled();
        // Should handle deletion failure gracefully

        httpServer.close();
      });
    });

    describe('Data Corruption Detection', () => {
      test('should handle corrupted notification data', async () => {
        const mockRedisClient = {
          isOpen: true,
          lRange: jest
            .fn()
            .mockResolvedValue([
              'corrupted data',
              '{}',
              'null',
              JSON.stringify({ type: 'info', message: 'Valid message' }),
            ]),
          del: jest.fn().mockResolvedValue(1),
        };

        const httpServer = http.createServer();
        const socketService = new SocketService(httpServer, mockRedisClient);
        socketService.io.to = jest.fn().mockReturnValue({ emit: jest.fn() });

        await socketService.sendQueuedNotifications('user-123', 'socket-123');

        // Should handle corrupted data and still process valid messages
        expect(mockRedisClient.lRange).toHaveBeenCalled();

        httpServer.close();
      });

      test('should handle corrupted cache data', async () => {
        const mockRedisClient = {
          isOpen: true,
          get: jest
            .fn()
            .mockResolvedValueOnce('{ invalid json }')
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce('{"valid": "data"}'),
        };

        const dataService = new DataService(mockRedisClient);

        const result1 = await dataService.getFromCache('key-1');
        const result2 = await dataService.getFromCache('key-2');
        const result3 = await dataService.getFromCache('key-3');

        expect(result1).toBeNull(); // Invalid JSON returns null
        expect(result2).toBeNull(); // Null value
        expect(result3).toEqual({ valid: 'data' }); // Valid data
      });
    });
  });

  describe('Phase E: Performance & Resource Management', () => {
    describe('Memory Limit Scenarios', () => {
      test('should handle Redis memory limit exceeded', async () => {
        const mockRedisClient = {
          isOpen: true,
          set: jest
            .fn()
            .mockRejectedValue(new Error('OOM command not allowed when used memory > maxmemory')),
        };

        const dataService = new DataService(mockRedisClient);

        const result = await dataService.setInCache('test-key', { data: 'large value' });

        expect(result).toBe(false);
        expect(mockRedisClient.set).toHaveBeenCalled();
      });

      test('should handle cache eviction during operations', async () => {
        let cacheSize = 0;
        const maxCacheSize = 3;
        const cache = new Map();

        const mockRedisClient = {
          isOpen: true,
          set: jest.fn().mockImplementation((_key, value) => {
            if (cacheSize >= maxCacheSize) {
              // Evict oldest entry
              const firstKey = cache.keys().next().value;
              cache.delete(firstKey);
              cacheSize--;
            }
            cache.set(_key, value);
            cacheSize++;
            return Promise.resolve('OK');
          }),
          get: jest.fn().mockImplementation((_key) => {
            return Promise.resolve(cache.get(_key) || null);
          }),
        };

        const dataService = new DataService(mockRedisClient);

        // Fill cache beyond limit
        await dataService.setInCache('key-1', { data: 'value-1' });
        await dataService.setInCache('key-2', { data: 'value-2' });
        await dataService.setInCache('key-3', { data: 'value-3' });
        await dataService.setInCache('key-4', { data: 'value-4' });

        // First key should be evicted
        const result = await dataService.getFromCache('key-1');
        expect(result).toBeNull();
      });
    });

    describe('Large Payload Handling', () => {
      test('should handle large notification payload', async () => {
        const largePayload = {
          type: 'info',
          message: 'x'.repeat(10000), // 10KB message
          data: Array.from({ length: 100 }, (_, i) => ({ id: i, value: 'data' })),
        };

        const mockRedisClient = {
          isOpen: true,
          rPush: jest.fn().mockResolvedValue(1),
          expire: jest.fn().mockResolvedValue(1),
        };

        const httpServer = http.createServer();
        const socketService = new SocketService(httpServer, mockRedisClient);

        await socketService.queueNotification('user-123', largePayload);

        expect(mockRedisClient.rPush).toHaveBeenCalled();
        const queuedData = JSON.parse(mockRedisClient.rPush.mock.calls[0][1]);
        expect(queuedData.message.length).toBe(10000);

        httpServer.close();
      });

      test('should handle cache payload size limits', async () => {
        const largeData = {
          items: Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            name: `Item ${i}`,
            description: 'x'.repeat(100),
          })),
        };

        const mockRedisClient = {
          isOpen: true,
          set: jest.fn().mockImplementation((_key, value) => {
            // Simulate Redis max string length limit
            if (value.length > 512 * 1024 * 1024) {
              return Promise.reject(new Error('String exceeds maximum allowed size'));
            }
            return Promise.resolve('OK');
          }),
        };

        const dataService = new DataService(mockRedisClient);

        const result = await dataService.setInCache('large-key', largeData);

        expect(result).toBe(true); // Should succeed within limits
        expect(mockRedisClient.set).toHaveBeenCalled();
      });
    });

    describe('Concurrent Operation Limits', () => {
      test('should handle concurrent cache operations', async () => {
        let activeOperations = 0;
        const mockRedisClient = {
          isOpen: true,
          get: jest.fn().mockImplementation((_key) => {
            activeOperations++;
            return Promise.resolve(null).finally(() => {
              activeOperations--;
            });
          }),
        };

        const dataService = new DataService(mockRedisClient);

        const promises = Array.from({ length: 50 }, (_, i) => dataService.getFromCache(`key-${i}`));

        await Promise.all(promises);

        expect(mockRedisClient.get).toHaveBeenCalledTimes(50);
        expect(activeOperations).toBe(0); // All operations completed
      });

      test('should handle concurrent queue operations', async () => {
        const mockRedisClient = {
          isOpen: true,
          rPush: jest.fn().mockResolvedValue(1),
          expire: jest.fn().mockResolvedValue(1),
        };

        const httpServer = http.createServer();
        const socketService = new SocketService(httpServer, mockRedisClient);

        const promises = Array.from({ length: 20 }, (_, i) =>
          socketService.queueNotification(`user-${i}`, {
            type: 'info',
            message: `Notification ${i}`,
          })
        );

        await Promise.all(promises);

        expect(mockRedisClient.rPush).toHaveBeenCalledTimes(20);
        expect(mockRedisClient.expire).toHaveBeenCalledTimes(20);

        httpServer.close();
      });
    });

    describe('Key Expiration Edge Cases', () => {
      test('should handle expired key during retrieval', async () => {
        const mockRedisClient = {
          isOpen: true,
          get: jest
            .fn()
            .mockResolvedValueOnce(JSON.stringify({ data: 'value' }))
            .mockResolvedValueOnce(null), // Key expired between calls
        };

        const dataService = new DataService(mockRedisClient);

        const result1 = await dataService.getFromCache('test-key');
        expect(result1).toEqual({ data: 'value' });

        const result2 = await dataService.getFromCache('test-key');
        expect(result2).toBeNull();
      });

      test('should handle queue expiration edge cases', async () => {
        const mockRedisClient = {
          isOpen: true,
          lRange: jest
            .fn()
            .mockResolvedValueOnce([
              JSON.stringify({ type: 'info', message: 'Message 1' }),
              JSON.stringify({ type: 'info', message: 'Message 2' }),
            ])
            .mockResolvedValueOnce([]), // Queue expired
        };

        const httpServer = http.createServer();
        const socketService = new SocketService(httpServer, mockRedisClient);
        socketService.io.to = jest.fn().mockReturnValue({ emit: jest.fn() });

        // First retrieval gets messages
        await socketService.sendQueuedNotifications('user-123', 'socket-123');
        expect(socketService.io.to).toHaveBeenCalled();

        // Reset mock
        socketService.io.to.mockClear();

        // Second retrieval finds empty queue (expired)
        await socketService.sendQueuedNotifications('user-123', 'socket-123');
        expect(socketService.io.to).not.toHaveBeenCalled();

        httpServer.close();
      });

      test('should handle expire operation failure', async () => {
        const mockRedisClient = {
          isOpen: true,
          rPush: jest.fn().mockResolvedValue(1),
          expire: jest.fn().mockRejectedValue(new Error('Failed to set expiration')),
        };

        const httpServer = http.createServer();
        const socketService = new SocketService(httpServer, mockRedisClient);

        await socketService.queueNotification('user-123', {
          type: 'info',
          message: 'Test notification',
        });

        expect(mockRedisClient.rPush).toHaveBeenCalled();
        expect(mockRedisClient.expire).toHaveBeenCalled();
        // Should handle expire failure gracefully

        httpServer.close();
      });
    });

    describe('Cache Invalidation Edge Cases', () => {
      test('should handle invalidation of non-existent keys', async () => {
        const mockRedisClient = {
          isOpen: true,
          del: jest.fn().mockResolvedValue(0), // No keys deleted
          keys: jest.fn().mockResolvedValue([]),
        };

        const dataService = new DataService(mockRedisClient);

        await dataService.invalidateCache('non-existent-id', 'user-123');

        expect(mockRedisClient.del).toHaveBeenCalled();
        expect(mockRedisClient.keys).toHaveBeenCalled();
      });

      test('should handle bulk invalidation with pattern matching', async () => {
        const mockRedisClient = {
          isOpen: true,
          keys: jest
            .fn()
            .mockResolvedValue([
              'data:list:user-123:{"status":"active"}',
              'data:list:user-123:{"status":"inactive"}',
              'data:list:user-123:{}',
            ]),
          del: jest.fn().mockResolvedValue(3),
        };

        const dataService = new DataService(mockRedisClient);

        await dataService.invalidateCache(null, 'user-123');

        expect(mockRedisClient.keys).toHaveBeenCalledWith('data:list:user-123:*');
        expect(mockRedisClient.del).toHaveBeenCalledWith([
          'data:list:user-123:{"status":"active"}',
          'data:list:user-123:{"status":"inactive"}',
          'data:list:user-123:{}',
        ]);
      });

      test('should handle invalidation during connection issues', async () => {
        const mockRedisClient = {
          isOpen: true,
          del: jest.fn().mockRejectedValue(new Error('Connection lost')),
          keys: jest.fn().mockResolvedValue(['key-1', 'key-2']),
        };

        const dataService = new DataService(mockRedisClient);

        await dataService.invalidateCache('test-id', 'user-123');

        // Should handle errors gracefully without crashing
        expect(mockRedisClient.del).toHaveBeenCalled();
      });
    });
  });

  describe('Integration: Real-world Scenarios', () => {
    test('should handle complete service lifecycle with Redis failures', async () => {
      let redisAvailable = true;
      const mockRedisClient = {
        get isOpen() {
          return redisAvailable;
        },
        rPush: jest.fn().mockImplementation(() => {
          if (!redisAvailable) {
            return Promise.reject(new Error('Redis unavailable'));
          }
          return Promise.resolve(1);
        }),
        lRange: jest.fn().mockImplementation(() => {
          if (!redisAvailable) {
            return Promise.reject(new Error('Redis unavailable'));
          }
          return Promise.resolve([]);
        }),
        expire: jest.fn().mockResolvedValue(1),
        del: jest.fn().mockResolvedValue(1),
      };

      const httpServer = http.createServer();
      const socketService = new SocketService(httpServer, mockRedisClient);

      // Normal operation
      await socketService.queueNotification('user-123', { type: 'info', message: 'Test' });
      expect(mockRedisClient.rPush).toHaveBeenCalled();

      // Redis goes down
      redisAvailable = false;
      await socketService.sendQueuedNotifications('user-123', 'socket-123');
      // Should handle gracefully

      // Redis comes back up
      redisAvailable = true;
      socketService.io.to = jest.fn().mockReturnValue({ emit: jest.fn() });
      await socketService.sendQueuedNotifications('user-123', 'socket-123');
      expect(mockRedisClient.lRange).toHaveBeenCalled();

      httpServer.close();
    });

    test('should maintain data consistency across service restarts', async () => {
      const persistentQueue = [
        JSON.stringify({
          type: 'info',
          message: 'Message 1',
          queuedAt: '2024-01-01T00:00:00.000Z',
        }),
        JSON.stringify({
          type: 'info',
          message: 'Message 2',
          queuedAt: '2024-01-01T00:01:00.000Z',
        }),
      ];

      const mockRedisClient = {
        isOpen: true,
        lRange: jest.fn().mockResolvedValue(persistentQueue),
        del: jest.fn().mockResolvedValue(1),
      };

      const httpServer1 = http.createServer();
      const socketService1 = new SocketService(httpServer1, mockRedisClient);
      socketService1.io.to = jest.fn().mockReturnValue({ emit: jest.fn() });

      // First service instance retrieves persisted data
      await socketService1.sendQueuedNotifications('user-123', 'socket-123');

      expect(mockRedisClient.lRange).toHaveBeenCalled();
      expect(socketService1.io.to).toHaveBeenCalled();
      expect(mockRedisClient.del).toHaveBeenCalled();

      httpServer1.close();

      // Second service instance starts (simulating restart)
      const httpServer2 = http.createServer();
      const socketService2 = new SocketService(httpServer2, mockRedisClient);
      expect(socketService2.redisClient).toBe(mockRedisClient);

      httpServer2.close();
    });
  });
});
