import { useState, useEffect } from 'react';
import { useWebSocket } from './WebSocketProvider';
import './SystemStatus.css';

const SystemStatus = () => {
  const { on, connected } = useWebSocket();
  const [status, setStatus] = useState({
    cpu: null,
    memory: null,
    uptime: null,
    activeConnections: 0,
  });

  useEffect(() => {
    const handleSystemUpdate = (data) => {
      setStatus(data);
    };

    const unsubscribe = on('system:status', handleSystemUpdate);
    return unsubscribe;
  }, [on]);

  const formatUptime = (seconds) => {
    if (!seconds) return 'Unknown';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (value) => {
    if (value === null) return 'unknown';
    if (value < 50) return 'good';
    if (value < 80) return 'warning';
    return 'critical';
  };

  return (
    <div className="system-status">
      <h3 className="system-status-title">
        System Status
        <span className={`connection-dot ${connected ? 'connected' : 'disconnected'}`} />
      </h3>

      <div className="status-grid">
        <div className={`status-metric ${getStatusColor(status.cpu)}`}>
          <div className="metric-label">CPU Usage</div>
          <div className="metric-value">{status.cpu !== null ? `${status.cpu}%` : '—'}</div>
          {status.cpu !== null && (
            <div className="metric-bar">
              <div className="metric-bar-fill" style={{ width: `${status.cpu}%` }} />
            </div>
          )}
        </div>

        <div className={`status-metric ${getStatusColor(status.memory)}`}>
          <div className="metric-label">Memory Usage</div>
          <div className="metric-value">{status.memory !== null ? `${status.memory}%` : '—'}</div>
          {status.memory !== null && (
            <div className="metric-bar">
              <div className="metric-bar-fill" style={{ width: `${status.memory}%` }} />
            </div>
          )}
        </div>

        <div className="status-metric">
          <div className="metric-label">Uptime</div>
          <div className="metric-value">{formatUptime(status.uptime)}</div>
        </div>

        <div className="status-metric">
          <div className="metric-label">Active Connections</div>
          <div className="metric-value">{status.activeConnections}</div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
