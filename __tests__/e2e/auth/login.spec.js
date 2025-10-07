const { test, expect } = require('@playwright/test');
const { createTestCredentials, registerUser } = require('../setup/helpers');

test.describe('User Login', () => {
  test('should successfully login with valid credentials', async ({ page }) => {
    // First register a user
    const credentials = await registerUser(page);

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('**/login');

    // Now login
    await page.getByLabel('Email').fill(credentials.email);
    await page.getByLabel('Password').fill(credentials.password);
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Should redirect to dashboard
    await page.waitForURL('**/');
    await expect(page.getByText(`Hello, ${credentials.name}!`)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('nonexistent@example.com');
    await page.getByLabel('Password').fill('WrongPassword123!');
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid.*credentials|incorrect|not found/i)).toBeVisible();
  });

  test('should show error for wrong password', async ({ page }) => {
    // First register a user
    const credentials = await registerUser(page);

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('**/login');

    // Try to login with wrong password
    await page.getByLabel('Email').fill(credentials.email);
    await page.getByLabel('Password').fill('WrongPassword123!');
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid.*credentials|incorrect|password/i)).toBeVisible();
  });

  test('should require email and password', async ({ page }) => {
    await page.goto('/login');

    // Try to submit without filling fields
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Should show validation
    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password');
    
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('should persist session after refresh', async ({ page }) => {
    // Register and login
    const credentials = await registerUser(page);

    // Verify logged in
    await expect(page.getByText(`Hello, ${credentials.name}!`)).toBeVisible();

    // Refresh page
    await page.reload();

    // Should still be logged in
    await expect(page.getByText(`Hello, ${credentials.name}!`)).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.getByLabel('Password');
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button if available
    const toggleButton = page.locator('[aria-label*="password" i], [title*="password" i]').first();
    
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      // Password should now be visible
      await expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });
});
