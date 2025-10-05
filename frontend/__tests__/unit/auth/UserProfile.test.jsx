import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '../../../src/contexts/AuthContext';
import UserProfile from '../../../src/components/auth/UserProfile';

// Mock authService
vi.mock('../../../src/services/authService', () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
  },
  isUsingMockAuth: vi.fn(() => true),
  authConfig: {
    useMock: true,
    apiUrl: 'http://localhost:3000',
  }
}));

import { authService } from '../../../src/services/authService';

const renderUserProfile = () => {
  return render(
    <AuthProvider>
      <UserProfile />
    </AuthProvider>
  );
};

describe('UserProfile', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    
    // Mock successful profile fetch
    authService.getProfile.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      name: 'Test User'
    });
  });

  it('renders nothing when not authenticated', async () => {
    const { container } = renderUserProfile();

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('displays user profile when authenticated', async () => {
    // Simulate authenticated user
    localStorage.setItem('authToken', 'mock-jwt-123456');
    localStorage.setItem(
      'authUser',
      JSON.stringify({ id: 1, email: 'test@example.com', name: 'Test User' })
    );

    renderUserProfile();

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeDefined();
      expect(screen.getByText('test@example.com')).toBeDefined();
    });
  });

  it('displays avatar with first letter of name', async () => {
    localStorage.setItem('authToken', 'mock-jwt-123456');
    localStorage.setItem(
      'authUser',
      JSON.stringify({ id: 1, email: 'test@example.com', name: 'Test User' })
    );

    renderUserProfile();

    await waitFor(() => {
      expect(screen.getByText('T')).toBeDefined();
    });
  });

  it('displays fallback when name is not available', async () => {
    localStorage.setItem('authToken', 'mock-jwt-123456');
    localStorage.setItem('authUser', JSON.stringify({ id: 1, email: 'test@example.com' }));

    renderUserProfile();

    await waitFor(() => {
      expect(screen.getByText('User')).toBeDefined();
    });
  });
});
