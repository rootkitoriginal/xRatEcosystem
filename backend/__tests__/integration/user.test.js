const request = require('supertest');
const express = require('express');
const User = require('../../src/models/User');
const userController = require('../../src/controllers/userController');
const { authenticate } = require('../../src/middleware/auth');
const { generateAccessToken } = require('../../src/utils/jwt');
const { validate, updateProfileSchema } = require('../../src/utils/validation');

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

describe('User Profile API Endpoints', () => {
  let app;
  let mockUsers = [];

  beforeAll(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Set up routes
    app.get('/api/v1/users/profile', authenticate, userController.getUserProfile);
    app.put(
      '/api/v1/users/profile',
      authenticate,
      validate(updateProfileSchema),
      userController.updateUserProfile
    );
  });

  beforeEach(() => {
    // Reset mock users
    mockUsers = [];

    // Mock User model methods
    User.findById = jest.fn((id) => {
      const user = mockUsers.find((u) => u._id === id);
      if (!user) {
        return {
          select: jest.fn(() => Promise.resolve(null)),
        };
      }

      return {
        select: jest.fn(() =>
          Promise.resolve({
            _id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          })
        ),
        save: jest.fn().mockResolvedValue(user),
        ...user,
      };
    });
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile successfully', async () => {
      const userId = 'user123';
      const accessToken = generateAccessToken({ userId, role: 'user' });

      mockUsers.push({
        _id: userId,
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        bio: 'Software developer',
        avatarUrl: 'https://example.com/avatar.png',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('userId', userId);
      expect(response.body.data).toHaveProperty('username', 'testuser');
      expect(response.body.data).toHaveProperty('email', 'test@example.com');
      expect(response.body.data).toHaveProperty('fullName', 'Test User');
      expect(response.body.data).toHaveProperty('bio', 'Software developer');
      expect(response.body.data).toHaveProperty('avatarUrl', 'https://example.com/avatar.png');
    });

    it('should return empty strings for missing profile fields', async () => {
      const userId = 'user456';
      const accessToken = generateAccessToken({ userId, role: 'user' });

      mockUsers.push({
        _id: userId,
        username: 'newuser',
        email: 'new@example.com',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('fullName', '');
      expect(response.body.data).toHaveProperty('bio', '');
      expect(response.body.data).toHaveProperty('avatarUrl', '');
    });

    it('should reject profile request without token', async () => {
      const response = await request(app).get('/api/v1/users/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Authentication required');
    });

    it('should return 401 if user not found during authentication', async () => {
      const userId = 'nonexistent';
      const accessToken = generateAccessToken({ userId, role: 'user' });

      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile successfully', async () => {
      const userId = 'user123';
      const accessToken = generateAccessToken({ userId, role: 'user' });

      const user = {
        _id: userId,
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Old Name',
        bio: 'Old bio',
        avatarUrl: 'https://example.com/old.png',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      mockUsers.push(user);

      const updateData = {
        fullName: 'New Name',
        bio: 'New bio about myself',
        avatarUrl: 'https://example.com/new.png',
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.data).toHaveProperty('fullName', 'New Name');
      expect(response.body.data).toHaveProperty('bio', 'New bio about myself');
      expect(response.body.data).toHaveProperty('avatarUrl', 'https://example.com/new.png');
      expect(user.save).toHaveBeenCalled();
    });

    it('should update only provided fields', async () => {
      const userId = 'user123';
      const accessToken = generateAccessToken({ userId, role: 'user' });

      const user = {
        _id: userId,
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Existing Name',
        bio: 'Existing bio',
        avatarUrl: 'https://example.com/avatar.png',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      mockUsers.push(user);

      const updateData = {
        bio: 'Updated bio only',
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('bio', 'Updated bio only');
      expect(response.body.data).toHaveProperty('fullName', 'Existing Name');
      expect(response.body.data).toHaveProperty('avatarUrl', 'https://example.com/avatar.png');
    });

    it('should reject update with bio exceeding 250 characters', async () => {
      const userId = 'user123';
      const accessToken = generateAccessToken({ userId, role: 'user' });

      mockUsers.push({
        _id: userId,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      });

      const longBio = 'a'.repeat(251);
      const updateData = {
        bio: longBio,
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].field).toBe('bio');
    });

    it('should reject update with invalid avatar URL', async () => {
      const userId = 'user123';
      const accessToken = generateAccessToken({ userId, role: 'user' });

      mockUsers.push({
        _id: userId,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      });

      const updateData = {
        avatarUrl: 'invalid-url',
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].field).toBe('avatarUrl');
    });

    it('should accept valid http and https URLs', async () => {
      const userId = 'user123';
      const accessToken = generateAccessToken({ userId, role: 'user' });

      const user = {
        _id: userId,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        save: jest.fn().mockResolvedValue(true),
      };

      mockUsers.push(user);

      // Test with http
      const httpData = {
        avatarUrl: 'http://example.com/avatar.jpg',
      };

      const httpResponse = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(httpData);

      expect(httpResponse.status).toBe(200);

      // Test with https
      const httpsData = {
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      const httpsResponse = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(httpsData);

      expect(httpsResponse.status).toBe(200);
    });

    it('should allow empty strings for profile fields', async () => {
      const userId = 'user123';
      const accessToken = generateAccessToken({ userId, role: 'user' });

      const user = {
        _id: userId,
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Existing Name',
        bio: 'Existing bio',
        avatarUrl: 'https://example.com/avatar.png',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      mockUsers.push(user);

      const updateData = {
        fullName: '',
        bio: '',
        avatarUrl: '',
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('fullName', '');
      expect(response.body.data).toHaveProperty('bio', '');
      expect(response.body.data).toHaveProperty('avatarUrl', '');
    });

    it('should reject update request without token', async () => {
      const updateData = {
        fullName: 'New Name',
      };

      const response = await request(app).put('/api/v1/users/profile').send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Authentication required');
    });

    it('should return 401 if user not found during authentication', async () => {
      const userId = 'nonexistent';
      const accessToken = generateAccessToken({ userId, role: 'user' });

      const updateData = {
        fullName: 'New Name',
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });
  });
});
