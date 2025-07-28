import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangePasswordForm } from './ChangePasswordForm';
import { toast } from 'sonner';

// Mock the changePassword action
vi.mock('@/lib/actions', () => ({
  changePassword: vi.fn(),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import the mocked changePassword function
import { changePassword } from '@/lib/actions';
const mockChangePassword = vi.mocked(changePassword);

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show success toast on successful password change', async () => {
    // Mock successful password change response
    mockChangePassword.mockResolvedValue({
      success: true,
      message: 'Password changed successfully.',
    });

    render(<ChangePasswordForm />);

    // Fill in the form
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/^new password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /change password/i });

    fireEvent.change(currentPasswordInput, { target: { value: 'currentpass123' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpass123' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Wait for the async operation and useEffect to complete
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Password changed successfully.');
    });
  });

  it('should show error toast on failed password change', async () => {
    // Mock failed password change response
    mockChangePassword.mockResolvedValue({
      success: false,
      message: 'Incorrect current password.',
    });

    render(<ChangePasswordForm />);

    // Fill in the form
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/^new password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: /change password/i });

    fireEvent.change(currentPasswordInput, { target: { value: 'wrongpass123' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpass123' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Wait for the async operation and useEffect to complete
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Incorrect current password.');
    });
  });

  it('should display pending state correctly', async () => {
    // Mock a changePassword that takes some time to resolve
    let resolveChangePassword: (value: { success: boolean; message: string }) => void;
    const changePasswordPromise = new Promise<{ success: boolean; message: string }>((resolve) => {
      resolveChangePassword = resolve;
    });
    mockChangePassword.mockReturnValue(changePasswordPromise);

    render(<ChangePasswordForm />);

    // Fill in the form
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/^new password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(currentPasswordInput, { target: { value: 'currentpass123' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpass123' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /change password/i });
    fireEvent.click(submitButton);

    // Check if the button shows pending state
    await waitFor(() => {
      const pendingButton = screen.getByRole('button', { name: /changing.../i });
      expect(pendingButton).toBeDisabled();
    });

    // Resolve the promise to clean up
    resolveChangePassword!({ success: true, message: 'Password changed successfully.' });
  });
}); 