const authController = require('../../../src/auth/authController');
const User = require('../../../src/models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../../src/utils/jwt');
const logger = require('../../../src/config/logger');

// Mock dependencies
jest.mock('../../../src/models/User');
jest.mock('../../../src/utils/jwt');
jest.mock('../../../src/config/logger');

describe('Auth Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Mock request
    mockReq = {
      body: {},
      user: {},
      requestId: 'test-request-id',
    };

    // Mock response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Clear all mocks
    jest.clearAllMocks();

    // Set default NODE_ENV
    process.env.NODE_ENV = 'development';
  });

  describe('register', () => {
    it('should handle database errors during registration', async () => {
      const error = new Error('Database connection failed');

      mockReq.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
      };

      User.findOne.mockResolvedValue(null);
      User.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(error),
      }));

      await authController.register(mockReq, mockRes);

      expect(logger.error).toHaveBeenCalledWith(
        'Registration error',
        expect.objectContaining({
          requestId: 'test-request-id',
          error: 'Database connection failed',
        })
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Registration failed',
        error: 'Database connection failed',
      });
    });

    it('should not expose error details in production', async () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Database error');

      mockReq.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
      };

      User.findOne.mockResolvedValue(null);
      User.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(error),
      }));

      await authController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Registration failed',
        error: undefined,
      });
    });
  });

  describe('login', () => {
    it('should handle database errors during login', async () => {
      const error = new Error('Database error');

      mockReq.body = {
        email: 'test@example.com',
        password: 'Password123',
      };

      User.findOne.mockRejectedValue(error);

      await authController.login(mockReq, mockRes);

      expect(logger.error).toHaveBeenCalledWith(
        'Login error',
        expect.objectContaining({
          requestId: 'test-request-id',
          error: 'Database error',
        })
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Login failed',
        error: 'Database error',
      });
    });

    it('should not expose error details in production', async () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Database error');

      mockReq.body = {
        email: 'test@example.com',
        password: 'Password123',
      };

      User.findOne.mockRejectedValue(error);

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Login failed',
        error: undefined,
      });
    });
  });

  describe('refresh', () => {
    it('should handle JsonWebTokenError', async () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';

      mockReq.body = {
        refreshToken: 'invalid-token',
      };

      verifyRefreshToken.mockImplementation(() => {
        throw error;
      });

      await authController.refresh(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    });

    it('should handle TokenExpiredError', async () => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';

      mockReq.body = {
        refreshToken: 'expired-token',
      };

      verifyRefreshToken.mockImplementation(() => {
        throw error;
      });

      await authController.refresh(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    });

    it('should handle database errors during token refresh', async () => {
      const error = new Error('Database error');

      mockReq.body = {
        refreshToken: 'valid-token',
      };

      verifyRefreshToken.mockReturnValue({ userId: 'user-123' });
      User.findById.mockRejectedValue(error);

      await authController.refresh(mockReq, mockRes);

      expect(logger.error).toHaveBeenCalledWith(
        'Token refresh error',
        expect.objectContaining({
          requestId: 'test-request-id',
          error: 'Database error',
        })
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token refresh failed',
        error: 'Database error',
      });
    });

    it('should not expose error details in production', async () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Database error');

      mockReq.body = {
        refreshToken: 'valid-token',
      };

      verifyRefreshToken.mockReturnValue({ userId: 'user-123' });
      User.findById.mockRejectedValue(error);

      await authController.refresh(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token refresh failed',
        error: undefined,
      });
    });
  });

  describe('logout', () => {
    it('should handle user not found', async () => {
      mockReq.user = { _id: 'user-123' };

      User.findById.mockResolvedValue(null);

      await authController.logout(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    it('should handle database errors during logout', async () => {
      const error = new Error('Database error');

      mockReq.user = { _id: 'user-123' };

      User.findById.mockRejectedValue(error);

      await authController.logout(mockReq, mockRes);

      expect(logger.error).toHaveBeenCalledWith(
        'Logout error',
        expect.objectContaining({
          requestId: 'test-request-id',
          error: 'Database error',
        })
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Logout failed',
        error: 'Database error',
      });
    });

    it('should not expose error details in production', async () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Database error');

      mockReq.user = { _id: 'user-123' };

      User.findById.mockRejectedValue(error);

      await authController.logout(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Logout failed',
        error: undefined,
      });
    });
  });

  describe('getProfile', () => {
    it('should handle errors when getting profile', async () => {
      const error = new Error('Unexpected error');

      mockReq.user = { _id: 'user-123' };

      // Force an error by making res.json throw
      mockRes.json.mockImplementationOnce(() => {
        throw error;
      });

      await authController.getProfile(mockReq, mockRes);

      expect(logger.error).toHaveBeenCalledWith(
        'Get profile error',
        expect.objectContaining({
          requestId: 'test-request-id',
          error: 'Unexpected error',
        })
      );

      // After the error, the catch block calls res.status and res.json again
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should not expose error details in production for getProfile', async () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Unexpected error');

      mockReq.user = { _id: 'user-123' };

      // Force an error by making res.json throw on first call, then work normally
      let callCount = 0;
      mockRes.json.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw error;
        }
        return mockRes;
      });

      await authController.getProfile(mockReq, mockRes);

      // The error handler should be called with undefined error in production
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to retrieve profile',
        error: undefined,
      });
    });
  });
});
