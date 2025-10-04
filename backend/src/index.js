const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');
const { createClient } = require('redis');
const { createHealthRouter } = require('./health');

// Load environment variables
require('dotenv').config();

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

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
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
      console.error('❌ Redis Client Error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    await redisClient.connect();
  } catch (err) {
    console.error('❌ Redis connection error:', err.message);
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
    },
  });
});

// API Routes
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

// Sample API endpoint with MongoDB and Redis
app.post('/api/data', async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || !value) {
      return res.status(400).json({
        success: false,
        message: 'Key and value are required',
      });
    }

    // Store in Redis cache
    if (redisClient && redisClient.isOpen) {
      await redisClient.set(`data:${key}`, JSON.stringify(value), {
        EX: 3600, // Expire in 1 hour
      });
    }

    res.json({
      success: true,
      message: 'Data stored successfully',
      key,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/data/:key', async (req, res) => {
  try {
    const { key } = req.params;

    // Get from Redis cache
    if (redisClient && redisClient.isOpen) {
      const cachedData = await redisClient.get(`data:${key}`);
      if (cachedData) {
        return res.json({
          success: true,
          data: JSON.parse(cachedData),
          source: 'cache',
        });
      }
    }

    res.status(404).json({
      success: false,
      message: 'Data not found',
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
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 xRat Backend running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  if (redisClient) {
    await redisClient.quit();
  }
  await mongoose.connection.close();
  process.exit(0);
});
