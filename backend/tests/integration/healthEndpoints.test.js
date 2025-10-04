const request = require('supertest');
const express = require('express');
const { createHealthRouter } = require('../../src/health');

describe('Health Endpoints Integration', () => {
  let app;
  let mockMongoClient;
  let mockRedisClient;

  beforeEach(() => {
    app = express();

    // Mock MongoDB client
    mockMongoClient = {
      topology: {
        isConnected: jest.fn().mockReturnValue(true),
      },
      db: jest.fn().mockReturnValue({
        admin: jest.fn().mockReturnValue({
          ping: jest.fn().mockResolvedValue({}),
        }),
        databaseName: 'test-db',
      }),
    };

    // Mock Redis client
    mockRedisClient = {
      isOpen: true,
      ping: jest.fn().mockResolvedValue('PONG'),
    };

    app.use('/health', createHealthRouter(mockMongoClient, mockRedisClient));
  });

  describe('GET /health', () => {
    test('should return basic health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        service: 'xRat Backend',
        environment: expect.any(String),
      });
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    test('should handle errors gracefully', async () => {
      // The basic health endpoint should always return 200 as it doesn't depend on external services
      const errorApp = express();
      const brokenHealthRouter = createHealthRouter(null, null);
      errorApp.use('/health', brokenHealthRouter);

      const response = await request(errorApp).get('/health').expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        service: 'xRat Backend',
      });
    });
  });

  describe('GET /health/ready', () => {
    test('should return ready status when all services are healthy', async () => {
      const response = await request(app).get('/health/ready').expect(200);

      expect(response.body).toMatchObject({
        status: 'ready',
        ready: true,
        services: {
          mongodb: { status: 'connected' },
          redis: { status: 'connected' },
        },
      });
    });

    test('should return not ready when MongoDB is down', async () => {
      mockMongoClient.topology.isConnected.mockReturnValue(false);

      const response = await request(app).get('/health/ready').expect(503);

      expect(response.body).toMatchObject({
        status: 'not_ready',
        ready: false,
        services: {
          mongodb: { status: 'error' },
          redis: { status: 'connected' },
        },
      });
    });

    test('should return not ready when Redis is down', async () => {
      mockRedisClient.isOpen = false;

      const response = await request(app).get('/health/ready').expect(503);

      expect(response.body).toMatchObject({
        status: 'not_ready',
        ready: false,
        services: {
          mongodb: { status: 'connected' },
          redis: { status: 'error' },
        },
      });
    });

    test('should handle service check errors', async () => {
      mockMongoClient.db().admin().ping.mockRejectedValue(new Error('Connection lost'));

      const response = await request(app).get('/health/ready').expect(503);

      expect(response.body).toMatchObject({
        status: 'not_ready',
        ready: false,
      });
    });
  });

  describe('GET /health/live', () => {
    test('should return alive status when application is healthy', async () => {
      const response = await request(app).get('/health/live').expect(200);

      expect(response.body).toMatchObject({
        status: 'alive',
        alive: true,
        metrics: {
          memory: {
            used: expect.any(Number),
            total: expect.any(Number),
            utilization: expect.any(Number),
          },
          cpu: {
            user: expect.any(Number),
            system: expect.any(Number),
          },
        },
      });
    });

    test('should handle liveness check errors', async () => {
      // Liveness check is based on memory usage, so it should normally return 200
      const errorApp = express();
      const brokenHealthRouter = createHealthRouter(null, null);
      errorApp.use('/health', brokenHealthRouter);

      const response = await request(errorApp).get('/health/live').expect(200);

      expect(response.body).toMatchObject({
        status: 'alive',
        alive: true,
        metrics: expect.any(Object),
      });
    });
  });

  describe('GET /health/complete', () => {
    test('should return complete health status', async () => {
      const response = await request(app).get('/health/complete').expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        service: 'xRat Backend',
        readiness: {
          ready: true,
          services: {
            mongodb: { status: 'connected' },
            redis: { status: 'connected' },
          },
        },
        liveness: {
          alive: true,
          metrics: expect.any(Object),
        },
      });
    });

    test('should return unhealthy when services are down', async () => {
      mockMongoClient.topology.isConnected.mockReturnValue(false);
      mockRedisClient.isOpen = false;

      const response = await request(app).get('/health/complete').expect(503);

      expect(response.body).toMatchObject({
        status: 'unhealthy',
        readiness: {
          ready: false,
        },
        liveness: {
          alive: true,
        },
      });
    });

    test('should return unhealthy when services are unavailable', async () => {
      const errorApp = express();
      const brokenHealthRouter = createHealthRouter(null, null);
      errorApp.use('/health', brokenHealthRouter);

      const response = await request(errorApp).get('/health/complete').expect(503);

      expect(response.body).toMatchObject({
        status: 'unhealthy',
        readiness: {
          ready: false,
        },
        liveness: {
          alive: true,
        },
      });
    });
  });

  describe('Content-Type and Headers', () => {
    test('should return JSON content type for all endpoints', async () => {
      const endpoints = ['/', '/ready', '/live', '/complete'];

      for (const endpoint of endpoints) {
        const response = await request(app).get(`/health${endpoint}`);
        expect(response.headers['content-type']).toMatch(/application\/json/);
      }
    });

    test('should include timestamp in all responses', async () => {
      const endpoints = ['/', '/ready', '/live', '/complete'];

      for (const endpoint of endpoints) {
        const response = await request(app).get(`/health${endpoint}`);
        expect(response.body.timestamp).toBeDefined();
        // Validate timestamp is a valid ISO string
        const timestamp = new Date(response.body.timestamp);
        expect(timestamp).toBeInstanceOf(Date);
        expect(timestamp.toISOString()).toBe(response.body.timestamp);
      }
    });
  });
});
