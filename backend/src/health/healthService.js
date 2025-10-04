/**
 * Health Check Service
 * Provides comprehensive health monitoring for all system components
 */
class HealthService {
  constructor(mongoClient, redisClient) {
    this.mongoClient = mongoClient;
    this.redisClient = redisClient;
  }

  /**
   * Basic health check - minimal resource usage
   * @returns {Object} Basic health status
   */
  async getBasicHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'xRat Backend',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor(process.uptime())
    };
  }

  /**
   * MongoDB connectivity check with latency measurement
   * @returns {Object} MongoDB health status
   */
  async checkMongoDB() {
    const startTime = Date.now();
    
    try {
      if (!this.mongoClient) {
        return {
          status: 'error',
          message: 'MongoDB client not initialized',
          latency: null
        };
      }

      // Check connection state
      const topology = this.mongoClient.topology;
      if (!topology || !topology.isConnected()) {
        return {
          status: 'error',
          message: 'MongoDB not connected',
          latency: null
        };
      }

      // Perform a lightweight ping operation
      const admin = this.mongoClient.db().admin();
      await admin.ping();
      
      const latency = Date.now() - startTime;
      
      return {
        status: 'connected',
        latency: `${latency}ms`,
        database: this.mongoClient.db().databaseName
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        latency: null
      };
    }
  }

  /**
   * Redis connectivity check with latency measurement
   * @returns {Object} Redis health status
   */
  async checkRedis() {
    const startTime = Date.now();
    
    try {
      if (!this.redisClient) {
        return {
          status: 'error',
          message: 'Redis client not initialized',
          latency: null
        };
      }

      // Check connection state
      if (!this.redisClient.isOpen) {
        return {
          status: 'error',
          message: 'Redis not connected',
          latency: null
        };
      }

      // Perform a lightweight ping operation
      await this.redisClient.ping();
      
      const latency = Date.now() - startTime;
      
      return {
        status: 'connected',
        latency: `${latency}ms`
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        latency: null
      };
    }
  }

  /**
   * Readiness check - all services must be healthy
   * Used by container orchestrators to determine if pod is ready for traffic
   * @returns {Object} Readiness status with service details
   */
  async getReadinessCheck() {
    const [basicHealth, mongoHealth, redisHealth] = await Promise.all([
      this.getBasicHealth(),
      this.checkMongoDB(),
      this.checkRedis()
    ]);

    const services = {
      mongodb: mongoHealth,
      redis: redisHealth
    };

    // Determine overall status
    const allServicesHealthy = Object.values(services).every(
      service => service.status === 'connected'
    );

    return {
      ...basicHealth,
      status: allServicesHealthy ? 'ready' : 'not_ready',
      services,
      ready: allServicesHealthy
    };
  }

  /**
   * Liveness check - basic application health
   * Used by container orchestrators to determine if pod should be restarted
   * @returns {Object} Liveness status
   */
  async getLivenessCheck() {
    const basicHealth = await this.getBasicHealth();
    
    // Check critical application state
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Memory threshold check (alert if over 98% of max heap)
    const memoryThreshold = 0.98;
    const maxHeapSize = memoryUsage.heapTotal;
    const currentHeapUsed = memoryUsage.heapUsed;
    const memoryUtilization = currentHeapUsed / maxHeapSize;
    
    const isMemoryHealthy = memoryUtilization < memoryThreshold;
    
    return {
      ...basicHealth,
      status: isMemoryHealthy ? 'alive' : 'unhealthy',
      alive: isMemoryHealthy,
      metrics: {
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          utilization: Math.round(memoryUtilization * 100) // percentage
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
    const memoryUtilization = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    const isMemoryHealthy = memoryUtilization < 98;
  }

  /**
   * Comprehensive health check combining all checks
   * @returns {Object} Complete health status
   */
  async getCompleteHealth() {
    const [readiness, liveness] = await Promise.all([
      this.getReadinessCheck(),
      this.getLivenessCheck()
    ]);

    return {
      timestamp: new Date().toISOString(),
      service: 'xRat Backend',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.floor(process.uptime()),
      status: readiness.ready && liveness.alive ? 'healthy' : 'unhealthy',
      readiness: {
        ready: readiness.ready,
        services: readiness.services
      },
      liveness: {
        alive: liveness.alive,
        metrics: liveness.metrics
      }
    };
  }
}

module.exports = HealthService;
