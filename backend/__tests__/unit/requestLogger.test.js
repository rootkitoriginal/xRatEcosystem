const { requestLogger, errorLogger } = require('../../src/middleware/requestLogger');
const logger = require('../../src/config/logger');

// Mock logger
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('Request Logger Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      url: '/api/test',
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      get: jest.fn().mockReturnValue('Test User Agent'),
    };

    res = {
      send: jest.fn().mockReturnThis(),
      statusCode: 200,
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('requestLogger', () => {
    it('should add requestId to request object', () => {
      requestLogger(req, res, next);
      expect(req.requestId).toBeDefined();
      expect(typeof req.requestId).toBe('string');
    });

    it('should log incoming request', () => {
      requestLogger(req, res, next);
      expect(logger.info).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          requestId: expect.any(String),
          method: 'GET',
          url: '/api/test',
          ip: '127.0.0.1',
          userAgent: 'Test User Agent',
        })
      );
    });

    it('should call next middleware', () => {
      requestLogger(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should log response when send is called', () => {
      requestLogger(req, res, next);

      // Simulate response being sent
      res.send('test response');

      expect(logger.info).toHaveBeenCalledWith(
        'Request completed',
        expect.objectContaining({
          requestId: expect.any(String),
          method: 'GET',
          url: '/api/test',
          statusCode: 200,
          responseTime: expect.stringMatching(/\d+ms/),
        })
      );
    });
  });

  describe('errorLogger', () => {
    it('should log error with request details', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      req.requestId = 'test-request-id';

      errorLogger(error, req, res, next);

      expect(logger.error).toHaveBeenCalledWith(
        'Request error',
        expect.objectContaining({
          requestId: 'test-request-id',
          method: 'GET',
          url: '/api/test',
          error: 'Test error',
          stack: 'Error stack trace',
        })
      );
    });

    it('should call next with error', () => {
      const error = new Error('Test error');
      req.requestId = 'test-request-id';

      errorLogger(error, req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
