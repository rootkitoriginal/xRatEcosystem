# Smoke Tests

This directory contains smoke tests for critical scripts and tools in the xRat Ecosystem.

## What are Smoke Tests?

Smoke tests are high-level tests that verify the basic functionality of critical components without testing every detail. They ensure that the main features work and that the system doesn't "catch fire" when deployed.

## Monitor Smoke Test

### Purpose

The `monitor.test.js` file contains smoke tests for `bin/monitorDevOps.js`, the DevOps monitoring script that tracks Pull Requests in real-time.

### What it Tests

- ✅ Module exports are correct
- ✅ `fetchOpenPRs` function with mocked GitHub API
- ✅ `monitor` function execution in dry-run mode
- ✅ Error handling for API failures
- ✅ Timeout handling
- ✅ Script performance (execution time)

### Mock Strategy

The smoke test uses **mocked HTTP requests** instead of calling the real GitHub API. This approach:

- Prevents rate limiting issues in CI
- Ensures consistent test results
- Runs quickly (< 1 second)
- Doesn't require GitHub authentication

### Running the Tests

```bash
# Run smoke tests only
npm run test:smoke

# Run with verbose output
npm run test:smoke -- --verbose

# Run with coverage
npm run test:smoke -- --coverage
```

### CI Integration

The smoke test runs automatically in GitHub Actions on:

- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`

The workflow is configured in `.github/workflows/test.yml` under the `monitor-smoke-test` job.

### Test Results

Current test suite includes **11 tests**:

1. Module export validation (2 tests)
2. GitHub API mocking (4 tests)
3. Monitor function execution (3 tests)
4. Health checks (2 tests)

All tests must pass for the CI pipeline to succeed.

### Adding New Smoke Tests

When adding new critical scripts to the `bin/` directory:

1. Create a new test file in `__tests__/smoke/`
2. Follow the pattern used in `monitor.test.js`
3. Mock external API calls
4. Test basic functionality only (not edge cases)
5. Ensure tests run quickly (< 5 seconds)

### Troubleshooting

**Test fails locally but passes in CI:**

- Check Node.js version (should be 20+)
- Ensure all dependencies are installed: `npm install`
- Clear Jest cache: `npx jest --clearCache`

**Test times out:**

- Verify mocks are properly configured
- Check that no real API calls are being made
- Increase timeout in jest.config.js if needed

**Import errors:**

- Ensure `bin/monitorDevOps.js` exports the necessary functions
- Check that `module.exports = { monitor, fetchOpenPRs }` is present

## Configuration

Jest configuration for smoke tests is located at the root level in `jest.config.js`.

Key settings:

- Test environment: Node.js
- Test match: `__tests__/smoke/**/*.test.js`
- Coverage threshold: 50% minimum
- Ignores: `backend/`, `frontend/` workspaces

## Best Practices

1. **Keep it simple**: Smoke tests should be straightforward
2. **Mock external dependencies**: No real API calls
3. **Test critical paths only**: Not every edge case
4. **Fast execution**: All smoke tests should complete in < 10 seconds
5. **Clear assertions**: Make test failures obvious

## Related Documentation

- [Testing Guide](../../docs/TESTING.md)
- [CI/CD Documentation](../../docs/DEPLOYMENT.md)
- [Contributing Guidelines](../../CONTRIBUTING.md)
