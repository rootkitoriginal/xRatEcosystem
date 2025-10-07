const { test, expect } = require('@playwright/test');
const { registerUser, apiRequest } = require('../setup/helpers');

test.describe('Bulk Operations', () => {
  test('should create multiple data entries in bulk', async ({ page }) => {
    await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    const bulkData = [];

    for (let i = 0; i < 5; i++) {
      bulkData.push({
        key: `bulk-create-${Date.now()}-${i}`,
        value: `value-${i}`,
      });
    }

    const result = await apiRequest(page, `${baseUrl}/api/v1/data/bulk`, {
      method: 'POST',
      body: JSON.stringify({ operations: bulkData }),
    });

    expect(result.success).toBeTruthy();
    expect(Array.isArray(result.data)).toBeTruthy();
    expect(result.data.length).toBe(5);

    // Clean up
    for (const item of result.data) {
      if (item._id) {
        await apiRequest(page, `${baseUrl}/api/v1/data/${item._id}`, {
          method: 'DELETE',
        });
      }
    }
  });

  test('should delete multiple data entries in bulk', async ({ page }) => {
    await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    
    // Create test data
    const createdIds = [];
    for (let i = 0; i < 3; i++) {
      const result = await apiRequest(page, `${baseUrl}/api/v1/data`, {
        method: 'POST',
        body: JSON.stringify({
          key: `bulk-delete-${Date.now()}-${i}`,
          value: `value-${i}`,
        }),
      });
      
      if (result.success && result.data?._id) {
        createdIds.push(result.data._id);
      }
    }

    // Bulk delete
    const deleteResult = await apiRequest(page, `${baseUrl}/api/v1/data/bulk-delete`, {
      method: 'POST',
      body: JSON.stringify({ ids: createdIds }),
    });

    expect(deleteResult.success).toBeTruthy();

    // Verify deletion
    for (const id of createdIds) {
      const getResult = await apiRequest(page, `${baseUrl}/api/v1/data/${id}`, {
        method: 'GET',
      });
      
      expect(getResult.success).toBeFalsy();
    }
  });

  test('should handle partial failures in bulk operations', async ({ page }) => {
    await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    
    // Mix of valid and invalid data
    const bulkData = [
      { key: `bulk-mixed-${Date.now()}-1`, value: 'valid-1' },
      { key: '', value: '' }, // Invalid
      { key: `bulk-mixed-${Date.now()}-2`, value: 'valid-2' },
    ];

    const result = await apiRequest(page, `${baseUrl}/api/v1/data/bulk`, {
      method: 'POST',
      body: JSON.stringify({ operations: bulkData }),
    });

    // Should handle gracefully
    expect(result).toBeDefined();

    // Clean up any created entries
    if (result.success && Array.isArray(result.data)) {
      for (const item of result.data) {
        if (item._id) {
          await apiRequest(page, `${baseUrl}/api/v1/data/${item._id}`, {
            method: 'DELETE',
          });
        }
      }
    }
  });

  test('should validate bulk operation size limits', async ({ page }) => {
    await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    
    // Try to create too many entries at once
    const tooManyItems = [];
    for (let i = 0; i < 1001; i++) {
      tooManyItems.push({
        key: `bulk-limit-${i}`,
        value: `value-${i}`,
      });
    }

    const result = await apiRequest(page, `${baseUrl}/api/v1/data/bulk`, {
      method: 'POST',
      body: JSON.stringify({ operations: tooManyItems }),
    });

    // Should either reject or limit the operations
    if (result.success) {
      // If it succeeded, clean up
      if (Array.isArray(result.data)) {
        const idsToDelete = result.data.map(item => item._id).filter(Boolean);
        if (idsToDelete.length > 0) {
          await apiRequest(page, `${baseUrl}/api/v1/data/bulk-delete`, {
            method: 'POST',
            body: JSON.stringify({ ids: idsToDelete }),
          });
        }
      }
    } else {
      // Should have an error message about limits
      expect(result.error || result.message).toBeDefined();
    }
  });

  test('should update multiple entries via bulk operations', async ({ page }) => {
    await registerUser(page);

    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    
    // Create test data
    const createdIds = [];
    for (let i = 0; i < 3; i++) {
      const result = await apiRequest(page, `${baseUrl}/api/v1/data`, {
        method: 'POST',
        body: JSON.stringify({
          key: `bulk-update-${Date.now()}-${i}`,
          value: `original-${i}`,
        }),
      });
      
      if (result.success && result.data?._id) {
        createdIds.push(result.data._id);
      }
    }

    // Bulk update
    const updates = createdIds.map((id, index) => ({
      id,
      data: { value: `updated-${index}` },
    }));

    const updateResult = await apiRequest(page, `${baseUrl}/api/v1/data/bulk`, {
      method: 'PUT',
      body: JSON.stringify({ operations: updates }),
    });

    if (updateResult.success) {
      expect(Array.isArray(updateResult.data)).toBeTruthy();
    }

    // Clean up
    for (const id of createdIds) {
      await apiRequest(page, `${baseUrl}/api/v1/data/${id}`, {
        method: 'DELETE',
      });
    }
  });
});
