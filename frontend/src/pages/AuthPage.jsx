import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

function AuthPage() {
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(() => location.pathname !== '/register');
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      {showLogin ? (
        <LoginForm
          onSuccess={handleAuthSuccess}
          onSwitchToRegister={() => setShowLogin(false)}
        />
      ) : (
        <RegisterForm
          onSuccess={handleAuthSuccess}
          onSwitchToLogin={() => setShowLogin(true)}
        />
      )}
    </div>
  );
}

export default AuthPage;
