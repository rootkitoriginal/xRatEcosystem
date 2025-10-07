/**
 * Helper utilities for E2E tests
 */

/**
 * Generate unique test credentials
 */
function createTestCredentials() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const email = `e2e+${timestamp}${random}@example.com`;
  const password = `Pass${timestamp}a1!`;
  const name = `E2E Tester ${timestamp}`;
  
  return { email, password, name };
}

/**
 * Register a new user and return credentials with auth tokens
 */
async function registerUser(page) {
  const credentials = createTestCredentials();

  await page.goto('/login');
  await page.getByRole('button', { name: 'Register here' }).click();

  await page.getByLabel('Name').fill(credentials.name);
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByLabel('Confirm Password').fill(credentials.password);

  await page.getByRole('button', { name: 'Register' }).click();
  await page.waitForURL('**/');

  return credentials;
}

/**
 * Login with existing credentials
 */
async function loginUser(page, email, password) {
  await page.goto('/login');
  
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  
  await page.getByRole('button', { name: /login|sign in/i }).click();
  await page.waitForURL('**/');
}

/**
 * Logout current user
 */
async function logoutUser(page) {
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.waitForURL('**/login');
}

/**
 * Wait for an element with retry logic
 */
async function waitForElement(page, selector, options = {}) {
  const { timeout = 10000, retries = 3 } = options;
  
  for (let i = 0; i < retries; i++) {
    try {
      await page.waitForSelector(selector, { timeout: timeout / retries });
      return true;
    } catch (error) {
      if (i === retries - 1) throw error;
      await page.waitForTimeout(1000);
    }
  }
}

/**
 * Create test data via API
 */
async function createTestData(page, data = {}) {
  const defaultData = {
    key: `test-key-${Date.now()}`,
    value: `test-value-${Date.now()}`,
    ...data,
  };

  // Navigate to data creation form or use API directly
  return defaultData;
}

/**
 * Clean up test data
 */
async function cleanupTestData(page, dataIds = []) {
  // Delete test data created during tests
  for (const id of dataIds) {
    try {
      // API call to delete data
      await page.evaluate((dataId) => {
        return fetch(`/api/v1/data/${dataId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
      }, id);
    } catch (error) {
      console.warn(`Failed to cleanup data ${id}:`, error.message);
    }
  }
}

/**
 * Wait for WebSocket connection
 */
async function waitForWebSocket(page, timeout = 5000) {
  return page.waitForFunction(
    () => {
      return window.socketConnected === true;
    },
    { timeout }
  );
}

/**
 * Retry an action with exponential backoff
 */
async function retryAction(action, options = {}) {
  const { maxRetries = 3, initialDelay = 1000, backoffMultiplier = 2 } = options;
  
  let delay = initialDelay;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= backoffMultiplier;
    }
  }
}

/**
 * Get localStorage token for API calls
 */
async function getAuthToken(page) {
  return page.evaluate(() => {
    const authData = localStorage.getItem('auth-storage');
    if (!authData) return null;
    
    try {
      const parsed = JSON.parse(authData);
      return parsed.state?.token || null;
    } catch (error) {
      return null;
    }
  });
}

/**
 * Make authenticated API request
 */
async function apiRequest(page, endpoint, options = {}) {
  const token = await getAuthToken(page);
  
  return page.evaluate(
    ({ endpoint, options, token }) => {
      return fetch(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
          ...options.headers,
        },
        credentials: 'include',
      }).then(res => res.json());
    },
    { endpoint, options, token }
  );
}

/**
 * Wait for network idle
 */
async function waitForNetworkIdle(page, timeout = 5000) {
  return page.waitForLoadState('networkidle', { timeout });
}

module.exports = {
  createTestCredentials,
  registerUser,
  loginUser,
  logoutUser,
  waitForElement,
  createTestData,
  cleanupTestData,
  waitForWebSocket,
  retryAction,
  getAuthToken,
  apiRequest,
  waitForNetworkIdle,
};
