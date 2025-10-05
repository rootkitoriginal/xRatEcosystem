import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from '../../../src/pages/ProfilePage';
import { userService } from '../../../src/services/userService';

// Mock the userService
vi.mock('../../../src/services/userService', () => ({
  userService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

// Mock WebSocket context
vi.mock('../../../src/components/realtime/WebSocketProvider', () => ({
  useWebSocket: () => ({
    addNotification: vi.fn(),
  }),
}));

const renderProfilePage = () => {
  return render(
    <BrowserRouter>
      <ProfilePage />
    </BrowserRouter>
  );
};

describe('ProfilePage', () => {
  const mockProfile = {
    userId: '1',
    fullName: 'John Doe',
    bio: 'Software developer',
    avatarUrl: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading state initially', () => {
    userService.getProfile.mockImplementation(() => new Promise(() => {})); // Never resolves
    renderProfilePage();

    expect(screen.getByText('Loading profile...')).toBeDefined();
  });

  it('loads and displays profile data', async () => {
    userService.getProfile.mockResolvedValueOnce({ data: mockProfile });
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeDefined();
      expect(screen.getByText('Software developer')).toBeDefined();
    });
  });

  it('displays error message on load failure', async () => {
    userService.getProfile.mockRejectedValueOnce(new Error('Network error'));
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('⚠️ Error')).toBeDefined();
      expect(screen.getByText('Network error')).toBeDefined();
    });
  });

  it('allows retry on error', async () => {
    userService.getProfile
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: mockProfile });

    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeDefined();
    });

    const user = userEvent.setup();
    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeDefined();
    });

    expect(userService.getProfile).toHaveBeenCalledTimes(2);
  });

  it('switches to edit mode when edit button is clicked', async () => {
    userService.getProfile.mockResolvedValueOnce({ data: mockProfile });
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeDefined();
    });

    const user = userEvent.setup();
    const editButton = screen.getByRole('button', { name: /edit profile/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('✏️ Edit Profile')).toBeDefined();
      expect(screen.getByLabelText('Full Name')).toBeDefined();
    });
  });

  it('updates profile successfully', async () => {
    const updatedProfile = { ...mockProfile, fullName: 'Jane Smith' };
    userService.getProfile.mockResolvedValueOnce({ data: mockProfile });
    userService.updateProfile.mockResolvedValueOnce({ data: updatedProfile });

    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeDefined();
    });

    const user = userEvent.setup();

    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit profile/i });
    await user.click(editButton);

    // Update full name
    const fullNameInput = screen.getByLabelText('Full Name');
    await user.clear(fullNameInput);
    await user.type(fullNameInput, 'Jane Smith');

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(userService.updateProfile).toHaveBeenCalledWith({
        fullName: 'Jane Smith',
        bio: 'Software developer',
        avatarUrl: 'https://example.com/avatar.jpg',
      });
    });

    // Should show display mode again with updated data
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeDefined();
    });
  });

  it('cancels edit mode when cancel button is clicked', async () => {
    userService.getProfile.mockResolvedValueOnce({ data: mockProfile });
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeDefined();
    });

    const user = userEvent.setup();

    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit profile/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('✏️ Edit Profile')).toBeDefined();
    });

    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Should return to display mode - check that the form is gone
    await waitFor(() => {
      expect(screen.queryByLabelText('Full Name')).toBeNull();
    });
    
    // Profile display should be visible again
    expect(screen.getByText('John Doe')).toBeDefined();
  });
});
