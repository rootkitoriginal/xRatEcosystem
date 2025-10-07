# E2E Testing Guide - xRat Ecosystem

Complete End-to-End testing suite for the xRat Ecosystem, validating full system integration including frontend, backend, WebSocket, MongoDB, Redis, and Nginx.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Environment Setup](#environment-setup)
- [Writing Tests](#writing-tests)
- [Troubleshooting](#troubleshooting)
- [CI/CD Integration](#cicd-integration)

## 🎯 Overview

The E2E test suite covers:

- ✅ **Authentication**: Registration, login, logout, session management
- ✅ **Data CRUD**: Create, read, update, delete operations
- ✅ **Search & Filter**: Data search and filtering
- ✅ **Bulk Operations**: Bulk create, update, delete
- ✅ **WebSocket**: Real-time communication, connections, broadcasts
- ✅ **User Profile**: Profile view and updates
- ✅ **Security**: Access control, XSS prevention, CSRF protection
- ✅ **Resilience**: Failure handling, network interruptions

### Test Statistics

- **Total Test Suites**: 12
- **Browser Support**: Chrome/Chromium only
- **Estimated Runtime**: < 10 minutes
- **Coverage**: 80%+ of critical user flows

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ and npm 10+
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/xLabInternet/xRatEcosystem.git
cd xRatEcosystem

# Install dependencies
npm install

# Install Playwright browsers
cd frontend
npx playwright install chromium
```

### Run All E2E Tests

```bash
# From repository root
npm run test:e2e

# Or from frontend directory
cd frontend
npm run e2e
```

## 📁 Test Structure

```
__tests__/e2e/
├── setup/
│   ├── docker-compose.e2e.yml    # E2E Docker environment
│   ├── global-setup.js            # Global test setup
│   ├── global-teardown.js         # Global test cleanup
│   ├── helpers.js                 # Test helper functions
│   └── fixtures.js                # Playwright fixtures
├── auth/
│   ├── registration.spec.js       # User registration tests
│   ├── login.spec.js              # Login/logout tests
│   └── session.spec.js            # Session management tests
├── data/
│   ├── crud.spec.js               # CRUD operations tests
│   ├── search.spec.js             # Search & filter tests
│   └── bulk.spec.js               # Bulk operations tests
├── websocket/
│   ├── connection.spec.js         # WebSocket connection tests
│   └── realtime.spec.js           # Real-time communication tests
├── profile/
│   └── user-profile.spec.js       # User profile tests
├── security/
│   └── access-control.spec.js     # Security & access control tests
└── resilience/
    └── failures.spec.js           # Failure handling tests
```

## 🧪 Running Tests

### Run All Tests

```bash
npm run test:e2e
```

### Run Specific Test Suite

```bash
npx playwright test __tests__/e2e/auth/
npx playwright test __tests__/e2e/data/crud.spec.js
```

### Run Tests in UI Mode

```bash
cd frontend
npm run e2e:ui
```

### Run Tests with Debug

```bash
npx playwright test --debug
```

### Run Tests in Headed Mode

```bash
npx playwright test --headed
```

### Generate Test Report

```bash
npx playwright show-report e2e-report
```

## 🔧 Environment Setup

### E2E Docker Environment

Tests run in an isolated Docker environment with:

- **Frontend**: http://172.22.0.10
- **Backend**: http://172.22.1.30:3000
- **MongoDB**: Internal (172.22.1.10)
- **Redis**: Internal (172.22.1.20)

### Environment Variables

```bash
# Base URL for tests (default: http://172.22.0.10)
E2E_BASE_URL=http://172.22.0.10

# Keep containers running after tests for debugging
E2E_KEEP_CONTAINERS=true

# Use dev server instead of Docker (for local development)
E2E_USE_DEV_SERVER=true
```

### Manual Docker Control

```bash
# Start E2E environment manually
cd __tests__/e2e/setup
docker compose -f docker-compose.e2e.yml up -d

# Check status
docker compose -f docker-compose.e2e.yml ps

# View logs
docker compose -f docker-compose.e2e.yml logs -f

# Stop environment
docker compose -f docker-compose.e2e.yml down -v
```

## ✍️ Writing Tests

### Basic Test Structure

```javascript
const { test, expect } = require('@playwright/test');
const { registerUser, apiRequest } = require('../setup/helpers');

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    // Setup: Register and login
    await registerUser(page);

    // Action: Perform test actions
    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    const result = await apiRequest(page, `${baseUrl}/api/v1/data`, {
      method: 'GET',
    });

    // Assert: Verify results
    expect(result.success).toBeTruthy();
  });
});
```

### Using Fixtures

```javascript
const { test } = require('../setup/fixtures');

test.describe('With Fixtures', () => {
  test('uses authenticated user fixture', async ({ authenticatedUser, page }) => {
    // User is already registered and logged in
    expect(authenticatedUser.email).toBeDefined();
  });

  test('uses test data fixture', async ({ authenticatedUser, testData, page }) => {
    // Create test data that auto-cleans up
    const data = await testData.createData({
      key: 'test-key',
      value: 'test-value',
    });

    expect(data.success).toBeTruthy();
    // Data will be automatically deleted after test
  });

  test('uses multiple users', async ({ multipleUsers }) => {
    // Array of 3 authenticated users with their own pages
    expect(multipleUsers.length).toBe(3);
  });
});
```

### Helper Functions

```javascript
const {
  createTestCredentials, // Generate unique test credentials
  registerUser, // Register and login a user
  loginUser, // Login existing user
  logoutUser, // Logout current user
  waitForElement, // Wait for element with retry
  createTestData, // Create test data
  cleanupTestData, // Delete test data
  waitForWebSocket, // Wait for WebSocket connection
  retryAction, // Retry action with backoff
  getAuthToken, // Get auth token from localStorage
  apiRequest, // Make authenticated API request
  waitForNetworkIdle, // Wait for network to be idle
} = require('../setup/helpers');
```

### Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up test data after tests
3. **Unique Data**: Use timestamps to create unique test data
4. **Explicit Waits**: Use explicit waits instead of arbitrary timeouts
5. **Error Handling**: Handle and verify error cases
6. **Realistic Scenarios**: Test real user workflows
7. **Screenshots**: Playwright captures screenshots on failure automatically

## 🔍 Troubleshooting

### Tests Timeout

**Problem**: Tests timeout waiting for services

**Solutions**:

```bash
# Check if Docker containers are healthy
cd __tests__/e2e/setup
docker compose -f docker-compose.e2e.yml ps

# View logs
docker compose -f docker-compose.e2e.yml logs backend
docker compose -f docker-compose.e2e.yml logs frontend

# Increase timeout in playwright.config.js
timeout: 120_000, // 2 minutes
```

### Services Not Starting

**Problem**: Docker services fail to start

**Solutions**:

```bash
# Clean up old containers
docker compose -f __tests__/e2e/setup/docker-compose.e2e.yml down -v

# Check for port conflicts
docker ps
netstat -tuln | grep -E ':(3000|5173|27017|6379)'

# Rebuild containers
docker compose -f __tests__/e2e/setup/docker-compose.e2e.yml build --no-cache
```

### Authentication Failures

**Problem**: Tests fail to authenticate

**Solutions**:

```javascript
// Check if backend is responding
const health = await page.evaluate(() => {
  return fetch('http://172.22.1.30:3000/health')
    .then((res) => res.json())
    .catch((err) => ({ error: err.message }));
});

// Verify JWT token is stored
const token = await getAuthToken(page);
console.log('Token:', token);

// Check localStorage
const storage = await page.evaluate(() => localStorage.getItem('auth-storage'));
console.log('Auth Storage:', storage);
```

### WebSocket Connection Issues

**Problem**: WebSocket tests fail to connect

**Solutions**:

```javascript
// Check WebSocket connection manually
await page.evaluate(() => {
  console.log('Socket:', window.socket);
  console.log('Connected:', window.socketConnected);
  console.log('Socket Auth:', window.socket?.auth);
});

// Enable WebSocket debugging
await page.evaluate(() => {
  if (window.socket) {
    window.socket.on('connect', () => console.log('WS Connected'));
    window.socket.on('disconnect', () => console.log('WS Disconnected'));
    window.socket.on('error', (err) => console.log('WS Error:', err));
  }
});
```

### Flaky Tests

**Problem**: Tests pass sometimes but fail other times

**Solutions**:

```javascript
// Use retries in playwright.config.js
retries: 2,

// Use retry helper
const result = await retryAction(
  async () => {
    return await apiRequest(page, url, options);
  },
  { maxRetries: 3, initialDelay: 1000 }
);

// Add explicit waits
await page.waitForLoadState('networkidle');
await waitForElement(page, selector, { timeout: 10000, retries: 3 });
```

### Keep Containers Running

**For debugging, keep containers running after tests**:

```bash
E2E_KEEP_CONTAINERS=true npm run test:e2e
```

Then manually inspect:

```bash
# View logs
docker compose -f __tests__/e2e/setup/docker-compose.e2e.yml logs -f

# Execute commands in containers
docker exec -it xrat-e2e-backend sh
docker exec -it xrat-e2e-frontend sh

# Clean up when done
docker compose -f __tests__/e2e/setup/docker-compose.e2e.yml down -v
```

## 🤖 CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Install Playwright
        run: npx playwright install chromium

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-report
          path: e2e-report/
```

### Test Report

After tests complete, view the HTML report:

```bash
npx playwright show-report e2e-report
```

### Performance Tips for CI

1. **Parallel Execution**: Enable in `playwright.config.js`

   ```javascript
   workers: process.env.CI ? 2 : 3,
   fullyParallel: true,
   ```

2. **Retry Failed Tests**: Automatic retries on failure

   ```javascript
   retries: process.env.CI ? 2 : 1,
   ```

3. **Cache Docker Images**: Cache in CI to speed up builds
   ```yaml
   - name: Cache Docker layers
     uses: actions/cache@v3
     with:
       path: /tmp/.buildx-cache
       key: ${{ runner.os }}-buildx-${{ github.sha }}
   ```

## 📊 Test Coverage

### Critical Flows Covered

- ✅ User Registration (6 tests)
- ✅ User Login (6 tests)
- ✅ Session Management (7 tests)
- ✅ Data CRUD (7 tests)
- ✅ Search & Filter (5 tests)
- ✅ Bulk Operations (5 tests)
- ✅ WebSocket Connection (7 tests)
- ✅ Real-time Communication (6 tests)
- ✅ User Profile (8 tests)
- ✅ Security & Access Control (10 tests)
- ✅ Resilience & Failure Handling (8 tests)

**Total**: 75+ E2E tests

### Coverage Goals

- ✅ Authentication: 100%
- ✅ Data Operations: 85%
- ✅ WebSocket: 80%
- ✅ Security: 90%
- ✅ Error Handling: 80%

## 🎓 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [xRat Ecosystem API Docs](../../docs/API.md)
- [WebSocket Testing Guide](../../docs/WEBSOCKET_TESTING.md)
- [General Testing Guide](../../docs/TESTING.md)

## 📝 Contributing

When adding new E2E tests:

1. Follow existing test structure and naming conventions
2. Use provided helpers and fixtures
3. Ensure tests are isolated and clean up after themselves
4. Add appropriate assertions and error handling
5. Update this README with new test coverage
6. Run tests locally before committing

## 📞 Support

For issues or questions:

- Check [Troubleshooting](#troubleshooting) section
- Review [GitHub Issues](https://github.com/xLabInternet/xRatEcosystem/issues)
- Consult [Documentation](../../docs/)

---

**Last Updated**: 2025
**Maintained By**: xRat Ecosystem Team
