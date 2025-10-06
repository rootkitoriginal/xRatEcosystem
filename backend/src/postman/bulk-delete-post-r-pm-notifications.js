// Types from @postman/test-script-types-plugin are available

// Parse the response body as JSON
pm.test('Response has valid JSON structure', function () {
  const responseJson = pm.response.json();
  pm.expect(responseJson).to.be.an('object');
  pm.expect(responseJson).to.have.property('success');
  pm.expect(responseJson).to.have.property('message');
  pm.expect(responseJson).to.have.property('results');
});

// Check that the status code is 200 (OK)
pm.test('Status code is 200', function () {
  pm.response.to.have.status(200);
});

// Check that the response has success property set to true
pm.test('Response has success property set to true', function () {
  const responseJson = pm.response.json();
  pm.expect(responseJson).to.have.property('success', true);
});

// Check that the response message is correct
pm.test('Response has correct bulk operation message', function () {
  const responseJson = pm.response.json();
  pm.expect(responseJson).to.have.property('message', 'Bulk delete completed');
});

// Check bulk delete results
pm.test('Response contains bulk delete results', function () {
  const responseJson = pm.response.json();

  // Verify results structure
  pm.expect(responseJson.results).to.be.an('object');
  pm.expect(responseJson.results).to.have.property('success').that.is.an('array');
  pm.expect(responseJson.results).to.have.property('failed').that.is.an('array');

  // Get original IDs
  let originalIds;
  try {
    originalIds = JSON.parse(pm.environment.get('bulkCreatedIds') || '[]');
  } catch (e) {
    originalIds = [];
  }

  // Verify success items - should match original count
  pm.expect(responseJson.results.success).to.have.lengthOf(originalIds.length);

  // Verify each deleted item has an ID that matches our original list
  responseJson.results.success.forEach((item) => {
    pm.expect(item).to.have.property('id');
    pm.expect(originalIds).to.include(item.id);
  });

  // Clear the environment variable as the data is now deleted
  pm.environment.unset('bulkCreatedIds');
  console.log('Removed bulk data IDs from environment variables');
});
