import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import ConnectionStatus from '../../../src/components/realtime/ConnectionStatus';

// Mock useWebSocket hook
vi.mock('../../../src/components/realtime/WebSocketProvider', () => ({
  useWebSocket: vi.fn(),
}));

import { useWebSocket } from '../../../src/components/realtime/WebSocketProvider';

describe('ConnectionStatus', () => {
  it('always renders nothing (hidden component)', () => {
    useWebSocket.mockReturnValue({
      connected: true,
      error: null,
      reconnect: vi.fn(),
      isMockMode: false,
    });

    const { container } = render(<ConnectionStatus />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing even with mock mode', () => {
    useWebSocket.mockReturnValue({
      connected: true,
      error: null,
      reconnect: vi.fn(),
      isMockMode: true,
    });

    const { container } = render(<ConnectionStatus />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing even when disconnected', () => {
    useWebSocket.mockReturnValue({
      connected: false,
      error: null,
      reconnect: vi.fn(),
      isMockMode: false,
    });

    const { container } = render(<ConnectionStatus />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing even with error', () => {
    useWebSocket.mockReturnValue({
      connected: false,
      error: 'Connection timeout',
      reconnect: vi.fn(),
      isMockMode: false,
    });

    const { container } = render(<ConnectionStatus />);
    expect(container.firstChild).toBeNull();
  });

  it('component is completely hidden', () => {
    const mockReconnect = vi.fn();

    useWebSocket.mockReturnValue({
      connected: false,
      error: null,
      reconnect: mockReconnect,
      isMockMode: false,
    });

    const { container } = render(<ConnectionStatus />);
    expect(container.firstChild).toBeNull();
    // Component doesn't render anything, so no interaction possible
  });
});
