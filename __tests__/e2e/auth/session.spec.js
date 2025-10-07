const { test, expect } = require('@playwright/test');
const { registerUser, loginUser, getAuthToken } = require('../setup/helpers');

test.describe('Session Management', () => {
  test('should maintain session across multiple tabs', async ({ context, page }) => {
    // Register and login in first tab
    const credentials = await registerUser(page);
    await expect(page.getByText(`Hello, ${credentials.name}!`)).toBeVisible();

    // Open second tab
    const page2 = await context.newPage();
    await page2.goto('/');

    // Should be logged in on second tab
    await expect(page2.getByText(`Hello, ${credentials.name}!`)).toBeVisible();

    await page2.close();
  });

  test('should logout from all tabs when logout is clicked', async ({ context, page }) => {
    // Register and login
    const credentials = await registerUser(page);

    // Open second tab
    const page2 = await context.newPage();
    await page2.goto('/');
    await expect(page2.getByText(`Hello, ${credentials.name}!`)).toBeVisible();

    // Logout from first tab
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('**/login');

    // Second tab should also be logged out on next navigation
    await page2.reload();
    await page2.waitForURL('**/login');

    await page2.close();
  });

  test('should handle expired token gracefully', async ({ page }) => {
    // Register and login
    const credentials = await registerUser(page);
    await expect(page.getByText(`Hello, ${credentials.name}!`)).toBeVisible();

    // Clear auth token to simulate expiration
    await page.evaluate(() => {
      localStorage.removeItem('auth-storage');
      sessionStorage.clear();
    });

    // Try to navigate to protected route
    await page.goto('/');
    
    // Should redirect to login
    await page.waitForURL('**/login');
  });

  test('should store auth token in localStorage', async ({ page }) => {
    // Register and login
    const credentials = await registerUser(page);
    
    // Check that token is stored
    const token = await getAuthToken(page);
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
  });

  test('should clear auth token on logout', async ({ page }) => {
    // Register and login
    await registerUser(page);
    
    // Verify token exists
    let token = await getAuthToken(page);
    expect(token).toBeTruthy();

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('**/login');

    // Token should be cleared
    token = await getAuthToken(page);
    expect(token).toBeFalsy();
  });

  test('should handle multiple login attempts', async ({ page }) => {
    // Register user
    const credentials = await registerUser(page);
    
    // Logout
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('**/login');

    // Login multiple times
    for (let i = 0; i < 3; i++) {
      await page.getByLabel('Email').fill(credentials.email);
      await page.getByLabel('Password').fill(credentials.password);
      await page.getByRole('button', { name: /login|sign in/i }).click();
      await page.waitForURL('**/');
      
      await page.getByRole('button', { name: 'Logout' }).click();
      await page.waitForURL('**/login');
    }

    // Should still be able to login
    await page.getByLabel('Email').fill(credentials.email);
    await page.getByLabel('Password').fill(credentials.password);
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await page.waitForURL('**/');
    await expect(page.getByText(`Hello, ${credentials.name}!`)).toBeVisible();
  });

  test('should handle simultaneous login from multiple contexts', async ({ browser }) => {
    const credentials = {
      name: `E2E Tester ${Date.now()}`,
      email: `e2e+${Date.now()}@example.com`,
      password: `Pass${Date.now()}a1!`
    };

    // Register user in first context
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    
    await page1.goto('/login');
    await page1.getByRole('button', { name: 'Register here' }).click();
    await page1.getByLabel('Name').fill(credentials.name);
    await page1.getByLabel('Email').fill(credentials.email);
    await page1.getByLabel('Password').fill(credentials.password);
    await page1.getByLabel('Confirm Password').fill(credentials.password);
    await page1.getByRole('button', { name: 'Register' }).click();
    await page1.waitForURL('**/');

    // Login same user in second context
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    
    await page2.goto('/login');
    await page2.getByLabel('Email').fill(credentials.email);
    await page2.getByLabel('Password').fill(credentials.password);
    await page2.getByRole('button', { name: /login|sign in/i }).click();
    await page2.waitForURL('**/');

    // Both should be logged in
    await expect(page1.getByText(`Hello, ${credentials.name}!`)).toBeVisible();
    await expect(page2.getByText(`Hello, ${credentials.name}!`)).toBeVisible();

    await context1.close();
    await context2.close();
  });
});
