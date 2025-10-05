# Real-Time Notification Demo

This guide demonstrates the real-time notification feature for data create and update operations.

## Prerequisites

1. Backend and frontend services running (via Docker Compose or locally)
2. User account created and authenticated
3. WebSocket connection established (automatic in the frontend)

## Demo Scenarios

### Scenario 1: Create Data with Notification

**Step 1: Open the frontend and authenticate**
```
Navigate to: http://localhost:5173
Login with your credentials
```

**Step 2: Open browser console**
```javascript
// You should see WebSocket connection logs
// [WebSocket] Connected
// [WebSocket] Authenticated
```

**Step 3: Create data via API or UI**

Using cURL:
```bash
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Notification",
    "description": "Testing real-time notifications",
    "content": "This will trigger a notification",
    "type": "text",
    "tags": ["test", "demo"],
    "status": "active"
  }'
```

**Expected Results:**

1. **API Response:**
   ```json
   {
     "success": true,
     "message": "Data created successfully",
     "data": { /* created data object */ }
   }
   ```

2. **WebSocket Notification (Console):**
   ```javascript
   notification: {
     type: 'success',
     message: 'New data entry "Test Notification" has been created',
     data: {
       id: '...',
       name: 'Test Notification',
       type: 'text'
     },
     timestamp: '2025-01-04T12:00:00.000Z'
   }
   ```

3. **UI Toast Notification:**
   - Green toast appears in top-right corner
   - Shows: ✅ "New data entry 'Test Notification' has been created"
   - Auto-dismisses after 5 seconds

4. **Data Update Broadcast (if subscribed):**
   ```javascript
   data:updated: {
     entity: 'data',
     data: { /* full data object */ },
     timestamp: '2025-01-04T12:00:00.000Z'
   }
   ```

### Scenario 2: Update Data with Notification

**Step 1: Update existing data**

```bash
curl -X PUT http://localhost:3000/api/data/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Updated Test Notification",
    "description": "Testing update notifications"
  }'
```

**Expected Results:**

1. **API Response:**
   ```json
   {
     "success": true,
     "message": "Data updated successfully",
     "data": { /* updated data object */ }
   }
   ```

2. **WebSocket Notification:**
   ```javascript
   notification: {
     type: 'info',
     message: 'Data entry "Updated Test Notification" has been updated',
     data: {
       id: '507f1f77bcf86cd799439011',
       name: 'Updated Test Notification',
       type: 'text'
     },
     timestamp: '2025-01-04T12:01:00.000Z'
   }
   ```

3. **UI Toast Notification:**
   - Blue toast appears in top-right corner
   - Shows: ℹ️ "Data entry 'Updated Test Notification' has been updated"
   - Auto-dismisses after 5 seconds

### Scenario 3: Bulk Operations with Summary Notification

**Step 1: Create multiple items**

```bash
curl -X POST http://localhost:3000/api/data/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "operation": "create",
    "data": [
      {"name": "Item 1", "content": "Content 1", "type": "text"},
      {"name": "Item 2", "content": "Content 2", "type": "text"},
      {"name": "Item 3", "content": "Content 3", "type": "text"}
    ]
  }'
```

**Expected Results:**

1. **Individual Broadcasts:**
   - Each item triggers a `data:updated` event

2. **Summary Notification:**
   ```javascript
   notification: {
     type: 'success',
     message: 'Bulk create completed: 3 succeeded',
     data: {
       operation: 'create',
       succeeded: 3,
       failed: 0
     },
     timestamp: '2025-01-04T12:02:00.000Z'
   }
   ```

3. **UI Toast:**
   - Single summary toast showing bulk operation results

## Testing WebSocket Connection

### Check Connection Status

```javascript
// In browser console
const { connected, socket } = window.__WEBSOCKET_CONTEXT__;
console.log('Connected:', connected);
console.log('Socket ID:', socket?.id);
```

### Subscribe to Data Updates

```javascript
// In browser console or component
socket.emit('data:subscribe', {
  entity: 'data',
  filters: { status: 'active' }
});

socket.on('data:subscribed', (data) => {
  console.log('Subscribed to:', data.room);
});

socket.on('data:updated', (update) => {
  console.log('Data updated:', update);
});
```

### Listen for Notifications

```javascript
// In browser console or component
socket.on('notification', (notification) => {
  console.log('Notification received:', notification);
});
```

## Troubleshooting

### No Notifications Appearing

1. **Check WebSocket Connection:**
   ```javascript
   // Should show true
   console.log('Connected:', window.__WEBSOCKET_CONTEXT__?.connected);
   ```

2. **Check Authentication:**
   ```javascript
   // Should have a token
   console.log('Token:', localStorage.getItem('token'));
   ```

3. **Check Mock Mode:**
   - If `VITE_MOCK_WEBSOCKET=true`, notifications are simulated
   - Set to `false` to use real WebSocket connection

4. **Check Backend Logs:**
   ```bash
   docker logs xrat-backend
   # Look for: "Notification sent to user"
   # Look for: "Data update broadcasted"
   ```

### Notifications Not Broadcasting to Other Users

1. **Subscribe to Updates:**
   ```javascript
   socket.emit('data:subscribe', { entity: 'data' });
   ```

2. **Check Room Membership:**
   - Only subscribed users receive `data:updated` events
   - Personal notifications always work (sent directly to user)

### Testing Offline Notification Queue

1. **Disconnect WebSocket:**
   ```javascript
   socket.disconnect();
   ```

2. **Create/Update Data** (via API)

3. **Reconnect:**
   ```javascript
   socket.connect();
   ```

4. **Queued Notifications Delivered:**
   - All notifications created while offline are sent on reconnect
   - Check Redis: `notifications:queue:YOUR_USER_ID`

## Performance Metrics

### Check WebSocket Statistics

```bash
curl http://localhost:3000/api/websocket/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalConnections": 5,
    "connectedUsers": 3,
    "activeRooms": 2
  }
}
```

## Next Steps

- Customize notification messages in `dataController.js`
- Add notification preferences (per user)
- Implement notification sound/vibration
- Add notification history persistence
- Create notification center UI component
