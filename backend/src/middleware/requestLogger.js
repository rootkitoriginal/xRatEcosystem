const logger = require('../config/logger');
const { randomUUID } = require('crypto');

/**
 * Request logging middleware
 * Logs all incoming requests with request ID, method, URL, and response details
 */
const requestLogger = (req, res, next) => {
  // Generate unique request ID
  const requestId = randomUUID();
  req.requestId = requestId;

  // Capture request start time
  const startTime = Date.now();

  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;

    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Log response
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
    });

    return res.send(data);
  };

  next();
};

/**
 * Error logging middleware
 * Logs all errors with full stack trace
 */
const errorLogger = (err, req, res, next) => {
  logger.error('Request error', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    error: err.message,
    stack: err.stack,
  });

  next(err);
};

module.exports = {
  requestLogger,
  errorLogger,
};
