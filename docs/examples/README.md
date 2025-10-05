# WebSocket Examples

This directory contains example code for integrating with the xRat Ecosystem WebSocket service.

## Examples

### 1. Node.js Client Example

**File:** `websocket-client-example.js`

A complete Node.js example showing how to connect to the WebSocket server and handle all event types.

**Features:**
- JWT authentication
- Data subscriptions
- Notification handling
- User presence tracking
- System health monitoring
- Error handling
- Graceful shutdown

**Usage:**

```bash
# Install dependencies
npm install socket.io-client

# Get JWT token (register/login first)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Set token and run
export JWT_TOKEN="your_jwt_token_here"
node websocket-client-example.js
```

### 2. React Hooks Example

**File:** `websocket-react-example.jsx`

Complete React hooks and components for integrating WebSocket functionality in a React application.

**Features:**
- `useWebSocket` - Main WebSocket connection hook
- `useDataSubscription` - Subscribe to real-time data updates
- `useNotifications` - Handle notifications
- `useUserPresence` - Track online users
- `Dashboard` - Complete dashboard component with real-time data
- `Chat` - Chat component with typing indicators
- `SystemHealthMonitor` - System health monitoring component

**Usage:**

```jsx
import { useWebSocket, useNotifications } from './websocket-react-example';

function MyComponent() {
  const token = localStorage.getItem('accessToken');
  const { socket, connected } = useWebSocket(token);
  const { notifications, markAsRead } = useNotifications(socket);

  return (
    <div>
      <p>Status: {connected ? 'Connected' : 'Disconnected'}</p>
      <ul>
        {notifications.map((notif, i) => (
          <li key={i}>{notif.message}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Prerequisites

### 1. Install Socket.IO Client

```bash
npm install socket.io-client
```

### 2. Get JWT Token

First, register a user:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

Then login to get the token:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

Save the `accessToken` from the response.

## Common Patterns

### Connecting with Authentication

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});
```

### Subscribing to Data Updates

```javascript
// Subscribe to specific entity with filters
socket.emit('data:subscribe', {
  entity: 'products',
  filters: { category: 'electronics' }
});

// Listen for updates
socket.on('data:updated', (update) => {
  console.log('New data:', update.data);
});
```

### Handling Notifications

```javascript
// Listen for notifications
socket.on('notification', (notification) => {
  // Show notification to user
  showNotification(notification.message, notification.type);
  
  // Mark as read
  socket.emit('notification:read', {
    notificationId: notification.id
  });
});
```

### User Presence Tracking

```javascript
// Track online users
const onlineUsers = new Set();

socket.on('user:online', (status) => {
  if (status.status === 'online') {
    onlineUsers.add(status.userId);
  } else {
    onlineUsers.delete(status.userId);
  }
  updateUserList(Array.from(onlineUsers));
});
```

### Typing Indicators

```javascript
// Send typing indicator
input.addEventListener('input', () => {
  socket.emit('user:typing', { roomId: 'chat-1' });
});

// Receive typing indicators
socket.on('user:typing', (data) => {
  showTypingIndicator(data.username);
});
```

## Error Handling

### Connection Errors

```javascript
socket.on('connect_error', (error) => {
  if (error.message.includes('Authentication')) {
    // Token is invalid or expired
    redirectToLogin();
  } else {
    // Network or server error
    showRetryDialog();
  }
});
```

### Rate Limiting

```javascript
socket.on('error', (error) => {
  if (error.message === 'Rate limit exceeded') {
    // Slow down message sending
    implementBackoff();
  }
});
```

## Testing

### Test WebSocket Connection

```bash
# Check if server is running
curl http://localhost:3000/

# Check WebSocket statistics
curl http://localhost:3000/api/websocket/stats
```

### Test with Socket.IO Client

```bash
# Install socket.io-client globally
npm install -g socket.io-client

# Connect and test (with valid token)
export JWT_TOKEN="your_token"
node websocket-client-example.js
```

## Troubleshooting

### Connection Refused

**Problem:** Cannot connect to WebSocket server

**Solutions:**
1. Check if backend is running: `curl http://localhost:3000/`
2. Verify WebSocket URL is correct
3. Check CORS configuration if connecting from different origin

### Authentication Failed

**Problem:** Connection rejected with "Authentication failed"

**Solutions:**
1. Verify JWT token is valid
2. Check token hasn't expired (1 hour default)
3. Ensure token is sent in `auth.token` field

### Not Receiving Updates

**Problem:** Connected but not receiving data updates

**Solutions:**
1. Verify subscription with `data:subscribed` event
2. Check filters match your data
3. Ensure event listener is registered before subscribing

### Rate Limit Exceeded

**Problem:** Getting "Rate limit exceeded" errors

**Solutions:**
1. Reduce message frequency (limit: 100 messages/min)
2. Implement client-side throttling
3. Batch operations when possible

## Best Practices

1. **Always authenticate** - Include valid JWT token
2. **Handle errors gracefully** - Listen for all error events
3. **Clean up listeners** - Remove event listeners when done
4. **Throttle events** - Don't emit too frequently
5. **Reconnection** - Let Socket.IO handle automatic reconnection
6. **Secure tokens** - Store JWT tokens securely (httpOnly cookies)
7. **User feedback** - Show connection status to users

## Resources

- [API Documentation](../API.md#websocket-real-time-communication)
- [WebSocket Guide](../WEBSOCKET.md)
- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)
- [React Hooks Documentation](https://react.dev/reference/react)

## Support

For issues or questions:
- Open an issue on GitHub
- Check the [troubleshooting guide](../WEBSOCKET.md#troubleshooting)
- Review the [API documentation](../API.md)
