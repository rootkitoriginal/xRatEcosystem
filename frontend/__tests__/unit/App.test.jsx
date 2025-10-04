import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App';

describe('App Component', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the app header', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ database: { mongodb: 'connected', redis: 'connected' } }),
    });

    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('🐀 xRat Ecosystem')).toBeDefined();
    expect(screen.getByText('Docker Isolated Environment')).toBeDefined();
  });

  it('displays loading state initially', async () => {
    global.fetch.mockImplementation(() => new Promise(() => {}));

    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('fetches and displays status on mount', async () => {
    const mockStatus = {
      success: true,
      ecosystem: 'xRat',
      database: {
        mongodb: 'connected',
        redis: 'connected',
      },
    };

    global.fetch.mockResolvedValueOnce({
      json: async () => mockStatus,
    });

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('🗄️ MongoDB')).toBeDefined();
      expect(screen.getByText('🔴 Redis')).toBeDefined();
    });
  });

  it('displays error message when fetch fails', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to connect to backend')).toBeDefined();
    });
  });

  it('refreshes status when refresh button is clicked', async () => {
    const mockStatus = {
      database: { mongodb: 'connected', redis: 'connected' },
    };

    global.fetch.mockResolvedValue({
      json: async () => mockStatus,
    });

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('🔄 Refresh Status')).toBeDefined();
    });

    const refreshButton = screen.getByText('🔄 Refresh Status');

    await act(async () => {
      fireEvent.click(refreshButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('submits form data successfully', async () => {
    const mockStatus = {
      database: { mongodb: 'connected', redis: 'connected' },
    };

    const mockSubmitResponse = {
      success: true,
      message: 'Data stored successfully',
    };

    global.fetch
      .mockResolvedValueOnce({ json: async () => mockStatus })
      .mockResolvedValueOnce({ json: async () => mockSubmitResponse });

    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Key:')).toBeDefined();
    });

    const keyInput = screen.getByLabelText('Key:');
    const valueInput = screen.getByLabelText('Value:');
    const submitButton = screen.getByText('💾 Save to Cache');

    await user.type(keyInput, 'test-key');
    await user.type(valueInput, 'test-value');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('✅ Data saved successfully!')).toBeDefined();
    });
  });

  it('displays error message when form submission fails', async () => {
    const mockStatus = {
      database: { mongodb: 'connected', redis: 'connected' },
    };

    global.fetch
      .mockResolvedValueOnce({ json: async () => mockStatus })
      .mockRejectedValueOnce(new Error('Submit failed'));

    const user = userEvent.setup();

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Key:')).toBeDefined();
    });

    const keyInput = screen.getByLabelText('Key:');
    const valueInput = screen.getByLabelText('Value:');
    const submitButton = screen.getByText('💾 Save to Cache');

    await user.type(keyInput, 'test-key');
    await user.type(valueInput, 'test-value');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('❌ Error saving data')).toBeDefined();
    });
  });

  it('renders ecosystem info section', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ database: { mongodb: 'connected', redis: 'connected' } }),
    });

    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('📋 Ecosystem Info')).toBeDefined();
    expect(screen.getByText(/Backend API exposed on port 3000/)).toBeDefined();
    expect(screen.getByText(/MongoDB internal only/)).toBeDefined();
  });
});
