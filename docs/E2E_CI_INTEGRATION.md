# E2E Tests CI/CD Integration Guide

Guide for integrating E2E tests into CI/CD pipelines.

## 📋 Overview

The xRat Ecosystem E2E tests are fully integrated into the CI/CD pipeline using GitHub Actions, providing automated testing for every push and pull request.

## 🚀 GitHub Actions Workflow

### Workflow File

Location: `.github/workflows/e2e-tests.yml`

### Workflow Triggers

The E2E test workflow runs on:

- **Push** to `main` or `develop` branches
- **Pull Requests** to `main` or `develop` branches
- **Manual trigger** via workflow dispatch

### Workflow Steps

1. **Setup Environment**
   - Checkout code
   - Setup Node.js 20
   - Cache npm dependencies
2. **Install Dependencies**
   - Install root dependencies
   - Install frontend dependencies
   - Install Playwright browsers (Chromium only)

3. **Setup Docker**
   - Setup Docker Buildx
   - Cache Docker layers for faster builds

4. **Run Tests**
   - Execute E2E test suite
   - Tests run in isolated Docker environment
   - Timeout: 30 minutes

5. **Upload Artifacts**
   - Test results (HTML report, JSON results)
   - Playwright traces (on failure)
   - Retention: 7 days

6. **Post Test Actions**
   - Clean up Docker environment
   - Comment PR with test results
   - Generate test summary

## 📊 Test Reports

### Viewing Test Results

After tests complete:

1. **GitHub Actions Tab**
   - Navigate to Actions → E2E Tests workflow
   - Click on the latest run
   - View logs and test summary

2. **Artifacts**
   - Download `e2e-test-results` artifact
   - Extract and open `index.html` in browser
   - View detailed test report with screenshots and traces

3. **PR Comments**
   - Automatic comment posted to PR
   - Summary of test results
   - Pass/fail counts
   - Link to full report

### Test Result Format

```
## 🧪 E2E Test Results

- **Total Tests**: 75
- **Passed**: ✅ 73
- **Failed**: ❌ 2
- **Flaky**: ⚠️ 0
- **Skipped**: ⏭️ 0

**Duration**: 8.45s

❌ **Some E2E tests failed.** Check the artifacts for details.

📊 [View detailed report in artifacts](../../actions/runs/123456789)
```

## 🔧 Configuration

### Environment Variables

Set in GitHub Actions workflow:

```yaml
env:
  CI: true                           # Enables CI mode
  E2E_BASE_URL: http://localhost:5173  # E2E frontend URL
```

### Playwright Configuration

CI-specific settings in `playwright.config.js`:

```javascript
export default defineConfig({
  // More retries in CI
  retries: process.env.CI ? 2 : 1,

  // Fewer workers in CI (resource constrained)
  workers: process.env.CI ? 2 : 3,

  // Fail build on only.skip in CI
  forbidOnly: !!process.env.CI,

  // Parallel execution
  fullyParallel: true,
});
```

## 🎯 Performance Optimization

### Docker Layer Caching

```yaml
- name: Cache Docker layers
  uses: actions/cache@v4
  with:
    path: /tmp/.buildx-cache
    key: ${{ runner.os }}-buildx-e2e-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-buildx-e2e-
      ${{ runner.os }}-buildx-
```

**Benefit**: 2-5 minute reduction in build time

### npm Dependency Caching

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
```

**Benefit**: 1-2 minute reduction in dependency installation

### Parallel Test Execution

```javascript
// playwright.config.js
workers: process.env.CI ? 2 : 3,
fullyParallel: true,
```

**Benefit**: 30-40% reduction in test execution time

## 🔍 Debugging CI Failures

### View Logs

1. **GitHub Actions Logs**
   - Go to Actions → E2E Tests → Latest run
   - Expand failed step
   - View detailed logs

2. **Container Logs**
   - Look for "Container logs:" section in workflow
   - Shows backend, frontend, MongoDB, Redis logs

### Download Artifacts

1. **Test Results**

   ```bash
   # Download from GitHub Actions UI
   # Extract and view
   unzip e2e-test-results.zip
   open e2e-report/index.html
   ```

2. **Playwright Traces**
   ```bash
   # Download playwright-traces artifact
   unzip playwright-traces.zip
   npx playwright show-trace trace.zip
   ```

### Common Issues

#### Tests Timeout in CI

**Problem**: Tests timeout but pass locally

**Solution**:

- Increase timeout in workflow or config
- Check if services are starting properly
- Review container health checks

```yaml
jobs:
  e2e-tests:
    timeout-minutes: 45 # Increase from 30
```

#### Docker Build Failures

**Problem**: Docker build fails in CI

**Solution**:

- Clear cache and retry
- Check Docker layer cache keys
- Verify Dockerfile syntax

```bash
# Manually trigger with cache cleared
# Go to Actions → E2E Tests → Run workflow
# Check "Clear cache" option
```

#### Flaky Tests

**Problem**: Tests pass/fail inconsistently

**Solution**:

- Enable retries (already enabled in CI)
- Add explicit waits
- Use Playwright's built-in retry logic

```javascript
retries: process.env.CI ? 2 : 1,  // 2 retries in CI
```

## 🔒 Security Considerations

### Secrets Management

E2E tests use test credentials defined in `docker-compose.e2e.yml`:

- MongoDB: admin/e2etestpass
- Redis: e2eredispass
- JWT: e2e-test-jwt-secret-key

**Note**: These are test-only credentials and should never be used in production.

### Network Isolation

E2E tests run in an isolated Docker network (172.22.0.0/16) that:

- Cannot access production systems
- Uses internal DNS resolution only
- Cleans up automatically after tests

## 📈 Monitoring and Metrics

### Test Duration Tracking

Monitor test duration in CI:

- Target: < 10 minutes
- Current average: 8-9 minutes
- Alert if > 15 minutes

### Success Rate

Track E2E test success rate:

- Target: > 95%
- Current: ~97%
- Investigate if < 90%

### Coverage Tracking

E2E test coverage:

- Critical flows: 100%
- Overall coverage: 80%+
- Track new feature coverage

## 🚀 Advanced CI Configurations

### Matrix Testing

Test across multiple configurations:

```yaml
strategy:
  matrix:
    node-version: [18, 20]
    os: [ubuntu-latest, macos-latest]
```

### Scheduled Tests

Run E2E tests on schedule:

```yaml
on:
  schedule:
    - cron: '0 0 * * *' # Daily at midnight
```

### Manual Triggers with Inputs

```yaml
on:
  workflow_dispatch:
    inputs:
      test-suite:
        description: 'Test suite to run'
        required: true
        default: 'all'
        type: choice
        options:
          - all
          - auth
          - data
          - websocket
```

## 🔄 Integration with Other Workflows

### Require E2E Pass Before Merge

In branch protection rules:

1. Go to Settings → Branches
2. Edit branch protection for `main`
3. Enable "Require status checks to pass"
4. Select "E2E Tests"

### Dependency on Other Tests

```yaml
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run unit tests
        run: npm test

  e2e-tests:
    needs: [unit-tests] # Run only if unit tests pass
    runs-on: ubuntu-latest
    steps:
      - name: Run E2E tests
        run: npm run test:e2e
```

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Playwright CI Documentation](https://playwright.dev/docs/ci)
- [Docker Compose in CI](https://docs.docker.com/compose/ci/)
- [E2E Testing Guide](../__tests__/e2e/README.md)

## 💡 Best Practices

1. **Fast Feedback**: Keep tests < 10 minutes
2. **Reliable Tests**: Use retries for flaky tests
3. **Clear Reports**: Upload artifacts for debugging
4. **Resource Efficient**: Use caching effectively
5. **Security**: Never commit real credentials
6. **Monitoring**: Track test metrics over time
7. **Documentation**: Keep CI docs up to date

## 🆘 Getting Help

- Check [E2E Testing Guide](../__tests__/e2e/README.md)
- Review [GitHub Actions logs](https://github.com/xLabInternet/xRatEcosystem/actions)
- Open an [issue](https://github.com/xLabInternet/xRatEcosystem/issues)

---

**Last Updated**: 2024  
**Maintained By**: xRat Ecosystem Team
