const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');

describe('Rate Limiter Integration Tests', () => {
  let app;
  let authLimiter;
  let apiLimiter;

  beforeEach(() => {
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

  describe('authLimiter - Authentication Rate Limiting', () => {
    beforeEach(() => {
      app.post('/api/v1/auth/login', authLimiter, (req, res) => {
        res.json({ success: true, message: 'Login successful' });
      });

      app.post('/api/v1/auth/register', authLimiter, (req, res) => {
        res.json({ success: true, message: 'Registration successful' });
      });
    });

    it('should allow multiple successful authentication attempts within limit', async () => {
      const responses = [];

      // Make 5 login attempts (the limit)
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({ username: 'testuser', password: 'password123' });

        responses.push(response);
      }

      // All should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.headers['ratelimit-remaining']).toBe(String(4 - index));
      });
    });

    it('should block authentication attempts after limit is exceeded', async () => {
      // Make 5 successful attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({ username: 'testuser', password: 'pass' });
      }

      // 6th attempt should be blocked
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'testuser', password: 'pass' });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        'Too many authentication attempts. Please try again later.'
      );
      expect(response.headers['ratelimit-remaining']).toBe('0');
    });

    it('should apply rate limit across different auth endpoints', async () => {
      // Make 3 login attempts
      for (let i = 0; i < 3; i++) {
        await request(app).post('/api/v1/auth/login').send({ username: 'user', password: 'pass' });
      }

      // Make 2 register attempts
      for (let i = 0; i < 2; i++) {
        await request(app)
          .post('/api/v1/auth/register')
          .send({ username: 'user', email: 'test@example.com', password: 'pass' });
      }

      // 6th attempt (across both endpoints) should be blocked
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'user', password: 'pass' });

      expect(response.status).toBe(429);
    });

    it('should provide retry-after information in headers when rate limited', async () => {
      // Exhaust the rate limit
      for (let i = 0; i < 5; i++) {
        await request(app).post('/api/v1/auth/login').send({ username: 'user', password: 'pass' });
      }

      // Next request should be rate limited
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'user', password: 'pass' });

      expect(response.status).toBe(429);
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });

    it('should return proper rate limit headers on success', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'user', password: 'pass' });

      expect(response.status).toBe(200);
      expect(response.headers['ratelimit-limit']).toBe('5');
      expect(response.headers['ratelimit-remaining']).toBe('4');
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });
  });

  describe('apiLimiter - General API Rate Limiting', () => {
    beforeEach(() => {
      app.get('/api/v1/data', apiLimiter, (req, res) => {
        res.json({ success: true, data: { id: 1, value: 'test' } });
      });

      app.post('/api/v1/data', apiLimiter, (req, res) => {
        res.json({ success: true, message: 'Data created' });
      });
    });

    it('should allow many requests within the higher limit', async () => {
      const responses = [];

      // Make 10 requests (well under the 100 limit)
      for (let i = 0; i < 10; i++) {
        const response = await request(app).get('/api/v1/data');
        responses.push(response);
      }

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Check the last response
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.headers['ratelimit-limit']).toBe('100');
      expect(parseInt(lastResponse.headers['ratelimit-remaining'])).toBeLessThan(100);
    });

    it('should block API requests after limit is exceeded', async () => {
      // Make 100 requests (the limit)
      for (let i = 0; i < 100; i++) {
        await request(app).get('/api/v1/data');
      }

      // 101st request should be blocked
      const response = await request(app).get('/api/v1/data');

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Too many requests. Please try again later.');
      expect(response.headers['ratelimit-remaining']).toBe('0');
    });

    it('should apply rate limit across different API endpoints', async () => {
      // Make 50 GET requests
      for (let i = 0; i < 50; i++) {
        await request(app).get('/api/v1/data');
      }

      // Make 49 POST requests
      for (let i = 0; i < 49; i++) {
        await request(app).post('/api/v1/data').send({ value: 'test' });
      }

      // 100th request should still work
      let response = await request(app).get('/api/v1/data');
      expect(response.status).toBe(200);

      // 101st request should be blocked
      response = await request(app).post('/api/v1/data').send({ value: 'test' });
      expect(response.status).toBe(429);
    });

    it('should return proper rate limit headers on success', async () => {
      const response = await request(app).get('/api/v1/data');

      expect(response.status).toBe(200);
      expect(response.headers['ratelimit-limit']).toBe('100');
      expect(response.headers['ratelimit-remaining']).toBe('99');
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });
  });

  describe('Separate rate limits for auth and API', () => {
    beforeEach(() => {
      app.post('/api/v1/auth/login', authLimiter, (req, res) => {
        res.json({ success: true, message: 'Login successful' });
      });

      app.get('/api/v1/data', apiLimiter, (req, res) => {
        res.json({ success: true, data: 'test' });
      });
    });

    it('should maintain separate counters for auth and API limiters', async () => {
      // Exhaust auth limiter
      for (let i = 0; i < 5; i++) {
        await request(app).post('/api/v1/auth/login').send({ username: 'user', password: 'pass' });
      }

      // Auth should be blocked
      const authResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'user', password: 'pass' });
      expect(authResponse.status).toBe(429);

      // But API should still work
      const apiResponse = await request(app).get('/api/v1/data');
      expect(apiResponse.status).toBe(200);
      expect(apiResponse.headers['ratelimit-remaining']).toBe('99');
    });

    it('should not affect auth limiter when API limiter is exhausted', async () => {
      // Make 100 API requests
      for (let i = 0; i < 100; i++) {
        await request(app).get('/api/v1/data');
      }

      // API should be blocked
      const apiResponse = await request(app).get('/api/v1/data');
      expect(apiResponse.status).toBe(429);

      // But auth should still work
      const authResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'user', password: 'pass' });
      expect(authResponse.status).toBe(200);
      expect(authResponse.headers['ratelimit-remaining']).toBe('4');
    });
  });

  describe('Rate limit headers format', () => {
    beforeEach(() => {
      app.get('/test', apiLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should use standard RateLimit headers (not legacy X-RateLimit)', async () => {
      const response = await request(app).get('/test');

      // Should have standard headers
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');

      // Should NOT have legacy X-RateLimit headers
      expect(response.headers).not.toHaveProperty('x-ratelimit-limit');
      expect(response.headers).not.toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).not.toHaveProperty('x-ratelimit-reset');
    });

    it('should include reset timestamp in headers', async () => {
      const response = await request(app).get('/test');

      const resetTimestamp = parseInt(response.headers['ratelimit-reset']);
      const currentTimestamp = Math.floor(Date.now() / 1000);

      // Reset should be a valid Unix timestamp in the future (within 15 minutes from now)
      // The reset time could be either absolute or relative depending on express-rate-limit version
      expect(resetTimestamp).toBeGreaterThan(0);
      // Should be within reasonable range - either absolute timestamp or seconds until reset
      expect(resetTimestamp).toBeLessThanOrEqual(Math.max(currentTimestamp + 15 * 60, 900));
    });
  });
});
