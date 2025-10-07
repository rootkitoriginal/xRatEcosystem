const { test, expect } = require('@playwright/test');
const { registerUser, apiRequest } = require('../setup/helpers');

test.describe('Data CRUD Operations', () => {
  test('should create new data entry', async ({ page }) => {
    // Register and login
    await registerUser(page);

    // Create data via API
    const testData = {
      key: `test-key-${Date.now()}`,
      value: `test-value-${Date.now()}`,
      metadata: { type: 'test' }
    };

    const result = await apiRequest(page, `${page.url().split('/')[0]}//${page.url().split('/')[2]}/api/v1/data`, {
      method: 'POST',
      body: JSON.stringify(testData),
    });

    expect(result.success).toBeTruthy();
    expect(result.data).toBeDefined();
    expect(result.data.key).toBe(testData.key);

    // Clean up
    if (result.data?._id) {
      await apiRequest(page, `${page.url().split('/')[0]}//${page.url().split('/')[2]}/api/v1/data/${result.data._id}`, {
        method: 'DELETE',
      });
    }
  });

  test('should list data with pagination', async ({ page }) => {
    await registerUser(page);

    // Create multiple data entries
    const createdIds = [];
    for (let i = 0; i < 5; i++) {
      const result = await apiRequest(page, `${page.url().split('/')[0]}//${page.url().split('/')[2]}/api/v1/data`, {
        method: 'POST',
        body: JSON.stringify({
          key: `test-key-${Date.now()}-${i}`,
          value: `test-value-${i}`,
        }),
      });
      
      if (result.success && result.data?._id) {
        createdIds.push(result.data._id);
      }
    }

    // List data
    const listResult = await apiRequest(page, `${page.url().split('/')[0]}//${page.url().split('/')[2]}/api/v1/data?page=1&limit=10`, {
      method: 'GET',
    });

    expect(listResult.success).toBeTruthy();
    expect(Array.isArray(listResult.data)).toBeTruthy();
    expect(listResult.data.length).toBeGreaterThanOrEqual(5);

    // Clean up
    for (const id of createdIds) {
      await apiRequest(page, `${page.url().split('/')[0]}//${page.url().split('/')[2]}/api/v1/data/${id}`, {
        method: 'DELETE',
      });
    }
  });

  test('should retrieve single data entry by ID', async ({ page }) => {
    await registerUser(page);

    // Create data
    const testData = {
      key: `test-key-${Date.now()}`,
      value: `test-value-${Date.now()}`,
    };

    const createResult = await apiRequest(page, `${page.url().split('/')[0]}//${page.url().split('/')[2]}/api/v1/data`, {
      method: 'POST',
      body: JSON.stringify(testData),
    });

    expect(createResult.success).toBeTruthy();
    const dataId = createResult.data._id;

    // Get data by ID
    const getResult = await apiRequest(page, `${page.url().split('/')[0]}//${page.url().split('/')[2]}/api/v1/data/${dataId}`, {
      method: 'GET',
    });

    expect(getResult.success).toBeTruthy();
    expect(getResult.data._id).toBe(dataId);
    expect(getResult.data.key).toBe(testData.key);

    // Clean up
    await apiRequest(page, `${page.url().split('/')[0]}//${page.url().split('/')[2]}/api/v1/data/${dataId}`, {
      method: 'DELETE',
    });
  });

  test('should update existing data entry', async ({ page }) => {
    await registerUser(page);

    // Create data
    const testData = {
      key: `test-key-${Date.now()}`,
      value: `original-value`,
    };

    const createResult = await apiRequest(page, `${page.url().split('/')[0]}//${page.url().split('/')[2]}/api/v1/data`, {
      method: 'POST',
      body: JSON.stringify(testData),
    });

    const dataId = createResult.data._id;

    // Update data
    const updatedData = {
      value: `updated-value-${Date.now()}`,
    };

    const updateResult = await apiRequest(page, `${page.url().split('/')[0]}//${page.url().split('/')[2]}/api/v1/data/${dataId}`, {
      method: 'PUT',
      body: JSON.stringify(updatedData),
    });

    expect(updateResult.success).toBeTruthy();
    expect(updateResult.data.value).toBe(updatedData.value);

    // Clean up
    await apiRequest(page, `${page.url().split('/')[0]}//${page.url().split('/')[2]}/api/v1/data/${dataId}`, {
      method: 'DELETE',
    });
  });

  test('should delete data entry', async ({ page }) => {
    await registerUser(page);

    // Create data
    const testData = {
      key: `test-key-${Date.now()}`,
      value: `test-value`,
    };

    const createResult = await apiRequest(page, `${page.url().split('/')[0]}//${page.url().split('/')[2]}/api/v1/data`, {
      method: 'POST',
      body: JSON.stringify(testData),
    });

    const dataId = createResult.data._id;

    // Delete data
    const deleteResult = await apiRequest(page, `${page.url().split('/')[0]}//${page.url().split('/')[2]}/api/v1/data/${dataId}`, {
      method: 'DELETE',
    });

    expect(deleteResult.success).toBeTruthy();

    // Verify deletion
    const getResult = await apiRequest(page, `${page.url().split('/')[0]}//${page.url().split('/')[2]}/api/v1/data/${dataId}`, {
      method: 'GET',
    });

    expect(getResult.success).toBeFalsy();
  });

  test('should validate required fields on create', async ({ page }) => {
    await registerUser(page);

    // Try to create data without required fields
    const invalidData = {};

    const result = await apiRequest(page, `${page.url().split('/')[0]}//${page.url().split('/')[2]}/api/v1/data`, {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    expect(result.success).toBeFalsy();
    expect(result.error || result.message).toBeDefined();
  });

  test('should prevent unauthorized access to data', async ({ page }) => {
    // Don't login - try to access data without auth
    await page.goto('/');

    // Try to create data without authentication
    const result = await page.evaluate(() => {
      return fetch('/api/v1/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'test', value: 'test' }),
      }).then(res => res.json());
    });

    expect(result.success).toBeFalsy();
  });
});
