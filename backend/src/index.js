const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');
const { createClient } = require('redis');
const { createHealthRouter } = require('./health');
const swaggerUi = require('swagger-ui-express');
const YAML = require('js-yaml');
const fs = require('fs');
const path = require('path');
const { SocketService } = require('./websocket');

// Load environment variables
require('dotenv').config();

// Import logger
const logger = require('./config/logger');

// Import routes and middleware
const authRoutes = require('./auth/authRoutes');
const createDataRoutes = require('./routes/dataRoutes');
const userRoutes = require('./routes/userRoutes');
const DataService = require('./services/dataService');
const dataController = require('./controllers/dataController');
const { apiLimiter } = require('./middleware/rateLimiter');
const { requestLogger, errorLogger } = require('./middleware/requestLogger');

// Load OpenAPI specification
const openApiPath = path.join(__dirname, 'openapi.yaml');
const openApiSpec = YAML.load(fs.readFileSync(openApiPath, 'utf8'));

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Trust proxy - we're behind nginx
app.set('trust proxy', 1);

// WebSocket service will be initialized after Redis connection
let socketService;

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
    app.use('/api/v1/data', dataRoutes);

    // Initialize WebSocket service
    socketService = new SocketService(server, redisClient);
    logger.info('WebSocket service initialized and ready');
  } catch (err) {
    logger.error('Redis connection error', { service: 'redis', error: err.message });
  }
})();

// Health check endpoints
app.use('/api/v1/health', createHealthRouter(mongoose.connection.getClient(), redisClient));

// Legacy health check endpoint for compatibility (Docker healthchecks, etc.)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API Documentation with Swagger UI
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'xRat Ecosystem API Documentation',
  })
);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to xRat Ecosystem API',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      api: '/api/v1',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      docs: '/api-docs',
      data: '/api/v1/data',
      websocket: 'ws://localhost:' + PORT,
    },
  });
});

// Auth Routes (public)
app.use('/api/v1/auth', authRoutes);

// User Routes (protected)
app.use('/api/v1/users', userRoutes);

// API Routes
// Apply general rate limiting to API routes
app.use('/api/v1', apiLimiter);

// WebSocket stats endpoint
app.get('/api/v1/websocket/stats', (req, res) => {
  if (!socketService) {
    return res.status(503).json({
      success: false,
      message: 'WebSocket service not initialized',
    });
  }

  const stats = socketService.getStats();
  res.json({
    success: true,
    stats,
  });
});

// Status endpoint
app.get('/api/v1/status', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
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
server.listen(PORT, '0.0.0.0', () => {
  logger.info('xRat Backend server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    healthCheckUrl: `http://localhost:${PORT}/health`,
    apiDocsUrl: `http://localhost:${PORT}/api-docs`,
    websocketUrl: `ws://localhost:${PORT}`,
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');

  if (socketService) {
    await socketService.shutdown();
    logger.info('WebSocket service closed');
  }

  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }

  await mongoose.connection.close();
  logger.info('MongoDB connection closed');

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Export socketService for use in other modules
module.exports = { app, server, socketService: () => socketService };
