# WebSocket Performance & Stress Testing Guide

## 📋 Overview

This document provides comprehensive guidance on the WebSocket performance and stress testing suite for the xRat Ecosystem. These tests validate system behavior under high load, identify memory leaks, and establish production performance benchmarks.

## 🎯 Testing Objectives

### Primary Goals

1. **Validate Scalability**: Ensure the system can handle 1,000+ concurrent connections
2. **Identify Memory Leaks**: Detect and prevent memory leaks during extended sessions
3. **Measure Throughput**: Establish baseline performance metrics for message delivery
4. **Test Resilience**: Verify graceful degradation under resource exhaustion
5. **Benchmark Performance**: Document performance characteristics for production planning

### Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **Concurrent Connections** | 10,000+ per server | Scaled to 100-500 in tests |
| **Connection Latency** | < 100ms | Under load |
| **Message Throughput** | 10,000+ msg/sec | Varies by payload size |
| **Memory Growth** | < 20MB per hour | During stable operation |
| **CPU Usage** | < 80% | Under maximum load |
| **Message Delivery Rate** | > 90% | Under normal load |

## 📁 Test Suite Structure

### Test Files

```
backend/__tests__/performance/
├── websocket-stress.test.js      # Connection load testing
├── websocket-memory.test.js      # Memory leak detection
├── websocket-throughput.test.js  # Message performance
└── websocket-resources.test.js   # Resource exhaustion
```

### Test Categories

#### 1. Connection Stress Tests (`websocket-stress.test.js`)

**Purpose**: Validate connection handling under high concurrent load

**Test Scenarios**:
- ✅ 100 simultaneous connections (scaled from 1,000+ target)
- ✅ Connection tracking accuracy
- ✅ Rapid connect/disconnect cycles (100 iterations)
- ✅ Resource cleanup after disconnections
- ✅ Connection pool capacity management
- ✅ Multiple connections per user (10 per user)
- ✅ Connection timeout handling
- ✅ Rate limiter cleanup validation
- ✅ Room membership cleanup validation

**Key Metrics**:
- Connection success rate: > 80%
- Cleanup effectiveness: > 50% resource reclamation
- Pool capacity: 100+ concurrent connections

#### 2. Memory Management Tests (`websocket-memory.test.js`)

**Purpose**: Detect memory leaks and validate memory management

**Test Scenarios**:
- ✅ Long-running connection memory tracking (50 clients, 5 seconds)
- ✅ Repeated connect/disconnect cycles (20 cycles, 10 clients each)
- ✅ Event listener cleanup validation
- ✅ Listener accumulation prevention (30 iterations)
- ✅ Room membership memory management (5 rooms, 5 clients)
- ✅ Memory efficiency with room operations (100 operations)
- ✅ Message queue memory usage (1,000 messages)
- ✅ High-volume broadcasting memory (20 clients, 200 broadcasts)
- ✅ Garbage collection effectiveness (5 iterations)
- ✅ Connection object cleanup validation (30 connections)

**Key Metrics**:
- Memory growth during session: < 10MB
- Memory drift over cycles: < 20MB
- Memory growth with operations: < 5-15MB (depending on test)
- Cleanup effectiveness: > 30% resource reclamation

#### 3. Message Throughput Tests (`websocket-throughput.test.js`)

**Purpose**: Measure message delivery performance and latency

**Test Scenarios**:
- ✅ 1,000 rapid broadcasts (throughput measurement)
- ✅ Low latency under load (10 clients, 50 msg each)
- ✅ 1MB+ large payload handling
- ✅ Multiple large payloads sequential (5x 500KB)
- ✅ Message queue overflow (10,000 messages)
- ✅ Priority delivery under queue pressure (5 clients, 1,000 msg)
- ✅ Room broadcasting to 100+ users (50 broadcasts)
- ✅ Cross-room message isolation (5 rooms, 10 clients each)
- ✅ Complex object serialization performance

**Key Metrics**:
- Message throughput: > 500 msg/sec
- Average latency: < 100ms
- Large payload delivery: 100% success
- Room delivery rate: > 90%
- Cross-room isolation: 100%

#### 4. Resource Exhaustion Tests (`websocket-resources.test.js`)

**Purpose**: Test system behavior under resource constraints

**Test Scenarios**:
- ✅ CPU usage monitoring under load (50 clients with active messaging)
- ✅ CPU-intensive broadcasting (30 clients, 500 broadcasts)
- ✅ Memory pressure recovery (50 clients, 100KB x 100 messages)
- ✅ Out-of-memory-like conditions (20 clients, 1MB x 50 messages)
- ✅ File descriptor management (200 concurrent connections)
- ✅ Redis unavailability handling (10 clients, 20 queue operations)
- ✅ Redis timeout scenarios (slow operations simulation)
- ✅ Network bandwidth saturation (10 clients, 100KB x 50 messages)
- ✅ Graceful degradation (100 clients, 100 messages)
- ✅ System stability after stress cycles (3 cycles, 50 clients each)

**Key Metrics**:
- CPU usage: < 95% under load
- Recovery: System remains operational
- FD success rate: > 85%
- Degradation: > 30% service maintained
- Stability: Operational through all cycles

## 🚀 Running Performance Tests

### Prerequisites

```bash
# Install dependencies
cd backend
npm install

# Ensure sufficient system resources
# Recommended: 4GB+ RAM, 4+ CPU cores
```

### Running All Performance Tests

```bash
# Run full performance suite (sequential execution)
npm run test:performance

# This runs all 4 test files with extended timeouts (120s)
# Estimated duration: 10-15 minutes
```

### Running Individual Test Suites

```bash
# Connection stress tests
npm run test:performance:stress

# Memory leak detection tests
npm run test:performance:memory

# Message throughput tests
npm run test:performance:throughput

# Resource exhaustion tests
npm run test:performance:resources
```

### Running Unit and Integration Tests (Excludes Performance)

```bash
# Regular tests (performance tests excluded by default)
npm test

# Only unit tests
npm run test:unit

# Only integration tests
npm run test:integration
```

## 📊 Interpreting Test Results

### Success Criteria

#### Connection Tests
```
✅ Connected 95/100 clients (95.00%)
   Note: Test scaled to 100 connections (production target: 1000+)
```
- **Success**: > 80% connection rate
- **Warning**: 60-80% connection rate (investigate networking)
- **Failure**: < 60% connection rate

#### Memory Tests
```
📊 Memory Usage:
  Initial: 45.23 MB
  After Connect: 52.67 MB
  During Session: 53.12 MB
  After Disconnect: 47.89 MB
  Growth during session: 0.45 MB
  Reclaimed after disconnect: 5.23 MB
```
- **Success**: Memory growth < 10MB, reclamation > 30%
- **Warning**: Memory growth 10-20MB
- **Failure**: Memory growth > 20MB or no reclamation

#### Throughput Tests
```
📊 Throughput Test Results:
  Sent: 1000 messages
  Received: 987 messages
  Duration: 1234ms
  Throughput: 810 msg/sec
```
- **Success**: > 90% delivery rate, throughput > 500 msg/sec
- **Warning**: 80-90% delivery rate
- **Failure**: < 80% delivery rate

#### Latency Tests
```
📊 Latency Statistics:
  Average: 45.23ms
  Min: 12ms
  Max: 156ms
  Total messages: 500
```
- **Success**: Average < 100ms, Max < 200ms
- **Warning**: Average 100-200ms
- **Failure**: Average > 200ms

### Common Performance Issues

#### High Memory Growth
- **Symptom**: Memory increases > 20MB during tests
- **Causes**: 
  - Event listeners not cleaned up
  - Room memberships not removed
  - Rate limiters accumulating
- **Solution**: Check disconnect handlers and cleanup logic

#### Low Connection Success Rate
- **Symptom**: < 80% connection success
- **Causes**:
  - File descriptor limits
  - Network timeout issues
  - Server capacity limits
- **Solution**: Check system limits (`ulimit -n`), increase timeouts

#### Poor Message Delivery
- **Symptom**: < 90% message delivery rate
- **Causes**:
  - Message queue overflow
  - Network congestion
  - CPU saturation
- **Solution**: Implement message prioritization, increase buffer sizes

#### CPU Saturation
- **Symptom**: CPU usage > 90%
- **Causes**:
  - Inefficient serialization
  - Too many broadcasts
  - Blocking operations
- **Solution**: Profile code, optimize hot paths, use worker threads

## 🔧 Configuration

### Test Scaling

Performance tests are scaled down for CI/CD environments. To run full-scale tests:

1. Edit test files to increase connection counts:
```javascript
// In websocket-stress.test.js
const connectionCount = 1000; // Change from 100 to 1000
```

2. Increase system limits:
```bash
# Increase file descriptor limit
ulimit -n 65536

# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"
```

3. Run with extended timeout:
```bash
jest __tests__/performance --testTimeout=300000 --runInBand
```

### Memory Profiling

For detailed memory profiling with garbage collection:

```bash
# Run with GC exposed
npm run test:performance:memory

# Or manually
node --expose-gc ./node_modules/.bin/jest __tests__/performance/websocket-memory.test.js
```

### Environment Variables

```bash
# Increase test timeouts
export JEST_TIMEOUT=180000

# Enable verbose logging
export DEBUG=socket.io:*

# Set custom port ranges
export PERF_TEST_PORT_START=30000
```

## 📈 Performance Benchmarking

### Establishing Baselines

1. **Run tests on reference hardware**:
```bash
npm run test:performance > baseline-results.txt 2>&1
```

2. **Extract key metrics**:
- Connection success rate
- Memory usage patterns
- Message throughput
- Latency statistics

3. **Document system configuration**:
- CPU: cores, speed
- RAM: total, available
- Network: bandwidth, latency
- OS: version, kernel

### Continuous Performance Monitoring

Add to CI/CD pipeline:

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on:
  schedule:
    - cron: '0 2 * * 0' # Weekly on Sunday 2 AM
  workflow_dispatch:

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd backend && npm install
      - name: Run performance tests
        run: cd backend && npm run test:performance
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: performance-results
          path: backend/performance-*.txt
```

## 🐛 Troubleshooting

### Tests Timing Out

**Problem**: Tests exceed timeout limits

**Solutions**:
1. Reduce connection counts in test files
2. Increase `testTimeout` in jest.config.js
3. Run tests with `--runInBand` to prevent parallel execution issues
4. Check system resources (CPU, memory availability)

### Connection Errors

**Problem**: "ECONNREFUSED" or "EADDRINUSE" errors

**Solutions**:
1. Ensure ports 30001-30004 are available
2. Close previous test processes
3. Wait between test runs for port cleanup
4. Use different port ranges per test file

### Memory Test Failures

**Problem**: Memory growth exceeds thresholds

**Solutions**:
1. Run tests in isolation
2. Increase GC frequency with `--expose-gc`
3. Check for background processes consuming memory
4. Verify cleanup code is executing

### Inconsistent Results

**Problem**: Tests pass/fail intermittently

**Solutions**:
1. Increase wait times between operations
2. Use `--runInBand` for sequential execution
3. Add retries for network-dependent operations
4. Check system load during test execution

## 🎓 Best Practices

### Writing New Performance Tests

1. **Use Realistic Scenarios**: Test patterns that match production usage
2. **Measure Objectively**: Capture metrics, don't rely on subjective assessment
3. **Scale Appropriately**: Balance thoroughness with execution time
4. **Clean Up Resources**: Always disconnect clients and free resources
5. **Document Expectations**: Clearly define success criteria

### Example Test Template

```javascript
describe('New Performance Test', () => {
  let httpServer;
  let socketService;
  let testToken;
  const PORT = 30005; // Use unique port

  beforeAll(async () => {
    // Setup test infrastructure
    httpServer = http.createServer();
    socketService = new SocketService(httpServer, mockRedisClient);
    testToken = generateAccessToken({ userId: 'test-user-id' });
    
    await new Promise((resolve) => {
      httpServer.listen(PORT, resolve);
    });
  });

  afterAll(async () => {
    // Cleanup
    if (socketService) await socketService.shutdown();
    await new Promise((resolve) => httpServer.close(resolve));
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  test('should validate performance metric', async () => {
    // Arrange: Setup test scenario
    const clients = [];
    
    // Act: Execute performance test
    const startTime = Date.now();
    // ... test logic ...
    const duration = Date.now() - startTime;
    
    // Assert: Validate metrics
    expect(duration).toBeLessThan(expectedThreshold);
    
    // Cleanup: Disconnect clients
    clients.forEach(c => c.disconnect());
    
    // Log: Report metrics
    console.log(`📊 Metric: ${value} (target: ${threshold})`);
  }, 30000);
});
```

## 📚 Additional Resources

### Related Documentation
- [WebSocket Testing Guide](./WEBSOCKET_TESTING.md) - Functional testing patterns
- [Phase 4 Summary](./PHASE4_WEBSOCKET_TESTING_SUMMARY.md) - Previous testing phase results
- [Architecture](./ARCHITECTURE.md) - System architecture overview
- [API Documentation](./API.md) - API endpoint documentation

### External Resources
- [Socket.IO Performance Tuning](https://socket.io/docs/v4/performance-tuning/)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Jest Performance Tips](https://jestjs.io/docs/troubleshooting#tests-are-extremely-slow-on-docker-andor-continuous-integration-ci-server)

## 🔄 Changelog

### Version 1.0.0 (2025-01-05)
- Initial performance testing suite implementation
- 4 test files with 38 performance tests
- Connection, memory, throughput, and resource tests
- Comprehensive documentation and examples
- Integration with npm scripts and Jest configuration

---

**Note**: Performance tests are designed to validate production readiness. Results may vary based on hardware, network conditions, and system load. Always run tests in environments similar to production for accurate benchmarking.
