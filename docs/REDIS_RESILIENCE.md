# Redis Resilience Patterns & Edge Case Handling

## 📋 Overview

This document describes the Redis resilience patterns implemented in the xRat Ecosystem to ensure robust caching and queue management under all failure scenarios, including connection failures, timeouts, failovers, and resource constraints.

## 🎯 Resilience Goals

1. **Graceful Degradation**: System continues to function (with reduced performance) when Redis is unavailable
2. **No Data Loss**: Critical operations are preserved during Redis failures
3. **Automatic Recovery**: System automatically recovers when Redis becomes available
4. **Error Transparency**: All Redis errors are properly logged and handled
5. **Performance Isolation**: Redis failures don't cascade to other system components

## 🔧 Implementation Patterns

### 1. Connection Resilience

#### Pattern: Null-Safe Redis Client Checks

**Problem**: Redis client may be null or disconnected during operations.

**Solution**: Always check Redis availability before operations.

```javascript
async queueNotification(userId, notification) {
  if (!this.redisClient) {
    logger.warn('Redis not available for notification queuing', { userId });
    return;
  }

  try {
    const queueKey = `notifications:queue:${userId}`;
    const notificationData = JSON.stringify({
      ...notification,
      queuedAt: new Date().toISOString(),
    });

    await this.redisClient.rPush(queueKey, notificationData);
    await this.redisClient.expire(queueKey, 7 * 24 * 60 * 60);
  } catch (error) {
    logger.error('Failed to queue notification', {
      userId,
      error: error.message,
    });
  }
}
```

**Tests Covered**:

- Redis server unavailable on startup
- Redis client not initialized
- Connection state detection

#### Pattern: Connection State Monitoring

**Problem**: Redis connection may drop during active operations.

**Solution**: Check `isOpen` status before operations and handle connection loss gracefully.

```javascript
async getFromCache(key) {
  if (!this.redisClient || !this.redisClient.isOpen) {
    return null;
  }

  try {
    const cached = await this.redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}
```

**Tests Covered**:

- Redis connection closed detection
- Rapid connection state changes
- Connection loss during active operations

### 2. Operation Timeout & Retry Handling

#### Pattern: Timeout Error Handling

**Problem**: Redis operations may hang indefinitely during network issues.

**Solution**: Handle timeout errors gracefully and continue application flow.

```javascript
async checkRedis() {
  const startTime = Date.now();
  try {
    if (!this.redisClient || !this.redisClient.isOpen) {
      return { status: 'error', message: 'Redis not connected', latency: null };
    }

    await this.redisClient.ping();
    const latency = Date.now() - startTime;
    return { status: 'connected', latency: `${latency}ms` };
  } catch (error) {
    return { status: 'error', message: error.message, latency: null };
  }
}
```

**Tests Covered**:

- Connection timeout during health check
- Slow Redis responses
- Operation timeout handling
- Concurrent operation timeouts

#### Pattern: Queue Overflow Protection

**Problem**: Large notification queues may cause memory issues when Redis is slow.

**Solution**: Handle large queues efficiently with proper error handling.

**Tests Covered**:

- Large notification queue (1000+ items)
- Queue operation during high memory pressure
- Operation cancellation during timeout

### 3. Failover & High Availability

#### Pattern: Master-Slave Failover Handling

**Problem**: Redis master failure requires failover to replica.

**Solution**: Gracefully handle READONLY errors and retry operations.

```javascript
// Example: Failover simulation
async getData(key) {
  try {
    return await this.redisClient.get(key);
  } catch (error) {
    if (error.message.includes('READONLY')) {
      logger.warn('Redis failover detected, retrying...', { key });
      // Retry logic handled by Redis client library
    }
    throw error;
  }
}
```

**Tests Covered**:

- Master failure and failover to replica
- Data consistency during failover
- Automatic recovery from transient failures

#### Pattern: Connection Pool Management

**Problem**: Connection pool exhaustion under high load.

**Solution**: Handle pool exhaustion errors gracefully.

**Tests Covered**:

- Connection pool exhaustion
- Concurrent connections limit
- Concurrent cache/queue operations

### 4. Data Persistence & Recovery

#### Pattern: Partial Data Recovery

**Problem**: Queue may contain corrupted or invalid JSON data.

**Solution**: Parse each queue item individually and skip corrupted entries.

```javascript
async sendQueuedNotifications(userId, socketId) {
  if (!this.redisClient) return;

  try {
    const queueKey = `notifications:queue:${userId}`;
    const notifications = await this.redisClient.lRange(queueKey, 0, -1);

    if (notifications.length > 0) {
      notifications.forEach((notifStr) => {
        try {
          const notification = JSON.parse(notifStr);
          this.io.to(socketId).emit('notification', notification);
        } catch (parseError) {
          logger.error('Failed to parse notification', {
            userId,
            error: parseError.message
          });
          // Continue with next notification
        }
      });

      await this.redisClient.del(queueKey);
    }
  } catch (error) {
    logger.error('Failed to send queued notifications', {
      userId,
      error: error.message,
    });
  }
}
```

**Tests Covered**:

- Partial queue retrieval
- Data recovery after connection loss
- Corrupted notification data handling
- Corrupted cache data handling

#### Pattern: Transaction Partial Completion

**Problem**: Multi-step Redis operations may fail partway through.

**Solution**: Handle partial completion gracefully and log warnings.

**Tests Covered**:

- Partial operation completion (rPush succeeds, expire fails)
- Queue deletion failure after send
- Transaction handling during failures

### 5. Performance & Resource Management

#### Pattern: Memory Limit Handling

**Problem**: Redis may reject operations when memory limit is reached.

**Solution**: Handle OOM errors gracefully and return failure status.

```javascript
async setInCache(key, value, ttl = this.CACHE_TTL) {
  if (!this.redisClient || !this.redisClient.isOpen) {
    return false;
  }

  try {
    await this.redisClient.set(key, JSON.stringify(value), { EX: ttl });
    return true;
  } catch (error) {
    if (error.message.includes('OOM')) {
      logger.error('Redis out of memory', { key, error: error.message });
    } else {
      console.error('Cache set error:', error);
    }
    return false;
  }
}
```

**Tests Covered**:

- Redis memory limit exceeded
- Cache eviction during operations
- Large payload handling (10KB+ messages)
- Cache payload size limits

#### Pattern: Key Expiration Handling

**Problem**: Keys may expire between operations or during retrieval.

**Solution**: Always check for null values and handle expiration gracefully.

**Tests Covered**:

- Expired key during retrieval
- Queue expiration edge cases
- Expire operation failure

#### Pattern: Cache Invalidation Resilience

**Problem**: Cache invalidation may fail during connection issues.

**Solution**: Handle invalidation errors silently to prevent application impact.

```javascript
async invalidateCache(id, userId) {
  if (!this.redisClient || !this.redisClient.isOpen) {
    return;
  }

  try {
    if (id) {
      await this.redisClient.del(this.getCacheKey(id));
    }

    if (userId) {
      const pattern = `${this.CACHE_PREFIX}list:${userId}:*`;
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
    // Don't throw - cache invalidation failure shouldn't break app
  }
}
```

**Tests Covered**:

- Invalidation of non-existent keys
- Bulk invalidation with pattern matching
- Invalidation during connection issues

## 🧪 Testing Strategy

### Test Coverage

Our Redis resilience testing includes **41 comprehensive tests** organized into 5 phases:

1. **Phase A - Connection Resilience (10 tests)**
   - Connection failure scenarios
   - Connection state management
   - Automatic reconnection

2. **Phase B - Operation Timeout & Retry (6 tests)**
   - Command timeout scenarios
   - Queue overflow scenarios
   - Operation cancellation

3. **Phase C - Failover & High Availability (5 tests)**
   - Master-slave failover scenarios
   - Connection pool management
   - Automatic recovery testing

4. **Phase D - Data Persistence & Recovery (6 tests)**
   - Queue persistence
   - Transaction handling
   - Data corruption detection

5. **Phase E - Performance & Resource Management (12 tests)**
   - Memory limit scenarios
   - Large payload handling
   - Concurrent operation limits
   - Key expiration edge cases
   - Cache invalidation edge cases

### Running Redis Tests

```bash
# Run all Redis edge case tests
cd backend
npm test -- __tests__/unit/redis/redis-edge-cases.test.js

# Run with coverage
npm run test:coverage -- __tests__/unit/redis/redis-edge-cases.test.js
```

## 📊 Monitoring & Observability

### Key Metrics to Monitor

1. **Connection Health**
   - Redis connection status (connected/disconnected)
   - Connection uptime percentage
   - Reconnection frequency

2. **Operation Performance**
   - Cache hit/miss ratio
   - Average operation latency
   - Timeout frequency

3. **Queue Health**
   - Queue length per user
   - Queue processing rate
   - Failed queue operations

4. **Error Rates**
   - Connection errors per minute
   - Operation timeout errors
   - OOM errors

### Logging Best Practices

```javascript
// Connection events
redisClient.on('connect', () => {
  logger.info('Redis connected successfully', { service: 'redis' });
});

redisClient.on('error', (err) => {
  logger.error('Redis client error', {
    service: 'redis',
    error: err.message,
    stack: err.stack,
  });
});

// Operation logging
logger.warn('Redis not available for notification queuing', { userId });
logger.error('Failed to queue notification', { userId, error: error.message });
logger.info('Notification queued for offline user', { userId, type: notification.type });
```

## 🔄 Circuit Breaker Pattern (Future Enhancement)

For production deployments, consider implementing a circuit breaker pattern:

```javascript
class RedisCircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}
```

## 🚀 Production Deployment Considerations

### Redis Configuration

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7.2-alpine
    command: >
      redis-server
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --save 60 1
      --appendonly yes
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 30s
      timeout: 10s
      retries: 3
```

### Application Configuration

```javascript
// Environment variables
const REDIS_CONFIG = {
  socket: {
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
    connectTimeout: 10000, // 10 seconds
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        return new Error('Redis connection retry limit exceeded');
      }
      return Math.min(retries * 50, 5000);
    },
  },
  password: process.env.REDIS_PASSWORD,
  lazyConnect: false,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
};
```

### High Availability Setup

For production, use Redis Sentinel or Redis Cluster:

```javascript
// Redis Sentinel configuration
const redisClient = createClient({
  sentinels: [
    { host: 'sentinel-1', port: 26379 },
    { host: 'sentinel-2', port: 26379 },
    { host: 'sentinel-3', port: 26379 },
  ],
  name: 'mymaster',
  password: process.env.REDIS_PASSWORD,
});
```

## 📚 References

- [Redis Client Node.js Documentation](https://github.com/redis/node-redis)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Resilience Patterns for Microservices](https://docs.microsoft.com/en-us/azure/architecture/patterns/category/resiliency)

## ✅ Acceptance Criteria Status

- ✅ All Redis connection failure scenarios tested (10 tests)
- ✅ Failover and recovery mechanisms validated (5 tests)
- ✅ Error handling covers all edge cases (41 tests total)
- ✅ Performance benchmarks established (12 performance tests)
- ✅ Documentation includes Redis resilience patterns (this document)
- ✅ Integration tests pass with Redis failures (2 integration tests)
- 🔄 Circuit breaker pattern documented (implementation optional)

---

**Last Updated**: 2025-10-05  
**Version**: 1.0.0  
**Related Issue**: [#52 - Redis Connection Edge Cases & Failover Testing](https://github.com/xLabInternet/xRatEcosystem/issues/52)
