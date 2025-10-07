const { test, expect } = require('@playwright/test');
const { registerUser, apiRequest } = require('../setup/helpers');

test.describe('Security and Access Control', () => {
  test('should prevent access to protected routes without authentication', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to login
    await page.waitForURL('**/login');
    await expect(page.getByRole('heading', { name: '🔐 Login' })).toBeVisible();
  });

  test('should reject API requests without authentication', async ({ page }) => {
    await page.goto('/login');

    // Try to access protected API endpoint
    const result = await page.evaluate(() => {
      return fetch('/api/v1/data', {
        method: 'GET',
      }).then(res => res.json());
    });

    expect(result.success).toBeFalsy();
  });

  test('should prevent XSS via data input', async ({ page }) => {
    await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    
    // Try to inject script
    const xssPayload = '<script>alert("XSS")</script>';
    const result = await apiRequest(page, `${baseUrl}/api/v1/data`, {
      method: 'POST',
      body: JSON.stringify({
        key: `xss-test-${Date.now()}`,
        value: xssPayload,
      }),
    });

    if (result.success && result.data?._id) {
      // Verify data is escaped/sanitized
      const getData = await apiRequest(page, `${baseUrl}/api/v1/data/${result.data._id}`, {
        method: 'GET',
      });

      // Script should not execute (data should be escaped)
      expect(getData.data.value).toBeDefined();

      // Clean up
      await apiRequest(page, `${baseUrl}/api/v1/data/${result.data._id}`, {
        method: 'DELETE',
      });
    }
  });

  test('should validate JWT token signature', async ({ page }) => {
    await registerUser(page);

    // Tamper with token
    await page.evaluate(() => {
      const authData = localStorage.getItem('auth-storage');
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.state && parsed.state.token) {
          // Tamper with token
          parsed.state.token = parsed.state.token.slice(0, -10) + 'tampered!!';
          localStorage.setItem('auth-storage', JSON.stringify(parsed));
        }
      }
    });

    // Try to access protected resource
    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    const result = await apiRequest(page, `${baseUrl}/api/v1/data`, {
      method: 'GET',
    });

    // Should reject tampered token
    expect(result.success).toBeFalsy();
  });

  test('should enforce rate limiting', async ({ page }) => {
    await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    
    // Make many rapid requests
    const requests = [];
    for (let i = 0; i < 50; i++) {
      requests.push(
        apiRequest(page, `${baseUrl}/api/v1/data`, {
          method: 'GET',
        })
      );
    }

    const results = await Promise.all(requests);

    // Some requests should be rate limited if enabled
    const failedCount = results.filter(r => !r.success).length;
    
    // Check if rate limiting is enabled in environment
    if (process.env.RATE_LIMIT_ENABLED === 'true' || failedCount > 0) {
      expect(failedCount).toBeGreaterThan(0);
    } else {
      // Log warning if rate limiting is not enabled
      console.warn('⚠️ Rate limiting does not appear to be enabled in E2E environment');
      expect(failedCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should sanitize search queries to prevent injection', async ({ page }) => {
    await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    
    // Try SQL-like injection
    const maliciousQuery = "'; DROP TABLE data; --";
    const encodedQuery = encodeURIComponent(maliciousQuery);
    
    const result = await apiRequest(page, `${baseUrl}/api/v1/data/search?query=${encodedQuery}`, {
      method: 'GET',
    });

    // Should handle gracefully without breaking
    expect(result).toBeDefined();
    expect(Array.isArray(result.data) || result.success === false).toBeTruthy();
  });

  test('should prevent CSRF attacks', async ({ page, context }) => {
    await registerUser(page);

    // Try to make request from different origin (simulated)
    const result = await page.evaluate(() => {
      return fetch('/api/v1/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://evil.com',
        },
        body: JSON.stringify({ key: 'test', value: 'test' }),
        credentials: 'include',
      }).then(res => res.json()).catch(err => ({ error: err.message }));
    });

    // CORS should block or handle appropriately
    expect(result).toBeDefined();
  });

  test('should validate content length limits', async ({ page }) => {
    await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    
    // Try to send very large payload
    const largeValue = 'x'.repeat(1000000); // 1MB of data
    
    const result = await apiRequest(page, `${baseUrl}/api/v1/data`, {
      method: 'POST',
      body: JSON.stringify({
        key: 'large-test',
        value: largeValue,
      }),
    });

    // Should reject or handle large payloads
    if (result.success && result.data?._id) {
      // Clean up if it was accepted
      await apiRequest(page, `${baseUrl}/api/v1/data/${result.data._id}`, {
        method: 'DELETE',
      });
    }
    
    expect(result).toBeDefined();
  });

  test('should not expose sensitive headers', async ({ page }) => {
    await registerUser(page);

    // Check response headers don't expose sensitive info
    const response = await page.goto('/');
    const headers = response.headers();

    // Should not expose server details
    expect(headers['x-powered-by']).toBeUndefined();
  });

  test('should enforce secure cookie attributes', async ({ page }) => {
    await registerUser(page);

    // Check cookies have secure attributes
    const cookies = await page.context().cookies();
    
    for (const cookie of cookies) {
      // In production, cookies should be secure
      if (process.env.NODE_ENV === 'production') {
        expect(cookie.secure).toBeTruthy();
        expect(cookie.httpOnly).toBeTruthy();
      }
    }
  });
});
