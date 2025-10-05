import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserPresence from '../../../src/components/realtime/UserPresence';

// Mock useWebSocket hook
vi.mock('../../../src/components/realtime/WebSocketProvider', () => ({
  useWebSocket: vi.fn(),
}));

import { useWebSocket } from '../../../src/components/realtime/WebSocketProvider';

describe('UserPresence', () => {
  it('renders user with online status', () => {
    useWebSocket.mockReturnValue({
      users: {
        'user-1': {
          online: true,
          lastSeen: new Date().toISOString(),
        },
      },
    });

    render(<UserPresence userId="user-1" userName="John Doe" />);

    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('Online')).toBeDefined();
  });

  it('renders user with offline status', () => {
    useWebSocket.mockReturnValue({
      users: {
        'user-1': {
          online: false,
          lastSeen: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        },
      },
    });

    render(<UserPresence userId="user-1" userName="John Doe" />);

    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText(/Last seen/)).toBeDefined();
  });

  it('renders without user info when showName is false', () => {
    useWebSocket.mockReturnValue({
      users: {
        'user-1': {
          online: true,
        },
      },
    });

    render(<UserPresence userId="user-1" userName="John Doe" showName={false} />);

    expect(screen.queryByText('John Doe')).toBeNull();
  });

  it('displays first letter of name in avatar', () => {
    useWebSocket.mockReturnValue({
      users: {},
    });

    render(<UserPresence userId="user-1" userName="Alice" />);

    expect(screen.getByText('A')).toBeDefined();
  });

  it('handles unknown user', () => {
    useWebSocket.mockReturnValue({
      users: {},
    });

    render(<UserPresence userId="unknown-user" userName="Unknown User" />);

    expect(screen.getByText('Unknown User')).toBeDefined();
  });
});
