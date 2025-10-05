# WebSocket Testing Guide

## Overview

This document provides comprehensive guidance on testing the xRat Ecosystem WebSocket implementation, covering unit tests, integration tests, and advanced testing patterns.

**📊 For performance and stress testing, see**: [WebSocket Performance Testing Guide](./WEBSOCKET_PERFORMANCE_TESTING.md)

## Test Coverage Summary

### Current Coverage Metrics

| Metric | Coverage | Target | Status |
|--------|----------|--------|--------|
| **Statements** | 93.77% | 90% | ✅ EXCEEDS |
| **Branches** | 91.04% | 90% | ✅ EXCEEDS |
| **Functions** | 76.66% | 90% | 🟡 In Progress |
| **Lines** | 96.55% | 90% | ✅ EXCEEDS |

**Total Tests**: 150 (140 unit + 10 integration)

### Module-Level Coverage

- **socketService.js**: 93.77% statements, 91.04% branches, 96.55% lines
- **validators.js**: 100% statements, 96% branches, 100% lines
- **authorization.js**: 97.14% statements, 90.38% branches, 97.14% lines

## Test Structure

### Unit Tests

Located in: `backend/__tests__/unit/websocket/socketService.test.js`

#### Test Categories

1. **Initialization Tests** (2 tests)
   - Server initialization with HTTP and Redis
   - Connection map initialization

2. **Room Management** (3 tests)
   - Room name building with filters
   - Room name consistency

3. **Statistics** (2 tests)
   - Connection statistics
   - User tracking

4. **Shutdown** (1 test)
   - Graceful shutdown procedures

5. **Connection Management** (3 tests)
   - User connection tracking
   - Multiple connections per user
   - Disconnection handling

6. **Event Handlers** (55+ tests)
   - `handleDataSubscribe`: Validation, authorization, rate limiting
   - `handleNotificationRead`: Validation, rate limiting, acknowledgment
   - `handleUserTyping`: Validation, room membership, rate limiting
   - `handleRoomJoin`: Validation, authorization, rate limiting
   - `handleRoomLeave`: Validation, cleanup, notifications
   - `sendQueuedNotifications`: Redis integration, error handling

7. **Broadcasting & Notifications** (20+ tests)
   - `broadcastDataUpdate`: Authorization checks, sanitization
   - `sendNotificationToUser`: Multiple connections, offline queueing
   - `broadcastUserStatus`: Status changes (online/offline/custom)
   - `broadcastSystemHealth`: Metrics broadcasting
   - `queueNotification`: Redis queueing, error handling

8. **Rate Limiting** (3 tests)
   - 100 requests/minute enforcement
   - Rate limit reset after window
   - Per-socket independent tracking

9. **Connection Pool** (2 tests)
   - Multiple sockets per user
   - Graceful cleanup on disconnection

### Integration Tests

Located in: `backend/__tests__/integration/websocket-auth.test.js`

#### Test Categories

1. **Connection Authentication** (7 tests)
   - Missing token rejection
   - Invalid token handling
   - Malformed JWT tokens
   - Token with special characters (XSS attempts)
   - Very long token handling (10000+ chars)
   - Empty token rejection
   - Invalid signature detection

2. **Connection Management** (1 test)
   - User tracking with real connections

3. **Error Handling** (2 tests)
   - Database errors during authentication
   - Invalid token signature verification

## Running Tests

### Run All WebSocket Tests

```bash
cd backend
npm test -- --testPathPatterns="websocket"
```

### Run with Coverage

```bash
npm test -- --coverage --testPathPatterns="websocket"
```

### Run Unit Tests Only

```bash
npm test -- --testPathPatterns="unit/websocket"
```

### Run Integration Tests Only

```bash
npm test -- --testPathPatterns="integration/websocket-auth"
```

### Run Tests Sequentially (for debugging)

```bash
npm test -- --testPathPatterns="websocket" --runInBand
```

## Testing Patterns

### 1. Authentication Testing

#### Mock Setup

```javascript
// Mock User model
jest.mock('../../../src/models/User', () => ({
  findById: jest.fn(),
}));

// Mock validators
jest.mock('../../../src/websocket/validators', () => ({
  validateEvent: jest.fn().mockReturnValue({
    valid: true,
    sanitizedData: {},
  }),
  sanitizeObject: jest.fn((data) => data),
}));
```

#### Integration Test Example

```javascript
test('should reject connection with invalid token', (done) => {
  const clientSocket = Client(`http://localhost:${serverPort}`, {
    auth: { token: 'invalid-token' },
    reconnection: false,
  });

  clientSocket.on('connect_error', (error) => {
    expect(error.message).toContain('Authentication');
    clientSocket.close();
    done();
  });
});
```

### 2. Event Handler Testing

#### Standard Pattern

```javascript
describe('handleEventName', () => {
  test('should handle valid event', () => {
    const { validateEvent } = require('../../../src/websocket/validators');
    validateEvent.mockReturnValueOnce({
      valid: true,
      sanitizedData: { /* expected data */ },
    });

    const data = { /* test data */ };
    socketService.handleEventName(mockSocket, data);

    // Verify expected behavior
    expect(mockSocket.emit).toHaveBeenCalledWith(/* expected call */);
  });

  test('should handle validation failure', () => {
    const { validateEvent } = require('../../../src/websocket/validators');
    validateEvent.mockReturnValueOnce({
      valid: false,
      error: 'Validation error message',
    });

    socketService.handleEventName(mockSocket, { /* invalid data */ });

    expect(mockSocket.emit).toHaveBeenCalledWith('error', {
      event: 'event:name',
      message: 'Validation failed',
      error: 'Validation error message',
    });
  });

  test('should handle rate limit exceeded', () => {
    socketService.checkRateLimit.mockReturnValue(false);

    socketService.handleEventName(mockSocket, { /* data */ });

    // Verify rate limit enforcement
  });
});
```

### 3. Broadcasting Testing

#### Testing Data Updates

```javascript
test('should broadcast data update with authorization', () => {
  const { canBroadcastToRoom } = require('../../../src/websocket/authorization');
  socketService.io.to = jest.fn().mockReturnValue({ emit: jest.fn() });

  canBroadcastToRoom.mockReturnValue({ authorized: true });

  const entity = 'users';
  const data = { id: '123', name: 'John' };
  const broadcaster = { _id: 'admin-id', role: 'admin' };

  socketService.broadcastDataUpdate(entity, data, broadcaster);

  expect(canBroadcastToRoom).toHaveBeenCalledWith(broadcaster, 'data:users');
  expect(socketService.io.to).toHaveBeenCalledWith('data:users');
  expect(socketService.io.to().emit).toHaveBeenCalledWith('data:updated', {
    entity: 'users',
    data: data,
    timestamp: expect.any(String),
  });
});
```

### 4. Redis Integration Testing

#### Testing Notification Queueing

```javascript
test('should queue notification for offline user', async () => {
  mockRedisClient.rPush.mockResolvedValue(1);
  mockRedisClient.expire.mockResolvedValue(1);

  const notification = { type: 'info', message: 'Test' };

  socketService.sendNotificationToUser('offline-user', notification);

  // Wait for async operation
  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(mockRedisClient.rPush).toHaveBeenCalledWith(
    'notifications:queue:offline-user',
    expect.stringContaining('"type":"info"')
  );
});
```

### 5. Rate Limiting Testing

#### Comprehensive Rate Limit Test

```javascript
test('should enforce rate limit of 100 requests per minute', () => {
  const socketId = 'test-socket';

  // First 100 requests should pass
  for (let i = 0; i < 100; i++) {
    expect(socketService.checkRateLimit(socketId)).toBe(true);
  }

  // 101st request should fail
  expect(socketService.checkRateLimit(socketId)).toBe(false);
});

test('should reset rate limit after time window', () => {
  const socketId = 'reset-socket';

  // Use up limit
  for (let i = 0; i < 100; i++) {
    socketService.checkRateLimit(socketId);
  }

  // Manually reset time (simulate passage of time)
  const limiter = socketService.rateLimiters.get(socketId);
  limiter.resetTime = Date.now() - 61000; // 61 seconds ago

  // Should allow requests again
  expect(socketService.checkRateLimit(socketId)).toBe(true);
});
```

### 6. Connection Pool Testing

#### Multiple Connections per User

```javascript
test('should track multiple sockets for same user', () => {
  const userId = 'multi-socket-user';

  socketService.connectedUsers.set(userId, new Set());
  socketService.connectedUsers.get(userId).add('socket-1');
  socketService.connectedUsers.get(userId).add('socket-2');
  socketService.connectedUsers.get(userId).add('socket-3');

  const stats = socketService.getStats();
  expect(stats.connectedUsers).toBe(1);
  expect(socketService.connectedUsers.get(userId).size).toBe(3);
});
```

## Edge Cases Covered

### Security Edge Cases

1. **Malformed Tokens**
   - Invalid JWT structure
   - Missing signature
   - Corrupted payload

2. **Malicious Input**
   - XSS attempts (`<script>alert("xss")</script>`)
   - SQL injection attempts (`' OR '1'='1`)
   - Null byte injection (`\x00`)
   - Very long tokens (10000+ characters)

3. **Authentication Failures**
   - Missing tokens
   - Empty tokens
   - Expired tokens
   - Invalid signatures
   - User not found in database
   - Database connection errors

### Event Handler Edge Cases

1. **Validation Failures**
   - Empty required fields
   - Invalid data types
   - Missing required parameters
   - Malformed data structures

2. **Authorization Failures**
   - Insufficient permissions
   - Private room access
   - Broadcast restrictions

3. **Rate Limiting**
   - Exceeded request limits
   - Multiple rapid requests
   - Reset window behavior

### Redis Integration Edge Cases

1. **Redis Unavailable**
   - Client is null
   - Connection refused
   - Timeout errors

2. **Redis Errors**
   - Command failures
   - Data serialization errors
   - Queue processing errors

### Connection Management Edge Cases

1. **Multiple Connections**
   - Same user, multiple devices
   - Connection cleanup on partial disconnect
   - Offline status determination

2. **Graceful Cleanup**
   - Room membership cleanup
   - Rate limiter cleanup
   - User tracking cleanup

## Best Practices

### 1. Mock Management

```javascript
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();

  // Setup fresh mock client
  mockRedisClient = {
    rPush: jest.fn().mockResolvedValue(true),
    expire: jest.fn().mockResolvedValue(true),
    lRange: jest.fn().mockResolvedValue([]),
    del: jest.fn().mockResolvedValue(true),
  };
});
```

### 2. Async Testing

```javascript
// For async operations that aren't awaitable
test('should handle async operation', async () => {
  socketService.asyncOperation();

  // Wait for async completion
  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(/* assertion */);
});
```

### 3. Integration Test Cleanup

```javascript
afterEach(async () => {
  // Shutdown in proper order
  if (socketService) {
    await socketService.shutdown();
  }

  if (httpServer && httpServer.listening) {
    await new Promise((resolve) => {
      httpServer.close(resolve);
    });
  }

  // Allow time for cleanup
  await new Promise((resolve) => setTimeout(resolve, 50));
});
```

### 4. Test Isolation

- Create new HTTP server for each integration test
- Clear all mocks between tests
- Reset rate limiters and connection maps
- Use unique identifiers for each test

### 5. Descriptive Test Names

```javascript
// Good
test('should reject connection when JWT token is malformed', () => {});

// Better
test('should emit connect_error with "Authentication failed" when JWT token structure is invalid', () => {});
```

## Debugging Tests

### Enable Verbose Logging

```bash
NODE_ENV=test npm test -- --testPathPatterns="websocket" --verbose
```

### Run Single Test

```bash
npm test -- --testPathPatterns="websocket" -t "should handle valid room join"
```

### Debug with Node Inspector

```bash
node --inspect-brk node_modules/.bin/jest --testPathPatterns="websocket" --runInBand
```

### Common Issues

1. **Port Already in Use**
   - Ensure previous test server was closed
   - Use dynamic port assignment (port 0)

2. **Async Timeout**
   - Increase timeout for long-running tests
   - Ensure `done()` is called in async tests

3. **Mock Not Resetting**
   - Call `jest.clearAllMocks()` in `beforeEach`
   - Verify mock implementation is correct

4. **Redis Mock Issues**
   - Ensure mock returns correct Promise types
   - Check for proper error simulation

## Performance Considerations

### Test Execution Time

- **Unit Tests**: ~2-3 seconds for 140 tests
- **Integration Tests**: ~10-12 seconds for 10 tests
- **Total Suite**: ~15 seconds

### Optimization Tips

1. Use `--runInBand` only for debugging
2. Parallelize unit and integration tests
3. Mock expensive operations (DB, Redis)
4. Reuse HTTP server where possible
5. Clean up connections promptly

## Coverage Gaps

### Remaining Uncovered Lines

**socketService.js: Lines 55-71, 83**
- Authentication middleware internals
- Socket.IO internal connection handling
- These are covered by integration tests but hard to unit test directly

### Why Not 100%?

1. **Socket.IO Internals**: Some lines are executed by Socket.IO framework
2. **Async Timing**: Precise timing of internal events
3. **Framework Callbacks**: Middleware next() calls are framework-managed

## Contributing

When adding new WebSocket features:

1. **Write Tests First** (TDD approach)
2. **Cover Edge Cases** (validation, errors, rate limits)
3. **Test Security** (malicious input, authorization)
4. **Integration Test** (real client connections when needed)
5. **Update Documentation** (this file)

### Test Checklist for New Features

- [ ] Unit tests for happy path
- [ ] Validation failure tests
- [ ] Authorization failure tests
- [ ] Rate limiting tests
- [ ] Redis unavailable tests
- [ ] Error handling tests
- [ ] Integration test (if needed)
- [ ] Documentation updated

## References

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Socket.IO Testing](https://socket.io/docs/v4/testing/)
- [Socket.IO Client Testing](https://socket.io/docs/v4/client-api/)
- [xRat WebSocket Documentation](./WEBSOCKET.md)

## Performance & Stress Testing

For comprehensive performance and stress testing documentation, including:
- Connection load testing (1,000+ concurrent connections)
- Memory leak detection and management
- Message throughput and latency testing
- Resource exhaustion scenarios
- Production performance benchmarks

**See**: [WebSocket Performance Testing Guide](./WEBSOCKET_PERFORMANCE_TESTING.md)

### Quick Start: Performance Tests

```bash
# Run all performance tests
npm run test:performance

# Run specific performance test suites
npm run test:performance:stress      # Connection stress tests
npm run test:performance:memory      # Memory leak detection
npm run test:performance:throughput  # Message throughput tests
npm run test:performance:resources   # Resource exhaustion tests
```

**Note**: Performance tests are excluded from regular test runs to avoid long CI times. They should be run periodically or before major releases.

## Conclusion

The xRat Ecosystem WebSocket implementation has achieved **production-grade test coverage** with:

- ✅ 150 comprehensive functional tests
- ✅ 38 performance & stress tests (NEW)
- ✅ 93.77% statement coverage
- ✅ 91.04% branch coverage
- ✅ 96.55% line coverage
- ✅ Full security edge case validation
- ✅ Complete error recovery testing
- ✅ Rate limiting enforcement verified
- ✅ Real Socket.IO integration tests
- ✅ Production-ready performance benchmarks (NEW)

This testing suite ensures **reliable, secure, and performant** real-time communication in the xRat Ecosystem.
