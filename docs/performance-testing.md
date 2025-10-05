# WebSocket Performance Testing Guide

## Overview

This guide covers performance and stress tests for the WebSocket infrastructure. These tests validate system behavior under high load and establish production performance benchmarks.

## Test Files

### 1. `websocket-stress.test.js`
**Connection Load Testing**

- 100+ simultaneous connections (scaled from 1,000+ target)
- Rapid connect/disconnect cycles
- Connection pool management
- Resource cleanup validation

**Key Metrics**: Connection success rate, cleanup effectiveness

### 2. `websocket-memory.test.js`
**Memory Leak Detection**

- Long-running connection memory tracking
- Event listener cleanup validation
- Room membership memory management
- Garbage collection effectiveness

**Key Metrics**: Memory growth, cleanup efficiency, GC performance

### 3. `websocket-throughput.test.js`
**Message Performance Testing**

- High-frequency message broadcasting
- Large payload handling (1MB+)
- Message queue overflow scenarios
- Room broadcasting performance

**Key Metrics**: Message throughput, latency, delivery rate

### 4. `websocket-resources.test.js`
**Resource Exhaustion Testing**

- CPU usage monitoring
- Memory exhaustion recovery
- File descriptor limits
- Network bandwidth saturation
- Graceful degradation

**Key Metrics**: CPU usage, recovery capability, stability

## Running Tests

### All Performance Tests
```bash
npm run test:performance
```

### Individual Test Suites
```bash
# Connection stress tests
npm run test:performance:stress

# Memory leak detection
npm run test:performance:memory

# Message throughput
npm run test:performance:throughput

# Resource exhaustion
npm run test:performance:resources
```

## Test Characteristics

- **Execution Time**: 10-15 minutes for full suite
- **Resource Requirements**: 4GB+ RAM, 4+ CPU cores recommended
- **Port Usage**: 30001-30004
- **Test Timeout**: 120 seconds per test
- **Isolation**: Performance tests excluded from regular test runs

## Success Criteria

| Test Type | Success Threshold |
|-----------|------------------|
| Connection Rate | > 80% |
| Memory Growth | < 10-20MB |
| Message Throughput | > 500 msg/sec |
| Average Latency | < 100ms |
| Delivery Rate | > 90% |
| CPU Usage | < 95% |
| Recovery | System operational |

## Scaling Notes

Tests are scaled down for CI/CD environments:
- Connection counts reduced (100 instead of 1,000+)
- Timeouts adjusted for reliability
- Resource usage optimized for standard CI runners

For full-scale testing:
1. Edit connection counts in test files
2. Increase system limits (`ulimit -n 65536`)
3. Allocate more Node.js memory (`--max-old-space-size=4096`)
4. Use extended timeouts (`--testTimeout=300000`)

## Example: Connection Stress Test

```javascript
describe('WebSocket Stress Tests', () => {
  const NUM_CONNECTIONS = 100; // Scale up for production testing
  
  it('should handle multiple simultaneous connections', async () => {
    const connections = [];
    
    // Create connections
    for (let i = 0; i < NUM_CONNECTIONS; i++) {
      const socket = io('http://localhost:30001', {
        auth: { token: validToken }
      });
      connections.push(socket);
    }
    
    // Wait for all to connect
    await Promise.all(connections.map(socket => 
      new Promise(resolve => socket.on('connect', resolve))
    ));
    
    // Verify connections
    expect(connections.filter(s => s.connected).length)
      .toBeGreaterThan(NUM_CONNECTIONS * 0.8); // 80% success rate
    
    // Cleanup
    connections.forEach(socket => socket.disconnect());
  });
});
```

## Example: Memory Leak Detection

```javascript
describe('Memory Leak Detection', () => {
  it('should not leak memory over time', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Simulate long-running connections
    for (let i = 0; i < 100; i++) {
      const socket = io('http://localhost:30002', {
        auth: { token: validToken }
      });
      
      await new Promise(resolve => socket.on('connect', resolve));
      socket.disconnect();
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Force garbage collection
    if (global.gc) global.gc();
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = finalMemory - initialMemory;
    
    // Memory growth should be minimal (< 20MB)
    expect(memoryGrowth).toBeLessThan(20 * 1024 * 1024);
  });
});
```

## Example: Throughput Testing

```javascript
describe('Message Throughput Tests', () => {
  it('should handle high message volume', async () => {
    const NUM_MESSAGES = 1000;
    const socket = io('http://localhost:30003', {
      auth: { token: validToken }
    });
    
    await new Promise(resolve => socket.on('connect', resolve));
    
    const startTime = Date.now();
    let receivedCount = 0;
    
    socket.on('message', () => {
      receivedCount++;
    });
    
    // Send messages
    for (let i = 0; i < NUM_MESSAGES; i++) {
      socket.emit('message', { data: `Message ${i}` });
    }
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const duration = (Date.now() - startTime) / 1000;
    const throughput = receivedCount / duration;
    
    // Should process > 500 messages/second
    expect(throughput).toBeGreaterThan(500);
    
    socket.disconnect();
  });
});
```

## Monitoring During Tests

### CPU Usage Monitoring

```javascript
const os = require('os');

function getCPUUsage() {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;
  
  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });
  
  return {
    idle: totalIdle / cpus.length,
    total: totalTick / cpus.length,
    usage: 100 - (100 * totalIdle / totalTick)
  };
}
```

### Memory Usage Tracking

```javascript
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    heapUsed: usage.heapUsed / 1024 / 1024, // MB
    heapTotal: usage.heapTotal / 1024 / 1024,
    external: usage.external / 1024 / 1024,
    rss: usage.rss / 1024 / 1024
  };
}
```

## Troubleshooting

### Tests Timeout
- Reduce connection counts
- Increase `testTimeout` values
- Run with `--runInBand`

### Connection Errors
- Check port availability (30001-30004)
- Close previous test processes
- Wait between test runs

### Memory Test Failures
- Run tests in isolation
- Use `--expose-gc` flag
- Check system memory availability

### Inconsistent Results
- Use `--runInBand` for sequential execution
- Add delays between operations
- Check system load

## Best Practices

1. **Baseline First**: Establish baseline metrics before optimization
2. **Isolate Tests**: Run performance tests separately from unit tests
3. **Monitor Resources**: Track CPU, memory, and network during tests
4. **Scale Gradually**: Start with small loads and increase progressively
5. **Document Results**: Keep records of performance test results
6. **CI Integration**: Include performance tests in CI pipeline
7. **Production Parity**: Test with production-like configurations

## CI Integration

Add performance tests to your CI pipeline:

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly
  workflow_dispatch:

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run test:performance
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: test-results/
```

## Related Documentation

- [WebSocket Performance Summary](./websocket-performance.md)
- [WebSocket Testing Guide](./WEBSOCKET_TESTING.md)
- [Testing Guide](./TESTING.md)
- [Architecture Documentation](./ARCHITECTURE.md)

---

**Note**: Performance test results vary based on hardware, network conditions, and system load. Always run in environments similar to production for accurate benchmarking.
