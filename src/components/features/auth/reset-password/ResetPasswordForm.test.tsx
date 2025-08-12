import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResetPasswordForm } from './ResetPasswordForm';
import apiClient from '@/lib/api/api-client';
import { toast } from 'sonner';
import { useSearchParams, useRouter, ReadonlyURLSearchParams } from 'next/navigation';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));
vi.mock('@/lib/api/api-client');
vi.mock('sonner');

describe('ResetPasswordForm', () => {
  const mockPush = vi.fn();
  const mockUseRouter = vi.mocked(useRouter);
  const mockUseSearchParams = vi.mocked(useSearchParams);
  const mockApiClientPost = vi.mocked(apiClient.post);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush } as unknown as AppRouterInstance);
  });

  const renderComponent = (token: string | null) => {
    mockUseSearchParams.mockReturnValue({
      get: (name: string) => (name === 'token' ? token : null),
    } as ReadonlyURLSearchParams);
    render(<ResetPasswordForm />);
  };

  it('renders the form correctly', () => {
    renderComponent('some-token');
    expect(screen.getByPlaceholderText('Enter your new password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm your new password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('displays a validation error for mismatched passwords', async () => {
    renderComponent('some-token');

    fireEvent.change(screen.getByPlaceholderText('Enter your new password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm your new password'), { target: { value: 'password456' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      // The error message should be visible
      const error = screen.getByText('Passwords do not match');
      expect(error).toBeInTheDocument();
      
      // The label should show error state
      const confirmPasswordLabel = screen.getByText('Confirm New Password');
      expect(confirmPasswordLabel).toHaveAttribute('data-error', 'true');
    });
  });

  it('shows error message when token is missing', async () => {
    renderComponent(null); // No token

    // Should show the invalid reset link message instead of the form
    expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument();
    expect(screen.getByText('This password reset link is invalid or has expired.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /request new reset link/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
  });

  it('calls API, shows success toast, and redirects on valid submission', async () => {
    const SUCCESS_MESSAGE = 'Your password has been reset!';
    renderComponent('valid-token');
    mockApiClientPost.mockResolvedValue({ message: SUCCESS_MESSAGE });

    fireEvent.change(screen.getByPlaceholderText('Enter your new password'), { target: { value: 'newPassword123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm your new password'), { target: { value: 'newPassword123' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(mockApiClientPost).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'valid-token',
        password: 'newPassword123',
      });
      expect(toast.success).toHaveBeenCalledWith(SUCCESS_MESSAGE);
    });

    // Wait for the setTimeout to complete (2 seconds + buffer)
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    }, { timeout: 3000 });
  });

  it('shows an error toast if the API call fails', async () => {
    const ERROR_MESSAGE = 'Invalid or expired token.';
    renderComponent('invalid-token');
    mockApiClientPost.mockRejectedValue(new Error(ERROR_MESSAGE));

    fireEvent.change(screen.getByPlaceholderText('Enter your new password'), { target: { value: 'newPassword123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm your new password'), { target: { value: 'newPassword123' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(ERROR_MESSAGE);
    });
  });

  it('disables the submit button when the form is submitting', async () => {
    renderComponent('some-token');
    
    // Make the API call hang
    mockApiClientPost.mockImplementation(() => new Promise(() => {}));

    fireEvent.change(screen.getByPlaceholderText('Enter your new password'), { target: { value: 'newPassword123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm your new password'), { target: { value: 'newPassword123' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
        const button = screen.getByRole('button', { name: /resetting.../i });
        expect(button).toBeDisabled();
    });
  });
}); 