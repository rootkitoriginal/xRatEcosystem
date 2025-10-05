import { useWebSocket } from './WebSocketProvider';
import './UserPresence.css';

const UserPresence = ({ userId, userName, showName = true, size = 'medium' }) => {
  const { users } = useWebSocket();
  const userPresence = users[userId];
  const isOnline = userPresence?.online || false;

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`user-presence ${size}`}>
      <div className="user-avatar">
        <span className="avatar-text">{userName?.[0]?.toUpperCase() || '?'}</span>
        <span className={`presence-indicator ${isOnline ? 'online' : 'offline'}`} />
      </div>
      {showName && (
        <div className="user-info">
          <div className="user-name">{userName || 'Unknown User'}</div>
          <div className="user-status">
            {isOnline ? 'Online' : `Last seen ${formatLastSeen(userPresence?.lastSeen)}`}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPresence;
