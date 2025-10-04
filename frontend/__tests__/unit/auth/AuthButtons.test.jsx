import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../../src/contexts/AuthContext';
import AuthButtons from '../../../src/components/auth/AuthButtons';

const renderAuthButtons = () => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AuthButtons />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('AuthButtons', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows login and register buttons when not authenticated', async () => {
    renderAuthButtons();

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeDefined();
      expect(screen.getByText('Register')).toBeDefined();
    });
  });

  it('shows user greeting and logout button when authenticated', async () => {
    // Simulate authenticated user
    localStorage.setItem('authToken', 'mock-jwt-123456');
    localStorage.setItem(
      'authUser',
      JSON.stringify({ id: 1, email: 'test@example.com', name: 'Test User' })
    );

    renderAuthButtons();

    await waitFor(() => {
      expect(screen.getByText(/Hello, Test User!/i)).toBeDefined();
      expect(screen.getByText('Logout')).toBeDefined();
    });
  });

  it('displays email when name is not available', async () => {
    localStorage.setItem('authToken', 'mock-jwt-123456');
    localStorage.setItem('authUser', JSON.stringify({ id: 1, email: 'test@example.com' }));

    renderAuthButtons();

    await waitFor(() => {
      expect(screen.getByText(/Hello, test@example.com!/i)).toBeDefined();
    });
  });

  it('handles logout click', async () => {
    localStorage.setItem('authToken', 'mock-jwt-123456');
    localStorage.setItem(
      'authUser',
      JSON.stringify({ id: 1, email: 'test@example.com', name: 'Test User' })
    );

    renderAuthButtons();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeDefined();
    });

    const logoutButton = screen.getByText('Logout');
    await user.click(logoutButton);

    await waitFor(() => {
      expect(localStorage.getItem('authToken')).toBeNull();
    });
  });
});
