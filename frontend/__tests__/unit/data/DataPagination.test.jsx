import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DataPagination from '../../../src/components/data/DataPagination';

describe('DataPagination', () => {
  const mockHandlers = {
    onPageChange: vi.fn(),
    onPerPageChange: vi.fn(),
  };

  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    perPage: 10,
    total: 50,
    ...mockHandlers,
  };

  it('displays pagination info', () => {
    render(<DataPagination {...defaultProps} />);

    expect(screen.getByText(/Showing 1 to 10 of 50 records/)).toBeDefined();
  });

  it('displays page numbers', () => {
    render(<DataPagination {...defaultProps} />);

    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
  });

  it('disables first and previous buttons on first page', () => {
    render(<DataPagination {...defaultProps} currentPage={1} />);

    const buttons = screen.getAllByRole('button');
    const firstButton = buttons.find((btn) => btn.getAttribute('aria-label') === 'First page');
    const prevButton = buttons.find((btn) => btn.getAttribute('aria-label') === 'Previous page');

    expect(firstButton.disabled).toBe(true);
    expect(prevButton.disabled).toBe(true);
  });

  it('disables next and last buttons on last page', () => {
    render(<DataPagination {...defaultProps} currentPage={5} />);

    const buttons = screen.getAllByRole('button');
    const nextButton = buttons.find((btn) => btn.getAttribute('aria-label') === 'Next page');
    const lastButton = buttons.find((btn) => btn.getAttribute('aria-label') === 'Last page');

    expect(nextButton.disabled).toBe(true);
    expect(lastButton.disabled).toBe(true);
  });

  it('calls onPageChange when page number clicked', () => {
    render(<DataPagination {...defaultProps} />);

    const page2Button = screen.getByText('2');
    fireEvent.click(page2Button);

    expect(mockHandlers.onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when next button clicked', () => {
    render(<DataPagination {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    const nextButton = buttons.find((btn) => btn.getAttribute('aria-label') === 'Next page');
    fireEvent.click(nextButton);

    expect(mockHandlers.onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPerPageChange when selecting different perPage value', () => {
    render(<DataPagination {...defaultProps} />);

    const select = screen.getByLabelText('Per page:');
    fireEvent.change(select, { target: { value: '20' } });

    expect(mockHandlers.onPerPageChange).toHaveBeenCalledWith(20);
  });

  it('marks current page as active', () => {
    render(<DataPagination {...defaultProps} currentPage={3} />);

    const page3Button = screen.getByLabelText('Page 3');
    expect(page3Button.getAttribute('aria-current')).toBe('page');
  });
});
