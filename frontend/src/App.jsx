import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WebSocketProvider } from './components/realtime/WebSocketProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthButtons from './components/auth/AuthButtons';
import NotificationPanel from './components/realtime/NotificationPanel';
import NotificationContainer from './components/realtime/NotificationContainer';
import ConnectionStatus from './components/realtime/ConnectionStatus';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import DataManagement from './pages/DataManagement';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider>
          <ConnectionStatus />
          <NotificationContainer />
          <div className="app">
            <header className="header">
              <div>
                <h1>🐀 xRat Ecosystem</h1>
                <p>Docker Isolated Environment</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <NotificationPanel />
                <AuthButtons />
              </div>
            </header>

            <Routes>
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/data"
                element={
                  <ProtectedRoute>
                    <DataManagement />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
