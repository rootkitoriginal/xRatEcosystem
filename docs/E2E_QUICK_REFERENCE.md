# E2E Testing Quick Reference

Quick reference guide for running and writing E2E tests in the xRat Ecosystem.

## 🚀 Quick Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run with debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Run specific test file
npx playwright test __tests__/e2e/auth/login.spec.js

# Run tests matching pattern
npx playwright test --grep "should login"

# Keep containers running for debugging
E2E_KEEP_CONTAINERS=true npm run test:e2e
```

## 📝 Writing Tests

### Basic Test Template

```javascript
const { test, expect } = require('@playwright/test');
const { registerUser, apiRequest } = require('../setup/helpers');

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Setup: Create authenticated user
    await registerUser(page);

    // Action: Perform test action
    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    const result = await apiRequest(page, `${baseUrl}/api/v1/endpoint`, {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
    });

    // Assert: Verify expected behavior
    expect(result.success).toBeTruthy();

    // Cleanup: Delete test data if needed
    if (result.data?._id) {
      await apiRequest(page, `${baseUrl}/api/v1/endpoint/${result.data._id}`, {
        method: 'DELETE',
      });
    }
  });
});
```

### Using Fixtures

```javascript
const { test } = require('../setup/fixtures');

test('with authenticated user', async ({ authenticatedUser, page }) => {
  // User is already logged in
  expect(authenticatedUser.email).toBeDefined();
});

test('with test data', async ({ authenticatedUser, testData, page }) => {
  // Create data that auto-cleans up
  const data = await testData.createData({
    key: 'test-key',
    value: 'test-value',
  });
  expect(data.success).toBeTruthy();
});
```

## 🔧 Common Helpers

```javascript
const {
  registerUser, // Register and login a user
  loginUser, // Login existing user
  logoutUser, // Logout current user
  createTestCredentials, // Generate unique credentials
  apiRequest, // Make authenticated API request
  waitForWebSocket, // Wait for WebSocket connection
  getAuthToken, // Get auth token from localStorage
} = require('../setup/helpers');
```

## 🐛 Debugging

### View Logs

```bash
# E2E container logs
cd __tests__/e2e/setup
docker compose -f docker-compose.e2e.yml logs -f

# Specific service
docker compose -f docker-compose.e2e.yml logs backend
```

### Inspect Containers

```bash
# List containers
docker compose -f __tests__/e2e/setup/docker-compose.e2e.yml ps

# Execute command in container
docker exec -it xrat-e2e-backend sh
docker exec -it xrat-e2e-frontend sh

# Check health
docker inspect xrat-e2e-backend | grep -A 5 Health
```

### Debug Tests

```javascript
// Add console logs
await page.evaluate(() => console.log('Debug info:', window.someVariable));

// Take screenshot
await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });

// Wait and inspect
await page.pause(); // Opens Playwright Inspector
```

### Check Test State

```javascript
// Check authentication
const token = await getAuthToken(page);
console.log('Auth token:', token);

// Check WebSocket
await page.evaluate(() => {
  console.log('Socket connected:', window.socketConnected);
  console.log('Socket object:', window.socket);
});

// Check localStorage
const storage = await page.evaluate(() => localStorage.getItem('auth-storage'));
console.log('Auth storage:', storage);
```

## 🔍 Troubleshooting

### Tests Timeout

```bash
# Increase timeout in test
test('my test', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
  // ... test code
});

# Or in config
// playwright.config.js
timeout: 120_000,
```

### Services Not Starting

```bash
# Clean and rebuild
docker compose -f __tests__/e2e/setup/docker-compose.e2e.yml down -v
docker compose -f __tests__/e2e/setup/docker-compose.e2e.yml build --no-cache
docker compose -f __tests__/e2e/setup/docker-compose.e2e.yml up -d
```

### Port Conflicts

```bash
# Check what's using ports
netstat -tuln | grep -E ':(3000|5173|27017|6379)'

# Stop conflicting services
docker ps
docker stop <container-id>
```

## 📊 Test Reports

### HTML Report

```bash
# Generate and open
npm run test:e2e:report

# Or manually
npx playwright show-report e2e-report
```

### JSON Results

```bash
# Results are saved to e2e-results.json
cat e2e-results.json | jq '.stats'
```

### CI Reports

Test reports are automatically uploaded to GitHub Actions artifacts:

- HTML report: `e2e-test-results`
- Traces: `playwright-traces` (on failure)

## 🎯 Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Unique Data**: Use timestamps for unique test data
4. **Explicit Waits**: Avoid arbitrary `waitForTimeout`
5. **Assertions**: Use meaningful assertions with good error messages
6. **Fixtures**: Use fixtures for common setups
7. **Helpers**: Use helper functions to reduce duplication

## 📚 Resources

- [Full E2E Testing Guide](__tests__/e2e/README.md)
- [Playwright Documentation](https://playwright.dev/)
- [Test Fixtures](__tests__/e2e/setup/fixtures.js)
- [Test Helpers](__tests__/e2e/setup/helpers.js)

## 💡 Tips

- Use `test.only()` to run a single test during development
- Use `test.skip()` to temporarily skip a test
- Use `--headed` flag to see browser while testing
- Use `--debug` flag to step through tests
- Keep E2E containers running with `E2E_KEEP_CONTAINERS=true`

---

**Need Help?** Check the [full documentation](__tests__/e2e/README.md) or [open an issue](https://github.com/xLabInternet/xRatEcosystem/issues).
