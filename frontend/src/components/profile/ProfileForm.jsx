import { useState, useEffect } from 'react';
import './ProfileForm.css';

function ProfileForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    avatarUrl: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        bio: initialData.bio || '',
        avatarUrl: initialData.avatarUrl || '',
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {};

    if (formData.bio && formData.bio.length > 250) {
      newErrors.bio = 'Bio must not exceed 250 characters';
    }

    if (formData.avatarUrl) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(formData.avatarUrl)) {
        newErrors.avatarUrl = 'Must be a valid URL starting with http:// or https://';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to save profile' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="profile-form-container">
      <h3>✏️ Edit Profile</h3>
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label htmlFor="fullName">Full Name</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Enter your full name"
            disabled={isSubmitting}
          />
          {errors.fullName && <span className="error-text">{errors.fullName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="bio">
            Bio <span className="char-count">({formData.bio.length}/250)</span>
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself (max 250 characters)"
            rows="4"
            maxLength="250"
            disabled={isSubmitting}
          />
          {errors.bio && <span className="error-text">{errors.bio}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="avatarUrl">Avatar URL</label>
          <input
            type="text"
            id="avatarUrl"
            name="avatarUrl"
            value={formData.avatarUrl}
            onChange={handleChange}
            placeholder="https://example.com/avatar.jpg"
            disabled={isSubmitting}
          />
          {errors.avatarUrl && <span className="error-text">{errors.avatarUrl}</span>}
          {formData.avatarUrl && !errors.avatarUrl && (
            <div className="avatar-preview">
              <img
                src={formData.avatarUrl}
                alt="Avatar preview"
                onError={(e) => {
                  e.target.style.display = 'none';
                  setErrors((prev) => ({ ...prev, avatarUrl: 'Failed to load image' }));
                }}
              />
            </div>
          )}
        </div>

        {errors.submit && (
          <div className="error-banner">
            <span>⚠️ {errors.submit}</span>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? '💾 Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfileForm;
