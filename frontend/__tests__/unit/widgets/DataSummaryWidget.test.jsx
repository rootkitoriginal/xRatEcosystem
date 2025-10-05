import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DataSummaryWidget from '../../../src/components/widgets/DataSummaryWidget';

// Mock the data service
vi.mock('../../../src/services/dataService', () => ({
  dataService: {
    getAnalytics: vi.fn(),
  },
}));

import { dataService } from '../../../src/services/dataService';

describe('DataSummaryWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    dataService.getAnalytics.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<DataSummaryWidget />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('displays total count after loading', async () => {
    dataService.getAnalytics.mockResolvedValue({
      analytics: {
        total: 42,
      }
    });

    render(<DataSummaryWidget />);

    await waitFor(() => {
      expect(screen.getByText('42')).toBeDefined();
      expect(screen.getByText('Total Records')).toBeDefined();
    });
  });

  it('displays error message on fetch failure', async () => {
    dataService.getAnalytics.mockRejectedValue(new Error('Network error'));

    render(<DataSummaryWidget />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load data count')).toBeDefined();
    });
  });
});
