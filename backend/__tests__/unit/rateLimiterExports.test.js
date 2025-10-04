const request = require('supertest');
const express = require('express');
const { authLimiter, apiLimiter } = require('../../src/middleware/rateLimiter');

describe('Rate Limiter Exports', () => {
  describe('authLimiter export', () => {
    it('should be a function', () => {
      expect(typeof authLimiter).toBe('function');
    });

    it('should work as middleware', async () => {
      const app = express();
      app.use(express.json());
      app.get('/test', authLimiter, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('ratelimit-limit');
    });
  });

  describe('apiLimiter export', () => {
    it('should be a function', () => {
      expect(typeof apiLimiter).toBe('function');
    });

    it('should work as middleware', async () => {
      const app = express();
      app.use(express.json());
      app.get('/test', apiLimiter, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('ratelimit-limit');
    });
  });
});
