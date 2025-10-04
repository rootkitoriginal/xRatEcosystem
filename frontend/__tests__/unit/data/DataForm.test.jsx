import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DataForm from '../../../src/components/data/DataForm';

describe('DataForm', () => {
  const mockHandlers = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders create form with all fields', () => {
    render(<DataForm {...mockHandlers} />);

    expect(screen.getByText('➕ New Record')).toBeDefined();
    expect(screen.getByLabelText(/Name/)).toBeDefined();
    expect(screen.getByLabelText(/Category/)).toBeDefined();
    expect(screen.getByLabelText(/Status/)).toBeDefined();
    expect(screen.getByLabelText(/Priority/)).toBeDefined();
    expect(screen.getByLabelText(/Value/)).toBeDefined();
  });

  it('renders edit form when initialData provided', () => {
    const initialData = {
      name: 'Test Item',
      category: 'Development',
      status: 'Active',
      priority: 'High',
      value: 1000,
    };

    render(<DataForm initialData={initialData} {...mockHandlers} />);

    expect(screen.getByText('✏️ Edit Record')).toBeDefined();
    expect(screen.getByDisplayValue('Test Item')).toBeDefined();
  });

  it('validates required fields', async () => {
    render(<DataForm onSubmit={mockHandlers.onSubmit} />);

    const submitButton = screen.getByText(/Create/);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeDefined();
      expect(screen.getByText('Value is required')).toBeDefined();
    });

    expect(mockHandlers.onSubmit).not.toHaveBeenCalled();
  });

  it('validates name length', async () => {
    render(<DataForm onSubmit={mockHandlers.onSubmit} />);

    const nameInput = screen.getByLabelText(/Name/);
    fireEvent.change(nameInput, { target: { value: 'ab' } });

    const submitButton = screen.getByText(/Create/);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name must be at least 3 characters')).toBeDefined();
    });
  });

  it('submits form with valid data', async () => {
    mockHandlers.onSubmit.mockResolvedValue();
    render(<DataForm onSubmit={mockHandlers.onSubmit} />);

    const nameInput = screen.getByLabelText(/Name/);
    const valueInput = screen.getByLabelText(/Value/);

    fireEvent.change(nameInput, { target: { value: 'Test Item' } });
    fireEvent.change(valueInput, { target: { value: '1000' } });

    const submitButton = screen.getByText(/Create/);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockHandlers.onSubmit).toHaveBeenCalledWith({
        name: 'Test Item',
        category: 'Development',
        status: 'Active',
        priority: 'Medium',
        value: 1000,
      });
    });
  });

  it('calls onCancel when cancel button clicked', () => {
    render(<DataForm {...mockHandlers} />);

    const cancelButton = screen.getByText(/Cancel/);
    fireEvent.click(cancelButton);

    expect(mockHandlers.onCancel).toHaveBeenCalled();
  });

  it('clears errors when field is edited', async () => {
    render(<DataForm onSubmit={mockHandlers.onSubmit} />);

    const submitButton = screen.getByText(/Create/);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeDefined();
    });

    const nameInput = screen.getByLabelText(/Name/);
    fireEvent.change(nameInput, { target: { value: 'Valid Name' } });

    await waitFor(() => {
      expect(screen.queryByText('Name is required')).toBeNull();
    });
  });
});
