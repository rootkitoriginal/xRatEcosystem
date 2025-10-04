import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserProfile from '../components/auth/UserProfile';
import '../App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function Dashboard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/status`);
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('Failed to connect to backend');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      });
      const data = await response.json();
      setMessage(data.success ? '✅ Data saved successfully!' : '❌ Failed to save data');
      setKey('');
      setValue('');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Error saving data');
      console.error(err);
    }
  };

  return (
    <div className="app">
      <main className="main">
        <section style={{ marginBottom: '2rem' }}>
          <UserProfile />
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <Link to="/data" className="data-link">
            <button className="submit-btn">📊 Go to Data Management</button>
          </Link>
        </section>

        <section className="status-section">
          <h2>System Status</h2>
          {loading && <p>Loading...</p>}
          {error && <div className="error">{error}</div>}
          {status && (
            <div className="status-grid">
              <div className="status-card">
                <h3>🗄️ MongoDB</h3>
                <span
                  className={`badge ${status.database?.mongodb === 'connected' ? 'success' : 'error'}`}
                >
                  {status.database?.mongodb || 'unknown'}
                </span>
              </div>
              <div className="status-card">
                <h3>🔴 Redis</h3>
                <span
                  className={`badge ${status.database?.redis === 'connected' ? 'success' : 'error'}`}
                >
                  {status.database?.redis || 'unknown'}
                </span>
              </div>
              <div className="status-card">
                <h3>⚙️ Backend</h3>
                <span className="badge success">connected</span>
              </div>
              <div className="status-card">
                <h3>🌐 Frontend</h3>
                <span className="badge success">running</span>
              </div>
            </div>
          )}
          <button onClick={fetchStatus} className="refresh-btn">
            🔄 Refresh Status
          </button>
        </section>

        <section className="form-section">
          <h2>Test Redis Cache</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="key">Key:</label>
              <input
                id="key"
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter key"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="value">Value:</label>
              <input
                id="value"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter value"
                required
              />
            </div>
            <button type="submit" className="submit-btn">
              💾 Save to Cache
            </button>
          </form>
          {message && <div className="message">{message}</div>}
        </section>

        <section className="info-section">
          <h2>📋 Ecosystem Info</h2>
          <ul>
            <li>✅ Backend API exposed on port 3000</li>
            <li>✅ Frontend exposed on port 5173</li>
            <li>🔒 MongoDB internal only (not exposed)</li>
            <li>🔒 Redis internal only (not exposed)</li>
            <li>🌐 Isolated Docker network: xrat-network</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
