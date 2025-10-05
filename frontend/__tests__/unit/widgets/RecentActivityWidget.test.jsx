import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RecentActivityWidget from '../../../src/components/widgets/RecentActivityWidget';

// Mock the data service
vi.mock('../../../src/services/dataService', () => ({
  dataService: {
    getAll: vi.fn(),
  },
}));

import { dataService } from '../../../src/services/dataService';

describe('RecentActivityWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    dataService.getAll.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<RecentActivityWidget />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('displays recent items after loading', async () => {
    const mockData = [
      {
        id: 1,
        name: 'Project Alpha',
        category: 'Development',
        updatedAt: '2023-10-01T10:00:00Z',
      },
      {
        id: 2,
        name: 'Project Beta',
        category: 'Testing',
        updatedAt: '2023-10-01T09:00:00Z',
      },
    ];

    dataService.getAll.mockResolvedValue({
      data: mockData,
      pagination: { total: 2 },
    });

    render(<RecentActivityWidget />);

    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeDefined();
      expect(screen.getByText('Project Beta')).toBeDefined();
    });
  });

  it('displays empty state when no items', async () => {
    dataService.getAll.mockResolvedValue({
      data: [],
      pagination: { total: 0 },
    });

    render(<RecentActivityWidget />);

    await waitFor(() => {
      expect(screen.getByText('No recent activity')).toBeDefined();
    });
  });

  it('calls getData with correct parameters', async () => {
    dataService.getAll.mockResolvedValue({
      data: [],
      pagination: { total: 0 },
    });

    render(<RecentActivityWidget />);

    await waitFor(() => {
      expect(dataService.getAll).toHaveBeenCalledWith({
        limit: 5,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });
    });
  });
});
