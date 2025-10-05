# xRat Ecosystem - WebSocket Documentation

## 🔌 Real-Time Communication Guide

This document provides comprehensive documentation for the WebSocket implementation using Socket.IO in the xRat Ecosystem.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Events Reference](#events-reference)
- [Security](#security)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The xRat Ecosystem WebSocket service provides real-time bidirectional communication between clients and the server. Built on Socket.IO v4.7, it offers:

- **JWT Authentication** - Secure connections with token validation
- **Room-Based Messaging** - Efficient targeted broadcasts
- **Automatic Reconnection** - Built-in resilience
- **Offline Support** - Message queuing with Redis
- **Rate Limiting** - Protection against abuse
- **Presence Tracking** - User online/offline status

## Getting Started

### Installation

**Client-Side (JavaScript/TypeScript):**

```bash
npm install socket.io-client
```

### Basic Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('Connected!');
});
```

### React Example

```javascript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function useWebSocket(token) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io('http://localhost:3000', {
      auth: { token }
    });

    socketInstance.on('connect', () => {
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  return { socket, connected };
}

// Usage in component
function App() {
  const { socket, connected } = useWebSocket(localStorage.getItem('token'));

  useEffect(() => {
    if (!socket) return;

    socket.on('notification', (notification) => {
      console.log('New notification:', notification);
    });

    return () => {
      socket.off('notification');
    };
  }, [socket]);

  return <div>{connected ? 'Connected' : 'Disconnected'}</div>;
}
```

## Architecture

### Server-Side Components

```
backend/src/websocket/
├── socketService.js    # Main WebSocket service
└── index.js           # Module exports
```

### Connection Flow

```
Client                      Server
  |                           |
  |-- Connect with JWT ------>|
  |                           |--> Verify Token
  |                           |--> Find User
  |<--- Connected Event ------|
  |                           |--> Track Connection
  |                           |--> Send Queued Messages
  |                           |--> Broadcast User Online
  |                           |
  |-- Emit Events ----------->|
  |<--- Receive Events -------|
  |                           |
  |-- Disconnect ------------>|
  |                           |--> Cleanup Connection
  |                           |--> Broadcast User Offline
```

### Data Structures

**Server maintains:**
- `connectedUsers`: Map of userId -> Set of socket IDs
- `userRooms`: Map of socketId -> Set of room names
- `rateLimiters`: Map of socketId -> rate limit state

## Events Reference

### Connection Events

#### Client → Server: Connect

Automatically handled by Socket.IO with authentication.

```javascript
const socket = io('http://localhost:3000', {
  auth: { token: JWT_TOKEN }
});
```

#### Server → Client: `connected`

Confirmation of successful connection.

```javascript
socket.on('connected', (data) => {
  // data: { socketId, userId, timestamp }
});
```

### Data Subscription

#### Client → Server: `data:subscribe`

Subscribe to real-time updates for an entity.

```javascript
socket.emit('data:subscribe', {
  entity: 'products',
  filters: { category: 'electronics', status: 'active' }
});
```

**Parameters:**
- `entity` (string, required): Entity type to subscribe to
- `filters` (object, optional): Filter criteria for updates

#### Server → Client: `data:subscribed`

Confirmation of subscription.

```javascript
socket.on('data:subscribed', (data) => {
  // data: { entity, filters, room }
});
```

#### Server → Client: `data:updated`

Real-time data update broadcast.

```javascript
socket.on('data:updated', (update) => {
  // update: { entity, data, timestamp }
});
```

### Notifications

#### Server → Client: `notification`

Push notification to specific user.

```javascript
socket.on('notification', (notification) => {
  // notification: { type, message, user, timestamp }
});
```

**Notification Types:**
- `info` - General information
- `warning` - Warning message
- `error` - Error notification
- `success` - Success message

#### Client → Server: `notification:read`

Mark notification as read.

```javascript
socket.emit('notification:read', {
  notificationId: 'notif_123'
});
```

#### Server → Client: `notification:read:ack`

Acknowledgment of read status.

```javascript
socket.on('notification:read:ack', (data) => {
  // data: { notificationId }
});
```

### User Presence

#### Server → Client: `user:online`

User presence status change.

```javascript
socket.on('user:online', (status) => {
  // status: { userId, status, timestamp }
  // status: 'online' or 'offline'
});
```

**Notes:**
- Broadcasted to all connected clients
- `online` emitted on connection
- `offline` emitted when user fully disconnects

### Typing Indicators

#### Client → Server: `user:typing`

Broadcast typing status.

```javascript
socket.emit('user:typing', {
  roomId: 'chat-room-1'
});
```

#### Server → Client: `user:typing`

Receive typing status from others.

```javascript
socket.on('user:typing', (data) => {
  // data: { userId, username, timestamp }
});
```

**Notes:**
- Not sent back to the sender
- Useful for chat-like features
- Subject to rate limiting

### System Health

#### Server → Client: `system:health`

System health metrics broadcast.

```javascript
socket.on('system:health', (health) => {
  // health: { status, metrics, timestamp }
});
```

**Metrics include:**
- CPU usage
- Memory usage
- Active connections
- Custom application metrics

## Security

### Authentication

**JWT Token Required:**
- All connections must provide a valid JWT token
- Token is verified on connection attempt
- Invalid tokens result in connection rejection

```javascript
socket.on('connect_error', (error) => {
  if (error.message.includes('Authentication')) {
    // Handle authentication error
    console.error('Authentication failed:', error.message);
  }
});
```

### Rate Limiting

**Per-Connection Limits:**
- **Limit:** 100 messages per minute
- **Window:** 60 seconds (rolling)
- **Enforcement:** Server-side

**Exceeded Behavior:**
```javascript
socket.on('error', (error) => {
  if (error.message === 'Rate limit exceeded') {
    // Back off and retry
  }
});
```

### CORS Configuration

WebSocket server respects CORS settings:
- **Origin:** Configured via `FRONTEND_URL` environment variable
- **Credentials:** Enabled by default
- **Default:** `http://localhost:5173`

## Best Practices

### 1. Connection Management

**✅ DO:**
```javascript
// Single connection per user
const socket = io(url, { auth: { token } });

// Reuse the connection
useEffect(() => {
  if (!socket) return;
  
  socket.on('notification', handleNotification);
  
  return () => {
    socket.off('notification', handleNotification);
  };
}, [socket]);
```

**❌ DON'T:**
```javascript
// Multiple connections in rapid succession
setInterval(() => {
  const socket = io(url);  // Creates new connection
}, 1000);
```

### 2. Event Listeners

**✅ DO:**
```javascript
// Clean up listeners
useEffect(() => {
  socket.on('event', handler);
  return () => socket.off('event', handler);
}, []);
```

**❌ DON'T:**
```javascript
// Memory leak: no cleanup
socket.on('event', handler);
socket.on('event', handler);  // Duplicate listener
```

### 3. Error Handling

**✅ DO:**
```javascript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
  // Show user-friendly message
  // Implement retry logic
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
  // Handle specific error types
});
```

**❌ DON'T:**
```javascript
// Ignore errors silently
socket.on('connect_error', () => {});
```

### 4. Subscriptions

**✅ DO:**
```javascript
// Subscribe to specific data
socket.emit('data:subscribe', {
  entity: 'orders',
  filters: { userId: currentUser.id, status: 'pending' }
});

// Unsubscribe when done
socket.emit('data:unsubscribe', { entity: 'orders' });
```

**❌ DON'T:**
```javascript
// Subscribe to everything
socket.emit('data:subscribe', { entity: '*' });  // Not supported

// Never unsubscribe
// Wastes server resources
```

### 5. Rate Limiting Awareness

**✅ DO:**
```javascript
// Throttle events
const throttledEmit = throttle((data) => {
  socket.emit('user:typing', data);
}, 1000);

input.addEventListener('keydown', () => {
  throttledEmit({ roomId });
});
```

**❌ DON'T:**
```javascript
// Emit on every keystroke
input.addEventListener('keydown', () => {
  socket.emit('user:typing', { roomId });  // Too frequent
});
```

## Troubleshooting

### Connection Issues

**Problem:** Connection fails immediately

**Solutions:**
1. Verify JWT token is valid
2. Check token hasn't expired
3. Ensure WebSocket URL is correct
4. Check CORS configuration

```javascript
// Debug connection
const socket = io(url, {
  auth: { token },
  transports: ['websocket', 'polling']  // Try both
});

socket.on('connect_error', (error) => {
  console.error('Details:', {
    message: error.message,
    description: error.description,
    context: error.context
  });
});
```

### Not Receiving Updates

**Problem:** Connected but not receiving events

**Solutions:**
1. Verify subscription was successful
2. Check filters match your data
3. Ensure event listener is registered

```javascript
// Verify subscription
socket.emit('data:subscribe', { entity: 'products' });

socket.once('data:subscribed', (confirmation) => {
  console.log('Subscribed to room:', confirmation.room);
});

// Check listener is registered
console.log(socket.listeners('data:updated'));
```

### Rate Limit Exceeded

**Problem:** Getting rate limit errors

**Solutions:**
1. Reduce message frequency
2. Implement client-side throttling
3. Batch multiple operations

```javascript
// Implement backoff
let backoffTime = 1000;

socket.on('error', (error) => {
  if (error.message === 'Rate limit exceeded') {
    setTimeout(() => {
      // Retry operation
      backoffTime = Math.min(backoffTime * 2, 10000);
    }, backoffTime);
  }
});
```

### Memory Leaks

**Problem:** Application memory grows over time

**Solutions:**
1. Clean up event listeners
2. Disconnect unused sockets
3. Monitor listener count

```javascript
// Proper cleanup in React
useEffect(() => {
  const handleUpdate = (data) => {
    // Handle update
  };

  socket.on('data:updated', handleUpdate);

  return () => {
    socket.off('data:updated', handleUpdate);
  };
}, [socket]);

// Monitor listeners
console.log('Listener count:', socket.listenerCount('data:updated'));
```

### Offline Messages Not Delivered

**Problem:** Messages queued while offline aren't delivered

**Solutions:**
1. Verify Redis is running
2. Check user reconnects with same userId
3. Ensure queue hasn't expired (7-day TTL)

```javascript
// Listen for queued messages
socket.on('notification', (notification) => {
  if (notification.queuedAt) {
    console.log('Queued message:', notification);
    // Handle offline message delivery
  }
});
```

## API Integration

### Broadcasting Data Changes

Update the data controller to broadcast changes:

```javascript
// In dataController.js
const { socketService } = require('../index');

async function updateData(req, res) {
  const updated = await Data.findByIdAndUpdate(req.params.id, req.body);
  
  // Broadcast update to subscribers
  const service = socketService();
  if (service) {
    service.broadcastDataUpdate('data', updated);
  }
  
  res.json({ success: true, data: updated });
}
```

### Sending Notifications

```javascript
const { socketService } = require('../index');

async function sendNotification(userId, notification) {
  const service = socketService();
  if (service) {
    service.sendNotificationToUser(userId, {
      type: 'info',
      message: notification.message,
      // additional fields
    });
  }
}
```

### Getting Statistics

```bash
curl http://localhost:3000/api/websocket/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalConnections": 25,
    "connectedUsers": 18,
    "activeRooms": 12
  }
}
```

## Performance Considerations

### Server Resources

- Each connection consumes memory (typically 10-50 KB)
- Redis used for offline message queuing
- Rate limiting prevents resource exhaustion

### Scaling

**Single Server:**
- Supports thousands of concurrent connections
- Limited by server memory and CPU

**Multi-Server (Future):**
- Use Redis adapter for Socket.IO
- Share connection state across servers
- Enable horizontal scaling

### Monitoring

Monitor these metrics:
- Active connections (`totalConnections`)
- Unique users (`connectedUsers`)
- Active rooms (`activeRooms`)
- Message rate per connection
- Redis queue sizes

---

**Last Updated:** 2025-01-04  
**Version:** 1.0.0  
**Socket.IO Version:** 4.7.5
