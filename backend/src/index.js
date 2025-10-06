const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');
const { createClient } = require('redis');
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
const createDataRoutes = require('./routes/dataRoutes');
const DataService = require('./services/dataService');
const dataController = require('./controllers/dataController');
const { requestLogger, errorLogger } = require('./middleware/requestLogger');

// Import API version management
const { setupVersionRouting } = require('./api/versionManager');
const { initV1Routes } = require('./api/v1');
const { initV2Routes } = require('./api/v2');

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

// Initialize application
async function initializeApp() {
  let redisClient = null;

  try {
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'redis',
        port: process.env.REDIS_PORT || 6379,
        connectTimeout: 5000,
      },
      password: process.env.REDIS_PASSWORD,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error', { service: 'redis', error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully', { service: 'redis' });
    });

    // Attempt connection with timeout
    const connectWithTimeout = Promise.race([
      redisClient.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis connection timeout after 5s')), 5000)
      ),
    ]);

    await connectWithTimeout;

    // Initialize data service after Redis connection
    const dataService = new DataService(redisClient);
    const dataRoutes = createDataRoutes(dataService, dataController);

    // Initialize WebSocket service
    socketService = new SocketService(server, redisClient);
    logger.info('WebSocket service initialized and ready');

    // Initialize version routers after all dependencies are ready
    const v1Router = initV1Routes({
      mongoose,
      redisClient,
      dataRoutes,
      socketService,
    });

    const v2Router = initV2Routes({
      mongoose,
      redisClient,
      dataRoutes,
      socketService,
    });

    // Setup API versioning
    setupVersionRouting(app, {
      v1: v1Router,
      v2: v2Router,
    });

    logger.info('API version routing initialized with Redis');
  } catch (err) {
    logger.error('Redis connection error', { service: 'redis', error: err.message });

    // Initialize in degraded mode without Redis
    logger.warn('Initializing API routes without Redis (degraded mode)');

    const v1Router = initV1Routes({
      mongoose,
      redisClient: null,
      dataRoutes: null,
      socketService: null,
    });

    const v2Router = initV2Routes({
      mongoose,
      redisClient: null,
      dataRoutes: null,
      socketService: null,
    });

    setupVersionRouting(app, {
      v1: v1Router,
      v2: v2Router,
    });

    logger.info('API version routing initialized (degraded mode)');
  }
}

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
    apiVersions: {
      current: 'v1',
      available: ['v1', 'v2'],
      versionInfo: '/api/versions',
    },
    endpoints: {
      health: '/api/v1/health',
      apiV1: '/api/v1',
      apiV2: '/api/v2',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      docs: '/api-docs',
      data: '/api/v1/data',
      websocket: 'ws://localhost:' + PORT,
    },
  });
});

// Start server after initializing routes
(async () => {
  await initializeApp();

  // 404 handler - MUST be registered AFTER all routes
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

  server.listen(PORT, '0.0.0.0', () => {
    logger.info('xRat Backend server started', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      healthCheckUrl: `http://localhost:${PORT}/health`,
      apiDocsUrl: `http://localhost:${PORT}/api-docs`,
      websocketUrl: `ws://localhost:${PORT}`,
    });
  });
})();

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
