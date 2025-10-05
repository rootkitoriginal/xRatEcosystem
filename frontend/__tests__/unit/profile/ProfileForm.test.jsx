import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileForm from '../../../src/components/profile/ProfileForm';

describe('ProfileForm', () => {
  const mockProfile = {
    fullName: 'John Doe',
    bio: 'Software developer',
    avatarUrl: 'https://example.com/avatar.jpg',
  };

  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  it('renders form with initial data', () => {
    render(
      <ProfileForm initialData={mockProfile} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    expect(screen.getByLabelText('Full Name')).toBeDefined();
    expect(screen.getByLabelText(/Bio/)).toBeDefined();
    expect(screen.getByLabelText('Avatar URL')).toBeDefined();
  });

  it('displays initial values in form fields', () => {
    render(
      <ProfileForm initialData={mockProfile} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    const fullNameInput = screen.getByLabelText('Full Name');
    const bioInput = screen.getByLabelText(/Bio/);
    const avatarUrlInput = screen.getByLabelText('Avatar URL');

    expect(fullNameInput.value).toBe('John Doe');
    expect(bioInput.value).toBe('Software developer');
    expect(avatarUrlInput.value).toBe('https://example.com/avatar.jpg');
  });

  it('shows character count for bio field', () => {
    render(
      <ProfileForm initialData={mockProfile} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    expect(screen.getByText('(18/250)')).toBeDefined(); // "Software developer" is 18 chars
  });

  it('prevents typing more than 250 characters in bio', async () => {
    render(<ProfileForm initialData={{}} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    const user = userEvent.setup();

    const bioInput = screen.getByLabelText(/Bio/);
    const longBio = 'a'.repeat(251);

    // Try to type more than 250 characters
    await user.type(bioInput, longBio);

    // The maxLength attribute should prevent it
    expect(bioInput.value.length).toBeLessThanOrEqual(250);
  });

  it('validates avatar URL format', async () => {
    render(<ProfileForm initialData={{}} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    const user = userEvent.setup();

    const avatarUrlInput = screen.getByLabelText('Avatar URL');
    await user.type(avatarUrlInput, 'invalid-url');

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/must be a valid url/i)).toBeDefined();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    mockOnSubmit.mockResolvedValueOnce();
    render(<ProfileForm initialData={{}} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    const user = userEvent.setup();

    const fullNameInput = screen.getByLabelText('Full Name');
    const bioInput = screen.getByLabelText(/Bio/);
    const avatarUrlInput = screen.getByLabelText('Avatar URL');

    await user.type(fullNameInput, 'Jane Smith');
    await user.type(bioInput, 'Frontend developer');
    await user.type(avatarUrlInput, 'https://example.com/new-avatar.jpg');

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        fullName: 'Jane Smith',
        bio: 'Frontend developer',
        avatarUrl: 'https://example.com/new-avatar.jpg',
      });
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    render(
      <ProfileForm initialData={mockProfile} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    const user = userEvent.setup();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('disables form during submission', async () => {
    mockOnSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
    render(
      <ProfileForm initialData={mockProfile} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    const user = userEvent.setup();

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    expect(screen.getByRole('button', { name: /saving/i })).toBeDefined();
    expect(screen.getByLabelText('Full Name')).toHaveProperty('disabled', true);
  });

  it('displays error message on submission failure', async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error('Network error'));
    render(
      <ProfileForm initialData={mockProfile} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );
    const user = userEvent.setup();

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('⚠️ Network error')).toBeDefined();
    });
  });
});
