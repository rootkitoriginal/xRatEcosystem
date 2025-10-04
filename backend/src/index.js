const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');
const { createClient } = require('redis');
const { createHealthRouter } = require('./health');

// Load environment variables
require('dotenv').config();

// Import logger
const logger = require('./config/logger');

// Import routes and middleware
const authRoutes = require('./auth/authRoutes');
const createDataRoutes = require('./routes/dataRoutes');
const DataService = require('./services/dataService');
const dataController = require('./controllers/dataController');
const { apiLimiter } = require('./middleware/rateLimiter');
const { requestLogger, errorLogger } = require('./middleware/requestLogger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(requestLogger);

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info('MongoDB connected successfully', { service: 'mongodb' });
  })
  .catch((err) => {
    logger.error('MongoDB connection error', { service: 'mongodb', error: err.message });
  });

// Redis Connection
let redisClient;

(async () => {
  try {
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'redis',
        port: process.env.REDIS_PORT || 6379,
      },
      password: process.env.REDIS_PASSWORD,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error', { service: 'redis', error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully', { service: 'redis' });
    });

    await redisClient.connect();

    // Initialize data service after Redis connection
    const dataService = new DataService(redisClient);
    const dataRoutes = createDataRoutes(dataService, dataController);

    // Data Management Routes (protected)
    app.use('/api/data', dataRoutes);
  } catch (err) {
    logger.error('Redis connection error', { service: 'redis', error: err.message });
  }
})();

// Health check endpoints
app.use('/health', createHealthRouter(mongoose.connection.getClient(), redisClient));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to xRat Ecosystem API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      data: '/api/data',
    },
  });
});

// Auth Routes (public)
app.use('/api/auth', authRoutes);

// API Routes
// Apply general rate limiting to API routes
app.use('/api', apiLimiter);
app.get('/api/status', async (req, res) => {
  try {
    // Test MongoDB
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    // Test Redis
    let redisStatus = 'disconnected';
    let cacheTest = null;

    if (redisClient && redisClient.isOpen) {
      await redisClient.set('test_key', 'xRat Ecosystem is running!');
      cacheTest = await redisClient.get('test_key');
      redisStatus = 'connected';
    }

    res.json({
      success: true,
      ecosystem: 'xRat',
      database: {
        mongodb: dbStatus,
        redis: redisStatus,
      },
      cache_test: cacheTest,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
  });
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error logging middleware
app.use(errorLogger);

// Error handler
app.use((err, req, res, _next) => {
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info('xRat Backend server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    healthCheckUrl: `http://localhost:${PORT}/health`,
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');

  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }

  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
  process.exit(0);
});
