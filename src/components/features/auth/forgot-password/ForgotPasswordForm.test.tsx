import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import apiClient from '@/lib/api/api-client';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/lib/api-client');
vi.mock('sonner');

describe('ForgotPasswordForm', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up apiClient mock properly
    apiClient.post = vi.fn();
  });

  it('renders the form correctly', () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('prevents form submission with invalid email', async () => {
    // Mock the API to ensure it's never called with invalid data
    const apiSpy = vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Should not be called'));
    
    render(<ForgotPasswordForm />);
    
    const emailInput = screen.getByPlaceholderText(/your.email@example.com/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    
    // Enter invalid email 
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    // Submit the form
    fireEvent.click(submitButton);

    // Wait a bit to ensure form validation completes
    await waitFor(() => {
      // The API should not have been called due to validation failure
      expect(apiSpy).not.toHaveBeenCalled();
    }, { timeout: 1000 });
    
    apiSpy.mockRestore();
  });

  it('calls the API and shows a success toast on valid submission', async () => {
    const SUCCESS_MESSAGE = 'Password reset link sent!';
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ message: SUCCESS_MESSAGE });

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
    (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(new Error(ERROR_MESSAGE));

    render(<ForgotPasswordForm />);
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'notfound@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(ERROR_MESSAGE);
    });
  });

  it('shows a generic error toast for non-Error exceptions', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue('A wild string appears!');

    render(<ForgotPasswordForm />);
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred.');
    });
  });
}); 