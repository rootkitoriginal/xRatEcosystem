// Set up environment variables for testing data notifications
pm.environment.set('baseUrl', pm.variables.get('baseUrl') || 'http://localhost:3000');

// Generate a unique test data name with timestamp
const timestamp = Date.now();
pm.environment.set('testDataName', `Test Data ${timestamp}`);

// Set authentication token if needed
if (!pm.environment.get('authToken')) {
  // Generate a mock token for testing if not already set
  pm.environment.set('authToken', `test-token-${timestamp}`);
}

// Prepare test data for creation
const testData = {
  name: pm.environment.get('testDataName'),
  type: 'test-type',
  content: 'This is test content for notification testing',
  metadata: {
    source: 'postman-test',
    timestamp: timestamp,
  },
};

// Set the request body
pm.variables.set('testDataPayload', JSON.stringify(testData));

// Log preparation for debugging
console.log('Prepared test data for notification testing:', testData);
