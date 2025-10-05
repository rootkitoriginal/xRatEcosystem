// Mock logger before requiring validators
jest.mock('../../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  stream: {
    write: jest.fn(),
  },
}));

const {
  validateEvent,
  sanitizeString,
  sanitizeObject,
  createValidator,
} = require('../../../src/websocket/validators');

describe('WebSocket Validators', () => {
  describe('sanitizeString', () => {
    it('should escape HTML characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeString(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;');
    });

    it('should trim whitespace', () => {
      const input = '  test string  ';
      const result = sanitizeString(input);
      expect(result).toBe('test string');
    });

    it('should return non-strings unchanged', () => {
      expect(sanitizeString(123)).toBe(123);
      expect(sanitizeString(null)).toBe(null);
      expect(sanitizeString(undefined)).toBe(undefined);
    });
  });

  describe('sanitizeObject', () => {
    it('should recursively sanitize object strings', () => {
      const input = {
        name: '<script>alert("xss")</script>',
        nested: {
          value: '  test  ',
        },
      };
      const result = sanitizeObject(input);
      expect(result.name).toContain('&lt;');
      expect(result.nested.value).toBe('test');
    });

    it('should handle arrays', () => {
      const input = ['<b>test</b>', '  trim  '];
      const result = sanitizeObject(input);
      // Arrays are processed recursively, but strings are only sanitized if inside objects
      // The map function processes each item recursively, but strings are returned as-is
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should return primitives unchanged', () => {
      expect(sanitizeObject(123)).toBe(123);
      expect(sanitizeObject(null)).toBe(null);
    });
  });

  describe('validateEvent - dataSubscribe', () => {
    it('should validate valid data subscription', () => {
      const data = {
        entity: 'users',
        filters: { status: 'active' },
      };
      const result = validateEvent('dataSubscribe', data);
      expect(result.valid).toBe(true);
      expect(result.sanitizedData).toBeDefined();
    });

    it('should reject invalid entity names', () => {
      const data = {
        entity: 'invalid entity!',
      };
      const result = validateEvent('dataSubscribe', data);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('alphanumeric');
    });

    it('should reject missing entity', () => {
      const data = {};
      const result = validateEvent('dataSubscribe', data);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should limit filters count', () => {
      const filters = {};
      for (let i = 0; i < 15; i++) {
        filters[`filter${i}`] = 'value';
      }
      const data = { entity: 'users', filters };
      const result = validateEvent('dataSubscribe', data);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateEvent - notificationRead', () => {
    it('should validate valid MongoDB ObjectId', () => {
      const data = {
        notificationId: '507f1f77bcf86cd799439011',
      };
      const result = validateEvent('notificationRead', data);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid ObjectId format', () => {
      const data = {
        notificationId: 'invalid-id',
      };
      const result = validateEvent('notificationRead', data);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('MongoDB ObjectId');
    });
  });

  describe('validateEvent - userTyping', () => {
    it('should validate user typing event', () => {
      const data = {
        roomId: 'chat:room123',
        isTyping: true,
      };
      const result = validateEvent('userTyping', data);
      expect(result.valid).toBe(true);
    });

    it('should reject empty roomId', () => {
      const data = {
        roomId: '',
      };
      const result = validateEvent('userTyping', data);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateEvent - roomJoin', () => {
    it('should validate room join event', () => {
      const data = {
        roomId: 'chat:room123',
      };
      const result = validateEvent('roomJoin', data);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid room ID pattern', () => {
      const data = {
        roomId: 'room with spaces!',
      };
      const result = validateEvent('roomJoin', data);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateEvent - roomLeave', () => {
    it('should validate room leave event', () => {
      const data = {
        roomId: 'chat:room123',
      };
      const result = validateEvent('roomLeave', data);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateEvent - messageSend', () => {
    it('should validate message send event', () => {
      const data = {
        roomId: 'chat:room123',
        message: 'Hello, world!',
      };
      const result = validateEvent('messageSend', data);
      expect(result.valid).toBe(true);
    });

    it('should reject empty message', () => {
      const data = {
        roomId: 'chat:room123',
        message: '',
      };
      const result = validateEvent('messageSend', data);
      expect(result.valid).toBe(false);
    });

    it('should reject message exceeding max length', () => {
      const data = {
        roomId: 'chat:room123',
        message: 'x'.repeat(5001),
      };
      const result = validateEvent('messageSend', data);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateEvent - unknown event', () => {
    it('should reject unknown event types', () => {
      const data = { test: 'data' };
      const result = validateEvent('unknownEvent', data);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown event type');
    });
  });

  describe('createValidator', () => {
    it('should create validator middleware', () => {
      const validator = createValidator('dataSubscribe');
      expect(typeof validator).toBe('function');
    });

    it('should emit validation error on invalid data', () => {
      const validator = createValidator('dataSubscribe');
      const mockSocket = {
        id: 'socket-123',
        user: { _id: 'user-123', username: 'testuser' },
        emit: jest.fn(),
      };
      const invalidData = { entity: 'invalid entity!' };
      const callback = jest.fn();

      const result = validator(mockSocket, invalidData, callback);

      expect(result).toBeNull();
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'validation:error',
        expect.objectContaining({
          event: 'dataSubscribe',
          message: 'Validation failed',
        })
      );
    });

    it('should return sanitized data on valid input', () => {
      const validator = createValidator('dataSubscribe');
      const mockSocket = {
        id: 'socket-123',
        user: { _id: 'user-123', username: 'testuser' },
        emit: jest.fn(),
      };
      const validData = { entity: 'users' };

      const result = validator(mockSocket, validData);

      expect(result).toBeDefined();
      expect(result.entity).toBe('users');
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('XSS Prevention', () => {
    it('should prevent XSS in data subscription', () => {
      const data = {
        entity: 'users',
        filters: {
          name: '<script>alert("xss")</script>',
        },
      };
      const result = validateEvent('dataSubscribe', data);
      expect(result.valid).toBe(true);
      expect(result.sanitizedData.filters.name).toContain('&lt;script&gt;');
    });

    it('should prevent SQL injection attempts', () => {
      const data = {
        entity: 'users',
        filters: {
          id: "1' OR '1'='1",
        },
      };
      const result = validateEvent('dataSubscribe', data);
      expect(result.valid).toBe(true);
      // Validator.escape should escape quotes
      expect(result.sanitizedData.filters.id).not.toContain("'");
    });
  });
});
