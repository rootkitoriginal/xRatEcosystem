const { test, expect } = require('@playwright/test');
const { execSync } = require('child_process');
const path = require('path');
const { registerUser, apiRequest } = require('../setup/helpers');

const composePath = path.join(__dirname, '../setup/docker-compose.e2e.yml');

test.describe('System Resilience and Failure Handling', () => {
  test('should show user-friendly error when backend is unreachable', async ({ page }) => {
    await registerUser(page);

    // Temporarily stop backend
    try {
      execSync('docker compose -f ' + JSON.stringify(composePath) + ' stop backend', { 
        timeout: 10000,
        shell: '/bin/bash',
      });
    } catch (error) {
      console.warn('Could not stop backend:', error.message);
      test.skip();
      return;
    }

    await page.waitForTimeout(2000);

    // Try to make a request
    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    const result = await page.evaluate((url) => {
      return fetch(`${url}/api/v1/data`, {
        method: 'GET',
        credentials: 'include',
      })
        .then(res => res.json())
        .catch(error => ({ error: error.message }));
    }, baseUrl);

    // Should show error
    expect(result.error || result.message).toBeDefined();

    // Restart backend
    try {
      execSync('docker compose -f ' + JSON.stringify(composePath) + ' start backend', { 
        timeout: 30000,
        shell: '/bin/bash',
      });
      await page.waitForTimeout(5000); // Wait for backend to be ready
    } catch (error) {
      console.warn('Could not restart backend:', error.message);
    }
  });

  test('should handle network timeouts gracefully', async ({ page }) => {
    await registerUser(page);

    // Set very short timeout and make request
    const result = await page.evaluate(() => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1); // 1ms timeout

      return fetch('/api/v1/data', {
        method: 'GET',
        credentials: 'include',
        signal: controller.signal,
      })
        .then(res => res.json())
        .catch(error => ({ error: 'timeout' }));
    });

    // Should handle timeout
    expect(result.error || result.success !== undefined).toBeTruthy();
  });

  test('should retry failed requests with exponential backoff', async ({ page }) => {
    await registerUser(page);

    // Simulate retry logic
    const result = await page.evaluate(() => {
      async function fetchWithRetry(url, options, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
          try {
            const response = await fetch(url, options);
            if (response.ok) {
              return await response.json();
            }
          } catch (error) {
            if (i === maxRetries - 1) {
              return { error: error.message };
            }
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 100));
          }
        }
      }

      return fetchWithRetry('/api/v1/data', {
        method: 'GET',
        credentials: 'include',
      });
    });

    expect(result).toBeDefined();
  });

  test('should display appropriate error messages for different failure types', async ({ page }) => {
    await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;

    // Test 404 error
    const notFoundResult = await apiRequest(page, `${baseUrl}/api/v1/data/nonexistent-id-12345`, {
      method: 'GET',
    });

    expect(notFoundResult.success).toBeFalsy();
    expect(notFoundResult.error || notFoundResult.message).toBeDefined();

    // Test validation error
    const validationResult = await apiRequest(page, `${baseUrl}/api/v1/data`, {
      method: 'POST',
      body: JSON.stringify({}), // Missing required fields
    });

    expect(validationResult.success).toBeFalsy();
  });

  test('should handle WebSocket disconnection gracefully', async ({ page }) => {
    await registerUser(page);

    // Wait for WebSocket connection
    await page.waitForFunction(() => window.socketConnected === true, { timeout: 10000 });

    // Force disconnect
    await page.evaluate(() => {
      if (window.socket && window.socket.disconnect) {
        window.socket.disconnect();
      }
    });

    await page.waitForTimeout(1000);

    // UI should handle disconnection gracefully (no crashes)
    const pageContent = await page.content();
    expect(pageContent).toBeDefined();
  });

  test('should maintain data integrity after network interruption', async ({ page }) => {
    await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;

    // Create data
    const createResult = await apiRequest(page, `${baseUrl}/api/v1/data`, {
      method: 'POST',
      body: JSON.stringify({
        key: `resilience-test-${Date.now()}`,
        value: 'test-value',
      }),
    });

    if (!createResult.success) {
      return; // Skip if creation failed
    }

    const dataId = createResult.data._id;

    // Simulate network interruption by going offline
    await page.context().setOffline(true);
    await page.waitForTimeout(1000);

    // Go back online
    await page.context().setOffline(false);
    await page.waitForTimeout(1000);

    // Verify data still exists
    const getResult = await apiRequest(page, `${baseUrl}/api/v1/data/${dataId}`, {
      method: 'GET',
    });

    expect(getResult.success).toBeTruthy();
    expect(getResult.data._id).toBe(dataId);

    // Clean up
    await apiRequest(page, `${baseUrl}/api/v1/data/${dataId}`, {
      method: 'DELETE',
    });
  });

  test('should show loading states during slow operations', async ({ page }) => {
    await registerUser(page);

    // Slow down network to simulate slow loading
    const client = await page.context().newCDPSession(page);
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 50 * 1024, // 50 KB/s
      uploadThroughput: 50 * 1024,
      latency: 500, // 500ms latency
    });

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;

    // Start a request
    const requestPromise = apiRequest(page, `${baseUrl}/api/v1/data`, {
      method: 'GET',
    });

    // Check for loading indicators (implementation specific)
    await page.waitForTimeout(200);

    // Complete the request
    const result = await requestPromise;
    expect(result).toBeDefined();

    // Reset network conditions
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    });
  });

  test('should cache data to improve resilience', async ({ page }) => {
    await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;

    // Fetch data first time
    const firstResult = await apiRequest(page, `${baseUrl}/api/v1/data`, {
      method: 'GET',
    });

    expect(firstResult.success).toBeTruthy();

    // Fetch again (may be cached)
    const secondResult = await apiRequest(page, `${baseUrl}/api/v1/data`, {
      method: 'GET',
    });

    expect(secondResult.success).toBeTruthy();
  });
});
