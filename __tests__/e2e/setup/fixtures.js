const { test as base } = require('@playwright/test');
const { registerUser, loginUser, logoutUser } = require('./helpers');

/**
 * Custom fixtures for E2E tests
 */
const test = base.extend({
  /**
   * Fixture: Authenticated user
   * Automatically registers and logs in a user before each test
   */
  authenticatedUser: async ({ page }, use) => {
    const credentials = await registerUser(page);
    await use(credentials);
    
    // Cleanup: logout after test
    try {
      await logoutUser(page);
    } catch (error) {
      console.warn('Failed to logout in cleanup:', error.message);
    }
  },

  /**
   * Fixture: Multiple authenticated users
   * Creates multiple users for testing multi-user scenarios
   */
  multipleUsers: async ({ browser }, use) => {
    const users = [];
    const contexts = [];

    // Create 3 test users
    for (let i = 0; i < 3; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      const credentials = await registerUser(page);
      
      users.push({ credentials, page, context });
      contexts.push(context);
    }

    await use(users);

    // Cleanup: close all contexts
    for (const context of contexts) {
      await context.close();
    }
  },

  /**
   * Fixture: Test data
   * Creates test data that is automatically cleaned up
   */
  testData: async ({ page }, use) => {
    const createdData = [];

    // Helper to create data and track it for cleanup
    const createData = async (data) => {
      const result = await page.evaluate((dataToCreate) => {
        return fetch('/api/v1/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToCreate),
          credentials: 'include',
        }).then(res => res.json());
      }, data);

      if (result.success && result.data?._id) {
        createdData.push(result.data._id);
      }

      return result;
    };

    await use({ createData, createdData });

    // Cleanup: delete all created data
    for (const id of createdData) {
      try {
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
  },

  /**
   * Fixture: WebSocket connection
   * Ensures WebSocket is connected before test
   */
  connectedWebSocket: async ({ page }, use) => {
    // Wait for WebSocket to connect
    await page.waitForFunction(
      () => {
        return window.socketConnected === true;
      },
      { timeout: 10000 }
    );

    await use(page);
  },
});

module.exports = { test };
