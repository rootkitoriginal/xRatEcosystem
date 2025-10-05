import './ProfileDisplay.css';

function ProfileDisplay({ profile, onEdit }) {
  return (
    <div className="profile-display">
      <div className="profile-header">
        <div className="profile-avatar-large">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.fullName || 'User'} />
          ) : (
            <div className="avatar-placeholder">
              {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : '?'}
            </div>
          )}
        </div>
        <div className="profile-info">
          <h2>{profile.fullName || 'No name set'}</h2>
          <button onClick={onEdit} className="btn btn-secondary">
            ✏️ Edit Profile
          </button>
        </div>
      </div>

      <div className="profile-details">
        <div className="profile-field">
          <label>Bio</label>
          <p>{profile.bio || 'No bio yet. Tell us about yourself!'}</p>
        </div>

        <div className="profile-field">
          <label>Avatar URL</label>
          <p className="url-field">{profile.avatarUrl || 'No avatar URL set'}</p>
        </div>
      </div>
    </div>
  );
}

export default ProfileDisplay;
