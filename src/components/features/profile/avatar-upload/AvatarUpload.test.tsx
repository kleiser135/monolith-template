import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AvatarUpload } from './AvatarUpload';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AvatarUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default user icon when no avatar', () => {
    render(<AvatarUpload />);
    
    // Look for the User icon SVG since there's no avatar image
    const userIconContainer = screen.getByLabelText('User icon');
    expect(userIconContainer).toBeInTheDocument();
    
    const uploadButton = screen.getByRole('button', { name: /upload avatar/i });
    expect(uploadButton).toBeInTheDocument();
  });

  it('renders with current avatar when provided', () => {
    const avatarUrl = '/uploads/avatars/test-avatar.jpg';
    render(<AvatarUpload currentAvatar={avatarUrl} />);
    
    const avatarImage = screen.getByRole('img', { name: /profile avatar/i });
    expect(avatarImage).toHaveAttribute('src', avatarUrl);
    
    const changeButton = screen.getByRole('button', { name: /change avatar/i });
    expect(changeButton).toBeInTheDocument();
  });

  it('shows remove button when avatar exists', () => {
    const avatarUrl = '/uploads/avatars/test-avatar.jpg';
    render(<AvatarUpload currentAvatar={avatarUrl} />);
    
    const removeButton = screen.getByRole('button', { name: /remove avatar/i });
    expect(removeButton).toBeInTheDocument();
  });

  it('handles successful avatar upload', async () => {
    const mockOnAvatarUpdate = vi.fn();
    const newAvatarUrl = '/uploads/avatars/new-avatar.jpg';
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ avatarUrl: newAvatarUrl }),
    });

    render(<AvatarUpload onAvatarUpdate={mockOnAvatarUpdate} />);
    
    const uploadButton = screen.getByRole('button', { name: /upload avatar/i });
    fireEvent.click(uploadButton);
    
    // Get the hidden file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Wait for fetch to be called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/avatar', {
        method: 'POST',
        body: expect.any(FormData),
      });
    });
    
    // Wait for the success handling
    await waitFor(() => {
      expect(mockOnAvatarUpdate).toHaveBeenCalledWith(newAvatarUrl);
    });
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Avatar updated successfully');
    });
  });

  it('handles avatar upload error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
    });

    render(<AvatarUpload />);
    
    const uploadButton = screen.getByRole('button', { name: /upload avatar/i });
    fireEvent.click(uploadButton);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Wait for fetch to be called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/avatar', {
        method: 'POST',
        body: expect.any(FormData),
      });
    });
    
    // Wait for error handling
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update avatar');
    });
  });

  it('validates file type', async () => {
    render(<AvatarUpload />);
    
    const uploadButton = screen.getByRole('button', { name: /upload avatar/i });
    fireEvent.click(uploadButton);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please select an image file');
    });
    
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('validates file size', async () => {
    render(<AvatarUpload />);
    
    const uploadButton = screen.getByRole('button', { name: /upload avatar/i });
    fireEvent.click(uploadButton);
    
    const fileInput = document.querySelector('input[type="file"]');
    // Create file larger than 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { 
      type: 'image/jpeg' 
    });
    fireEvent.change(fileInput!, { target: { files: [largeFile] } });
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Image size must be less than 5MB');
    });
    
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('handles successful avatar removal', async () => {
    const mockOnAvatarUpdate = vi.fn();
    const avatarUrl = '/uploads/avatars/test-avatar.jpg';
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<AvatarUpload currentAvatar={avatarUrl} onAvatarUpdate={mockOnAvatarUpdate} />);
    
    const removeButton = screen.getByRole('button', { name: /remove avatar/i });
    fireEvent.click(removeButton);
    
    // Wait for fetch to be called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/avatar', {
        method: 'DELETE',
      });
    });
    
    // Wait for the success handling
    await waitFor(() => {
      expect(mockOnAvatarUpdate).toHaveBeenCalledWith(null);
    });
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Avatar removed successfully');
    });
  });

  it('handles avatar removal error', async () => {
    const avatarUrl = '/uploads/avatars/test-avatar.jpg';
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<AvatarUpload currentAvatar={avatarUrl} />);
    
    const removeButton = screen.getByRole('button', { name: /remove avatar/i });
    fireEvent.click(removeButton);
    
    // Wait for fetch to be called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/avatar', {
        method: 'DELETE',
      });
    });
    
    // Wait for error handling
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to remove avatar');
    });
  });

  it('shows loading state during upload', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const uploadPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    mockFetch.mockReturnValueOnce(uploadPromise);

    render(<AvatarUpload />);
    
    const uploadButton = screen.getByRole('button', { name: /upload avatar/i });
    fireEvent.click(uploadButton);
    
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput!, { target: { files: [file] } });
    
    // Should show loading state
    await waitFor(() => {
      expect(uploadButton).toBeDisabled();
    });
    
    // Resolve the upload
    resolvePromise!({
      ok: true,
      json: async () => ({ avatarUrl: '/test.jpg' }),
    });
    
    await waitFor(() => {
      expect(uploadButton).not.toBeDisabled();
    });
  });
});
