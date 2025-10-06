const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');
const User = require('../../src/models/User');
const authController = require('../../src/auth/authController');
const { authenticate } = require('../../src/middleware/auth');
const { generateAccessToken, generateRefreshToken } = require('../../src/utils/jwt');

// Mock MongoDB connection
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue(true),
    connection: {
      readyState: 1,
      close: jest.fn(),
    },
  };
});

describe('Auth API Endpoints', () => {
  let app;
  let mockUsers = [];

  beforeAll(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Set up rate limiter for auth endpoints
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });

    // Apply rate limiter specifically to sensitive auth endpoints
    app.post('/api/v1/auth/register', authLimiter, authController.register);
    app.post('/api/v1/auth/login', authLimiter, authController.login);
    app.post('/api/v1/auth/refresh', authLimiter, authController.refresh);
    // Other endpoints (logout/profile) typically don't need limiting, but could add if desired
    app.post('/api/v1/auth/logout', authenticate, authController.logout);
    app.get('/api/v1/auth/profile', authenticate, authController.getProfile);
  });

  beforeEach(() => {
    // Reset mock users
    mockUsers = [];

    // Mock User model methods
    User.findOne = jest.fn((query) => {
      if (query.$or) {
        return Promise.resolve(
          mockUsers.find(
            (u) => u.email === query.$or[0].email || u.username === query.$or[1].username
          )
        );
      }
      if (query.email) {
        // Handle both direct email queries and MongoDB $eq operator
        const emailValue = typeof query.email === 'object' ? query.email.$eq : query.email;
        const user = mockUsers.find((u) => u.email === emailValue);
        if (!user) return Promise.resolve(null);

        return Promise.resolve({
          ...user,
          comparePassword: jest.fn((password) => Promise.resolve(password === 'Password123')),
          save: jest.fn().mockResolvedValue(user),
          toJSON: () => ({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
          }),
        });
      }
      return Promise.resolve(null);
    });

    User.findById = jest.fn((id) => {
      const user = mockUsers.find((u) => u._id === id);
      if (!user) return Promise.resolve(null);

      return {
        ...user,
        save: jest.fn().mockResolvedValue(user),
        select: jest.fn(() =>
          Promise.resolve({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
          })
        ),
      };
    });

    User.prototype.save = jest.fn(function () {
      mockUsers.push(this);
      return Promise.resolve(this);
    });

    User.prototype.toJSON = jest.fn(function () {
      return {
        _id: this._id,
        username: this.username,
        email: this.email,
        role: this.role,
      };
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
      };

      const response = await request(app).post('/api/v1/auth/register').send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.user.email).toBe(userData.email);
    });

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ username: 'testuser' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Username, email, and password are required');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Password must be at least 8 characters');
    });

    it('should reject registration with password without complexity', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        'Password must contain at least one letter and one number'
      );
    });

    it('should reject registration with existing email', async () => {
      mockUsers.push({
        _id: '123',
        username: 'existing',
        email: 'test@example.com',
        role: 'user',
      });

      const response = await request(app).post('/api/v1/auth/register').send({
        username: 'newuser',
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(() => {
      mockUsers.push({
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'user',
        refreshToken: null,
      });
    });

    it('should login user successfully', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email and password are required');
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'wrong@example.com',
        password: 'Password123',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should reject login with invalid password', async () => {
      User.findOne = jest.fn(() =>
        Promise.resolve({
          email: 'test@example.com',
          comparePassword: jest.fn(() => Promise.resolve(false)),
          save: jest.fn(),
        })
      );

      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'test@example.com',
        password: 'WrongPassword123',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token successfully', async () => {
      const userId = '123';
      const refreshToken = generateRefreshToken({ userId });

      mockUsers.push({
        _id: userId,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        refreshToken,
      });

      const response = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token refreshed successfully');
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should reject refresh with missing token', async () => {
      const response = await request(app).post('/api/v1/auth/refresh').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Refresh token is required');
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid_token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired refresh token');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const userId = '123';
      const accessToken = generateAccessToken({ userId, role: 'user' });

      mockUsers.push({
        _id: userId,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        refreshToken: 'some_token',
      });

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should reject logout without token', async () => {
      const response = await request(app).post('/api/v1/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Authentication required');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile successfully', async () => {
      const userId = '123';
      const accessToken = generateAccessToken({ userId, role: 'user' });

      mockUsers.push({
        _id: userId,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      });

      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user._id).toBe(userId);
    });

    it('should reject profile request without token', async () => {
      const response = await request(app).get('/api/v1/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Authentication required');
    });

    it('should reject profile request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token');
    });
  });
});
