const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../../../src/middleware/auth');
const { authLimiter } = require('../../../src/middleware/rateLimiter');

// Mock the auth middleware to avoid real authentication
jest.mock('../../../src/middleware/auth');

describe('Rate Limiting with Authentication - Security Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    jest.clearAllMocks();
  });

  describe('Authentication Rate Limiting - Brute Force Prevention', () => {
    beforeEach(() => {
      // Create fresh rate limiter for each test
      const testAuthLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: {
          success: false,
          message: 'Too many authentication attempts. Please try again later.',
        },
        standardHeaders: true,
        legacyHeaders: false,
      });

      // Mock authenticate to simulate login attempts
      authenticate.mockImplementation((req, res, next) => {
        // Simulate failed authentication
        if (req.body.password !== 'correct_password') {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials',
          });
        }
        next();
      });

      app.post('/auth/login', testAuthLimiter, authenticate, (req, res) => {
        res.json({ success: true, message: 'Login successful' });
      });
    });

    it('should allow valid login attempts under rate limit', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'test', password: 'test123' });

      expect(response.status).toBe(401); // Failed auth, but not rate limited
      expect(response.headers).toHaveProperty('ratelimit-remaining');
    });

    it('should block authentication after exceeding rate limit', async () => {
      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/login')
          .send({ username: 'test', password: 'wrong' });
      }

      // 6th attempt should be rate limited
      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'test', password: 'wrong' });

      expect(response.status).toBe(429);
      expect(response.body.message).toBe(
        'Too many authentication attempts. Please try again later.'
      );
    });

    it('should include standard rate limit headers', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'test', password: 'test123' });

      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
      expect(response.headers['ratelimit-limit']).toBe('5');
    });

    it('should decrement rate limit counter with each failed attempt', async () => {
      const response1 = await request(app)
        .post('/auth/login')
        .send({ username: 'test', password: 'wrong1' });
      expect(response1.headers['ratelimit-remaining']).toBe('4');

      const response2 = await request(app)
        .post('/auth/login')
        .send({ username: 'test', password: 'wrong2' });
      expect(response2.headers['ratelimit-remaining']).toBe('3');

      const response3 = await request(app)
        .post('/auth/login')
        .send({ username: 'test', password: 'wrong3' });
      expect(response3.headers['ratelimit-remaining']).toBe('2');
    });
  });

  describe('Rate Limiting - IP-based Attack Scenarios', () => {
    beforeEach(() => {
      const testAuthLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 3,
        message: { success: false, message: 'Too many requests' },
        standardHeaders: true,
        legacyHeaders: false,
      });

      authenticate.mockImplementation((req, res, next) => {
        res.status(401).json({ success: false, message: 'Unauthorized' });
      });

      app.post('/test-endpoint', testAuthLimiter, authenticate, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should apply rate limits per IP address', async () => {
      // Simulate requests from same IP
      await request(app).post('/test-endpoint').send({});
      await request(app).post('/test-endpoint').send({});
      await request(app).post('/test-endpoint').send({});

      // 4th request from same IP should be blocked
      const response = await request(app).post('/test-endpoint').send({});

      expect(response.status).toBe(429);
    });

    it('should track different usernames under same IP rate limit', async () => {
      // Different usernames, same IP
      await request(app).post('/test-endpoint').send({ username: 'user1' });
      await request(app).post('/test-endpoint').send({ username: 'user2' });
      await request(app).post('/test-endpoint').send({ username: 'user3' });

      // 4th request should be rate limited regardless of username
      const response = await request(app)
        .post('/test-endpoint')
        .send({ username: 'user4' });

      expect(response.status).toBe(429);
    });
  });

  describe('Rate Limiting - Distributed Attack Patterns', () => {
    beforeEach(() => {
      const testAuthLimiter = rateLimit({
        windowMs: 60000, // 1 minute
        max: 2,
        message: { success: false, message: 'Rate limit exceeded' },
      });

      authenticate.mockImplementation((req, res, next) => {
        res.status(401).json({ success: false });
      });

      app.post('/auth/test', testAuthLimiter, authenticate, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should handle rapid successive requests', async () => {
      const requests = [
        request(app).post('/auth/test').send({}),
        request(app).post('/auth/test').send({}),
      ];

      await Promise.all(requests);

      // Next request should be rate limited
      const response = await request(app).post('/auth/test').send({});
      expect(response.status).toBe(429);
    });

    it('should handle concurrent parallel requests', async () => {
      // Fire multiple requests simultaneously
      const promises = Array(5)
        .fill()
        .map(() => request(app).post('/auth/test').send({}));

      const responses = await Promise.all(promises);

      // At least some requests should be rate limited
      const rateLimitedCount = responses.filter((r) => r.status === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });

  describe('Rate Limiting - Account Lockout Patterns', () => {
    let loginAttempts = {};

    beforeEach(() => {
      loginAttempts = {};

      const testAuthLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: { success: false, message: 'Too many attempts' },
      });

      authenticate.mockImplementation((req, res, next) => {
        const username = req.body.username;

        // Track failed attempts per username
        if (!loginAttempts[username]) {
          loginAttempts[username] = 0;
        }
        loginAttempts[username]++;

        // Simulate account lockout after 3 failed attempts
        if (loginAttempts[username] > 3) {
          return res.status(423).json({
            success: false,
            message: 'Account locked due to too many failed attempts',
          });
        }

        res.status(401).json({ success: false, message: 'Invalid credentials' });
      });

      app.post('/auth/lockout-test', testAuthLimiter, authenticate, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should track failed login attempts per user', async () => {
      const username = 'testuser';

      // Make 3 failed attempts
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/auth/lockout-test')
          .send({ username, password: 'wrong' });
        expect(response.status).toBe(401);
      }

      // 4th attempt should trigger account lock
      const response = await request(app)
        .post('/auth/lockout-test')
        .send({ username, password: 'wrong' });

      expect(response.status).toBe(423); // Locked
      expect(loginAttempts[username]).toBeGreaterThan(3);
    });

    it('should maintain separate counters for different users', async () => {
      // User 1 makes 3 attempts
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/auth/lockout-test')
          .send({ username: 'user1', password: 'wrong' });
      }

      // User 2 makes 2 attempts
      for (let i = 0; i < 2; i++) {
        await request(app)
          .post('/auth/lockout-test')
          .send({ username: 'user2', password: 'wrong' });
      }

      expect(loginAttempts['user1']).toBe(3);
      expect(loginAttempts['user2']).toBe(2);
    });
  });

  describe('Rate Limiting - Edge Cases', () => {
    beforeEach(() => {
      const testAuthLimiter = rateLimit({
        windowMs: 60000,
        max: 3,
        message: { success: false, message: 'Rate limited' },
      });

      authenticate.mockImplementation((req, res, next) => {
        res.status(401).json({ success: false });
      });

      app.post('/test', testAuthLimiter, authenticate, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should handle requests with missing body', async () => {
      await request(app).post('/test');
      await request(app).post('/test');
      await request(app).post('/test');

      const response = await request(app).post('/test');
      expect(response.status).toBe(429);
    });

    it('should handle requests with malformed JSON', async () => {
      const response = await request(app)
        .post('/test')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}'); // Malformed JSON

      // Express will handle malformed JSON before rate limiter
      expect([400, 429]).toContain(response.status);
    });

    it('should handle very large request bodies', async () => {
      const largeBody = {
        data: 'x'.repeat(100000),
      };

      await request(app).post('/test').send(largeBody);
      await request(app).post('/test').send(largeBody);
      await request(app).post('/test').send(largeBody);

      const response = await request(app).post('/test').send(largeBody);
      expect(response.status).toBe(429);
    });

    it('should handle special characters in request data', async () => {
      const specialCharData = {
        username: '<script>alert("xss")</script>',
        password: '; DROP TABLE users; --',
      };

      await request(app).post('/test').send(specialCharData);
      await request(app).post('/test').send(specialCharData);
      await request(app).post('/test').send(specialCharData);

      const response = await request(app).post('/test').send(specialCharData);
      expect(response.status).toBe(429);
    });
  });

  describe('Rate Limiting - Timing Attack Prevention', () => {
    beforeEach(() => {
      const testAuthLimiter = rateLimit({
        windowMs: 60000,
        max: 5,
        message: { success: false, message: 'Too many requests' },
      });

      authenticate.mockImplementation((req, res, next) => {
        // Simulate constant time response
        setTimeout(() => {
          res.status(401).json({ success: false, message: 'Unauthorized' });
        }, 100); // Fixed delay
      });

      app.post('/timing-test', testAuthLimiter, authenticate, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should apply rate limiting before authentication timing', async () => {
      // Fill up the rate limit
      for (let i = 0; i < 5; i++) {
        await request(app).post('/timing-test').send({});
      }

      const startTime = Date.now();
      const response = await request(app).post('/timing-test').send({});
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(429);
      // Rate limit response should be faster than auth response (< 100ms)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Rate Limiting - Security Headers', () => {
    beforeEach(() => {
      const testAuthLimiter = rateLimit({
        windowMs: 60000,
        max: 3,
        message: { success: false, message: 'Rate limited' },
        standardHeaders: true,
        legacyHeaders: false,
      });

      authenticate.mockImplementation((req, res, next) => {
        res.status(401).json({ success: false });
      });

      app.post('/headers-test', testAuthLimiter, authenticate, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should not include legacy X-RateLimit headers', async () => {
      const response = await request(app).post('/headers-test').send({});

      expect(response.headers).not.toHaveProperty('x-ratelimit-limit');
      expect(response.headers).not.toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).not.toHaveProperty('x-ratelimit-reset');
    });

    it('should include RateLimit standard headers', async () => {
      const response = await request(app).post('/headers-test').send({});

      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });

    it('should include Retry-After header when rate limited', async () => {
      // Exhaust rate limit
      await request(app).post('/headers-test').send({});
      await request(app).post('/headers-test').send({});
      await request(app).post('/headers-test').send({});

      const response = await request(app).post('/headers-test').send({});

      expect(response.status).toBe(429);
      expect(response.headers).toHaveProperty('retry-after');
    });
  });
});
