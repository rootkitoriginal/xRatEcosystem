import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../../src/contexts/AuthContext';
import LoginForm from '../../../src/components/auth/LoginForm';

const renderLoginForm = (props = {}) => {
  return render(
    <AuthProvider>
      <LoginForm {...props} />
    </AuthProvider>
  );
};

describe('LoginForm', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders login form correctly', () => {
    renderLoginForm();

    expect(screen.getByText('🔐 Login')).toBeDefined();
    expect(screen.getByLabelText('Email')).toBeDefined();
    expect(screen.getByLabelText('Password')).toBeDefined();
    expect(screen.getByRole('button', { name: /login/i })).toBeDefined();
  });

  it('shows validation errors for empty fields', async () => {
    renderLoginForm();
    const user = userEvent.setup();

    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeDefined();
      expect(screen.getByText('Password is required')).toBeDefined();
    });
  });

  it('shows validation error for short password', async () => {
    renderLoginForm();
    const user = userEvent.setup();

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '12345');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeDefined();
    });
  });

  it('submits form with valid credentials', async () => {
    const onSuccess = vi.fn();
    renderLoginForm({ onSuccess });
    const user = userEvent.setup();

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('disables form during submission', async () => {
    renderLoginForm();
    const user = userEvent.setup();

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(screen.getByRole('button', { name: /logging in/i })).toBeDefined();
  });

  it('shows switch to register link', () => {
    const onSwitchToRegister = vi.fn();
    renderLoginForm({ onSwitchToRegister });

    const registerLink = screen.getByRole('button', { name: /register here/i });
    expect(registerLink).toBeDefined();
  });
});
