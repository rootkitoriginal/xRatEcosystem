const DataService = require('../../../src/services/dataService');
const Data = require('../../../src/models/Data');

// Mock the Data model
jest.mock('../../../src/models/Data');

describe('DataService', () => {
  let dataService;
  let mockRedisClient;

  beforeEach(() => {
    // Mock Redis client
    mockRedisClient = {
      isOpen: true,
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
    };

    dataService = new DataService(mockRedisClient);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Cache operations with errors', () => {
    it('should return null when Redis get fails', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await dataService.getFromCache('test-key');

      expect(result).toBeNull();
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when Redis is closed', async () => {
      mockRedisClient.isOpen = false;

      const result = await dataService.getFromCache('test-key');

      expect(result).toBeNull();
      expect(mockRedisClient.get).not.toHaveBeenCalled();
    });

    it('should return null when Redis is not available', async () => {
      dataService.redisClient = null;

      const result = await dataService.getFromCache('test-key');

      expect(result).toBeNull();
    });

    it('should return false when Redis set fails', async () => {
      mockRedisClient.set.mockRejectedValue(new Error('Redis error'));

      const result = await dataService.setInCache('test-key', { data: 'test' });

      expect(result).toBe(false);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ data: 'test' }),
        { EX: 3600 }
      );
    });

    it('should return false when Redis is closed for set', async () => {
      mockRedisClient.isOpen = false;

      const result = await dataService.setInCache('test-key', { data: 'test' });

      expect(result).toBe(false);
      expect(mockRedisClient.set).not.toHaveBeenCalled();
    });

    it('should return false when Redis is not available for set', async () => {
      dataService.redisClient = null;

      const result = await dataService.setInCache('test-key', { data: 'test' });

      expect(result).toBe(false);
    });

    it('should handle errors during cache invalidation', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Redis error'));
      mockRedisClient.keys.mockRejectedValue(new Error('Redis error'));

      // Should not throw, just log error
      await expect(dataService.invalidateCache('test-id', 'test-user')).resolves.toBeUndefined();
    });

    it('should not attempt cache operations when Redis is closed', async () => {
      mockRedisClient.isOpen = false;

      await dataService.invalidateCache('test-id', 'test-user');

      expect(mockRedisClient.del).not.toHaveBeenCalled();
      expect(mockRedisClient.keys).not.toHaveBeenCalled();
    });

    it('should not attempt cache operations when Redis is not available', async () => {
      dataService.redisClient = null;

      await dataService.invalidateCache('test-id', 'test-user');

      // Should return early without errors
    });

    it('should handle cache invalidation with only id', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await dataService.invalidateCache('test-id', null);

      expect(mockRedisClient.del).toHaveBeenCalledWith('data:test-id');
      expect(mockRedisClient.keys).not.toHaveBeenCalled();
    });

    it('should handle cache invalidation with only userId', async () => {
      mockRedisClient.keys.mockResolvedValue(['key1', 'key2', 'key3']);
      mockRedisClient.del.mockResolvedValue(3);

      await dataService.invalidateCache(null, 'test-user');

      expect(mockRedisClient.keys).toHaveBeenCalledWith('data:list:test-user:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
      expect(mockRedisClient.del).toHaveBeenCalledTimes(1);
    });

    it('should handle cache invalidation with empty keys result', async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      await dataService.invalidateCache(null, 'test-user');

      expect(mockRedisClient.keys).toHaveBeenCalledWith('data:list:test-user:*');
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });
  });

  describe('findById with cache', () => {
    it('should return null when user does not own cached data', async () => {
      const cachedData = {
        _id: 'data-id',
        userId: 'different-user',
        name: 'Test',
        content: 'test',
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await dataService.findById('data-id', 'test-user');

      expect(result).toBeNull();
      expect(mockRedisClient.get).toHaveBeenCalledWith('data:data-id');
    });
  });

  describe('list with filters', () => {
    it('should handle array tags filter', async () => {
      Data.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      Data.countDocuments = jest.fn().mockResolvedValue(0);

      await dataService.list('user-id', { tags: ['tag1', 'tag2'] }, { page: 1, limit: 10 });

      expect(Data.find).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: { $in: ['tag1', 'tag2'] },
        })
      );
    });

    it('should handle single tag filter', async () => {
      Data.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      Data.countDocuments = jest.fn().mockResolvedValue(0);

      await dataService.list('user-id', { tags: 'tag1' }, { page: 1, limit: 10 });

      expect(Data.find).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: { $in: ['tag1'] },
        })
      );
    });
  });
});
