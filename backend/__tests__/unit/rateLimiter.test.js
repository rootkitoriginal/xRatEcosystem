const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');

describe('Rate Limiter Middleware', () => {
  let app;
  let authLimiter;
  let apiLimiter;

  beforeEach(() => {
    // Create a fresh Express app and fresh rate limiters for each test
    app = express();
    app.use(express.json());

    // Create fresh rate limiter instances for each test to avoid state sharing
    authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: {
        success: false,
        message: 'Too many authentication attempts. Please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: {
        success: false,
        message: 'Too many requests. Please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  });

  describe('authLimiter', () => {
    beforeEach(() => {
      // Create test route with authLimiter
      app.get('/test-auth', authLimiter, (req, res) => {
        res.json({ success: true, message: 'Request successful' });
      });
    });

    it('should allow requests under the limit', async () => {
      const response = await request(app).get('/test-auth');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Request successful');
    });

    it('should include rate limit headers', async () => {
      const response = await request(app).get('/test-auth');

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });

    it('should have correct rate limit configuration (5 requests per 15 minutes)', async () => {
      const response = await request(app).get('/test-auth');

      expect(response.headers['ratelimit-limit']).toBe('5');
    });

    it('should block requests after exceeding the limit', async () => {
      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        await request(app).get('/test-auth');
      }

      // 6th request should be blocked
      const response = await request(app).get('/test-auth');

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        'Too many authentication attempts. Please try again later.'
      );
    });

    it('should decrement remaining count with each request', async () => {
      const response1 = await request(app).get('/test-auth');
      expect(response1.headers['ratelimit-remaining']).toBe('4');

      const response2 = await request(app).get('/test-auth');
      expect(response2.headers['ratelimit-remaining']).toBe('3');

      const response3 = await request(app).get('/test-auth');
      expect(response3.headers['ratelimit-remaining']).toBe('2');
    });

    it('should not include legacy X-RateLimit headers', async () => {
      const response = await request(app).get('/test-auth');

      expect(response.headers).not.toHaveProperty('x-ratelimit-limit');
      expect(response.headers).not.toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).not.toHaveProperty('x-ratelimit-reset');
    });
  });

  describe('apiLimiter', () => {
    beforeEach(() => {
      // Create test route with apiLimiter
      app.get('/test-api', apiLimiter, (req, res) => {
        res.json({ success: true, message: 'API request successful' });
      });
    });

    it('should allow requests under the limit', async () => {
      const response = await request(app).get('/test-api');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('API request successful');
    });

    it('should include rate limit headers', async () => {
      const response = await request(app).get('/test-api');

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });

    it('should have correct rate limit configuration (100 requests per 15 minutes)', async () => {
      const response = await request(app).get('/test-api');

      expect(response.headers['ratelimit-limit']).toBe('100');
    });

    it('should block requests after exceeding the limit', async () => {
      // Make 100 requests (the limit) in parallel
      const requests = [];
      for (let i = 0; i < 100; i++) {
        requests.push(request(app).get('/test-api'));
      }
      await Promise.all(requests);

      // 101st request should be blocked
      const response = await request(app).get('/test-api');

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Too many requests. Please try again later.');
    });

    it('should decrement remaining count with each request', async () => {
      const response1 = await request(app).get('/test-api');
      expect(response1.headers['ratelimit-remaining']).toBe('99');

      const response2 = await request(app).get('/test-api');
      expect(response2.headers['ratelimit-remaining']).toBe('98');
    });

    it('should not include legacy X-RateLimit headers', async () => {
      const response = await request(app).get('/test-api');

      expect(response.headers).not.toHaveProperty('x-ratelimit-limit');
      expect(response.headers).not.toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).not.toHaveProperty('x-ratelimit-reset');
    });
  });

  describe('Multiple endpoints with different limiters', () => {
    beforeEach(() => {
      app.get('/auth-endpoint', authLimiter, (req, res) => {
        res.json({ success: true });
      });

      app.get('/api-endpoint', apiLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should track limits independently for different endpoints', async () => {
      // Make requests to auth endpoint
      const authResponse1 = await request(app).get('/auth-endpoint');
      expect(authResponse1.headers['ratelimit-limit']).toBe('5');
      expect(authResponse1.headers['ratelimit-remaining']).toBe('4');

      // Make requests to api endpoint - should have separate counter
      const apiResponse1 = await request(app).get('/api-endpoint');
      expect(apiResponse1.headers['ratelimit-limit']).toBe('100');
      expect(apiResponse1.headers['ratelimit-remaining']).toBe('99');
    });
  });
});
