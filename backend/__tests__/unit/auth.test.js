const { authenticate, optionalAuth } = require('../../src/middleware/auth');
const { verifyAccessToken } = require('../../src/utils/jwt');
const User = require('../../src/models/User');

// Mock dependencies
jest.mock('../../src/utils/jwt');
jest.mock('../../src/models/User');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should reject request without authorization header', async () => {
      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required. Please provide a valid token.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid authorization header format', async () => {
      req.headers.authorization = 'InvalidFormat token123';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required. Please provide a valid token.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with missing Bearer prefix', async () => {
      req.headers.authorization = 'token123';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required. Please provide a valid token.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      req.headers.authorization = 'Bearer invalid_token';

      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with expired token', async () => {
      req.headers.authorization = 'Bearer expired_token';

      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token expired. Please login again.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request when user is not found in database', async () => {
      req.headers.authorization = 'Bearer valid_token';

      verifyAccessToken.mockReturnValue({ userId: 'user123', role: 'user' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found. Token is invalid.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should successfully authenticate with valid token and existing user', async () => {
      req.headers.authorization = 'Bearer valid_token';

      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      };

      verifyAccessToken.mockReturnValue({ userId: 'user123', role: 'user' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authenticate(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should exclude password and refreshToken fields from user object', async () => {
      req.headers.authorization = 'Bearer valid_token';

      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      };

      verifyAccessToken.mockReturnValue({ userId: 'user123', role: 'user' });
      const selectMock = jest.fn().mockResolvedValue(mockUser);
      User.findById.mockReturnValue({
        select: selectMock,
      });

      await authenticate(req, res, next);

      expect(selectMock).toHaveBeenCalledWith('-password -refreshToken');
    });

    it('should handle unexpected errors gracefully in production', async () => {
      req.headers.authorization = 'Bearer valid_token';
      process.env.NODE_ENV = 'production';

      const error = new Error('Database connection failed');
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication error',
        error: undefined,
      });
      expect(next).not.toHaveBeenCalled();

      delete process.env.NODE_ENV;
    });

    it('should include error message in development mode', async () => {
      req.headers.authorization = 'Bearer valid_token';
      process.env.NODE_ENV = 'development';

      const error = new Error('Database connection failed');
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication error',
        error: 'Database connection failed',
      });
      expect(next).not.toHaveBeenCalled();

      delete process.env.NODE_ENV;
    });
  });

  describe('optionalAuth', () => {
    it('should continue without authentication when no authorization header', async () => {
      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should continue without authentication when authorization header is invalid format', async () => {
      req.headers.authorization = 'InvalidFormat token123';

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should continue without authentication when token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid_token';

      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should continue without authentication when token is expired', async () => {
      req.headers.authorization = 'Bearer expired_token';

      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should continue without authentication when user is not found', async () => {
      req.headers.authorization = 'Bearer valid_token';

      verifyAccessToken.mockReturnValue({ userId: 'user123', role: 'user' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should attach user to request when token is valid', async () => {
      req.headers.authorization = 'Bearer valid_token';

      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      };

      verifyAccessToken.mockReturnValue({ userId: 'user123', role: 'user' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await optionalAuth(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should exclude password and refreshToken fields from user object', async () => {
      req.headers.authorization = 'Bearer valid_token';

      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      };

      verifyAccessToken.mockReturnValue({ userId: 'user123', role: 'user' });
      const selectMock = jest.fn().mockResolvedValue(mockUser);
      User.findById.mockReturnValue({
        select: selectMock,
      });

      await optionalAuth(req, res, next);

      expect(selectMock).toHaveBeenCalledWith('-password -refreshToken');
    });

    it('should handle unexpected errors by continuing without authentication', async () => {
      req.headers.authorization = 'Bearer valid_token';

      const error = new Error('Database connection failed');
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
