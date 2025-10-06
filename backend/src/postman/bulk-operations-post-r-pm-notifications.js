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
  pm.expect(responseJson).to.have.property('message', 'Bulk create completed');
});

// Check bulk operation results
pm.test('Response contains bulk operation results', function () {
  const responseJson = pm.response.json();

  // Verify results structure
  pm.expect(responseJson.results).to.be.an('object');
  pm.expect(responseJson.results).to.have.property('success').that.is.an('array');
  pm.expect(responseJson.results).to.have.property('failed').that.is.an('array');

  // Verify success items
  pm.expect(responseJson.results.success).to.have.lengthOf.at.least(1);

  // Save created IDs for future requests
  const successIds = responseJson.results.success.map((item) => item.id);
  pm.environment.set('bulkCreatedIds', JSON.stringify(successIds));
  console.log('Saved bulk created IDs:', successIds);

  // Verify each created item has required notification properties
  responseJson.results.success.forEach((item, index) => {
    pm.expect(item).to.have.property('id');
    pm.expect(item).to.have.property('data');
    pm.expect(item.data).to.have.property('_id');
    pm.expect(item.data).to.have.property('name');
    pm.expect(item.data).to.have.property('type');

    // Verify names match what we sent
    if (index === 0) {
      pm.expect(item.data.name).to.equal(pm.environment.get('bulkItem1Name'));
    } else if (index === 1) {
      pm.expect(item.data.name).to.equal(pm.environment.get('bulkItem2Name'));
    }
  });
});
