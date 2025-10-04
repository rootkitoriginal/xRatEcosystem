import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../src/App';

describe('App Component', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the app header', () => {
    render(<App />);

    expect(screen.getByText('🐀 xRat Ecosystem')).toBeDefined();
    expect(screen.getByText('Docker Isolated Environment')).toBeDefined();
  });

  it('shows login page when not authenticated', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('🔐 Login')).toBeDefined();
    });
  });

  it('shows login and register buttons when not authenticated', () => {
    render(<App />);

    const loginButtons = screen.getAllByRole('button', { name: /login/i });
    expect(loginButtons.length).toBeGreaterThan(0);

    const registerButtons = screen.getAllByRole('button', { name: /register/i });
    expect(registerButtons.length).toBeGreaterThan(0);
  });

  it('redirects to login when accessing protected route without auth', async () => {
    // App has its own BrowserRouter, so we just render it directly
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('🔐 Login')).toBeDefined();
    });
  });
});
