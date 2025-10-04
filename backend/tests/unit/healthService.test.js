const HealthService = require('../../src/health/healthService');

describe('HealthService', () => {
  let healthService;
  let mockMongoClient;
  let mockRedisClient;

  beforeEach(() => {
    // Mock MongoDB client
    mockMongoClient = {
      topology: {
        isConnected: jest.fn().mockReturnValue(true)
      },
      db: jest.fn().mockReturnValue({
        admin: jest.fn().mockReturnValue({
          ping: jest.fn().mockResolvedValue({})
        }),
        databaseName: 'test-db'
      })
    };

    // Mock Redis client
    mockRedisClient = {
      isOpen: true,
      ping: jest.fn().mockResolvedValue('PONG')
    };

    healthService = new HealthService(mockMongoClient, mockRedisClient);
  });

  describe('getBasicHealth', () => {
    test('should return basic health information', async () => {
      const result = await healthService.getBasicHealth();

      expect(result).toMatchObject({
        status: 'ok',
        service: 'xRat Backend',
        environment: expect.any(String)
      });
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('checkMongoDB', () => {
    test('should return connected status when MongoDB is healthy', async () => {
      const result = await healthService.checkMongoDB();

      expect(result).toMatchObject({
        status: 'connected',
        database: 'test-db'
      });
      expect(result.latency).toMatch(/\d+ms/);
    });

    test('should return error when MongoDB client is not initialized', async () => {
      healthService.mongoClient = null;
      const result = await healthService.checkMongoDB();

      expect(result).toMatchObject({
        status: 'error',
        message: 'MongoDB client not initialized',
        latency: null
      });
    });

    test('should return error when MongoDB is not connected', async () => {
      mockMongoClient.topology.isConnected.mockReturnValue(false);
      const result = await healthService.checkMongoDB();

      expect(result).toMatchObject({
        status: 'error',
        message: 'MongoDB not connected',
        latency: null
      });
    });

    test('should handle MongoDB ping errors', async () => {
      mockMongoClient.db().admin().ping.mockRejectedValue(new Error('Connection timeout'));
      const result = await healthService.checkMongoDB();

      expect(result).toMatchObject({
        status: 'error',
        message: 'Connection timeout',
        latency: null
      });
    });
  });

  describe('checkRedis', () => {
    test('should return connected status when Redis is healthy', async () => {
      const result = await healthService.checkRedis();

      expect(result).toMatchObject({
        status: 'connected'
      });
      expect(result.latency).toMatch(/\d+ms/);
    });

    test('should return error when Redis client is not initialized', async () => {
      healthService.redisClient = null;
      const result = await healthService.checkRedis();

      expect(result).toMatchObject({
        status: 'error',
        message: 'Redis client not initialized',
        latency: null
      });
    });

    test('should return error when Redis is not connected', async () => {
      mockRedisClient.isOpen = false;
      const result = await healthService.checkRedis();

      expect(result).toMatchObject({
        status: 'error',
        message: 'Redis not connected',
        latency: null
      });
    });

    test('should handle Redis ping errors', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('Redis timeout'));
      const result = await healthService.checkRedis();

      expect(result).toMatchObject({
        status: 'error',
        message: 'Redis timeout',
        latency: null
      });
    });
  });

  describe('getReadinessCheck', () => {
    test('should return ready when all services are healthy', async () => {
      const result = await healthService.getReadinessCheck();

      expect(result).toMatchObject({
        status: 'ready',
        ready: true,
        services: {
          mongodb: { status: 'connected' },
          redis: { status: 'connected' }
        }
      });
    });

    test('should return not ready when MongoDB is unhealthy', async () => {
      mockMongoClient.topology.isConnected.mockReturnValue(false);
      const result = await healthService.getReadinessCheck();

      expect(result).toMatchObject({
        status: 'not_ready',
        ready: false,
        services: {
          mongodb: { status: 'error' },
          redis: { status: 'connected' }
        }
      });
    });

    test('should return not ready when Redis is unhealthy', async () => {
      mockRedisClient.isOpen = false;
      const result = await healthService.getReadinessCheck();

      expect(result).toMatchObject({
        status: 'not_ready',
        ready: false,
        services: {
          mongodb: { status: 'connected' },
          redis: { status: 'error' }
        }
      });
    });
  });

  describe('getLivenessCheck', () => {
    test('should return alive when application is healthy', async () => {
      const result = await healthService.getLivenessCheck();

      expect(result).toMatchObject({
        status: 'alive',
        alive: true,
        metrics: {
          memory: {
            used: expect.any(Number),
            total: expect.any(Number),
            utilization: expect.any(Number)
          },
          cpu: {
            user: expect.any(Number),
            system: expect.any(Number)
          }
        }
      });
      expect(result.metrics.memory.utilization).toBeLessThan(100);
    });
  });

  describe('getCompleteHealth', () => {
    test('should return complete health status', async () => {
      const result = await healthService.getCompleteHealth();

      expect(result).toMatchObject({
        status: 'healthy',
        service: 'xRat Backend',
        readiness: {
          ready: true,
          services: expect.any(Object)
        },
        liveness: {
          alive: true,
          metrics: expect.any(Object)
        }
      });
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    test('should return unhealthy when services are down', async () => {
      mockMongoClient.topology.isConnected.mockReturnValue(false);
      mockRedisClient.isOpen = false;

      const result = await healthService.getCompleteHealth();

      expect(result).toMatchObject({
        status: 'unhealthy',
        readiness: {
          ready: false
        },
        liveness: {
          alive: true
        }
      });
    });
  });
});
