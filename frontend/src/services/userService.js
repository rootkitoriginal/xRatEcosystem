// User Profile Service
// This provides user profile management functionality
// In development mode, uses mock data; in production, calls real API

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || true;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock profile data storage
let mockProfile = {
  userId: '1',
  fullName: 'John Doe',
  bio: 'Software developer passionate about creating amazing applications.',
  avatarUrl: 'https://via.placeholder.com/150',
};

const mockUserService = {
  // Get user profile
  getProfile: async () => {
    await delay(500);
    return {
      success: true,
      data: { ...mockProfile },
    };
  },

  // Update user profile
  updateProfile: async (profileData) => {
    await delay(800);

    // Validate fields
    if (profileData.bio && profileData.bio.length > 250) {
      throw new Error('Bio must not exceed 250 characters');
    }

    if (profileData.avatarUrl) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(profileData.avatarUrl)) {
        throw new Error('Avatar URL must be a valid URL');
      }
    }

    // Update mock data
    mockProfile = {
      ...mockProfile,
      ...profileData,
    };

    return {
      success: true,
      data: { ...mockProfile },
      message: 'Profile updated successfully',
    };
  },
};

const realUserService = {
  // Get user profile
  getProfile: async () => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/users/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch profile');
    }

    return await response.json();
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update profile');
    }

    return await response.json();
  },
};

// Export the appropriate service based on environment
export const userService = USE_MOCK ? mockUserService : realUserService;
