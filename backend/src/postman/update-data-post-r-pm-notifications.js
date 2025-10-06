// Types from @postman/test-script-types-plugin are available

// Parse the response body as JSON
pm.test('Response has valid JSON structure', function () {
  const responseJson = pm.response.json();
  pm.expect(responseJson).to.be.an('object');
  pm.expect(responseJson).to.have.property('success');
  pm.expect(responseJson).to.have.property('message');
  pm.expect(responseJson).to.have.property('data');
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
pm.test('Response has correct success message', function () {
  const responseJson = pm.response.json();
  pm.expect(responseJson).to.have.property('message', 'Data updated successfully');
});

// Check that the data was properly updated with the new name
pm.test('Response data contains updated name', function () {
  const responseJson = pm.response.json();
  pm.expect(responseJson.data).to.have.property('name', pm.environment.get('updatedDataName'));
});

// Verify notification properties in response data
pm.test('Response data contains properties needed for notifications', function () {
  const responseJson = pm.response.json();
  pm.expect(responseJson.data).to.have.property('_id');
  pm.expect(responseJson.data).to.have.property('name');
  pm.expect(responseJson.data).to.have.property('type');
});
