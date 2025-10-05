# Real-time UI Components

This directory contains real-time UI components for live updates, notifications, and user presence using WebSocket/Socket.IO.

## Components

### WebSocketProvider

Context provider for WebSocket connection management.

**Features:**
- Automatic connection/disconnection based on authentication
- Mock mode for development (when backend WebSocket is not available)
- Notification management
- User presence tracking
- Auto-reconnection logic
- Event subscription/emission

**Usage:**
```jsx
import { WebSocketProvider } from './components/realtime';

function App() {
  return (
    <WebSocketProvider>
      {/* Your app components */}
    </WebSocketProvider>
  );
}
```

**Hook Usage:**
```jsx
import { useWebSocket } from './components/realtime';

function MyComponent() {
  const { connected, emit, on, addNotification } = useWebSocket();

  // Emit event
  emit('message:send', { text: 'Hello' });

  // Subscribe to event
  useEffect(() => {
    const unsubscribe = on('message:received', (data) => {
      console.log('Received:', data);
    });
    return unsubscribe;
  }, [on]);

  // Add notification
  addNotification({
    type: 'success',
    title: 'Success',
    message: 'Operation completed',
  });
}
```

### NotificationToast

Toast notification component with auto-dismiss.

**Props:**
- `notification` (object): Notification data
  - `id`: Unique identifier
  - `type`: 'success' | 'error' | 'warning' | 'info'
  - `title`: Optional title
  - `message`: Notification message
- `onClose` (function): Callback when toast is closed
- `duration` (number): Auto-dismiss duration in ms (default: 5000)

**Usage:**
```jsx
<NotificationToast
  notification={{
    id: 1,
    type: 'success',
    title: 'Success',
    message: 'Data saved successfully',
  }}
  onClose={(id) => console.log('Closed:', id)}
  duration={5000}
/>
```

### NotificationPanel

Dropdown panel showing notification history.

**Features:**
- Unread notification badge
- Notification history
- Clear individual/all notifications
- Relative timestamps

**Usage:**
```jsx
import { NotificationPanel } from './components/realtime';

function Header() {
  return (
    <header>
      <NotificationPanel />
    </header>
  );
}
```

### NotificationContainer

Container for displaying toast notifications (auto-managed).

**Usage:**
```jsx
import { NotificationContainer } from './components/realtime';

function App() {
  return (
    <>
      <NotificationContainer />
      {/* Your app */}
    </>
  );
}
```

### ConnectionStatus

Visual indicator for WebSocket connection status.

**Features:**
- Shows mock mode indicator
- Displays disconnection errors
- Reconnect button
- Auto-hides when connected

**Usage:**
```jsx
import { ConnectionStatus } from './components/realtime';

function App() {
  return (
    <>
      <ConnectionStatus />
      {/* Your app */}
    </>
  );
}
```

### UserPresence

Display user online/offline status with avatar.

**Props:**
- `userId` (string): User identifier
- `userName` (string): Display name
- `showName` (boolean): Show name and status (default: true)
- `size` (string): 'small' | 'medium' | 'large' (default: 'medium')

**Usage:**
```jsx
<UserPresence
  userId="user-123"
  userName="John Doe"
  size="medium"
  showName={true}
/>
```

### TypingIndicator

Shows typing indicators for collaborative features.

**Props:**
- `room` (string): Room/channel identifier

**Usage:**
```jsx
<TypingIndicator room="chat-room-1" />
```

To indicate typing:
```jsx
const { emit } = useWebSocket();

// Start typing
emit('typing:start', { room: 'chat-room-1', userName: 'John' });

// Stop typing
emit('typing:stop', { room: 'chat-room-1', userName: 'John' });
```

### RealtimeData

Wrapper component for live data updates with visual feedback.

**Props:**
- `event` (string): Event name to listen for
- `onUpdate` (function): Callback when data updates
- `children` (function): Render function receiving `{ data, hasUpdate }`

**Usage:**
```jsx
<RealtimeData
  event="data:updated"
  onUpdate={(data) => console.log('Updated:', data)}
>
  {({ data, hasUpdate }) => (
    <div className={hasUpdate ? 'flash' : ''}>
      {data ? JSON.stringify(data) : 'No data'}
    </div>
  )}
</RealtimeData>
```

### SystemStatus

Real-time system health monitoring dashboard.

**Features:**
- CPU usage
- Memory usage
- System uptime
- Active connections
- Visual indicators (good/warning/critical)

**Usage:**
```jsx
import { SystemStatus } from './components/realtime';

function Dashboard() {
  return (
    <div>
      <SystemStatus />
    </div>
  );
}
```

Backend should emit:
```javascript
socket.emit('system:status', {
  cpu: 45,
  memory: 60,
  uptime: 3600,
  activeConnections: 12,
});
```

## Mock Mode

When the backend WebSocket server is not available, the components run in mock mode automatically. This allows frontend development to continue independently.

**Environment Variable:**
```env
VITE_MOCK_WEBSOCKET=false  # Set to false to attempt real connection
```

## Event Reference

### Emitted Events

- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- Custom events via `emit(event, data)`

### Subscribed Events

- `notification` - New notification
- `user:presence` - User online/offline status
- `system:status` - System health metrics
- `typing:start` - Typing started
- `typing:stop` - Typing stopped
- `data:updated` - Data updated
- Custom events via `on(event, callback)`

## Styling

All components come with default CSS styles. You can customize by:

1. Overriding CSS variables
2. Importing custom CSS after component CSS
3. Using CSS modules

## Testing

Components are fully tested with Vitest and React Testing Library.

Run tests:
```bash
npm test
```

## Examples

See `Dashboard.jsx` for example usage of multiple real-time components.
