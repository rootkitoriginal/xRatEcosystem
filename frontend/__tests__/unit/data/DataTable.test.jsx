import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DataTable from '../../../src/components/data/DataTable';

describe('DataTable', () => {
  const mockData = [
    {
      id: 1,
      name: 'Test Item 1',
      category: 'Development',
      status: 'Active',
      priority: 'High',
      value: 1000,
      createdAt: '2025-01-01T10:00:00Z',
    },
    {
      id: 2,
      name: 'Test Item 2',
      category: 'Marketing',
      status: 'Pending',
      priority: 'Medium',
      value: 500,
      createdAt: '2025-01-02T10:00:00Z',
    },
  ];

  const mockHandlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onSelectionChange: vi.fn(),
  };

  it('renders table with data', () => {
    render(<DataTable data={mockData} {...mockHandlers} />);

    expect(screen.getByText('Test Item 1')).toBeDefined();
    expect(screen.getByText('Test Item 2')).toBeDefined();
    expect(screen.getByText('Development')).toBeDefined();
    expect(screen.getByText('Marketing')).toBeDefined();
  });

  it('shows empty state when no data', () => {
    render(<DataTable data={[]} {...mockHandlers} />);

    expect(screen.getByText('No data found')).toBeDefined();
  });

  it('calls onEdit when edit button clicked', () => {
    render(<DataTable data={mockData} {...mockHandlers} />);

    const editButtons = screen.getAllByLabelText(/Edit/);
    fireEvent.click(editButtons[0]);

    expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockData[0]);
  });

  it('calls onDelete when delete button clicked', () => {
    render(<DataTable data={mockData} {...mockHandlers} />);

    const deleteButtons = screen.getAllByLabelText(/Delete/);
    fireEvent.click(deleteButtons[0]);

    expect(mockHandlers.onDelete).toHaveBeenCalledWith(1);
  });

  it('selects individual rows', () => {
    render(<DataTable data={mockData} {...mockHandlers} selectedIds={[]} />);

    const checkboxes = screen.getAllByRole('checkbox');
    // Click the first data row checkbox (skip the header checkbox)
    fireEvent.click(checkboxes[1]);

    expect(mockHandlers.onSelectionChange).toHaveBeenCalledWith([1]);
  });

  it('selects all rows when header checkbox clicked', () => {
    render(<DataTable data={mockData} {...mockHandlers} selectedIds={[]} />);

    const checkboxes = screen.getAllByRole('checkbox');
    // Click the header checkbox
    fireEvent.click(checkboxes[0]);

    expect(mockHandlers.onSelectionChange).toHaveBeenCalledWith([1, 2]);
  });

  it('displays status badges correctly', () => {
    render(<DataTable data={mockData} {...mockHandlers} />);

    expect(screen.getByText('Active')).toBeDefined();
    expect(screen.getByText('Pending')).toBeDefined();
  });

  it('displays priority badges correctly', () => {
    render(<DataTable data={mockData} {...mockHandlers} />);

    expect(screen.getByText('High')).toBeDefined();
    expect(screen.getByText('Medium')).toBeDefined();
  });
});
