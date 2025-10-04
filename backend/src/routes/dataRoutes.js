const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const {
  validate,
  validateQuery,
  createDataSchema,
  updateDataSchema,
  queryParamsSchema,
  bulkOperationSchema,
  exportParamsSchema,
} = require('../utils/validation');

/**
 * Data Management Routes
 * All routes are protected and require authentication
 */

/**
 * Create data routes with dependency injection for dataService
 */
const createDataRoutes = (dataService, dataController) => {
  /**
   * @route   GET /api/data/analytics
   * @desc    Get data analytics
   * @access  Protected
   */
  router.get('/analytics', authenticate, dataController.getAnalytics(dataService));

  /**
   * @route   GET /api/data/export
   * @desc    Export data (JSON/CSV)
   * @access  Protected
   */
  router.get(
    '/export',
    authenticate,
    validateQuery(exportParamsSchema),
    dataController.exportData(dataService)
  );

  /**
   * @route   GET /api/data/search
   * @desc    Search data with filters
   * @access  Protected
   */
  router.get(
    '/search',
    authenticate,
    validateQuery(queryParamsSchema),
    dataController.searchData(dataService)
  );

  /**
   * @route   POST /api/data/bulk
   * @desc    Bulk operations (create/update/delete)
   * @access  Protected
   */
  router.post(
    '/bulk',
    authenticate,
    apiLimiter,
    validate(bulkOperationSchema),
    dataController.bulkOperations(dataService)
  );

  /**
   * @route   GET /api/data
   * @desc    List all data with pagination
   * @access  Protected
   */
  router.get(
    '/',
    authenticate,
    validateQuery(queryParamsSchema),
    dataController.listData(dataService)
  );

  /**
   * @route   POST /api/data
   * @desc    Create new data
   * @access  Protected
   */
  router.post(
    '/',
    authenticate,
    apiLimiter,
    validate(createDataSchema),
    dataController.createData(dataService)
  );

  /**
   * @route   GET /api/data/:id
   * @desc    Get data by ID
   * @access  Protected
   */
  router.get('/:id', authenticate, dataController.getDataById(dataService));

  /**
   * @route   PUT /api/data/:id
   * @desc    Update data by ID
   * @access  Protected
   */
  router.put(
    '/:id',
    authenticate,
    apiLimiter,
    validate(updateDataSchema),
    dataController.updateData(dataService)
  );

  /**
   * @route   DELETE /api/data/:id
   * @desc    Delete data by ID
   * @access  Protected
   */
  router.delete('/:id', authenticate, apiLimiter, dataController.deleteData(dataService));

  return router;
};

module.exports = createDataRoutes;
