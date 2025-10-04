const express = require('express');
const HealthService = require('./healthService');

/**
 * Health Check Router
 * Provides health monitoring endpoints for container orchestration
 */
function createHealthRouter(mongoClient, redisClient) {
  const router = express.Router();
  const healthService = new HealthService(mongoClient, redisClient);

  /**
   * GET /health
   * Basic health check endpoint
   * Returns: 200 if service is running
   */
  router.get('/', async (req, res) => {
    try {
      const health = await healthService.getBasicHealth();
      res.status(200).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        message: error.message
      });
    }
  });

  /**
   * GET /health/ready
   * Readiness probe endpoint
   * Returns: 200 if ready to receive traffic, 503 if not ready
   */
  router.get('/ready', async (req, res) => {
    try {
      const readiness = await healthService.getReadinessCheck();
      const statusCode = readiness.ready ? 200 : 503;
      res.status(statusCode).json(readiness);
    } catch (error) {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        ready: false,
        message: error.message
      });
    }
  });

  /**
   * GET /health/live
   * Liveness probe endpoint
   * Returns: 200 if application is alive, 503 if unhealthy
   */
  router.get('/live', async (req, res) => {
    try {
      const liveness = await healthService.getLivenessCheck();
      const statusCode = liveness.alive ? 200 : 503;
      res.status(statusCode).json(liveness);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        alive: false,
        message: error.message
      });
    }
  });

  /**
   * GET /health/complete
   * Comprehensive health check endpoint
   * Returns: Complete system health status
   */
  router.get('/complete', async (req, res) => {
    try {
      const completeHealth = await healthService.getCompleteHealth();
      const statusCode = completeHealth.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(completeHealth);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        message: error.message
      });
    }
  });

  return router;
}

module.exports = createHealthRouter;
