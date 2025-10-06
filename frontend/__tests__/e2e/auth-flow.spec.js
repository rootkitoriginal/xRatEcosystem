import { test, expect } from '@playwright/test';

const createTestCredentials = () => {
  const timestamp = Date.now();
  const email = `e2e+${timestamp}@example.com`;
  const password = `Pass${timestamp}a1`;
  return { email, password, name: `E2E Tester ${timestamp}` };
};

test.describe('Authentication flow', () => {
  test('registers a new user and reaches the dashboard', async ({ page }) => {
    const credentials = createTestCredentials();

    await page.goto('/login');
    await page.getByRole('button', { name: 'Register here' }).click();

    await page.getByLabel('Name').fill(credentials.name);
    await page.getByLabel('Email').fill(credentials.email);
    await page.getByLabel('Password').fill(credentials.password);
    await page.getByLabel('Confirm Password').fill(credentials.password);

    await page.getByRole('button', { name: 'Register' }).click();

    await page.waitForURL('**/');
    await expect(page.getByText(`Hello, ${credentials.name}!`)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'System Status' })).toBeVisible();
  });

  test('logs out and prevents access to protected routes', async ({ page }) => {
    const credentials = createTestCredentials();

    await page.goto('/login');
    await page.getByRole('button', { name: 'Register here' }).click();

    await page.getByLabel('Name').fill(credentials.name);
    await page.getByLabel('Email').fill(credentials.email);
    await page.getByLabel('Password').fill(credentials.password);
    await page.getByLabel('Confirm Password').fill(credentials.password);
    await page.getByRole('button', { name: 'Register' }).click();
    await page.waitForURL('**/');

    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('**/login');
    await expect(page.getByRole('heading', { name: '🔐 Login' })).toBeVisible();

    await page.goto('/');
    await page.waitForURL('**/login');
  });
});
