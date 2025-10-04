import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConnectionStatus from '../../../src/components/realtime/ConnectionStatus';

// Mock useWebSocket hook
vi.mock('../../../src/components/realtime/WebSocketProvider', () => ({
  useWebSocket: vi.fn(),
}));

import { useWebSocket } from '../../../src/components/realtime/WebSocketProvider';

describe('ConnectionStatus', () => {
  it('renders nothing when connected without error', () => {
    useWebSocket.mockReturnValue({
      connected: true,
      error: null,
      reconnect: vi.fn(),
      isMockMode: false,
    });

    const { container } = render(<ConnectionStatus />);
    expect(container.firstChild).toBeNull();
  });

  it('shows mock mode indicator', () => {
    useWebSocket.mockReturnValue({
      connected: true,
      error: null,
      reconnect: vi.fn(),
      isMockMode: true,
    });

    render(<ConnectionStatus />);
    expect(screen.getByText(/mock mode/i)).toBeDefined();
  });

  it('shows disconnected status', () => {
    useWebSocket.mockReturnValue({
      connected: false,
      error: null,
      reconnect: vi.fn(),
      isMockMode: false,
    });

    render(<ConnectionStatus />);
    expect(screen.getByText('Disconnected from server')).toBeDefined();
  });

  it('shows error message', () => {
    useWebSocket.mockReturnValue({
      connected: false,
      error: 'Connection timeout',
      reconnect: vi.fn(),
      isMockMode: false,
    });

    render(<ConnectionStatus />);
    expect(screen.getByText('Connection timeout')).toBeDefined();
  });

  it('calls reconnect when button is clicked', async () => {
    const user = userEvent.setup();
    const mockReconnect = vi.fn();

    useWebSocket.mockReturnValue({
      connected: false,
      error: null,
      reconnect: mockReconnect,
      isMockMode: false,
    });

    render(<ConnectionStatus />);

    const reconnectButton = screen.getByText('Reconnect');
    await user.click(reconnectButton);

    expect(mockReconnect).toHaveBeenCalled();
  });
});
