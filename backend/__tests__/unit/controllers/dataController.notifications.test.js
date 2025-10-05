const dataController = require('../../../src/controllers/dataController');

// Mock the index.js module before requiring dataController
jest.mock('../../../src/index', () => ({
  socketService: jest.fn(() => ({
    sendNotificationToUser: jest.fn(),
    broadcastDataUpdate: jest.fn(),
  })),
}));

const { socketService } = require('../../../src/index');

describe('Data Controller - Real-time Notifications', () => {
  let mockDataService;
  let mockReq;
  let mockRes;
  let mockSocketService;

  beforeEach(() => {
    // Clear the mock before each test
    jest.clearAllMocks();

    // Setup mock socket service
    mockSocketService = {
      sendNotificationToUser: jest.fn(),
      broadcastDataUpdate: jest.fn(),
    };
    socketService.mockReturnValue(mockSocketService);

    // Mock data service
    mockDataService = {
      create: jest.fn(),
      update: jest.fn(),
    };

    // Mock request
    mockReq = {
      user: { userId: 'test-user-123' },
      params: {},
      validatedBody: {},
    };

    // Mock response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Temporarily set NODE_ENV to development to allow socketService
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset to test environment
    process.env.NODE_ENV = 'test';
  });

  describe('createData with notifications', () => {
    it('should send notification and broadcast when data is created', async () => {
      const mockData = {
        _id: 'mock-id-123',
        name: 'Test Data',
        type: 'test-type',
        content: 'test content',
      };

      mockDataService.create.mockResolvedValue(mockData);
      mockReq.validatedBody = { name: 'Test Data', content: 'test content' };

      const createDataHandler = dataController.createData(mockDataService);
      await createDataHandler(mockReq, mockRes);

      // Verify notification was sent
      expect(mockSocketService.sendNotificationToUser).toHaveBeenCalledWith('test-user-123', {
        type: 'success',
        message: 'New data entry "Test Data" has been created',
        data: {
          id: 'mock-id-123',
          name: 'Test Data',
          type: 'test-type',
        },
      });

      // Verify broadcast was sent
      expect(mockSocketService.broadcastDataUpdate).toHaveBeenCalledWith('data', mockData);

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Data created successfully',
          data: mockData,
        })
      );
    });

    it('should handle missing socketService gracefully', async () => {
      // Mock socketService to return null
      socketService.mockReturnValue(null);

      const mockData = {
        _id: 'mock-id-123',
        name: 'Test Data',
        type: 'test-type',
      };

      mockDataService.create.mockResolvedValue(mockData);
      mockReq.validatedBody = { name: 'Test Data' };

      const createDataHandler = dataController.createData(mockDataService);
      await createDataHandler(mockReq, mockRes);

      // Verify socketService was attempted but no error thrown
      expect(socketService).toHaveBeenCalled();

      // Verify response still works
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockData,
        })
      );
    });
  });

  describe('updateData with notifications', () => {
    it('should send notification and broadcast when data is updated', async () => {
      const mockData = {
        _id: 'mock-id-123',
        name: 'Updated Data',
        type: 'test-type',
        content: 'updated content',
      };

      mockDataService.update.mockResolvedValue(mockData);
      mockReq.params = { id: '507f1f77bcf86cd799439011' };
      mockReq.validatedBody = { name: 'Updated Data' };

      const updateDataHandler = dataController.updateData(mockDataService);
      await updateDataHandler(mockReq, mockRes);

      // Verify notification was sent
      expect(mockSocketService.sendNotificationToUser).toHaveBeenCalledWith('test-user-123', {
        type: 'info',
        message: 'Data entry "Updated Data" has been updated',
        data: {
          id: 'mock-id-123',
          name: 'Updated Data',
          type: 'test-type',
        },
      });

      // Verify broadcast was sent
      expect(mockSocketService.broadcastDataUpdate).toHaveBeenCalledWith('data', mockData);

      // Verify response
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Data updated successfully',
          data: mockData,
        })
      );
    });

    it('should not send notification when data is not found', async () => {
      mockDataService.update.mockResolvedValue(null);
      mockReq.params = { id: '507f1f77bcf86cd799439011' };
      mockReq.validatedBody = { name: 'Updated Data' };

      const updateDataHandler = dataController.updateData(mockDataService);
      await updateDataHandler(mockReq, mockRes);

      // Verify no notification was sent
      expect(mockSocketService.sendNotificationToUser).not.toHaveBeenCalled();
      expect(mockSocketService.broadcastDataUpdate).not.toHaveBeenCalled();

      // Verify 404 response
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('bulkOperations with notifications', () => {
    it('should send summary notification for successful bulk operations', async () => {
      const mockCreatedData = [
        { _id: 'id1', name: 'Data 1' },
        { _id: 'id2', name: 'Data 2' },
      ];

      mockDataService.create
        .mockResolvedValueOnce(mockCreatedData[0])
        .mockResolvedValueOnce(mockCreatedData[1]);

      mockReq.validatedBody = {
        operation: 'create',
        data: [{ name: 'Data 1' }, { name: 'Data 2' }],
      };

      const bulkOpsHandler = dataController.bulkOperations(mockDataService);
      await bulkOpsHandler(mockReq, mockRes);

      // Verify broadcast was called for each item
      expect(mockSocketService.broadcastDataUpdate).toHaveBeenCalledTimes(2);

      // Verify summary notification
      expect(mockSocketService.sendNotificationToUser).toHaveBeenCalledWith('test-user-123', {
        type: 'success',
        message: 'Bulk create completed: 2 succeeded',
        data: {
          operation: 'create',
          succeeded: 2,
          failed: 0,
        },
      });
    });

    it('should send info notification when bulk operation has failures', async () => {
      mockDataService.create
        .mockResolvedValueOnce({ _id: 'id1', name: 'Data 1' })
        .mockRejectedValueOnce(new Error('Creation failed'));

      mockReq.validatedBody = {
        operation: 'create',
        data: [{ name: 'Data 1' }, { name: 'Data 2' }],
      };

      const bulkOpsHandler = dataController.bulkOperations(mockDataService);
      await bulkOpsHandler(mockReq, mockRes);

      // Verify summary notification with mixed results
      expect(mockSocketService.sendNotificationToUser).toHaveBeenCalledWith('test-user-123', {
        type: 'info',
        message: 'Bulk create completed: 1 succeeded, 1 failed',
        data: {
          operation: 'create',
          succeeded: 1,
          failed: 1,
        },
      });
    });
  });
});
