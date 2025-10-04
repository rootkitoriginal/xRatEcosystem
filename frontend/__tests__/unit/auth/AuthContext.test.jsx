import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../../src/contexts/AuthContext';

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('provides initial state', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBe(null);
    expect(result.current.token).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('logs in user successfully', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.user).toBeDefined();
    expect(result.current.user.email).toBe('test@example.com');
    expect(result.current.token).toBeDefined();
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('registers user successfully', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(result.current.user).toBeDefined();
    expect(result.current.user.name).toBe('Test User');
    expect(result.current.user.email).toBe('test@example.com');
    expect(result.current.token).toBeDefined();
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('logs out user successfully', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBe(null);
    expect(result.current.token).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('persists user in localStorage', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(localStorage.getItem('authToken')).toBeDefined();
    expect(localStorage.getItem('authUser')).toBeDefined();
  });

  it('removes user from localStorage on logout', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(localStorage.getItem('authToken')).toBeDefined();

    await act(async () => {
      await result.current.logout();
    });

    expect(localStorage.getItem('authToken')).toBe(null);
    expect(localStorage.getItem('authUser')).toBe(null);
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });
});
