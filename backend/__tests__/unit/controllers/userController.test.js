const userController = require('../../../src/controllers/userController');
const User = require('../../../src/models/User');
const logger = require('../../../src/config/logger');

jest.mock('../../../src/models/User');
jest.mock('../../../src/config/logger');

describe('User Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: {
        _id: 'user123',
      },
      requestId: 'test-request-id',
      validatedBody: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should return user profile successfully', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        bio: 'Software developer',
        avatarUrl: 'https://example.com/avatar.png',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      User.findById = jest.fn(() => ({
        select: jest.fn().mockResolvedValue(mockUser),
      }));

      await userController.getUserProfile(req, res);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: mockUser._id,
          username: mockUser.username,
          email: mockUser.email,
          fullName: mockUser.fullName,
          bio: mockUser.bio,
          avatarUrl: mockUser.avatarUrl,
          role: mockUser.role,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });
    });

    it('should return empty strings for missing profile fields', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      User.findById = jest.fn(() => ({
        select: jest.fn().mockResolvedValue(mockUser),
      }));

      await userController.getUserProfile(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          fullName: '',
          bio: '',
          avatarUrl: '',
        }),
      });
    });

    it('should return 404 if user not found', async () => {
      User.findById = jest.fn(() => ({
        select: jest.fn().mockResolvedValue(null),
      }));

      await userController.getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Database error');
      User.findById = jest.fn(() => ({
        select: jest.fn().mockRejectedValue(error),
      }));

      await userController.getUserProfile(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'Get user profile error',
        expect.objectContaining({
          requestId: 'test-request-id',
          userId: 'user123',
          error: 'Database error',
        })
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to retrieve profile',
        error: undefined,
      });
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const mockUser = {
        _id: 'user123',
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

      User.findById = jest.fn().mockResolvedValue(mockUser);

      req.validatedBody = {
        fullName: 'New Name',
        bio: 'New bio',
        avatarUrl: 'https://example.com/new.png',
      };

      await userController.updateUserProfile(req, res);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockUser.fullName).toBe('New Name');
      expect(mockUser.bio).toBe('New bio');
      expect(mockUser.avatarUrl).toBe('https://example.com/new.png');
      expect(mockUser.save).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'User profile updated',
        expect.objectContaining({
          requestId: 'test-request-id',
          userId: 'user123',
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully',
        data: expect.objectContaining({
          fullName: 'New Name',
          bio: 'New bio',
          avatarUrl: 'https://example.com/new.png',
        }),
      });
    });

    it('should update only provided fields', async () => {
      const mockUser = {
        _id: 'user123',
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

      User.findById = jest.fn().mockResolvedValue(mockUser);

      req.validatedBody = {
        bio: 'Updated bio only',
      };

      await userController.updateUserProfile(req, res);

      expect(mockUser.fullName).toBe('Existing Name'); // Should remain unchanged
      expect(mockUser.bio).toBe('Updated bio only');
      expect(mockUser.avatarUrl).toBe('https://example.com/avatar.png'); // Should remain unchanged
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should handle empty strings', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Name',
        bio: 'Bio',
        avatarUrl: 'https://example.com/avatar.png',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      req.validatedBody = {
        fullName: '',
        bio: '',
        avatarUrl: '',
      };

      await userController.updateUserProfile(req, res);

      expect(mockUser.fullName).toBe('');
      expect(mockUser.bio).toBe('');
      expect(mockUser.avatarUrl).toBe('');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
      User.findById = jest.fn().mockResolvedValue(null);

      req.validatedBody = {
        fullName: 'New Name',
      };

      await userController.updateUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    it('should handle validation errors', async () => {
      const mockUser = {
        _id: 'user123',
        save: jest.fn().mockRejectedValue({
          name: 'ValidationError',
          errors: {
            bio: { message: 'Bio must not exceed 250 characters' },
          },
        }),
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      req.validatedBody = {
        bio: 'a'.repeat(251),
      };

      await userController.updateUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: [
          {
            field: 'bio',
            message: 'Bio must not exceed 250 characters',
          },
        ],
      });
    });

    it('should handle general errors', async () => {
      const error = new Error('Database error');
      User.findById = jest.fn().mockRejectedValue(error);

      req.validatedBody = {
        fullName: 'New Name',
      };

      await userController.updateUserProfile(req, res);

      expect(logger.error).toHaveBeenCalledWith(
        'Update user profile error',
        expect.objectContaining({
          requestId: 'test-request-id',
          userId: 'user123',
          error: 'Database error',
        })
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update profile',
        error: undefined,
      });
    });
  });
});
