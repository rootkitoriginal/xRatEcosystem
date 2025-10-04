const dataController = require('../../../src/controllers/dataController');

describe('Data Controller', () => {
  let mockDataService;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Mock data service
    mockDataService = {
      create: jest.fn(),
      list: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
      getAnalytics: jest.fn(),
    };

    // Mock request
    mockReq = {
      user: { userId: 'test-user-123' },
      params: {},
      validatedBody: {},
      validatedQuery: {},
    };

    // Mock response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    // Set NODE_ENV to development for error details
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createData', () => {
    it('should handle service errors', async () => {
      const error = new Error('Database error');
      mockDataService.create.mockRejectedValue(error);

      mockReq.validatedBody = { name: 'Test', content: 'test' };

      const createDataHandler = dataController.createData(mockDataService);
      await createDataHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to create data',
        error: 'Database error',
      });
    });

    it('should not expose error details in production', async () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Database error');
      mockDataService.create.mockRejectedValue(error);

      mockReq.validatedBody = { name: 'Test', content: 'test' };

      const createDataHandler = dataController.createData(mockDataService);
      await createDataHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to create data',
        error: undefined,
      });
    });
  });

  describe('listData', () => {
    it('should handle service errors', async () => {
      const error = new Error('Database error');
      mockDataService.list.mockRejectedValue(error);

      mockReq.validatedQuery = { page: 1, limit: 10 };

      const listDataHandler = dataController.listData(mockDataService);
      await listDataHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to retrieve data',
        error: 'Database error',
      });
    });
  });

  describe('getDataById', () => {
    it('should handle service errors', async () => {
      const error = new Error('Database error');
      mockDataService.findById.mockRejectedValue(error);

      mockReq.params = { id: '507f1f77bcf86cd799439011' };

      const getDataByIdHandler = dataController.getDataById(mockDataService);
      await getDataByIdHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to retrieve data',
        error: 'Database error',
      });
    });
  });

  describe('updateData', () => {
    it('should handle invalid ObjectId', async () => {
      mockReq.params = { id: 'invalid-id' };
      mockReq.validatedBody = { name: 'Updated' };

      const updateDataHandler = dataController.updateData(mockDataService);
      await updateDataHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid data ID format',
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      mockDataService.update.mockRejectedValue(error);

      mockReq.params = { id: '507f1f77bcf86cd799439011' };
      mockReq.validatedBody = { name: 'Updated' };

      const updateDataHandler = dataController.updateData(mockDataService);
      await updateDataHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update data',
        error: 'Database error',
      });
    });
  });

  describe('deleteData', () => {
    it('should handle invalid ObjectId', async () => {
      mockReq.params = { id: 'invalid-id' };

      const deleteDataHandler = dataController.deleteData(mockDataService);
      await deleteDataHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid data ID format',
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      mockDataService.delete.mockRejectedValue(error);

      mockReq.params = { id: '507f1f77bcf86cd799439011' };

      const deleteDataHandler = dataController.deleteData(mockDataService);
      await deleteDataHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to delete data',
        error: 'Database error',
      });
    });
  });

  describe('searchData', () => {
    it('should handle missing search query', async () => {
      mockReq.validatedQuery = { page: 1, limit: 10 };

      const searchDataHandler = dataController.searchData(mockDataService);
      await searchDataHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Search query is required',
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Search error');
      mockDataService.search.mockRejectedValue(error);

      mockReq.validatedQuery = { search: 'test', page: 1, limit: 10 };

      const searchDataHandler = dataController.searchData(mockDataService);
      await searchDataHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Search failed',
        error: 'Search error',
      });
    });
  });

  describe('bulkOperations', () => {
    it('should handle create operation errors', async () => {
      mockDataService.create.mockRejectedValueOnce(new Error('Create failed'));
      mockDataService.create.mockResolvedValueOnce({ _id: '123', name: 'Item 2' });

      mockReq.validatedBody = {
        operation: 'create',
        data: [
          { name: 'Item 1', content: 'test1' },
          { name: 'Item 2', content: 'test2' },
        ],
      };

      const bulkOperationsHandler = dataController.bulkOperations(mockDataService);
      await bulkOperationsHandler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Bulk create completed',
          results: {
            success: [{ id: '123', data: { _id: '123', name: 'Item 2' } }],
            failed: [{ data: { name: 'Item 1', content: 'test1' }, error: 'Create failed' }],
          },
        })
      );
    });

    it('should handle update operation with not found items', async () => {
      mockDataService.update.mockResolvedValueOnce(null);
      mockDataService.update.mockResolvedValueOnce({ _id: '456', name: 'Updated' });

      mockReq.validatedBody = {
        operation: 'update',
        data: [
          { id: '123', updates: { name: 'Not found' } },
          { id: '456', updates: { name: 'Updated' } },
        ],
      };

      const bulkOperationsHandler = dataController.bulkOperations(mockDataService);
      await bulkOperationsHandler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Bulk update completed',
          results: {
            success: [{ id: '456', data: { _id: '456', name: 'Updated' } }],
            failed: [{ id: '123', error: 'Not found' }],
          },
        })
      );
    });

    it('should handle update operation errors', async () => {
      mockDataService.update.mockRejectedValueOnce(new Error('Update failed'));

      mockReq.validatedBody = {
        operation: 'update',
        data: [{ id: '123', updates: { name: 'Test' } }],
      };

      const bulkOperationsHandler = dataController.bulkOperations(mockDataService);
      await bulkOperationsHandler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          results: {
            success: [],
            failed: [{ id: '123', error: 'Update failed' }],
          },
        })
      );
    });

    it('should handle delete operation with not found items', async () => {
      mockDataService.delete.mockResolvedValueOnce(null);
      mockDataService.delete.mockResolvedValueOnce({ _id: '456' });

      mockReq.validatedBody = {
        operation: 'delete',
        data: [{ id: '123' }, { id: '456' }],
      };

      const bulkOperationsHandler = dataController.bulkOperations(mockDataService);
      await bulkOperationsHandler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Bulk delete completed',
          results: {
            success: [{ id: '456' }],
            failed: [{ id: '123', error: 'Not found' }],
          },
        })
      );
    });

    it('should handle delete operation errors', async () => {
      mockDataService.delete.mockRejectedValueOnce(new Error('Delete failed'));

      mockReq.validatedBody = {
        operation: 'delete',
        data: [{ id: '123' }],
      };

      const bulkOperationsHandler = dataController.bulkOperations(mockDataService);
      await bulkOperationsHandler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          results: {
            success: [],
            failed: [{ id: '123', error: 'Delete failed' }],
          },
        })
      );
    });

    it('should handle general bulk operation errors', async () => {
      const error = new Error('Bulk operation failed');
      mockDataService.create.mockRejectedValue(error);

      mockReq.validatedBody = {
        operation: 'create',
        data: [{ name: 'Test', content: 'test' }],
      };

      // Force an error before the operations loop
      mockReq.validatedBody = undefined;

      const bulkOperationsHandler = dataController.bulkOperations(mockDataService);
      await bulkOperationsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Bulk operation failed',
        error: expect.any(String),
      });
    });
  });

  describe('exportData', () => {
    it('should handle CSV export', async () => {
      const mockData = [
        {
          _id: '123',
          name: 'Test 1',
          type: 'text',
          status: 'active',
          tags: ['tag1', 'tag2'],
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-02'),
        },
        {
          _id: '456',
          name: 'Test 2',
          type: 'json',
          status: 'archived',
          tags: ['tag3'],
          createdAt: new Date('2025-01-03'),
          updatedAt: new Date('2025-01-04'),
        },
      ];

      mockDataService.list.mockResolvedValue({
        items: mockData,
        pagination: { page: 1, limit: 10000, total: 2, pages: 1 },
      });

      mockReq.validatedQuery = { format: 'csv' };

      const exportDataHandler = dataController.exportData(mockDataService);
      await exportDataHandler(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=data-export.csv'
      );
      expect(mockRes.send).toHaveBeenCalledWith(expect.stringContaining('ID,Name,Type,Status'));
    });

    it('should handle JSON export', async () => {
      const mockData = [
        {
          _id: '123',
          name: 'Test 1',
          type: 'text',
          status: 'active',
          tags: ['tag1'],
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-02'),
        },
      ];

      mockDataService.list.mockResolvedValue({
        items: mockData,
        pagination: { page: 1, limit: 10000, total: 1, pages: 1 },
      });

      mockReq.validatedQuery = { format: 'json' };

      const exportDataHandler = dataController.exportData(mockDataService);
      await exportDataHandler(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=data-export.json'
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockData,
          count: 1,
        })
      );
    });

    it('should handle date filtering in export', async () => {
      const mockData = [
        {
          _id: '123',
          name: 'Test 1',
          type: 'text',
          status: 'active',
          tags: [],
          createdAt: new Date('2025-01-15'),
          updatedAt: new Date('2025-01-16'),
        },
        {
          _id: '456',
          name: 'Test 2',
          type: 'text',
          status: 'active',
          tags: [],
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-02'),
        },
        {
          _id: '789',
          name: 'Test 3',
          type: 'text',
          status: 'active',
          tags: [],
          createdAt: new Date('2025-01-30'),
          updatedAt: new Date('2025-01-31'),
        },
      ];

      mockDataService.list.mockResolvedValue({
        items: mockData,
        pagination: { page: 1, limit: 10000, total: 3, pages: 1 },
      });

      mockReq.validatedQuery = {
        format: 'json',
        startDate: '2025-01-10',
        endDate: '2025-01-20',
      };

      const exportDataHandler = dataController.exportData(mockDataService);
      await exportDataHandler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 1, // Only one item in date range
          data: expect.arrayContaining([
            expect.objectContaining({ _id: '123' }),
          ]),
        })
      );
    });

    it('should handle export errors', async () => {
      const error = new Error('Export failed');
      mockDataService.list.mockRejectedValue(error);

      mockReq.validatedQuery = { format: 'json' };

      const exportDataHandler = dataController.exportData(mockDataService);
      await exportDataHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Export failed',
        error: 'Export failed',
      });
    });
  });

  describe('getAnalytics', () => {
    it('should handle service errors', async () => {
      const error = new Error('Analytics error');
      mockDataService.getAnalytics.mockRejectedValue(error);

      const getAnalyticsHandler = dataController.getAnalytics(mockDataService);
      await getAnalyticsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to retrieve analytics',
        error: 'Analytics error',
      });
    });
  });
});
