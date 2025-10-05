import { useWebSocket } from './WebSocketProvider';
import NotificationToast from './NotificationToast';
import './NotificationContainer.css';

const NotificationContainer = () => {
  const { notifications, removeNotification } = useWebSocket();

  // Only show recent toasts (last 3)
  const recentNotifications = notifications.slice(0, 3);

  return (
    <div className="notification-container">
      {recentNotifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
