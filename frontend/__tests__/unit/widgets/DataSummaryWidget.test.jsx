import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DataSummaryWidget from '../../../src/components/widgets/DataSummaryWidget';
import { mockDataService } from '../../../src/services/mockDataService';

// Mock the data service
vi.mock('../../../src/services/mockDataService', () => ({
  mockDataService: {
    getStats: vi.fn(),
  },
}));

describe('DataSummaryWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockDataService.getStats.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<DataSummaryWidget />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('displays total count after loading', async () => {
    mockDataService.getStats.mockResolvedValue({
      total: 42,
      byStatus: {},
      byCategory: {},
      byPriority: {},
      totalValue: 0,
    });

    render(<DataSummaryWidget />);

    await waitFor(() => {
      expect(screen.getByText('42')).toBeDefined();
      expect(screen.getByText('Total Records')).toBeDefined();
    });
  });

  it('displays error message on fetch failure', async () => {
    mockDataService.getStats.mockRejectedValue(new Error('Network error'));

    render(<DataSummaryWidget />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load data count')).toBeDefined();
    });
  });

  it('has correct widget structure', async () => {
    mockDataService.getStats.mockResolvedValue({
      total: 10,
      byStatus: {},
      byCategory: {},
      byPriority: {},
      totalValue: 0,
    });

    const { container } = render(<DataSummaryWidget />);

    await waitFor(() => {
      expect(container.querySelector('.data-summary-widget')).toBeDefined();
      expect(container.querySelector('.widget-header')).toBeDefined();
      expect(container.querySelector('.widget-content')).toBeDefined();
    });
  });
});
