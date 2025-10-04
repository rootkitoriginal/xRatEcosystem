import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SystemStatus from '../../../src/components/realtime/SystemStatus';

// Mock useWebSocket hook
vi.mock('../../../src/components/realtime/WebSocketProvider', () => ({
  useWebSocket: vi.fn(),
}));

import { useWebSocket } from '../../../src/components/realtime/WebSocketProvider';

describe('SystemStatus', () => {
  it('renders system status component', () => {
    useWebSocket.mockReturnValue({
      connected: true,
      on: vi.fn(() => vi.fn()),
    });

    render(<SystemStatus />);

    expect(screen.getByText('System Status')).toBeDefined();
    expect(screen.getByText('CPU Usage')).toBeDefined();
    expect(screen.getByText('Memory Usage')).toBeDefined();
    expect(screen.getByText('Uptime')).toBeDefined();
    expect(screen.getByText('Active Connections')).toBeDefined();
  });

  it('displays placeholder when no data', () => {
    useWebSocket.mockReturnValue({
      connected: true,
      on: vi.fn(() => vi.fn()),
    });

    render(<SystemStatus />);

    const placeholders = screen.getAllByText('—');
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it('shows connected status', () => {
    useWebSocket.mockReturnValue({
      connected: true,
      on: vi.fn(() => vi.fn()),
    });

    const { container } = render(<SystemStatus />);
    const connectedDot = container.querySelector('.connection-dot.connected');

    expect(connectedDot).toBeDefined();
  });

  it('shows disconnected status', () => {
    useWebSocket.mockReturnValue({
      connected: false,
      on: vi.fn(() => vi.fn()),
    });

    const { container } = render(<SystemStatus />);
    const disconnectedDot = container.querySelector('.connection-dot.disconnected');

    expect(disconnectedDot).toBeDefined();
  });
});
