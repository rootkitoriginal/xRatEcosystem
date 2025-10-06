# WebSocket Performance Tests

## Overview

This directory contains performance and stress tests for the WebSocket infrastructure. These tests validate system behavior under high load and establish production performance benchmarks.

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

| Test Type          | Success Threshold  |
| ------------------ | ------------------ |
| Connection Rate    | > 80%              |
| Memory Growth      | < 10-20MB          |
| Message Throughput | > 500 msg/sec      |
| Average Latency    | < 100ms            |
| Delivery Rate      | > 90%              |
| CPU Usage          | < 95%              |
| Recovery           | System operational |

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

## Documentation

For detailed documentation, see:

- [WebSocket Performance Testing Guide](../../docs/websocket-performance.md)
- [WebSocket Testing Guide](../../docs/WEBSOCKET_TESTING.md)

## Contributing

When adding new performance tests:

1. Use unique ports (30005+)
2. Document expected metrics
3. Include cleanup logic
4. Scale appropriately for CI
5. Update this README

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

---

**Note**: Performance test results vary based on hardware, network conditions, and system load. Always run in environments similar to production for accurate benchmarking.
