// Types from @postman/test-script-types-plugin are available

// Parse the response body as JSON
pm.test('Response has valid JSON structure', function () {
  const responseJson = pm.response.json();
  pm.expect(responseJson).to.be.an('object');
  pm.expect(responseJson).to.have.property('success');
  pm.expect(responseJson).to.have.property('message');
  pm.expect(responseJson).to.have.property('data');
});

// Check that the status code is 201 (Created)
pm.test('Status code is 201', function () {
  pm.response.to.have.status(201);
});

// Check that the response has success property set to true
pm.test('Response has success property set to true', function () {
  const responseJson = pm.response.json();
  pm.expect(responseJson).to.have.property('success', true);
});

// Check that the response message is correct
pm.test('Response has correct success message', function () {
  const responseJson = pm.response.json();
  pm.expect(responseJson).to.have.property('message', 'Data created successfully');
});

// Check that the response contains data with the correct name
pm.test('Response data contains correct name', function () {
  const responseJson = pm.response.json();
  pm.expect(responseJson.data).to.have.property('name', pm.environment.get('testDataName'));
});

// Save created data ID for future requests
pm.test('Save data ID for future requests', function () {
  const responseJson = pm.response.json();
  pm.environment.set('createdDataId', responseJson.data._id);
  console.log('Saved data ID:', responseJson.data._id);
});

// Verify expected notification properties in response data
pm.test('Response data contains properties needed for notifications', function () {
  const responseJson = pm.response.json();
  pm.expect(responseJson.data).to.have.property('_id');
  pm.expect(responseJson.data).to.have.property('name');
  pm.expect(responseJson.data).to.have.property('type');
});
