const request = require('supertest');
const express = require('express');
const DataService = require('../../src/services/dataService');
const dataController = require('../../src/controllers/dataController');
const createDataRoutes = require('../../src/routes/dataRoutes');
const Data = require('../../src/models/Data');
const mongoose = require('mongoose');

jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { userId: 'test-user-123' };
    next();
  },
}));

jest.mock('../../src/middleware/rateLimiter', () => ({
  apiLimiter: (req, res, next) => next(),
  authLimiter: (req, res, next) => next(),
}));

// Mock MongoDB ObjectId validation
jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockImplementation((id) => {
  return /^[a-f\d]{24}$/i.test(id);
});

describe('Data Management API', () => {
  let app;
  let mockRedisClient;
  let dataService;
  let mockDataStore = [];

  beforeAll(() => {
    // Mock Redis client
    mockRedisClient = {
      isOpen: true,
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      keys: jest.fn().mockResolvedValue([]),
    };

    // Create data service with mock Redis
    dataService = new DataService(mockRedisClient);

    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Mount data routes
    const dataRoutes = createDataRoutes(dataService, dataController);
    app.use('/api/data', dataRoutes);

    // Error handler
    app.use((err, req, res, _next) => {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    });
  });

  beforeEach(() => {
    // Reset mocks
    mockDataStore = [];
    jest.clearAllMocks();

    // Mock Data model methods
    Data.prototype.save = jest.fn(function () {
      const data = {
        _id: '507f1f77bcf86cd799439011',
        ...this.toObject(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDataStore.push(data);
      return Promise.resolve(data);
    });

    Data.findOne = jest.fn((query) => {
      const data = mockDataStore.find(
        (d) => d._id === query._id && d.userId === query.userId
      );
      return Promise.resolve(data || null);
    });

    Data.find = jest.fn((query) => ({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn(() => {
        const filtered = mockDataStore.filter((d) => d.userId === query.userId);
        return Promise.resolve(filtered);
      }),
    }));

    Data.countDocuments = jest.fn((query) => {
      const count = mockDataStore.filter((d) => d.userId === query.userId).length;
      return Promise.resolve(count);
    });

    Data.findOneAndUpdate = jest.fn((query, update) => {
      const index = mockDataStore.findIndex(
        (d) => d._id === query._id && d.userId === query.userId
      );
      if (index !== -1) {
        mockDataStore[index] = { ...mockDataStore[index], ...update.$set };
        return Promise.resolve(mockDataStore[index]);
      }
      return Promise.resolve(null);
    });

    Data.findOneAndDelete = jest.fn((query) => {
      const index = mockDataStore.findIndex(
        (d) => d._id === query._id && d.userId === query.userId
      );
      if (index !== -1) {
        const deleted = mockDataStore.splice(index, 1)[0];
        return Promise.resolve(deleted);
      }
      return Promise.resolve(null);
    });

    Data.aggregate = jest.fn(() => Promise.resolve([]));
  });

  describe('POST /api/data - Create Data', () => {
    it('should create new data successfully', async () => {
      const newData = {
        name: 'Test Data',
        description: 'Test description',
        content: { test: 'value' },
        type: 'json',
        tags: ['test', 'example'],
      };

      const response = await request(app).post('/api/data').send(newData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Data created successfully');
      expect(response.body.data).toHaveProperty('name', 'Test Data');
    });

    it('should reject data without required fields', async () => {
      const invalidData = {
        description: 'Missing name and content',
      };

      const response = await request(app).post('/api/data').send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should reject data with invalid type', async () => {
      const invalidData = {
        name: 'Test',
        content: 'data',
        type: 'invalid_type',
      };

      const response = await request(app).post('/api/data').send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/data - List Data', () => {
    beforeEach(() => {
      // Add some test data
      mockDataStore = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Data 1',
          content: 'content 1',
          userId: 'test-user-123',
          status: 'active',
          type: 'text',
          tags: ['tag1'],
          createdAt: new Date(),
        },
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'Data 2',
          content: 'content 2',
          userId: 'test-user-123',
          status: 'active',
          type: 'json',
          tags: ['tag2'],
          createdAt: new Date(),
        },
      ];
    });

    it('should list all data with pagination', async () => {
      const response = await request(app).get('/api/data').query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
    });

    it('should filter data by status', async () => {
      const response = await request(app)
        .get('/api/data')
        .query({ status: 'active' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter data by type', async () => {
      const response = await request(app).get('/api/data').query({ type: 'json' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/data/:id - Get Data By ID', () => {
    beforeEach(() => {
      mockDataStore = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Test Data',
          content: 'test content',
          userId: 'test-user-123',
          status: 'active',
          type: 'text',
        },
      ];
    });

    it('should get data by valid ID', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const response = await request(app).get('/api/data/507f1f77bcf86cd799439011');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id', '507f1f77bcf86cd799439011');
    });

    it('should return 404 for non-existent ID', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      Data.findOne.mockResolvedValue(null);

      const response = await request(app).get('/api/data/507f1f77bcf86cd799439099');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Data not found');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app).get('/api/data/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid data ID format');
    });
  });

  describe('PUT /api/data/:id - Update Data', () => {
    beforeEach(() => {
      mockDataStore = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Original Name',
          content: 'original content',
          userId: 'test-user-123',
          status: 'active',
        },
      ];
    });

    it('should update data successfully', async () => {
      const updates = {
        name: 'Updated Name',
        description: 'Updated description',
      };

      const response = await request(app)
        .put('/api/data/507f1f77bcf86cd799439011')
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Data updated successfully');
    });

    it('should return 404 for non-existent data', async () => {
      Data.findOneAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/data/507f1f77bcf86cd799439099')
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject empty update', async () => {
      const response = await request(app)
        .put('/api/data/507f1f77bcf86cd799439011')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/data/:id - Delete Data', () => {
    beforeEach(() => {
      mockDataStore = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Test Data',
          userId: 'test-user-123',
        },
      ];
    });

    it('should delete data successfully', async () => {
      const response = await request(app).delete('/api/data/507f1f77bcf86cd799439011');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Data deleted successfully');
    });

    it('should return 404 for non-existent data', async () => {
      Data.findOneAndDelete.mockResolvedValue(null);

      const response = await request(app).delete('/api/data/507f1f77bcf86cd799439099');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/data/search - Search Data', () => {
    it('should search data successfully', async () => {
      mockDataStore = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Test Data',
          userId: 'test-user-123',
        },
      ];

      const response = await request(app)
        .get('/api/data/search')
        .query({ search: 'test', page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.query).toBe('test');
    });

    it('should return 400 without search query', async () => {
      const response = await request(app).get('/api/data/search');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/data/bulk - Bulk Operations', () => {
    it('should perform bulk create operation', async () => {
      const bulkData = {
        operation: 'create',
        data: [
          { name: 'Data 1', content: 'content 1' },
          { name: 'Data 2', content: 'content 2' },
        ],
      };

      const response = await request(app).post('/api/data/bulk').send(bulkData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.summary.total).toBe(2);
    });

    it('should validate bulk operation request', async () => {
      const invalidBulk = {
        operation: 'invalid_op',
        data: [],
      };

      const response = await request(app).post('/api/data/bulk').send(invalidBulk);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/data/export - Export Data', () => {
    beforeEach(() => {
      mockDataStore = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Export Test',
          type: 'text',
          status: 'active',
          tags: ['export'],
          userId: 'test-user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    });

    it('should export data as JSON', async () => {
      const response = await request(app)
        .get('/api/data/export')
        .query({ format: 'json' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should export data as CSV', async () => {
      const response = await request(app)
        .get('/api/data/export')
        .query({ format: 'csv' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
    });
  });

  describe('GET /api/data/analytics - Get Analytics', () => {
    it('should return analytics data', async () => {
      Data.countDocuments.mockResolvedValue(10);
      Data.aggregate.mockResolvedValue([
        { _id: 'text', count: 5 },
        { _id: 'json', count: 5 },
      ]);

      const response = await request(app).get('/api/data/analytics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toHaveProperty('total');
      expect(response.body.analytics).toHaveProperty('byType');
      expect(response.body.analytics).toHaveProperty('byStatus');
    });
  });
});
