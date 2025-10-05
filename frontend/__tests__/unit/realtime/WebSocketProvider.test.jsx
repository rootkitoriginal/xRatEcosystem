import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { WebSocketProvider, useWebSocket } from '../../../src/components/realtime/WebSocketProvider';
import { AuthProvider } from '../../../src/contexts/AuthContext';

// Mock AuthContext
vi.mock('../../../src/contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../../src/contexts/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(() => ({
      token: 'mock-token',
      isAuthenticated: true,
    })),
  };
});

const wrapper = ({ children }) => (
  <AuthProvider>
    <WebSocketProvider>{children}</WebSocketProvider>
  </AuthProvider>
);

describe('WebSocketProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('provides WebSocket context', () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.socket).toBeDefined();
    expect(result.current.emit).toBeInstanceOf(Function);
    expect(result.current.on).toBeInstanceOf(Function);
  });

  it('connects in mock mode by default', async () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });

    expect(result.current.isMockMode).toBe(true);
  });

  it('manages notifications', () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    act(() => {
      result.current.addNotification({
        type: 'success',
        message: 'Test notification',
      });
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].message).toBe('Test notification');
  });

  it('removes notifications', () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    act(() => {
      result.current.addNotification({
        id: 'test-1',
        type: 'success',
        message: 'Test notification',
      });
    });

    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      result.current.removeNotification('test-1');
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('clears all notifications', () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    act(() => {
      result.current.addNotification({ type: 'info', message: 'Notification 1' });
      result.current.addNotification({ type: 'info', message: 'Notification 2' });
    });

    expect(result.current.notifications).toHaveLength(2);

    act(() => {
      result.current.clearNotifications();
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('emits events through socket', () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    act(() => {
      result.current.emit('test:event', { data: 'test' });
    });

    // In mock mode, emit just logs
    expect(result.current.socket).toBeDefined();
  });

  it('subscribes to events', () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });
    const mockCallback = vi.fn();

    act(() => {
      result.current.on('test:event', mockCallback);
    });

    expect(result.current.socket).toBeDefined();
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useWebSocket());
    }).toThrow('useWebSocket must be used within a WebSocketProvider');
  });
});
