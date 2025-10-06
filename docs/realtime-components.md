# Real-time UI Components Guide

React components for WebSocket/Socket.IO real-time functionality in the xRat Ecosystem.

## Overview

This guide covers the real-time UI components for live updates, notifications, and user presence using WebSocket/Socket.IO.

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
  return <WebSocketProvider>{/* Your app components */}</WebSocketProvider>;
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
<UserPresence userId="user-123" userName="John Doe" size="medium" showName={true} />
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
<RealtimeData event="data:updated" onUpdate={(data) => console.log('Updated:', data)}>
  {({ data, hasUpdate }) => (
    <div className={hasUpdate ? 'flash' : ''}>{data ? JSON.stringify(data) : 'No data'}</div>
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

**Mock Behavior:**

- Simulates connection events
- Generates sample notifications
- Provides test data
- No actual WebSocket connection

## Event Reference

### Emitted Events

- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- Custom events via `emit(event, data)`

**Example:**

```jsx
const { emit } = useWebSocket();

emit('custom:event', {
  userId: '123',
  action: 'like',
  targetId: '456',
});
```

### Subscribed Events

- `notification` - New notification
- `user:presence` - User online/offline status
- `system:status` - System health metrics
- `typing:start` - Typing started
- `typing:stop` - Typing stopped
- `data:updated` - Data updated
- Custom events via `on(event, callback)`

**Example:**

```jsx
const { on } = useWebSocket();

useEffect(() => {
  const unsubscribe = on('custom:event', (data) => {
    console.log('Custom event received:', data);
  });

  return unsubscribe; // Cleanup
}, [on]);
```

## Styling

All components come with default CSS styles. You can customize by:

### 1. Overriding CSS Variables

```css
:root {
  --notification-success: #4caf50;
  --notification-error: #f44336;
  --notification-warning: #ff9800;
  --notification-info: #2196f3;
  --connection-online: #4caf50;
  --connection-offline: #f44336;
}
```

### 2. Importing Custom CSS

```jsx
import './components/realtime/NotificationToast.css';
import './my-custom-styles.css'; // Override default styles
```

### 3. Using CSS Modules

```jsx
import styles from './MyComponent.module.css';

<NotificationToast className={styles.customToast} />;
```

## Testing

Components are fully tested with Vitest and React Testing Library.

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Example Test

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationToast } from './NotificationToast';

describe('NotificationToast', () => {
  it('displays notification message', () => {
    const notification = {
      id: 1,
      type: 'success',
      message: 'Test message',
    };

    render(<NotificationToast notification={notification} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('calls onClose when dismissed', () => {
    const onClose = jest.fn();
    const notification = { id: 1, type: 'info', message: 'Test' };

    render(<NotificationToast notification={notification} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledWith(1);
  });
});
```

## Complete Example: Dashboard

```jsx
import {
  WebSocketProvider,
  NotificationContainer,
  ConnectionStatus,
  SystemStatus,
  UserPresence,
  RealtimeData,
} from './components/realtime';

function Dashboard() {
  return (
    <WebSocketProvider>
      <div className="dashboard">
        <header>
          <h1>Dashboard</h1>
          <ConnectionStatus />
        </header>

        <main>
          <SystemStatus />

          <section>
            <h2>Online Users</h2>
            <UserPresence userId="1" userName="John Doe" />
            <UserPresence userId="2" userName="Jane Smith" />
          </section>

          <section>
            <h2>Live Data</h2>
            <RealtimeData event="data:updated">
              {({ data, hasUpdate }) => (
                <div className={hasUpdate ? 'pulse' : ''}>{JSON.stringify(data, null, 2)}</div>
              )}
            </RealtimeData>
          </section>
        </main>

        <NotificationContainer />
      </div>
    </WebSocketProvider>
  );
}

export default Dashboard;
```

## Best Practices

1. **Always use WebSocketProvider**: Wrap your app in the provider
2. **Handle disconnections gracefully**: Show user-friendly messages
3. **Clean up subscriptions**: Use useEffect cleanup
4. **Throttle frequent events**: Don't emit too often
5. **Mock for development**: Use mock mode when backend is unavailable
6. **Test thoroughly**: Write tests for all event handlers
7. **Optimize renders**: Use React.memo for expensive components

## Troubleshooting

### Components not receiving updates

**Problem**: Real-time updates not appearing

**Solutions:**

1. Verify WebSocketProvider wraps components
2. Check backend is emitting events
3. Verify event names match
4. Check browser console for errors

### Connection issues

**Problem**: WebSocket won't connect

**Solutions:**

1. Check backend WebSocket server is running
2. Verify `VITE_API_URL` is correct
3. Check JWT token is valid
4. Enable mock mode for development

### Performance issues

**Problem**: App slows down with many updates

**Solutions:**

1. Throttle event emissions
2. Use React.memo for components
3. Optimize event handlers
4. Batch state updates

## Related Documentation

- [WebSocket API Documentation](./WEBSOCKET.md)
- [API Documentation](./API.md)
- [Frontend Setup](./frontend-setup.md)
- [Testing Guide](./TESTING.md)

---

**Need help?** Check the [WebSocket examples](./examples.md) or open an issue on GitHub.
