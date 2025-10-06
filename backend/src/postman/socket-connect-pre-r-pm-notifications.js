// Set up WebSocket client configuration
pm.environment.set('wsEndpoint', pm.variables.get('wsEndpoint') || 'ws://localhost:3000/socket');

// Set up authentication for WebSocket connections if needed
if (!pm.environment.get('wsAuthToken')) {
  const authToken = pm.environment.get('authToken') || `ws-test-token-${Date.now()}`;
  pm.environment.set('wsAuthToken', authToken);
}

// Log preparation
console.log('WebSocket configuration prepared with endpoint:', pm.environment.get('wsEndpoint'));
