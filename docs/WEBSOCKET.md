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
    token: 'YOUR_JWT_TOKEN',
  },
});

socket.on('connect', () => {
  console.log('Connected!');
});
```

### React Example

The frontend includes a complete WebSocket implementation with notification support:

```javascript
// Using the built-in WebSocketProvider
import { WebSocketProvider, useWebSocket } from './components/realtime/WebSocketProvider';
import NotificationContainer from './components/realtime/NotificationContainer';

function App() {
  return (
    <WebSocketProvider>
      <NotificationContainer />
      <YourComponents />
    </WebSocketProvider>
  );
}

// Access WebSocket in any component
function DataComponent() {
  const { socket, connected, notifications } = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    // Listen for data updates
    socket.on('data:updated', (update) => {
      console.log('Data updated:', update);
      // Handle the update in your component
    });

    return () => {
      socket.off('data:updated');
    };
  }, [socket]);

  return (
    <div>
      {connected ? '🟢 Connected' : '🔴 Disconnected'}
      <div>Notifications: {notifications.length}</div>
    </div>
  );
}
```

**Built-in Components:**

- `WebSocketProvider` - Manages connection and state
- `NotificationContainer` - Displays toast notifications (top-right)
- `NotificationPanel` - Notification history panel
- `ConnectionStatus` - Shows connection status indicator

**Automatic Features:**

- ✅ Auto-reconnection on disconnect
- ✅ Toast notifications for data changes
- ✅ JWT authentication integration
- ✅ Mock mode for development (set `VITE_MOCK_WEBSOCKET=true`)

## Architecture

### Server-Side Components

```
backend/src/websocket/
├── socketService.js      # Main WebSocket service
├── validators.js         # Input validation & sanitization
├── authorization.js      # Room permission system
└── index.js             # Module exports
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
  auth: { token: JWT_TOKEN },
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
  filters: { category: 'electronics', status: 'active' },
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
  notificationId: 'notif_123',
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
  roomId: 'chat-room-1',
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

### Room Management

#### Client → Server: `room:join`

Join a room with authorization checks.

```javascript
socket.emit('room:join', {
  roomId: 'chat:general',
  entity: 'chat', // optional
  filters: {}, // optional
});
```

**Parameters:**

- `roomId` (string, required): Unique room identifier (max 200 chars)
- `entity` (string, optional): Entity type (alphanumeric, hyphens, underscores)
- `filters` (object, optional): Additional room filters (max 10 filters)

**Room ID Format:**

- `data:users` - Public data subscription
- `chat:room123` - Chat room
- `notifications:userId` - Private user notifications (owner only)
- `admin:metrics` - Role-based admin room

#### Server → Client: `room:joined`

Confirmation of successful room join.

```javascript
socket.on('room:joined', (data) => {
  // data: { roomId, timestamp }
  console.log('Joined room:', data.roomId);
});
```

#### Server → Client: `user:joined`

Notification when another user joins the room.

```javascript
socket.on('user:joined', (data) => {
  // data: { userId, username, roomId, timestamp }
  console.log(`${data.username} joined ${data.roomId}`);
});
```

#### Client → Server: `room:leave`

Leave a room.

```javascript
socket.emit('room:leave', {
  roomId: 'chat:general',
});
```

**Parameters:**

- `roomId` (string, required): Room identifier to leave

#### Server → Client: `room:left`

Confirmation of leaving room.

```javascript
socket.on('room:left', (data) => {
  // data: { roomId, timestamp }
});
```

#### Server → Client: `user:left`

Notification when another user leaves the room.

```javascript
socket.on('user:left', (data) => {
  // data: { userId, username, roomId, timestamp }
  console.log(`${data.username} left ${data.roomId}`);
});
```

### Validation Errors

#### Server → Client: `validation:error`

Sent when event data fails validation.

```javascript
socket.on('validation:error', (error) => {
  // error: { event, message, error, timestamp }
  console.error(`Validation failed for ${error.event}:`, error.error);
});
```

**Common Validation Errors:**

- Invalid characters in entity/room names
- Missing required fields
- Exceeding maximum length limits
- Too many filters (max 10)
- Invalid MongoDB ObjectId format

**Example:**

```javascript
// Invalid entity name
socket.emit('data:subscribe', {
  entity: 'users$$$', // Special characters not allowed
});

socket.on('validation:error', (error) => {
  // error.error: "Entity name can only contain alphanumeric characters..."
});
```

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

## Input Validation & Sanitization

All WebSocket events undergo strict validation and sanitization to prevent security vulnerabilities.

### Validation Rules

#### Event: `data:subscribe`

**Entity Name:**

- Required field
- 1-100 characters
- Alphanumeric, hyphens, and underscores only
- Pattern: `/^[a-zA-Z0-9_-]+$/`

**Filters:**

- Optional object
- Maximum 10 filters allowed
- Each filter key: max 50 characters
- Each filter value: string (max 200 chars), number, or boolean

**Example Valid:**

```javascript
socket.emit('data:subscribe', {
  entity: 'products',
  filters: {
    category: 'electronics',
    price: 100,
    inStock: true,
  },
});
```

**Example Invalid:**

```javascript
// ❌ Invalid entity name
socket.emit('data:subscribe', {
  entity: 'products$$$', // Special characters not allowed
});

// ❌ Too many filters
const tooManyFilters = {};
for (let i = 0; i < 11; i++) {
  tooManyFilters[`filter${i}`] = 'value';
}
socket.emit('data:subscribe', {
  entity: 'products',
  filters: tooManyFilters, // Max 10 filters
});
```

#### Event: `notification:read`

**Notification ID:**

- Required field
- Must be valid MongoDB ObjectId (24 hex characters)
- Pattern: `/^[a-fA-F0-9]{24}$/`

**Example:**

```javascript
// ✅ Valid
socket.emit('notification:read', {
  notificationId: '507f1f77bcf86cd799439011',
});

// ❌ Invalid
socket.emit('notification:read', {
  notificationId: 'invalid-id', // Not a MongoDB ObjectId
});
```

#### Event: `user:typing`

**Room ID:**

- Required field
- 1-200 characters
- Cannot be empty after trimming

**Is Typing (optional):**

- Boolean value

**Example:**

```javascript
// ✅ Valid
socket.emit('user:typing', {
  roomId: 'chat:room123',
  isTyping: true,
});
```

#### Event: `room:join`

**Room ID:**

- Required field
- 1-200 characters
- Alphanumeric, colons, hyphens, and underscores only
- Pattern: `/^[a-zA-Z0-9:_-]+$/`

**Entity (optional):**

- 1-100 characters
- Alphanumeric, hyphens, and underscores only

**Filters (optional):**

- Object with max 10 properties

**Example:**

```javascript
// ✅ Valid
socket.emit('room:join', {
  roomId: 'data:users:status:active',
});

// ❌ Invalid
socket.emit('room:join', {
  roomId: 'room$!@#', // Special characters not allowed
});
```

### Sanitization

All string inputs are automatically sanitized to prevent XSS and injection attacks:

**HTML Escaping:**

```javascript
// Input:  '<script>alert("xss")</script>'
// Output: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
```

**SQL Injection Prevention:**

```javascript
// Input:  "1' OR '1'='1"
// Output: "1&#x27; OR &#x27;1&#x27;=&#x27;1"
```

**Whitespace Trimming:**

```javascript
// Input:  '  test  '
// Output: 'test'
```

### Validation Error Handling

When validation fails, clients receive a `validation:error` event:

```javascript
socket.on('validation:error', (error) => {
  console.error('Validation Error:', {
    event: error.event, // The event that failed
    message: error.message, // 'Validation failed'
    error: error.error, // Detailed error message
    timestamp: error.timestamp, // ISO timestamp
  });

  // Show user-friendly message
  showToast('Invalid input. Please check your data.');
});
```

**Common Validation Errors:**

- "Entity name can only contain alphanumeric characters, hyphens, and underscores"
- "Entity name must not exceed 100 characters"
- "Maximum 10 filters allowed"
- "Invalid notification ID format (must be MongoDB ObjectId)"
- "Room ID cannot be empty"
- "Room ID can only contain alphanumeric characters, colons, hyphens, and underscores"

## Authorization & Room Permissions

The WebSocket service implements a comprehensive authorization system for room access control.

### Permission Types

#### PUBLIC

Anyone can join these rooms.

**Examples:**

- `data:users` - Data subscription rooms
- `chat:general` - Public chat rooms

```javascript
// Any authenticated user can join
socket.emit('room:join', { roomId: 'data:users' });
```

#### OWNER_ONLY

Only the resource owner can join.

**Examples:**

- `notifications:userId` - User's private notifications
- `messages:userId` - User's private messages

```javascript
// Only user with ID 'user123' can join
socket.emit('room:join', { roomId: 'notifications:user123' });

// ❌ Other users will be denied
socket.on('error', (error) => {
  // error.message: "Access denied: owner only"
});
```

#### PRIVATE

Owner or invited users can join.

**Examples:**

- `messages:conversationId` - Private conversations

```javascript
// Server-side check for invited users
const authCheck = canJoinRoom(user, roomId, {
  invitedUsers: ['user456', 'user789'],
});
```

#### ROLE_BASED

Access based on user roles (admin, moderator, user).

**Examples:**

- `admin:metrics` - Admin-only rooms
- `moderator:reports` - Moderator rooms

```javascript
// Only users with 'admin' role can join
socket.emit('room:join', { roomId: 'admin:metrics' });

// ❌ Regular users will be denied
socket.on('error', (error) => {
  // error.message: "Access denied: admin role required"
});
```

### Role Hierarchy

Roles are hierarchical - higher roles can access lower-level resources:

```
admin (100)       → Can access admin, moderator, and user resources
  ↓
moderator (50)    → Can access moderator and user resources
  ↓
user (10)         → Can access user resources only
  ↓
guest (0)         → Limited access
```

**Example:**

```javascript
// Admin can join moderator room
const adminUser = { role: 'admin' };
canJoinRoom(adminUser, 'moderator:reports'); // ✅ Authorized

// User cannot join admin room
const regularUser = { role: 'user' };
canJoinRoom(regularUser, 'admin:metrics'); // ❌ Denied
```

### Room ID Parsing

Room IDs follow a structured format for automatic permission detection:

**Format:** `type:identifier[:filter:value...]`

**Examples:**

```javascript
parseRoomId('data:users');
// { type: 'data', entity: 'data', identifier: 'users', permission: 'PUBLIC' }

parseRoomId('notifications:user123');
// { type: 'notifications', identifier: 'user123', permission: 'OWNER_ONLY' }

parseRoomId('admin:metrics');
// { type: 'admin', identifier: 'metrics', permission: 'ROLE_BASED' }

parseRoomId('data:users:status:active');
// { type: 'data', identifier: 'users', filters: ['status', 'active'] }
```

### Authorization Checks

#### Joining Rooms

Authorization is automatically checked when users attempt to join rooms:

```javascript
socket.emit('room:join', { roomId: 'admin:metrics' });

// Server performs authorization check
// If authorized: emits 'room:joined'
// If denied: emits 'error' with reason
```

**Server-side logic:**

```javascript
const authCheck = canJoinRoom(socket.user, roomId);
if (!authCheck.authorized) {
  socket.emit('error', {
    event: 'room:join',
    message: authCheck.reason,
  });
  return;
}
```

#### Broadcasting

Broadcasting to rooms also requires authorization:

```javascript
// Only admins can broadcast to data rooms
socketService.broadcastDataUpdate('users', data, broadcaster);

// If broadcaster doesn't have permission, broadcast is blocked
// and warning is logged
```

### Audit Logging

All room access attempts are audited:

**Successful Access:**

```
{
  "level": "info",
  "message": "Room access audit: GRANTED",
  "userId": "507f1f77bcf86cd799439011",
  "username": "john_doe",
  "userRole": "user",
  "roomId": "chat:general",
  "authorized": true,
  "timestamp": "2025-01-04T10:30:45.123Z"
}
```

**Denied Access:**

```
{
  "level": "warn",
  "message": "Room access audit: DENIED",
  "userId": "507f1f77bcf86cd799439011",
  "username": "john_doe",
  "userRole": "user",
  "roomId": "admin:metrics",
  "authorized": false,
  "reason": "Access denied: admin role required",
  "timestamp": "2025-01-04T10:30:45.123Z"
}
```

### Best Practices for Authorization

**1. Check Permissions Client-Side (UX):**

```javascript
// Don't show admin rooms to non-admin users
function getAvailableRooms(user) {
  const rooms = ['data:users', 'chat:general'];

  if (user.role === 'admin') {
    rooms.push('admin:metrics', 'admin:logs');
  }

  if (user.role === 'moderator' || user.role === 'admin') {
    rooms.push('moderator:reports');
  }

  return rooms;
}
```

**2. Handle Authorization Errors:**

```javascript
socket.on('error', (error) => {
  if (error.message.includes('Access denied')) {
    // Show appropriate message
    showError("You don't have permission to access this room");
    // Redirect to appropriate page
    router.push('/dashboard');
  }
});
```

**3. Don't Rely Solely on Client-Side Checks:**

Server always validates permissions - client-side checks are for UX only.

```javascript
// ✅ Good: Server validates
socket.emit('room:join', { roomId });
// Server checks authorization

// ❌ Bad: Only client-side check
if (user.role === 'admin') {
  socket.emit('room:join', { roomId }); // Can be bypassed
}
```

**4. Subscribe to Own Resources:**

```javascript
// Always allowed: user's own notifications
socket.emit('room:join', {
  roomId: `notifications:${currentUser.id}`,
});

// Always allowed: user's own messages
socket.emit('room:join', {
  roomId: `messages:${currentUser.id}`,
});
```

### CORS Configuration

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
  const socket = io(url); // Creates new connection
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
socket.on('event', handler); // Duplicate listener
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
  filters: { userId: currentUser.id, status: 'pending' },
});

// Unsubscribe when done
socket.emit('data:unsubscribe', { entity: 'orders' });
```

**❌ DON'T:**

```javascript
// Subscribe to everything
socket.emit('data:subscribe', { entity: '*' }); // Not supported

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
  socket.emit('user:typing', { roomId }); // Too frequent
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
  transports: ['websocket', 'polling'], // Try both
});

socket.on('connect_error', (error) => {
  console.error('Details:', {
    message: error.message,
    description: error.description,
    context: error.context,
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

The data controller automatically broadcasts changes when data is created or updated:

```javascript
// Example from backend/src/controllers/dataController.js
const getSocketService = () => {
  try {
    const { socketService } = require('../index');
    return socketService ? socketService() : null;
  } catch (error) {
    // Service not available (e.g., during initialization or tests)
    return null;
  }
};

// Automatically sends notifications on data creation
async function createData(dataService) {
  const data = await dataService.create(dataObj, userId);

  // Send real-time notification to user
  const service = getSocketService();
  if (service) {
    service.sendNotificationToUser(userId, {
      type: 'success',
      message: `New data entry "${data.name}" has been created`,
      data: { id: data._id, name: data.name, type: data.type },
    });

    // Broadcast update to subscribers
    service.broadcastDataUpdate('data', data);
  }

  return data;
}
```

**What gets broadcasted:**

- ✅ Data creation → `success` notification + `data:updated` event
- ✅ Data updates → `info` notification + `data:updated` event
- ✅ Bulk operations → Individual broadcasts + summary notification

### Sending Notifications

For custom notifications in your controllers:

```javascript
const getSocketService = () => {
  try {
    const { socketService } = require('../index');
    return socketService ? socketService() : null;
  } catch (error) {
    return null;
  }
};

async function sendCustomNotification(userId, notification) {
  const service = getSocketService();
  if (service) {
    service.sendNotificationToUser(userId, {
      type: 'info',
      message: notification.message,
      // additional fields
    });
  }
}
```

**Notification Types:**

- `success` - Green notification for successful operations
- `info` - Blue notification for informational messages
- `warning` - Yellow notification for warnings
- `error` - Red notification for errors

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

**Last Updated:** 2025-01-05  
**Version:** 1.1.0  
**Socket.IO Version:** 4.7.5

**New in v1.1.0:**

- ✅ Input validation with Joi schemas
- ✅ Automatic sanitization (XSS & injection prevention)
- ✅ Room-based authorization (PUBLIC, OWNER_ONLY, PRIVATE, ROLE_BASED)
- ✅ Role hierarchy system (admin > moderator > user > guest)
- ✅ Audit logging for all access attempts
- ✅ New events: `room:join`, `room:leave`, `validation:error`
- ✅ Enhanced security for all WebSocket communications
