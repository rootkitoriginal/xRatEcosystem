import { useEffect, useState } from 'react';
import './NotificationToast.css';

const NotificationToast = ({ notification, onClose, duration = 5000 }) => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        setVisible(false);
        setTimeout(() => onClose(notification.id), 300);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [notification.id, duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(notification.id), 300);
  };

  const getIcon = () => {
    switch (notification.type) {
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

  return (
    <div
      className={`notification-toast ${notification.type || 'info'} ${visible ? 'show' : 'hide'}`}
    >
      <div className="toast-content">
        <span className="toast-icon">{getIcon()}</span>
        <div className="toast-message">
          {notification.title && <div className="toast-title">{notification.title}</div>}
          <div className="toast-text">{notification.message}</div>
        </div>
        <button className="toast-close" onClick={handleClose} aria-label="Close notification">
          ✕
        </button>
      </div>
      <div className="toast-progress" style={{ width: `${progress}%` }} />
    </div>
  );
};

export default NotificationToast;
