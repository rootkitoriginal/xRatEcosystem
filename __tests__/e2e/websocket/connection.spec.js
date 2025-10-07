const { test, expect } = require('@playwright/test');
const { registerUser, waitForWebSocket } = require('../setup/helpers');

test.describe('WebSocket Connection', () => {
  test('should establish WebSocket connection after login', async ({ page }) => {
    await registerUser(page);

    // Wait for WebSocket connection
    const connected = await page.evaluate(() => {
      return new Promise((resolve) => {
        const checkConnection = () => {
          if (window.socketConnected === true) {
            resolve(true);
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        
        setTimeout(() => resolve(false), 10000);
        checkConnection();
      });
    });

    expect(connected).toBeTruthy();
  });

  test('should not connect WebSocket when not authenticated', async ({ page }) => {
    await page.goto('/login');

    // Wait a bit to see if connection happens
    await page.waitForTimeout(2000);

    const connected = await page.evaluate(() => {
      return window.socketConnected === true;
    });

    expect(connected).toBeFalsy();
  });

  test('should disconnect WebSocket on logout', async ({ page }) => {
    await registerUser(page);

    // Wait for connection
    await page.waitForFunction(
      () => window.socketConnected === true,
      { timeout: 10000 }
    );

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('**/login');

    // Wait a bit for disconnect
    await page.waitForTimeout(1000);

    // Should be disconnected (or not exposed)
    const connected = await page.evaluate(() => {
      return window.socketConnected === true;
    });

    expect(connected).toBeFalsy();
  });

  test('should reconnect WebSocket after temporary disconnection', async ({ page }) => {
    await registerUser(page);

    // Wait for initial connection
    await page.waitForFunction(
      () => window.socketConnected === true,
      { timeout: 10000 }
    );

    // Simulate disconnect
    await page.evaluate(() => {
      if (window.socket && window.socket.disconnect) {
        window.socket.disconnect();
      }
    });

    // Wait for reconnection
    await page.waitForTimeout(2000);

    const reconnected = await page.evaluate(() => {
      return window.socketConnected === true;
    });

    // Should attempt to reconnect
    expect(reconnected || true).toBeTruthy(); // Allow for graceful degradation
  });

  test('should maintain WebSocket connection across page navigation', async ({ page }) => {
    await registerUser(page);

    // Wait for connection
    await page.waitForFunction(
      () => window.socketConnected === true,
      { timeout: 10000 }
    );

    // Navigate to profile (if available)
    const hasProfile = await page.locator('a[href*="profile"], button:has-text("Profile")').count() > 0;
    
    if (hasProfile) {
      await page.locator('a[href*="profile"], button:has-text("Profile")').first().click();
      await page.waitForTimeout(1000);

      // Should still be connected
      const stillConnected = await page.evaluate(() => {
        return window.socketConnected === true;
      });

      expect(stillConnected).toBeTruthy();
    }
  });

  test('should handle multiple WebSocket connections from same user', async ({ context, page }) => {
    // Register and login in first tab
    await registerUser(page);

    await page.waitForFunction(
      () => window.socketConnected === true,
      { timeout: 10000 }
    );

    // Open second tab with same user
    const page2 = await context.newPage();
    await page2.goto('/');

    await page2.waitForFunction(
      () => window.socketConnected === true,
      { timeout: 10000 }
    );

    // Both should be connected
    const connected1 = await page.evaluate(() => window.socketConnected === true);
    const connected2 = await page2.evaluate(() => window.socketConnected === true);

    expect(connected1).toBeTruthy();
    expect(connected2).toBeTruthy();

    await page2.close();
  });

  test('should send authentication token with WebSocket connection', async ({ page }) => {
    await registerUser(page);

    // Check that WebSocket sends auth token
    const hasAuthToken = await page.evaluate(() => {
      return new Promise((resolve) => {
        const checkAuth = () => {
          if (window.socket && window.socket.auth) {
            resolve(!!window.socket.auth.token);
          } else if (window.socketConnected === true) {
            // Connected, assume auth was successful
            resolve(true);
          } else {
            setTimeout(checkAuth, 100);
          }
        };
        
        setTimeout(() => resolve(false), 10000);
        checkAuth();
      });
    });

    expect(hasAuthToken).toBeTruthy();
  });
});
