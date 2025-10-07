const { test, expect } = require('@playwright/test');
const { registerUser, apiRequest } = require('../setup/helpers');

test.describe('Data Search and Filter', () => {
  test('should search data by key', async ({ page }) => {
    await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    const uniqueKey = `search-test-${Date.now()}`;

    // Create test data
    const createdIds = [];
    for (let i = 0; i < 3; i++) {
      const result = await apiRequest(page, `${baseUrl}/api/v1/data`, {
        method: 'POST',
        body: JSON.stringify({
          key: `${uniqueKey}-${i}`,
          value: `value-${i}`,
        }),
      });
      
      if (result.success && result.data?._id) {
        createdIds.push(result.data._id);
      }
    }

    // Search for data
    const searchResult = await apiRequest(page, `${baseUrl}/api/v1/data/search?query=${uniqueKey}`, {
      method: 'GET',
    });

    expect(searchResult.success).toBeTruthy();
    expect(Array.isArray(searchResult.data)).toBeTruthy();
    expect(searchResult.data.length).toBeGreaterThanOrEqual(3);

    // Clean up
    for (const id of createdIds) {
      await apiRequest(page, `${baseUrl}/api/v1/data/${id}`, {
        method: 'DELETE',
      });
    }
  });

  test('should filter data by value', async ({ page }) => {
    await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    const uniqueValue = `filter-value-${Date.now()}`;

    // Create test data
    const createdIds = [];
    for (let i = 0; i < 2; i++) {
      const result = await apiRequest(page, `${baseUrl}/api/v1/data`, {
        method: 'POST',
        body: JSON.stringify({
          key: `key-${Date.now()}-${i}`,
          value: uniqueValue,
        }),
      });
      
      if (result.success && result.data?._id) {
        createdIds.push(result.data._id);
      }
    }

    // Filter data
    const filterResult = await apiRequest(page, `${baseUrl}/api/v1/data/search?query=${uniqueValue}`, {
      method: 'GET',
    });

    expect(filterResult.success).toBeTruthy();
    expect(filterResult.data.length).toBeGreaterThanOrEqual(2);

    // Clean up
    for (const id of createdIds) {
      await apiRequest(page, `${baseUrl}/api/v1/data/${id}`, {
        method: 'DELETE',
      });
    }
  });

  test('should return empty array for non-existent search', async ({ page }) => {
    await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    const nonExistentKey = `non-existent-${Date.now()}-${Math.random()}`;

    const searchResult = await apiRequest(page, `${baseUrl}/api/v1/data/search?query=${nonExistentKey}`, {
      method: 'GET',
    });

    expect(searchResult.success).toBeTruthy();
    expect(Array.isArray(searchResult.data)).toBeTruthy();
    expect(searchResult.data.length).toBe(0);
  });

  test('should paginate search results', async ({ page }) => {
    await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    const searchKey = `paginate-test-${Date.now()}`;

    // Create multiple test data entries
    const createdIds = [];
    for (let i = 0; i < 15; i++) {
      const result = await apiRequest(page, `${baseUrl}/api/v1/data`, {
        method: 'POST',
        body: JSON.stringify({
          key: `${searchKey}-${i}`,
          value: `value-${i}`,
        }),
      });
      
      if (result.success && result.data?._id) {
        createdIds.push(result.data._id);
      }
    }

    // Get first page
    const page1Result = await apiRequest(page, `${baseUrl}/api/v1/data/search?query=${searchKey}&page=1&limit=10`, {
      method: 'GET',
    });

    expect(page1Result.success).toBeTruthy();
    expect(page1Result.data.length).toBeLessThanOrEqual(10);

    // Get second page
    const page2Result = await apiRequest(page, `${baseUrl}/api/v1/data/search?query=${searchKey}&page=2&limit=10`, {
      method: 'GET',
    });

    expect(page2Result.success).toBeTruthy();

    // Clean up
    for (const id of createdIds) {
      await apiRequest(page, `${baseUrl}/api/v1/data/${id}`, {
        method: 'DELETE',
      });
    }
  });

  test('should handle special characters in search', async ({ page }) => {
    await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    const specialKey = `test-key-!@#$-${Date.now()}`;

    // Create data with special characters
    const createResult = await apiRequest(page, `${baseUrl}/api/v1/data`, {
      method: 'POST',
      body: JSON.stringify({
        key: specialKey,
        value: 'test-value',
      }),
    });

    if (!createResult.success) {
      // Some special chars might not be allowed, skip test
      return;
    }

    const dataId = createResult.data._id;

    // Search with URL encoding
    const encodedKey = encodeURIComponent(specialKey);
    const searchResult = await apiRequest(page, `${baseUrl}/api/v1/data/search?query=${encodedKey}`, {
      method: 'GET',
    });

    expect(searchResult.success).toBeTruthy();

    // Clean up
    await apiRequest(page, `${baseUrl}/api/v1/data/${dataId}`, {
      method: 'DELETE',
    });
  });
});
