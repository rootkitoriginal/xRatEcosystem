import { useAuth } from '../../contexts/AuthContext';
import './UserProfile.css';

function UserProfile() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="user-profile">
      <div className="profile-avatar">
        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
      </div>
      <div className="profile-info">
        <div className="profile-name">{user.name || 'User'}</div>
        <div className="profile-email">{user.email}</div>
      </div>
    </div>
  );
}

export default UserProfile;
