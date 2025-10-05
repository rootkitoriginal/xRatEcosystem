import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RecentActivityWidget from '../../../src/components/widgets/RecentActivityWidget';
import { mockDataService } from '../../../src/services/mockDataService';

// Mock the data service
vi.mock('../../../src/services/mockDataService', () => ({
  mockDataService: {
    getData: vi.fn(),
  },
}));

describe('RecentActivityWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockDataService.getData.mockImplementation(
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
        updatedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      },
      {
        id: 2,
        name: 'Project Beta',
        updatedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      },
    ];

    mockDataService.getData.mockResolvedValue({
      data: mockData,
      pagination: { total: 2, page: 1, perPage: 5, totalPages: 1 },
    });

    render(<RecentActivityWidget />);

    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeDefined();
      expect(screen.getByText('Project Beta')).toBeDefined();
    });
  });

  it('displays error message on fetch failure', async () => {
    mockDataService.getData.mockRejectedValue(new Error('Network error'));

    render(<RecentActivityWidget />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load recent activity')).toBeDefined();
    });
  });

  it('displays empty state when no items', async () => {
    mockDataService.getData.mockResolvedValue({
      data: [],
      pagination: { total: 0, page: 1, perPage: 5, totalPages: 0 },
    });

    render(<RecentActivityWidget />);

    await waitFor(() => {
      expect(screen.getByText('No recent activity')).toBeDefined();
    });
  });

  it('calls getData with correct parameters', async () => {
    mockDataService.getData.mockResolvedValue({
      data: [],
      pagination: { total: 0, page: 1, perPage: 5, totalPages: 0 },
    });

    render(<RecentActivityWidget />);

    await waitFor(() => {
      expect(mockDataService.getData).toHaveBeenCalledWith({
        perPage: 5,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });
    });
  });

  it('has correct widget structure', async () => {
    mockDataService.getData.mockResolvedValue({
      data: [
        {
          id: 1,
          name: 'Test Item',
          updatedAt: new Date().toISOString(),
        },
      ],
      pagination: { total: 1, page: 1, perPage: 5, totalPages: 1 },
    });

    const { container } = render(<RecentActivityWidget />);

    await waitFor(() => {
      expect(container.querySelector('.recent-activity-widget')).toBeDefined();
      expect(container.querySelector('.widget-header')).toBeDefined();
      expect(container.querySelector('.widget-content')).toBeDefined();
      expect(container.querySelector('.activity-list')).toBeDefined();
    });
  });
});
