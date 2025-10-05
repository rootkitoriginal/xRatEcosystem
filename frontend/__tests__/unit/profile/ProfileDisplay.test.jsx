import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileDisplay from '../../../src/components/profile/ProfileDisplay';

describe('ProfileDisplay', () => {
  const mockProfile = {
    userId: '1',
    fullName: 'John Doe',
    bio: 'Software developer passionate about coding.',
    avatarUrl: 'https://example.com/avatar.jpg',
  };

  const mockOnEdit = vi.fn();

  it('renders profile information correctly', () => {
    render(<ProfileDisplay profile={mockProfile} onEdit={mockOnEdit} />);

    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('Software developer passionate about coding.')).toBeDefined();
    expect(screen.getByText('https://example.com/avatar.jpg')).toBeDefined();
  });

  it('displays avatar image when avatarUrl is provided', () => {
    render(<ProfileDisplay profile={mockProfile} onEdit={mockOnEdit} />);

    const avatar = screen.getByAltText('John Doe');
    expect(avatar).toBeDefined();
    expect(avatar.src).toBe('https://example.com/avatar.jpg');
  });

  it('displays placeholder when no avatarUrl is provided', () => {
    const profileWithoutAvatar = { ...mockProfile, avatarUrl: '' };
    render(<ProfileDisplay profile={profileWithoutAvatar} onEdit={mockOnEdit} />);

    expect(screen.getByText('J')).toBeDefined(); // First letter of name
  });

  it('displays fallback text for missing fields', () => {
    const incompleteProfile = {
      userId: '1',
      fullName: '',
      bio: '',
      avatarUrl: '',
    };
    render(<ProfileDisplay profile={incompleteProfile} onEdit={mockOnEdit} />);

    expect(screen.getByText('No name set')).toBeDefined();
    expect(screen.getByText('No bio yet. Tell us about yourself!')).toBeDefined();
    expect(screen.getByText('No avatar URL set')).toBeDefined();
  });

  it('calls onEdit when edit button is clicked', async () => {
    render(<ProfileDisplay profile={mockProfile} onEdit={mockOnEdit} />);
    const user = userEvent.setup();

    const editButton = screen.getByRole('button', { name: /edit profile/i });
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });
});
