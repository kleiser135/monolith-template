import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/lib/api-client');
vi.mock('sonner');

describe('ForgotPasswordForm', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form correctly', () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('shows a validation error for an invalid email', async () => {
    render(<ForgotPasswordForm />);
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid-email' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('calls the API and shows a success toast on valid submission', async () => {
    const SUCCESS_MESSAGE = 'Password reset link sent!';
    vi.mocked(apiClient.post).mockResolvedValue({ message: SUCCESS_MESSAGE });

    render(<ForgotPasswordForm />);
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'test@example.com' });
      expect(toast.success).toHaveBeenCalledWith(SUCCESS_MESSAGE);
    });
  });

  it('shows an error toast if the API call fails', async () => {
    const ERROR_MESSAGE = 'User not found.';
    vi.mocked(apiClient.post).mockRejectedValue(new Error(ERROR_MESSAGE));

    render(<ForgotPasswordForm />);
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'notfound@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(ERROR_MESSAGE);
    });
  });

  it('shows a generic error toast for non-Error exceptions', async () => {
    vi.mocked(apiClient.post).mockRejectedValue('A wild string appears!');

    render(<ForgotPasswordForm />);
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred.');
    });
  });
}); 