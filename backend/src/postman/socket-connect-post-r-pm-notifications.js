// Types from @postman/test-script-types-plugin are available

// This script is for testing socket connection responses
// Note: Postman doesn't have built-in WebSocket support in tests,
// but we can verify the response from the socket setup endpoint

// Check for successful response
pm.test('Socket connection endpoint responds successfully', function () {
  pm.response.to.have.status(200);
});

// Store any connection details returned by the endpoint
pm.test('Save socket connection details if available', function () {
  try {
    const responseJson = pm.response.json();

    if (responseJson && responseJson.socketId) {
      pm.environment.set('socketId', responseJson.socketId);
      console.log('Socket ID saved:', responseJson.socketId);
    }

    if (responseJson && responseJson.sessionId) {
      pm.environment.set('socketSessionId', responseJson.sessionId);
      console.log('Socket session ID saved:', responseJson.sessionId);
    }
  } catch (e) {
    // Response might not be JSON
    console.log('No JSON response from socket connection endpoint');
  }
});
