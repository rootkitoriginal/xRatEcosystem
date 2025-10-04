import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../../src/contexts/AuthContext';
import RegisterForm from '../../../src/components/auth/RegisterForm';

const renderRegisterForm = (props = {}) => {
  return render(
    <AuthProvider>
      <RegisterForm {...props} />
    </AuthProvider>
  );
};

describe('RegisterForm', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders register form correctly', () => {
    renderRegisterForm();

    expect(screen.getByText('📝 Register')).toBeDefined();
    expect(screen.getByLabelText('Name')).toBeDefined();
    expect(screen.getByLabelText('Email')).toBeDefined();
    expect(screen.getByLabelText('Password')).toBeDefined();
    expect(screen.getByLabelText('Confirm Password')).toBeDefined();
    expect(screen.getByRole('button', { name: /^register$/i })).toBeDefined();
  });

  it('shows validation errors for empty fields', async () => {
    renderRegisterForm();
    const user = userEvent.setup();

    const submitButton = screen.getByRole('button', { name: /^register$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeDefined();
      expect(screen.getByText('Email is required')).toBeDefined();
      expect(screen.getByText('Password is required')).toBeDefined();
      expect(screen.getByText('Please confirm your password')).toBeDefined();
    });
  });

  it('shows validation error for short name', async () => {
    renderRegisterForm();
    const user = userEvent.setup();

    const nameInput = screen.getByLabelText('Name');
    const submitButton = screen.getByRole('button', { name: /^register$/i });

    await user.type(nameInput, 'A');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeDefined();
    });
  });

  it('shows validation error for short password', async () => {
    renderRegisterForm();
    const user = userEvent.setup();

    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /^register$/i });

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '12345');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeDefined();
    });
  });

  it('shows validation error when passwords do not match', async () => {
    renderRegisterForm();
    const user = userEvent.setup();

    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /^register$/i });

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password456');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeDefined();
    });
  });

  it('submits form with valid data', async () => {
    const onSuccess = vi.fn();
    renderRegisterForm({ onSuccess });
    const user = userEvent.setup();

    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /^register$/i });

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('disables form during submission', async () => {
    renderRegisterForm();
    const user = userEvent.setup();

    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /^register$/i });

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    expect(screen.getByRole('button', { name: /registering/i })).toBeDefined();
  });

  it('shows switch to login link', () => {
    const onSwitchToLogin = vi.fn();
    renderRegisterForm({ onSwitchToLogin });

    const loginLink = screen.getByRole('button', { name: /login here/i });
    expect(loginLink).toBeDefined();
  });
});
