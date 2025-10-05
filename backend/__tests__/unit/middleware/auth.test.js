const { authenticate, optionalAuth } = require('../../../src/middleware/auth');
const { verifyAccessToken } = require('../../../src/utils/jwt');
const User = require('../../../src/models/User');

// Mock dependencies
jest.mock('../../../src/utils/jwt');
jest.mock('../../../src/models/User');

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('authenticate - Invalid Header Types (Gemini Suggestions)', () => {
    it('should return 401 for numeric authorization header', async () => {
      req.headers.authorization = 12345;

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required. Please provide a valid token.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for boolean authorization header', async () => {
      req.headers.authorization = true;

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required. Please provide a valid token.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for object authorization header', async () => {
      req.headers.authorization = { bearer: 'token' };

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required. Please provide a valid token.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for array authorization header', async () => {
      req.headers.authorization = ['Bearer', 'token'];

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required. Please provide a valid token.',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authenticate - NotBeforeError Handling (Gemini Suggestions)', () => {
    it('should return 401 for NotBeforeError', async () => {
      req.headers.authorization = 'Bearer early_token';

      const error = new Error('jwt not active');
      error.name = 'NotBeforeError';
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token not yet valid. Please check your system time.',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authenticate - Valid Cases', () => {
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
    };

    it('should authenticate successfully with valid token', async () => {
      req.headers.authorization = 'Bearer valid_token';

      verifyAccessToken.mockReturnValue({ userId: 'user123', role: 'user' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authenticate(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 for missing authorization header', async () => {
      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required. Please provide a valid token.',
      });
    });

    it('should return 401 for invalid Bearer format', async () => {
      req.headers.authorization = 'InvalidFormat token';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required. Please provide a valid token.',
      });
    });
  });

  describe('optionalAuth - Invalid Header Types', () => {
    it('should continue without authentication for numeric header', async () => {
      req.headers.authorization = 12345;

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should continue without authentication for boolean header', async () => {
      req.headers.authorization = false;

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should continue without authentication for object header', async () => {
      req.headers.authorization = { bearer: 'token' };

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth - Valid Cases', () => {
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
    };

    it('should attach user for valid token', async () => {
      req.headers.authorization = 'Bearer valid_token';

      verifyAccessToken.mockReturnValue({ userId: 'user123', role: 'user' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await optionalAuth(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should continue without user for missing header', async () => {
      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should continue without user for invalid token', async () => {
      req.headers.authorization = 'Bearer invalid_token';

      verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });
});
