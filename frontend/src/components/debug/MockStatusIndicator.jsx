import { useState, useEffect } from 'react';
import { isUsingMockAuth } from '../../services/authService';
import { isUsingMockData } from '../../services/dataService';
import './MockStatusIndicator.css';

function MockStatusIndicator() {
  const [mockStatus, setMockStatus] = useState({
    auth: false,
    data: false,
    websocket: false,
  });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check mock status
    const authMock = isUsingMockAuth();
    const dataMock = isUsingMockData();
    const websocketMock = import.meta.env.VITE_USE_MOCK_WEBSOCKET === 'true';

    setMockStatus({
      auth: authMock,
      data: dataMock,
      websocket: websocketMock,
    });

    // Log mock status to console
    console.group('🎭 Mock Status');
    console.log(`Authentication: ${authMock ? '🔴 MOCK' : '🟢 REAL API'}`);
    console.log(`Data Service: ${dataMock ? '🔴 MOCK' : '🟢 REAL API'}`);
    console.log(`WebSocket: ${websocketMock ? '🔴 MOCK' : '🟢 REAL API'}`);
    console.log(`API URL: ${import.meta.env.VITE_API_URL || 'http://localhost:3000'}`);
    console.groupEnd();

    // Show notification if any mocks are active
    const anyMockActive = authMock || dataMock || websocketMock;
    if (anyMockActive) {
      console.warn('⚠️ Some services are running in MOCK mode. Check .env file to disable mocks.');
    }
  }, []);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const anyMockActive = mockStatus.auth || mockStatus.data || mockStatus.websocket;

  if (!isVisible) {
    return (
      <div className="mock-status-collapsed" onClick={toggleVisibility}>
        <span className={`mock-status-dot ${anyMockActive ? 'mock-active' : 'mock-inactive'}`}>
          {anyMockActive ? '🔴' : '🟢'}
        </span>
      </div>
    );
  }

  return (
    <div className={`mock-status-indicator ${anyMockActive ? 'has-mocks' : 'no-mocks'}`}>
      <div className="mock-status-header" onClick={toggleVisibility}>
        <h4>🎭 Mock Status</h4>
        <button className="mock-status-toggle">−</button>
      </div>
      
      <div className="mock-status-content">
        <div className="mock-status-item">
          <span className="mock-service">Auth:</span>
          <span className={`mock-value ${mockStatus.auth ? 'mock-on' : 'mock-off'}`}>
            {mockStatus.auth ? '🔴 MOCK' : '🟢 REAL'}
          </span>
        </div>
        
        <div className="mock-status-item">
          <span className="mock-service">Data:</span>
          <span className={`mock-value ${mockStatus.data ? 'mock-on' : 'mock-off'}`}>
            {mockStatus.data ? '🔴 MOCK' : '🟢 REAL'}
          </span>
        </div>
        
        <div className="mock-status-item">
          <span className="mock-service">WebSocket:</span>
          <span className={`mock-value ${mockStatus.websocket ? 'mock-on' : 'mock-off'}`}>
            {mockStatus.websocket ? '🔴 MOCK' : '🟢 REAL'}
          </span>
        </div>

        <div className="mock-status-info">
          <p>API URL: <code>{import.meta.env.VITE_API_URL || 'http://localhost:3000'}</code></p>
          {anyMockActive && (
            <p className="mock-warning">
              ⚠️ To disable mocks, set environment variables to &apos;false&apos; in .env file
            </p>
          )}
        </div>

        <div className="mock-status-env">
          <details>
            <summary>Environment Variables</summary>
            <ul>
              <li><code>VITE_USE_MOCK_AUTH={import.meta.env.VITE_USE_MOCK_AUTH || 'undefined'}</code></li>
              <li><code>VITE_USE_MOCK_DATA={import.meta.env.VITE_USE_MOCK_DATA || 'undefined'}</code></li>
              <li><code>VITE_USE_MOCK_WEBSOCKET={import.meta.env.VITE_USE_MOCK_WEBSOCKET || 'undefined'}</code></li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}

export default MockStatusIndicator;