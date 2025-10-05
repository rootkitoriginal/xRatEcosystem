import { useWebSocket } from './WebSocketProvider';
import './ConnectionStatus.css';

const ConnectionStatus = () => {
  const { connected, error, reconnect, isMockMode } = useWebSocket();

  // Show mock mode indicator
  if (isMockMode) {
    return (
      <div className="connection-status warning">
        <div className="connection-status-content">
          <span className="status-icon">🔌</span>
          <span className="status-text">Running in mock mode</span>
        </div>
      </div>
    );
  }

  // Don't show when everything is fine in production mode
  if (connected && !error) {
    return null;
  }

  return (
    <div className={`connection-status ${connected ? 'warning' : 'error'}`}>
      <div className="connection-status-content">
        <span className="status-icon">{connected ? '⚠️' : '❌'}</span>
        <span className="status-text">
          {error || (connected ? 'Connection unstable' : 'Disconnected from server')}
        </span>
        {!connected && (
          <button className="reconnect-btn" onClick={reconnect}>
            Reconnect
          </button>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;
