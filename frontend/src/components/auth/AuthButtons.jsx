import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AuthButtons.css';

function AuthButtons() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isAuthenticated) {
    return (
      <div className="auth-buttons">
        <span className="user-greeting">Hello, {user?.name || user?.email}!</span>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="auth-buttons">
      <button onClick={() => navigate('/login')} className="login-button">
        Login
      </button>
      <button onClick={() => navigate('/register')} className="register-button">
        Register
      </button>
    </div>
  );
}

export default AuthButtons;
