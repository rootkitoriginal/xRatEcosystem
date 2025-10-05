// Authentication Service
// This provides authentication functionality with configurable mock/real API
// Controlled by VITE_USE_MOCK_AUTH environment variable

import { mockAuth } from './mockAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Real API authentication service
const realAuthService = {
  // Login with real backend API
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      return {
        token: data.data.accessToken,
        user: data.data.user,
      };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  },

  // Register with real backend API
  register: async (userData) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      if (!data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      return {
        token: data.data.accessToken,
        user: data.data.user,
      };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  },

  // Validate token with real backend API
  validateToken: async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (!data.success) {
        return null;
      }

      return data.data.user;
    } catch (error) {
      console.warn('Token validation failed:', error.message);
      return null;
    }
  },

  // Logout with real backend API
  logout: async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn('Logout request failed:', data.message);
      }

      return { success: true };
    } catch (error) {
      console.warn('Logout request failed:', error.message);
      return { success: true }; // Always return success for logout
    }
  },

  // Refresh token with real backend API
  refreshToken: async (refreshToken) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      if (!data.success) {
        throw new Error(data.message || 'Token refresh failed');
      }

      return {
        token: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  },
};

// Enhanced mock service with similar API structure
const enhancedMockAuth = {
  ...mockAuth,
  
  // Add refresh token method for consistency
  refreshToken: async (refreshToken) => {
    await delay(500);
    
    if (!refreshToken || !refreshToken.startsWith('mock-refresh-')) {
      throw new Error('Invalid refresh token');
    }
    
    return {
      token: 'mock-jwt-' + Date.now(),
      refreshToken: 'mock-refresh-' + Date.now(),
    };
  },
};

// Log service mode
console.log(`🔐 Auth Service: Using ${USE_MOCK_AUTH ? 'MOCK' : 'REAL API'} mode`);

// Export the appropriate service based on environment variable
export const authService = USE_MOCK_AUTH ? enhancedMockAuth : realAuthService;

// Export configuration for debugging
export const authConfig = {
  useMock: USE_MOCK_AUTH,
  apiUrl: API_URL,
};

// Helper function to check if we're using mock mode
export const isUsingMockAuth = () => USE_MOCK_AUTH;