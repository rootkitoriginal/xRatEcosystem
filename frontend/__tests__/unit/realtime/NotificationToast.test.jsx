import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationToast from '../../../src/components/realtime/NotificationToast';

describe('NotificationToast', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders notification with message', () => {
    const notification = {
      id: 1,
      type: 'success',
      message: 'Test message',
    };

    render(<NotificationToast notification={notification} onClose={mockOnClose} />);

    expect(screen.getByText('Test message')).toBeDefined();
  });

  it('renders notification with title and message', () => {
    const notification = {
      id: 1,
      type: 'info',
      title: 'Test Title',
      message: 'Test message',
    };

    render(<NotificationToast notification={notification} onClose={mockOnClose} />);

    expect(screen.getByText('Test Title')).toBeDefined();
    expect(screen.getByText('Test message')).toBeDefined();
  });

  it('displays correct icon for success type', () => {
    const notification = {
      id: 1,
      type: 'success',
      message: 'Success message',
    };

    render(<NotificationToast notification={notification} onClose={mockOnClose} />);

    expect(screen.getByText('✅')).toBeDefined();
  });

  it('displays correct icon for error type', () => {
    const notification = {
      id: 1,
      type: 'error',
      message: 'Error message',
    };

    render(<NotificationToast notification={notification} onClose={mockOnClose} />);

    expect(screen.getByText('❌')).toBeDefined();
  });

  it('displays correct icon for warning type', () => {
    const notification = {
      id: 1,
      type: 'warning',
      message: 'Warning message',
    };

    render(<NotificationToast notification={notification} onClose={mockOnClose} />);

    expect(screen.getByText('⚠️')).toBeDefined();
  });

  it('calls onClose when close button is clicked', async () => {
    vi.useRealTimers(); // Use real timers for user interaction
    const user = userEvent.setup();
    const notification = {
      id: 1,
      type: 'info',
      message: 'Test message',
    };

    render(<NotificationToast notification={notification} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText('Close notification');

    await act(async () => {
      await user.click(closeButton);
    });

    // Wait for animation to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    expect(mockOnClose).toHaveBeenCalledWith(1);
  });

  it('auto-closes after duration', () => {
    const notification = {
      id: 1,
      type: 'info',
      message: 'Test message',
    };

    render(<NotificationToast notification={notification} onClose={mockOnClose} duration={500} />);

    // Fast-forward time including animation delay
    act(() => {
      vi.advanceTimersByTime(850);
    });

    expect(mockOnClose).toHaveBeenCalledWith(1);
  });
});
