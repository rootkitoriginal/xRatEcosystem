const { test, expect } = require('@playwright/test');
const { createTestCredentials } = require('../setup/helpers');

test.describe('User Registration', () => {
  test('should successfully register a new user', async ({ page }) => {
    const credentials = createTestCredentials();

    await page.goto('/login');
    await page.getByRole('button', { name: 'Register here' }).click();

    await page.getByLabel('Name').fill(credentials.name);
    await page.getByLabel('Email').fill(credentials.email);
    await page.getByLabel('Password').fill(credentials.password);
    await page.getByLabel('Confirm Password').fill(credentials.password);

    await page.getByRole('button', { name: 'Register' }).click();

    // Should redirect to dashboard
    await page.waitForURL('**/');
    await expect(page.getByText(`Hello, ${credentials.name}!`)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'System Status' })).toBeVisible();
  });

  test('should show error for duplicate email', async ({ page }) => {
    const credentials = createTestCredentials();

    // Register first time
    await page.goto('/login');
    await page.getByRole('button', { name: 'Register here' }).click();
    await page.getByLabel('Name').fill(credentials.name);
    await page.getByLabel('Email').fill(credentials.email);
    await page.getByLabel('Password').fill(credentials.password);
    await page.getByLabel('Confirm Password').fill(credentials.password);
    await page.getByRole('button', { name: 'Register' }).click();
    await page.waitForURL('**/');

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('**/login');

    // Try to register again with same email
    await page.getByRole('button', { name: 'Register here' }).click();
    await page.getByLabel('Name').fill('Different Name');
    await page.getByLabel('Email').fill(credentials.email);
    await page.getByLabel('Password').fill(credentials.password);
    await page.getByLabel('Confirm Password').fill(credentials.password);
    await page.getByRole('button', { name: 'Register' }).click();

    // Should show error message
    await expect(page.getByText(/already exists|already registered/i)).toBeVisible();
  });

  test('should validate password requirements', async ({ page }) => {
    const credentials = createTestCredentials();

    await page.goto('/login');
    await page.getByRole('button', { name: 'Register here' }).click();

    await page.getByLabel('Name').fill(credentials.name);
    await page.getByLabel('Email').fill(credentials.email);
    
    // Try weak password
    await page.getByLabel('Password').fill('weak');
    await page.getByLabel('Confirm Password').fill('weak');
    await page.getByRole('button', { name: 'Register' }).click();

    // Should show validation error
    await expect(page.locator('text=/password.*least.*characters/i')).toBeVisible({ timeout: 5000 });
  });

  test('should validate password confirmation match', async ({ page }) => {
    const credentials = createTestCredentials();

    await page.goto('/login');
    await page.getByRole('button', { name: 'Register here' }).click();

    await page.getByLabel('Name').fill(credentials.name);
    await page.getByLabel('Email').fill(credentials.email);
    await page.getByLabel('Password').fill(credentials.password);
    await page.getByLabel('Confirm Password').fill('DifferentPassword123!');
    await page.getByRole('button', { name: 'Register' }).click();

    // Should show validation error
    await expect(page.locator('text=/password.*match/i')).toBeVisible({ timeout: 5000 });
  });

  test('should validate email format', async ({ page }) => {
    const credentials = createTestCredentials();

    await page.goto('/login');
    await page.getByRole('button', { name: 'Register here' }).click();

    await page.getByLabel('Name').fill(credentials.name);
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByLabel('Password').fill(credentials.password);
    await page.getByLabel('Confirm Password').fill(credentials.password);
    await page.getByRole('button', { name: 'Register' }).click();

    // Should show validation error
    await expect(page.locator('text=/valid.*email|email.*invalid/i')).toBeVisible({ timeout: 5000 });
  });

  test('should require all fields', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Register here' }).click();

    // Try to submit without filling fields
    await page.getByRole('button', { name: 'Register' }).click();

    // Should show validation errors
    const nameInput = page.getByLabel('Name');
    const emailInput = page.getByLabel('Email');
    
    await expect(nameInput).toHaveAttribute('required', '');
    await expect(emailInput).toHaveAttribute('required', '');
  });
});
