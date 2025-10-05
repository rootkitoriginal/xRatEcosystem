import { useState, useEffect } from 'react';
import ProfileDisplay from '../components/profile/ProfileDisplay';
import ProfileForm from '../components/profile/ProfileForm';
import { userService } from '../services/userService';
import { useWebSocket } from '../components/realtime/WebSocketProvider';
import './ProfilePage.css';

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { addNotification } = useWebSocket();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getProfile();
      setProfile(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load profile');
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (profileData) => {
    try {
      const response = await userService.updateProfile(profileData);
      setProfile(response.data);
      setIsEditing(false);

      // Show success notification
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Profile updated successfully!',
      });
    } catch (err) {
      // Re-throw to let form handle the error
      throw err;
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="error-container">
            <h2>⚠️ Error</h2>
            <p>{error}</p>
            <button onClick={fetchProfile} className="btn btn-primary">
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <header className="profile-header">
          <div>
            <h1>👤 My Profile</h1>
            <p>Manage your personal information</p>
          </div>
        </header>

        {isEditing ? (
          <ProfileForm
            initialData={profile}
            onSubmit={handleUpdateProfile}
            onCancel={handleCancelEdit}
          />
        ) : (
          <ProfileDisplay profile={profile} onEdit={() => setIsEditing(true)} />
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
