import { useState } from 'react';
import { useWebSocket } from './WebSocketProvider';
import './NotificationPanel.css';

const NotificationPanel = () => {
  const { notifications, clearNotifications, removeNotification } = useWebSocket();
  const [isOpen, setIsOpen] = useState(false);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="notification-panel">
      <button className="notification-trigger" onClick={() => setIsOpen(!isOpen)} aria-label="Open notifications">
        🔔
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button className="clear-all-btn" onClick={clearNotifications}>
                Clear All
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className={`notification-item ${notification.type || 'info'}`}>
                  <div className="notification-item-content">
                    <span className="notification-item-icon">{getIcon(notification.type)}</span>
                    <div className="notification-item-body">
                      {notification.title && <div className="notification-item-title">{notification.title}</div>}
                      <div className="notification-item-message">{notification.message}</div>
                      <div className="notification-item-time">{formatTime(notification.timestamp)}</div>
                    </div>
                    <button
                      className="notification-item-close"
                      onClick={() => removeNotification(notification.id)}
                      aria-label="Dismiss notification"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {isOpen && <div className="notification-overlay" onClick={() => setIsOpen(false)} />}
    </div>
  );
};

export default NotificationPanel;
