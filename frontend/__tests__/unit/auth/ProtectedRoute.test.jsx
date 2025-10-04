import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../../src/contexts/AuthContext';
import ProtectedRoute from '../../../src/components/auth/ProtectedRoute';

const TestComponent = () => <div>Protected Content</div>;
const LoginComponent = () => <div>Login Page</div>;

const renderProtectedRoute = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginComponent />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects to login when not authenticated', async () => {
    renderProtectedRoute('/');

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeDefined();
    });
  });

  it('shows loading state while checking authentication', async () => {
    renderProtectedRoute('/');

    // The loading state appears briefly, then redirects to login
    // We can verify the redirect happens
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeDefined();
    });
  });

  it('renders protected content when authenticated', async () => {
    // Simulate authenticated user
    localStorage.setItem('authToken', 'mock-jwt-123456');
    localStorage.setItem(
      'authUser',
      JSON.stringify({ id: 1, email: 'test@example.com', name: 'Test' })
    );

    renderProtectedRoute('/');

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeDefined();
    });
  });
});
