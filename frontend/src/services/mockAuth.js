// Mock Authentication Service
// This provides authentication functionality for development
// Replace with real API calls when backend is ready

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockAuth = {
  // Simulate login with email and password
  login: async (email, password) => {
    await delay(800); // Simulate network delay

    // Simple validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (password.length < 6) {
      throw new Error('Invalid credentials');
    }

    // Mock successful login
    return {
      token: 'mock-jwt-' + Date.now(),
      user: {
        id: Date.now(),
        email: email,
        name: email.split('@')[0],
      },
    };
  },

  // Simulate registration
  register: async (userData) => {
    await delay(800); // Simulate network delay

    const { name, email, password } = userData;

    // Simple validation
    if (!name || !email || !password) {
      throw new Error('All fields are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Mock successful registration
    return {
      token: 'mock-jwt-' + Date.now(),
      user: {
        id: Date.now(),
        name,
        email,
      },
    };
  },

  // Simulate token validation
  validateToken: async (token) => {
    await delay(300);

    if (!token || !token.startsWith('mock-jwt-')) {
      return null;
    }

    // Return mock user data
    return {
      id: Date.now(),
      email: 'user@example.com',
      name: 'User',
    };
  },

  // Simulate logout
  logout: async () => {
    await delay(300);
    return { success: true };
  },
};
