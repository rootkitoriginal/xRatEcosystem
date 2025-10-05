const { authenticate, optionalAuth } = require('../../../src/middleware/auth');
const { verifyAccessToken } = require('../../../src/utils/jwt');
const User = require('../../../src/models/User');

// Mock dependencies
jest.mock('../../../src/utils/jwt');
jest.mock('../../../src/models/User');

describe('JWT Security - Advanced Edge Cases', () => {
  let req, res, next;
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

  describe('Token Format Edge Cases', () => {
    it('should reject Bearer token with multiple spaces', async () => {
      req.headers.authorization = 'Bearer  token_with_double_space';

      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject token with lowercase bearer', async () => {
      req.headers.authorization = 'bearer valid_token';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required. Please provide a valid token.',
      });
    });

    it('should reject token with mixed case Bearer', async () => {
      req.headers.authorization = 'BeArEr valid_token';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle very long token strings', async () => {
      const longToken = 'a'.repeat(10000);
      req.headers.authorization = `Bearer ${longToken}`;

      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(verifyAccessToken).toHaveBeenCalledWith(longToken);
    });

    it('should handle token with special characters', async () => {
      req.headers.authorization = 'Bearer token<script>alert("xss")</script>';

      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle token with SQL injection attempts', async () => {
      req.headers.authorization = 'Bearer token\' OR \'1\'=\'1';

      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle empty Bearer prefix', async () => {
      req.headers.authorization = 'Bearer ';

      const error = new Error('jwt must be provided');
      error.name = 'JsonWebTokenError';
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(verifyAccessToken).toHaveBeenCalledWith('');
    });

    it('should handle only Bearer keyword', async () => {
      req.headers.authorization = 'Bearer';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle authorization header with tabs', async () => {
      req.headers.authorization = 'Bearer\ttoken_with_tab';

      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle authorization header with newlines', async () => {
      req.headers.authorization = 'Bearer\ntoken_with_newline';

      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Database Connection Edge Cases', () => {
    it('should handle database timeout during user lookup', async () => {
      req.headers.authorization = 'Bearer valid_token';

      verifyAccessToken.mockReturnValue({ userId: 'user123', role: 'user' });

      const timeoutError = new Error('Database timeout');
      timeoutError.name = 'MongoTimeoutError';
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(timeoutError),
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication error',
        error: undefined, // In production mode
      });
    });

    it('should handle database connection lost during user lookup', async () => {
      req.headers.authorization = 'Bearer valid_token';

      verifyAccessToken.mockReturnValue({ userId: 'user123', role: 'user' });

      const connectionError = new Error('Connection lost');
      connectionError.name = 'MongoNetworkError';
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(connectionError),
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle null user ID in token payload', async () => {
      req.headers.authorization = 'Bearer valid_token';

      verifyAccessToken.mockReturnValue({ userId: null, role: 'user' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(User.findById).toHaveBeenCalledWith(null);
    });

    it('should handle undefined user ID in token payload', async () => {
      req.headers.authorization = 'Bearer valid_token';

      verifyAccessToken.mockReturnValue({ role: 'user' }); // userId is undefined
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle malformed user ID in token payload', async () => {
      req.headers.authorization = 'Bearer valid_token';

      verifyAccessToken.mockReturnValue({ userId: 'not-a-valid-objectid', role: 'user' });

      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(castError),
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Token Expiration Edge Cases', () => {
    it('should handle token expired error', async () => {
      req.headers.authorization = 'Bearer expired_token';

      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      error.expiredAt = new Date();
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token expired. Please login again.',
      });
    });

    it('should handle token not before error', async () => {
      req.headers.authorization = 'Bearer early_token';

      const error = new Error('jwt not active');
      error.name = 'NotBeforeError';
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      await authenticate(req, res, next);

      // NotBeforeError should be caught and handled as generic error
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Multiple Concurrent Authentication Attempts', () => {
    it('should handle concurrent authentication for same user', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
      };

      req.headers.authorization = 'Bearer valid_token';
      verifyAccessToken.mockReturnValue({ userId: 'user123', role: 'user' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      // Simulate concurrent requests
      const promises = [
        authenticate(req, res, next),
        authenticate({ ...req }, { ...res }, jest.fn()),
        authenticate({ ...req }, { ...res }, jest.fn()),
      ];

      await Promise.all(promises);

      expect(User.findById).toHaveBeenCalledTimes(3);
    });
  });

  describe('User Data Edge Cases', () => {
    it('should handle user with missing fields in database', async () => {
      req.headers.authorization = 'Bearer valid_token';

      const incompleteUser = {
        _id: 'user123',
        // Missing username and email
      };

      verifyAccessToken.mockReturnValue({ userId: 'user123', role: 'user' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(incompleteUser),
      });

      await authenticate(req, res, next);

      expect(req.user).toEqual(incompleteUser);
      expect(next).toHaveBeenCalled();
    });

    it('should handle user with extra fields in database', async () => {
      req.headers.authorization = 'Bearer valid_token';

      const userWithExtra = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        extraField1: 'value1',
        extraField2: 'value2',
      };

      verifyAccessToken.mockReturnValue({ userId: 'user123', role: 'user' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithExtra),
      });

      await authenticate(req, res, next);

      expect(req.user).toEqual(userWithExtra);
      expect(next).toHaveBeenCalled();
    });

    it('should handle user with special characters in username', async () => {
      req.headers.authorization = 'Bearer valid_token';

      const userWithSpecialChars = {
        _id: 'user123',
        username: 'user<script>alert("xss")</script>',
        email: 'test@example.com',
      };

      verifyAccessToken.mockReturnValue({ userId: 'user123', role: 'user' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithSpecialChars),
      });

      await authenticate(req, res, next);

      expect(req.user.username).toContain('<script>');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('OptionalAuth Security Edge Cases', () => {
    it('should not expose errors to client in optionalAuth', async () => {
      req.headers.authorization = 'Bearer corrupted_token';

      const error = new Error('Sensitive database error information');
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle database failure gracefully in optionalAuth', async () => {
      req.headers.authorization = 'Bearer valid_token';

      verifyAccessToken.mockReturnValue({ userId: 'user123', role: 'user' });

      const dbError = new Error('Database connection failed');
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(dbError),
      });

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should handle null findById result in optionalAuth', async () => {
      req.headers.authorization = 'Bearer valid_token';

      verifyAccessToken.mockReturnValue({ userId: 'user123', role: 'user' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('JWT Secret Key Security', () => {
    it('should not expose JWT secret in error messages', async () => {
      req.headers.authorization = 'Bearer invalid_token';
      process.env.NODE_ENV = 'development';

      const error = new Error('invalid signature');
      error.name = 'JsonWebTokenError';
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      await authenticate(req, res, next);

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.message).toBe('Invalid token');
      expect(JSON.stringify(jsonCall)).not.toContain('your-secret-key');
      expect(JSON.stringify(jsonCall)).not.toContain(JWT_SECRET);

      delete process.env.NODE_ENV;
    });
  });

  describe('Request Object Pollution Prevention', () => {
    it('should not allow token to inject properties into request', async () => {
      req.headers.authorization = 'Bearer valid_token';

      const maliciousPayload = {
        userId: 'user123',
        role: 'user',
        isAdmin: true,
        __proto__: { polluted: true },
      };

      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
      };

      verifyAccessToken.mockReturnValue(maliciousPayload);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authenticate(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(req.polluted).toBeUndefined();
      expect(req.isAdmin).toBeUndefined();
    });

    it('should not modify original request object properties', async () => {
      req.headers.authorization = 'Bearer valid_token';
      req.existingProperty = 'original_value';

      const mockUser = {
        _id: 'user123',
        username: 'testuser',
      };

      verifyAccessToken.mockReturnValue({ userId: 'user123', role: 'user' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authenticate(req, res, next);

      expect(req.existingProperty).toBe('original_value');
      expect(req.user).toEqual(mockUser);
    });
  });

  describe('Error Message Security', () => {
    it('should return generic message for unexpected errors', async () => {
      req.headers.authorization = 'Bearer valid_token';

      const unexpectedError = new Error('Internal server implementation detail');
      unexpectedError.name = 'UnexpectedError';
      verifyAccessToken.mockImplementation(() => {
        throw unexpectedError;
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.message).toBe('Authentication error');
      expect(jsonCall.error).toBeUndefined(); // No error details in production
    });

    it('should include error details only in development mode', async () => {
      req.headers.authorization = 'Bearer valid_token';
      process.env.NODE_ENV = 'development';

      const error = new Error('Detailed error message');
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      await authenticate(req, res, next);

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.error).toBe('Detailed error message');

      delete process.env.NODE_ENV;
    });

    it('should not include error details in production mode', async () => {
      req.headers.authorization = 'Bearer valid_token';
      process.env.NODE_ENV = 'production';

      const error = new Error('Sensitive information');
      verifyAccessToken.mockImplementation(() => {
        throw error;
      });

      await authenticate(req, res, next);

      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.error).toBeUndefined();

      delete process.env.NODE_ENV;
    });
  });

  describe('Token Replay Prevention Patterns', () => {
    it('should accept same valid token multiple times (no replay prevention yet)', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
      };

      req.headers.authorization = 'Bearer valid_token';
      verifyAccessToken.mockReturnValue({ userId: 'user123', role: 'user' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      // First authentication
      await authenticate(req, res, next);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledTimes(1);

      // Reset mocks
      jest.clearAllMocks();
      verifyAccessToken.mockReturnValue({ userId: 'user123', role: 'user' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      // Second authentication with same token (replay)
      await authenticate({ ...req }, { ...res }, jest.fn());

      // Currently allows replay - documenting expected behavior
      expect(verifyAccessToken).toHaveBeenCalledWith('valid_token');
    });
  });

  describe('Authorization Header Edge Cases', () => {
    it('should handle null authorization header', async () => {
      req.headers.authorization = null;

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(verifyAccessToken).not.toHaveBeenCalled();
    });

    it('should handle undefined authorization header', async () => {
      delete req.headers.authorization;

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(verifyAccessToken).not.toHaveBeenCalled();
    });

    it('should handle empty string authorization header', async () => {
      req.headers.authorization = '';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle numeric authorization header', async () => {
      req.headers.authorization = 12345;

      await authenticate(req, res, next);

      // Non-string types cause TypeError when calling .startsWith()
      // This results in 500 error instead of 401
      expect(res.status).toHaveBeenCalledWith(500);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle boolean authorization header', async () => {
      req.headers.authorization = true;

      await authenticate(req, res, next);

      // Non-string types cause TypeError when calling .startsWith()
      expect(res.status).toHaveBeenCalledWith(500);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle object authorization header', async () => {
      req.headers.authorization = { bearer: 'token' };

      await authenticate(req, res, next);

      // Non-string types cause TypeError when calling .startsWith()
      expect(res.status).toHaveBeenCalledWith(500);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
