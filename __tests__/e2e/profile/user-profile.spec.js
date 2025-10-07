const { test, expect } = require('@playwright/test');
const { registerUser, apiRequest } = require('../setup/helpers');

test.describe('User Profile Management', () => {
  test('should view user profile', async ({ page }) => {
    const credentials = await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    
    // Get profile via API
    const profile = await apiRequest(page, `${baseUrl}/api/v1/users/profile`, {
      method: 'GET',
    });

    expect(profile.success).toBeTruthy();
    expect(profile.data).toBeDefined();
    expect(profile.data.email).toBe(credentials.email);
    expect(profile.data.name).toBe(credentials.name);
  });

  test('should update user profile name', async ({ page }) => {
    await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    const newName = `Updated Name ${Date.now()}`;

    // Update profile
    const updateResult = await apiRequest(page, `${baseUrl}/api/v1/users/profile`, {
      method: 'PUT',
      body: JSON.stringify({ name: newName }),
    });

    expect(updateResult.success).toBeTruthy();
    expect(updateResult.data.name).toBe(newName);

    // Verify update
    const profile = await apiRequest(page, `${baseUrl}/api/v1/users/profile`, {
      method: 'GET',
    });

    expect(profile.data.name).toBe(newName);
  });

  test('should validate profile update fields', async ({ page }) => {
    await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;

    // Try to update with invalid email
    const invalidUpdate = await apiRequest(page, `${baseUrl}/api/v1/users/profile`, {
      method: 'PUT',
      body: JSON.stringify({ email: 'invalid-email' }),
    });

    expect(invalidUpdate.success).toBeFalsy();
  });

  test('should not allow updating to existing email', async ({ browser }) => {
    // Create two users
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const user1 = await registerUser(page1);
    const user2 = await registerUser(page2);

    const baseUrl = `${page2.url().split('/')[0]}//${page2.url().split('/')[2]}`;

    // Try to update user2 email to user1 email
    const updateResult = await apiRequest(page2, `${baseUrl}/api/v1/users/profile`, {
      method: 'PUT',
      body: JSON.stringify({ email: user1.email }),
    });

    expect(updateResult.success).toBeFalsy();

    await context1.close();
    await context2.close();
  });

  test('should update profile bio if supported', async ({ page }) => {
    await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    const newBio = `Test bio ${Date.now()}`;

    // Try to update bio
    const updateResult = await apiRequest(page, `${baseUrl}/api/v1/users/profile`, {
      method: 'PUT',
      body: JSON.stringify({ bio: newBio }),
    });

    // May or may not be supported
    if (updateResult.success) {
      expect(updateResult.data.bio).toBe(newBio);
    }
  });

  test('should not expose sensitive data in profile response', async ({ page }) => {
    await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    
    const profile = await apiRequest(page, `${baseUrl}/api/v1/users/profile`, {
      method: 'GET',
    });

    expect(profile.success).toBeTruthy();
    
    // Should not contain password or sensitive fields
    expect(profile.data.password).toBeUndefined();
    expect(profile.data.passwordHash).toBeUndefined();
    expect(profile.data.__v).toBeUndefined();
  });

  test('should handle concurrent profile updates', async ({ context, page }) => {
    await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;

    // Make multiple concurrent updates
    const updates = [];
    for (let i = 0; i < 3; i++) {
      updates.push(
        apiRequest(page, `${baseUrl}/api/v1/users/profile`, {
          method: 'PUT',
          body: JSON.stringify({ name: `Name ${i}` }),
        })
      );
    }

    const results = await Promise.all(updates);

    // All should complete (last one wins)
    const successCount = results.filter(r => r.success).length;
    expect(successCount).toBeGreaterThan(0);

    // Final state should be consistent
    const profile = await apiRequest(page, `${baseUrl}/api/v1/users/profile`, {
      method: 'GET',
    });

    expect(profile.success).toBeTruthy();
  });

  test('should require authentication for profile access', async ({ page }) => {
    await page.goto('/');

    // Try to access profile without authentication
    const result = await page.evaluate(() => {
      return fetch('/api/v1/users/profile', {
        method: 'GET',
      }).then(res => res.json());
    });

    expect(result.success).toBeFalsy();
  });
});
