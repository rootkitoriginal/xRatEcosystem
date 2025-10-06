import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';

const WebSocketContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

const MOCK_MODE = import.meta.env.VITE_MOCK_WEBSOCKET !== 'false';

export const WebSocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState({});
  const reconnectTimeoutRef = useRef(null);
  const mockSocketRef = useRef(null);

  // Mock socket for development
  const createMockSocket = useCallback(() => {
    if (mockSocketRef.current) return mockSocketRef.current;

    const listeners = {};
    const mockSocket = {
      connected: true,
      emit: (event, data) => {
        console.log('[Mock Socket] Emit:', event, data);
      },
      on: (event, callback) => {
        if (!listeners[event]) {
          listeners[event] = [];
        }
        listeners[event].push(callback);

        // Simulate connection events
        if (event === 'connect') {
          setTimeout(() => callback(), 100);
        }
      },
      off: (event, callback) => {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter((cb) => cb !== callback);
        }
      },
      disconnect: () => {
        console.log('[Mock Socket] Disconnected');
        mockSocket.connected = false;
      },
      // Helper to trigger events for testing
      _trigger: (event, data) => {
        if (listeners[event]) {
          listeners[event].forEach((cb) => cb(data));
        }
      },
    };

    mockSocketRef.current = mockSocket;
    return mockSocket;
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setConnected(false);
      return;
    }

    let socketInstance;

    if (MOCK_MODE) {
      // Use mock socket for development
      socketInstance = createMockSocket();
      setSocket(socketInstance);
      setConnected(true);
      setError(null);
    } else {
      // Real socket.io connection
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      socketInstance = io(API_URL, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socketInstance.on('connect', () => {
        console.log('[WebSocket] Connected');
        setConnected(true);
        setError(null);
      });

      socketInstance.on('disconnect', () => {
        console.log('[WebSocket] Disconnected');
        setConnected(false);
      });

      socketInstance.on('connect_error', (err) => {
        console.error('[WebSocket] Connection error:', err);
        setError(err.message);
        setConnected(false);
      });

      socketInstance.on('error', (err) => {
        console.error('[WebSocket] Error:', err);
        setError(err.message);
      });

      setSocket(socketInstance);
    }

    // Cleanup
    return () => {
      if (socketInstance && !MOCK_MODE) {
        socketInstance.disconnect();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isAuthenticated, token, createMockSocket]);

  // Listen for notification events
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification) => {
      setNotifications((prev) => [
        {
          ...notification,
          id: notification.id || Date.now(),
          timestamp: notification.timestamp || new Date().toISOString(),
        },
        ...prev,
      ]);
    };

    const handleUserPresence = (data) => {
      setUsers((prev) => ({
        ...prev,
        [data.userId]: {
          ...prev[data.userId],
          online: data.status === 'online',
          lastSeen: data.timestamp,
        },
      }));
    };

    socket.on('notification', handleNotification);
    socket.on('user:presence', handleUserPresence);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('user:presence', handleUserPresence);
    };
  }, [socket]);

  // Emit event
  const emit = useCallback(
    (event, data) => {
      if (socket) {
        socket.emit(event, data);
      }
    },
    [socket]
  );

  // Subscribe to event
  const on = useCallback(
    (event, callback) => {
      if (socket) {
        socket.on(event, callback);
        return () => socket.off(event, callback);
      }
      return () => {};
    },
    [socket]
  );

  // Add notification
  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [
      {
        ...notification,
        id: notification.id || Date.now(),
        timestamp: notification.timestamp || new Date().toISOString(),
      },
      ...prev,
    ]);
  }, []);

  // Remove notification
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    if (socket && !connected && !MOCK_MODE) {
      socket.connect();
    }
  }, [socket, connected]);

  const value = {
    socket,
    connected,
    error,
    emit,
    on,
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    users,
    reconnect,
    isMockMode: MOCK_MODE,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};
