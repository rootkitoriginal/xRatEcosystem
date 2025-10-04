/**
 * React WebSocket Hook Example for xRat Ecosystem
 * 
 * This example shows how to integrate WebSocket functionality in a React application.
 * 
 * Prerequisites:
 * - npm install socket.io-client
 * - React 16.8+ (for hooks)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

/**
 * Custom hook for WebSocket connection
 */
export function useWebSocket(token, url = 'http://localhost:3000') {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setError('No authentication token provided');
      return;
    }

    // Create socket connection
    const socketInstance = io(url, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socketInstance;

    // Connection handlers
    socketInstance.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
      setError(null);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
      setError(err.message);
      setConnected(false);
    });

    setSocket(socketInstance);

    // Cleanup
    return () => {
      socketInstance.disconnect();
    };
  }, [token, url]);

  return { socket, connected, error };
}

/**
 * Custom hook for data subscriptions
 */
export function useDataSubscription(socket, entity, filters = {}) {
  const [data, setData] = useState([]);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!socket || !entity) return;

    // Subscribe to entity
    socket.emit('data:subscribe', { entity, filters });

    // Listen for subscription confirmation
    const handleSubscribed = (confirmation) => {
      if (confirmation.entity === entity) {
        setSubscribed(true);
        console.log('Subscribed to', confirmation.room);
      }
    };

    // Listen for data updates
    const handleUpdate = (update) => {
      if (update.entity === entity) {
        setData((prev) => [...prev, update.data]);
      }
    };

    socket.on('data:subscribed', handleSubscribed);
    socket.on('data:updated', handleUpdate);

    // Cleanup
    return () => {
      socket.off('data:subscribed', handleSubscribed);
      socket.off('data:updated', handleUpdate);
    };
  }, [socket, entity, filters]);

  return { data, subscribed };
}

/**
 * Custom hook for notifications
 */
export function useNotifications(socket) {
  const [notifications, setNotifications] = useState([]);

  const markAsRead = useCallback(
    (notificationId) => {
      if (socket) {
        socket.emit('notification:read', { notificationId });
      }
    },
    [socket]
  );

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification) => {
      setNotifications((prev) => [...prev, notification]);
      
      // Auto-mark as read after 5 seconds (optional)
      setTimeout(() => {
        if (notification.id) {
          markAsRead(notification.id);
        }
      }, 5000);
    };

    const handleReadAck = (ack) => {
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === ack.notificationId
            ? { ...notif, read: true }
            : notif
        )
      );
    };

    socket.on('notification', handleNotification);
    socket.on('notification:read:ack', handleReadAck);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('notification:read:ack', handleReadAck);
    };
  }, [socket, markAsRead]);

  return { notifications, markAsRead };
}

/**
 * Custom hook for user presence
 */
export function useUserPresence(socket) {
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    if (!socket) return;

    const handleUserStatus = (status) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        if (status.status === 'online') {
          newSet.add(status.userId);
        } else {
          newSet.delete(status.userId);
        }
        return newSet;
      });
    };

    socket.on('user:online', handleUserStatus);

    return () => {
      socket.off('user:online', handleUserStatus);
    };
  }, [socket]);

  return onlineUsers;
}

/**
 * Example Component: Dashboard with real-time updates
 */
export function Dashboard() {
  const token = localStorage.getItem('accessToken');
  const { socket, connected, error } = useWebSocket(token);
  const { data: products, subscribed } = useDataSubscription(socket, 'products', {
    category: 'electronics',
  });
  const { notifications, markAsRead } = useNotifications(socket);
  const onlineUsers = useUserPresence(socket);

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className={`status ${connected ? 'connected' : 'disconnected'}`}>
      {connected ? '🟢 Connected' : '🔴 Disconnected'}
      {error && <span className="error">{error}</span>}
    </div>
  );

  // Notifications list
  const NotificationList = () => (
    <div className="notifications">
      <h3>Notifications ({notifications.length})</h3>
      {notifications.map((notif, index) => (
        <div
          key={index}
          className={`notification ${notif.type} ${notif.read ? 'read' : 'unread'}`}
        >
          <span className="message">{notif.message}</span>
          {!notif.read && (
            <button onClick={() => markAsRead(notif.id)}>
              Mark as read
            </button>
          )}
        </div>
      ))}
    </div>
  );

  // Products list with real-time updates
  const ProductList = () => (
    <div className="products">
      <h3>Products (Real-time) {subscribed && '✅'}</h3>
      {products.map((product, index) => (
        <div key={index} className="product">
          <h4>{product.name}</h4>
          <p>${product.price}</p>
        </div>
      ))}
    </div>
  );

  // Online users list
  const OnlineUsersList = () => (
    <div className="online-users">
      <h3>Online Users ({onlineUsers.size})</h3>
      <ul>
        {Array.from(onlineUsers).map((userId) => (
          <li key={userId}>👤 {userId}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="dashboard">
      <h1>xRat Ecosystem Dashboard</h1>
      <ConnectionStatus />
      
      <div className="grid">
        <ProductList />
        <NotificationList />
        <OnlineUsersList />
      </div>
    </div>
  );
}

/**
 * Example Component: Chat with typing indicators
 */
export function Chat({ roomId }) {
  const token = localStorage.getItem('accessToken');
  const { socket, connected } = useWebSocket(token);
  const [typing, setTyping] = useState(new Set());
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleTyping = (data) => {
      setTyping((prev) => {
        const newSet = new Set(prev);
        newSet.add(data.username);
        
        // Remove after 3 seconds
        setTimeout(() => {
          setTyping((prev) => {
            const updated = new Set(prev);
            updated.delete(data.username);
            return updated;
          });
        }, 3000);
        
        return newSet;
      });
    };

    socket.on('user:typing', handleTyping);

    return () => {
      socket.off('user:typing', handleTyping);
    };
  }, [socket]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);

    // Emit typing indicator (throttled)
    if (socket && connected) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      socket.emit('user:typing', { roomId });

      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null;
      }, 1000);
    }
  };

  return (
    <div className="chat">
      <div className="typing-indicator">
        {typing.size > 0 && (
          <span>{Array.from(typing).join(', ')} is typing...</span>
        )}
      </div>
      
      <input
        type="text"
        value={message}
        onChange={handleInputChange}
        placeholder="Type a message..."
        disabled={!connected}
      />
    </div>
  );
}

/**
 * Example: System Health Monitor
 */
export function SystemHealthMonitor() {
  const token = localStorage.getItem('accessToken');
  const { socket } = useWebSocket(token);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handleHealth = (healthData) => {
      setHealth(healthData);
    };

    socket.on('system:health', handleHealth);

    return () => {
      socket.off('system:health', handleHealth);
    };
  }, [socket]);

  if (!health) return <div>Waiting for health data...</div>;

  return (
    <div className="health-monitor">
      <h3>System Health</h3>
      <div className={`status ${health.status}`}>{health.status}</div>
      <div className="metrics">
        <div>CPU: {health.metrics.cpu}%</div>
        <div>Memory: {health.metrics.memory}%</div>
        <div>Connections: {health.metrics.connections}</div>
      </div>
      <small>Last updated: {new Date(health.timestamp).toLocaleString()}</small>
    </div>
  );
}

// Export all components and hooks
export default {
  useWebSocket,
  useDataSubscription,
  useNotifications,
  useUserPresence,
  Dashboard,
  Chat,
  SystemHealthMonitor,
};
