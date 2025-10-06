/**
 * API Version 1 Router
 *
 * Aggregates all v1 routes and exports them as a single router.
 * This keeps the main index.js clean and makes version management easier.
 */

const express = require('express');
const router = express.Router();

// Import existing route modules
const authRoutes = require('../../auth/authRoutes');
const userRoutes = require('../../routes/userRoutes');
const { createHealthRouter } = require('../../health');

// Import rate limiters
const { apiLimiter } = require('../../middleware/rateLimiter');

/**
 * Initialize v1 routes
 * @param {Object} deps - Dependencies object
 * @param {Object} deps.mongoose - Mongoose connection
 * @param {Object} deps.redisClient - Redis client
 * @param {Object} deps.dataRoutes - Data routes (initialized with DataService)
 * @returns {Router} Express router with all v1 routes
 */
function initV1Routes(deps) {
  const { mongoose, redisClient, dataRoutes } = deps;

  // Health check - depends on Redis and Mongoose
  const healthRouter = createHealthRouter({ redisClient, mongoose });
  router.use('/health', healthRouter);

  // API v1 Status endpoint
  router.get('/status', (req, res) => {
    res.json({
      status: 'ok',
      version: 'v1',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Auth routes - Authentication endpoints
  router.use('/auth', apiLimiter, authRoutes);

  // User routes - User management endpoints
  router.use('/users', apiLimiter, userRoutes);

  // Data routes - only mount if available (requires Redis)
  if (dataRoutes) {
    router.use('/data', apiLimiter, dataRoutes);
  }

  return router;
}

module.exports = { initV1Routes };
