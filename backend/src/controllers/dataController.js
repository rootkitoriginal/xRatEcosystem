const mongoose = require('mongoose');

/**
 * Data Controller
 * Handles all data management endpoints
 */

/**
 * Create a new data entity
 * POST /api/data
 */
const createData = (dataService) => async (req, res) => {
  try {
    const userId = req.user.userId;
    const dataObj = req.validatedBody;

    const data = await dataService.create(dataObj, userId);

    res.status(201).json({
      success: true,
      message: 'Data created successfully',
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Create data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * List all data with pagination and filters
 * GET /api/data
 */
const listData = (dataService) => async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page, limit, sort, status, type, tags, search } = req.validatedQuery;

    const filters = { status, type, tags, search };
    const pagination = { page, limit, sort };

    const result = await dataService.list(userId, filters, pagination);

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('List data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get data by ID
 * GET /api/data/:id
 */
const getDataById = (dataService) => async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data ID format',
      });
    }

    const data = await dataService.findById(id, userId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data not found',
      });
    }

    res.json({
      success: true,
      data,
      source: 'cache', // Indicates if cached or from DB
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Update data by ID
 * PUT /api/data/:id
 */
const updateData = (dataService) => async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const updates = req.validatedBody;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data ID format',
      });
    }

    const data = await dataService.update(id, userId, updates);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data not found',
      });
    }

    res.json({
      success: true,
      message: 'Data updated successfully',
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Update data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Delete data by ID
 * DELETE /api/data/:id
 */
const deleteData = (dataService) => async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data ID format',
      });
    }

    const data = await dataService.delete(id, userId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data not found',
      });
    }

    res.json({
      success: true,
      message: 'Data deleted successfully',
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Delete data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Search data
 * GET /api/data/search
 */
const searchData = (dataService) => async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page, limit, sort, status, type, tags, search } = req.validatedQuery;

    if (!search) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const filters = { status, type, tags };
    const pagination = { page, limit, sort };

    const result = await dataService.search(userId, search, filters, pagination);

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
      query: search,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Search data error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Bulk operations
 * POST /api/data/bulk
 */
const bulkOperations = (dataService) => async (req, res) => {
  try {
    const userId = req.user.userId;
    const { operation, data } = req.validatedBody;

    const results = {
      success: [],
      failed: [],
    };

    if (operation === 'create') {
      for (const item of data) {
        try {
          const created = await dataService.create(item, userId);
          results.success.push({ id: created._id, data: created });
        } catch (error) {
          results.failed.push({ data: item, error: error.message });
        }
      }
    } else if (operation === 'update') {
      for (const item of data) {
        try {
          const updated = await dataService.update(item.id, userId, item.updates || {});
          if (updated) {
            results.success.push({ id: updated._id, data: updated });
          } else {
            results.failed.push({ id: item.id, error: 'Not found' });
          }
        } catch (error) {
          results.failed.push({ id: item.id, error: error.message });
        }
      }
    } else if (operation === 'delete') {
      for (const item of data) {
        try {
          const deleted = await dataService.delete(item.id, userId);
          if (deleted) {
            results.success.push({ id: deleted._id });
          } else {
            results.failed.push({ id: item.id, error: 'Not found' });
          }
        } catch (error) {
          results.failed.push({ id: item.id, error: error.message });
        }
      }
    }

    res.json({
      success: true,
      message: `Bulk ${operation} completed`,
      results,
      summary: {
        total: data.length,
        succeeded: results.success.length,
        failed: results.failed.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Bulk operation error:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk operation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Export data
 * GET /api/data/export
 */
const exportData = (dataService) => async (req, res) => {
  try {
    const userId = req.user.userId;
    const { format, status, type, tags, startDate, endDate } = req.validatedQuery;

    const filters = { status, type, tags };

    // Get all data without pagination
    const result = await dataService.list(userId, filters, { limit: 10000 });

    let filteredData = result.items;

    // Apply date filters if provided
    if (startDate || endDate) {
      filteredData = filteredData.filter((item) => {
        const createdAt = new Date(item.createdAt);
        if (startDate && createdAt < new Date(startDate)) return false;
        if (endDate && createdAt > new Date(endDate)) return false;
        return true;
      });
    }

    if (format === 'csv') {
      // Convert to CSV
      const headers = ['ID', 'Name', 'Type', 'Status', 'Tags', 'Created At', 'Updated At'];
      const rows = filteredData.map((item) => [
        item._id,
        item.name,
        item.type,
        item.status,
        item.tags.join(';'),
        item.createdAt,
        item.updatedAt,
      ]);

      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=data-export.csv');
      res.send(csv);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=data-export.json');
      res.json({
        success: true,
        data: filteredData,
        count: filteredData.length,
        exportedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Export failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get data analytics
 * GET /api/data/analytics
 */
const getAnalytics = (dataService) => async (req, res) => {
  try {
    const userId = req.user.userId;

    const analytics = await dataService.getAnalytics(userId);

    res.json({
      success: true,
      analytics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  createData,
  listData,
  getDataById,
  updateData,
  deleteData,
  searchData,
  bulkOperations,
  exportData,
  getAnalytics,
};
