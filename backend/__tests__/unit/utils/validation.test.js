const { validateQuery, queryParamsSchema } = require('../../../src/utils/validation');

describe('Validation Middleware', () => {
  describe('validateQuery', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
      mockReq = {
        query: {},
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      mockNext = jest.fn();
    });

    it('should validate and pass valid query parameters', () => {
      mockReq.query = {
        page: '1',
        limit: '10',
        status: 'active',
      };

      const middleware = validateQuery(queryParamsSchema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validatedQuery).toBeDefined();
      expect(mockReq.validatedQuery.page).toBe(1);
      expect(mockReq.validatedQuery.limit).toBe(10);
      expect(mockReq.validatedQuery.status).toBe('active');
    });

    it('should return 400 for invalid query parameters', () => {
      mockReq.query = {
        page: 'invalid',
        limit: '999',
      };

      const middleware = validateQuery(queryParamsSchema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: expect.any(Array),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should format multiple validation errors', () => {
      mockReq.query = {
        page: '-1',
        limit: '999',
        status: 'invalid-status',
      };

      const middleware = validateQuery(queryParamsSchema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      const callArgs = mockRes.json.mock.calls[0][0];
      expect(callArgs.errors).toBeDefined();
      expect(callArgs.errors.length).toBeGreaterThan(0);
      expect(callArgs.errors[0]).toHaveProperty('field');
      expect(callArgs.errors[0]).toHaveProperty('message');
    });

    it('should strip unknown query parameters', () => {
      mockReq.query = {
        page: '1',
        limit: '10',
        unknownParam: 'should be stripped',
      };

      const middleware = validateQuery(queryParamsSchema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validatedQuery.unknownParam).toBeUndefined();
    });
  });
});
