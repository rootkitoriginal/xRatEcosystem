const Data = require('../models/Data');

/**
 * Data Service
 * Handles business logic and caching for data operations
 */
class DataService {
  constructor(redisClient) {
    this.redisClient = redisClient;
    this.CACHE_TTL = 3600; // 1 hour
    this.CACHE_PREFIX = 'data:';
  }

  /**
   * Get cache key for data
   */
  getCacheKey(id) {
    return `${this.CACHE_PREFIX}${id}`;
  }

  /**
   * Get list cache key for user
   */
  getListCacheKey(userId, filters) {
    return `${this.CACHE_PREFIX}list:${userId}:${JSON.stringify(filters)}`;
  }

  /**
   * Get from cache
   */
  async getFromCache(key) {
    if (!this.redisClient || !this.redisClient.isOpen) {
      return null;
    }

    try {
      const cached = await this.redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set in cache
   */
  async setInCache(key, value, ttl = this.CACHE_TTL) {
    if (!this.redisClient || !this.redisClient.isOpen) {
      return false;
    }

    try {
      await this.redisClient.set(key, JSON.stringify(value), {
        EX: ttl,
      });
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Invalidate cache
   */
  async invalidateCache(id, userId) {
    if (!this.redisClient || !this.redisClient.isOpen) {
      return;
    }

    try {
      // Delete specific item cache
      if (id) {
        await this.redisClient.del(this.getCacheKey(id));
      }

      // Delete list caches for user
      if (userId) {
        const pattern = `${this.CACHE_PREFIX}list:${userId}:*`;
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Create new data entity
   */
  async create(dataObj, userId) {
    const data = new Data({
      ...dataObj,
      userId,
    });

    await data.save();

    // Invalidate list cache for user
    await this.invalidateCache(null, userId);

    return data;
  }

  /**
   * Find by ID with caching
   */
  async findById(id, userId) {
    // Try cache first
    const cacheKey = this.getCacheKey(id);
    const cached = await this.getFromCache(cacheKey);

    if (cached) {
      // Verify ownership
      if (cached.userId.toString() !== userId.toString()) {
        return null;
      }
      return cached;
    }

    // Query database
    const data = await Data.findOne({ _id: id, userId });

    if (data) {
      // Cache the result
      await this.setInCache(cacheKey, data);
    }

    return data;
  }

  /**
   * List data with pagination and filters
   */
  async list(userId, filters = {}, pagination = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = pagination;

    // Build query
    const query = { userId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: Array.isArray(filters.tags) ? filters.tags : [filters.tags] };
    }

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [items, total] = await Promise.all([
      Data.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Data.countDocuments(query),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update data by ID
   */
  async update(id, userId, updates) {
    const data = await Data.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (data) {
      // Invalidate cache
      await this.invalidateCache(id, userId);
    }

    return data;
  }

  /**
   * Delete data by ID
   */
  async delete(id, userId) {
    const data = await Data.findOneAndDelete({ _id: id, userId });

    if (data) {
      // Invalidate cache
      await this.invalidateCache(id, userId);
    }

    return data;
  }

  /**
   * Search data
   */
  async search(userId, searchTerm, filters = {}, pagination = {}) {
    return this.list(
      userId,
      {
        ...filters,
        search: searchTerm,
      },
      pagination
    );
  }

  /**
   * Get analytics
   */
  async getAnalytics(userId) {
    const [total, byType, byStatus, recentCount] = await Promise.all([
      Data.countDocuments({ userId }),
      Data.aggregate([
        { $match: { userId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Data.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Data.countDocuments({
        userId,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    return {
      total,
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentCount,
    };
  }
}

module.exports = DataService;
