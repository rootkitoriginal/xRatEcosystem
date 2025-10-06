// Types from @postman/test-script-types-plugin are available

// Parse the response body as JSON
pm.test('Response has valid JSON structure', function () {
  const responseJson = pm.response.json();
  pm.expect(responseJson).to.be.an('object');
  pm.expect(responseJson).to.have.property('success');
  pm.expect(responseJson).to.have.property('message');
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
pm.test('Response has correct delete message', function () {
  const responseJson = pm.response.json();
  pm.expect(responseJson).to.have.property('message', 'Data deleted successfully');
});

// Clear the environment variable as the data is now deleted
pm.environment.unset('createdDataId');
console.log('Removed deleted data ID from environment variables');
