import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangePasswordForm } from './ChangePasswordForm';
import { useActionState } from 'react';
import { toast } from 'sonner';

vi.mock('react', async (importActual) => {
  const actual = await importActual<typeof import('react')>();
  return {
    ...actual,
    useActionState: vi.fn(),
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const useActionStateMock = vi.mocked(useActionState);

interface ChangePasswordState {
  success: boolean;
  message?: string | null;
  errors?: {
    currentPassword?: string[];
    newPassword?: string[];
    confirmPassword?: string[];
  } | null;
}

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useActionStateMock.mockReturnValue([
      { success: false, message: null, errors: null },
      () => new Promise<undefined>((resolve) => resolve(undefined)),
      false,
    ] as [ChangePasswordState, (payload: unknown) => void, boolean]);
  });

  it('should show success toast on successful password change', async () => {
    useActionStateMock.mockReturnValue([
      { success: true, message: 'Password changed successfully.', errors: null },
      () => new Promise<undefined>((resolve) => resolve(undefined)),
      false,
    ] as [ChangePasswordState, (payload: unknown) => void, boolean]);

    render(<ChangePasswordForm />);
    
    // This test relies on the useEffect inside the component to fire, which
    // will call the toast notification. The assertion is on the mock.
    expect(toast.success).toHaveBeenCalledWith('Password changed successfully.');
  });

  it('should show error toast on failed password change', async () => {
    useActionStateMock.mockReturnValue([
      { success: false, message: 'Incorrect current password.', errors: null },
      () => new Promise<undefined>((resolve) => resolve(undefined)),
      false,
    ] as [ChangePasswordState, (payload: unknown) => void, boolean]);

    render(<ChangePasswordForm />);

    // Similar to the success test, we check if the error toast is called.
    expect(toast.error).toHaveBeenCalledWith('Incorrect current password.');
  });

  it('should display pending state correctly', () => {
    useActionStateMock.mockReturnValue([
      { success: false, message: null, errors: null },
      () => new Promise<undefined>((resolve) => resolve(undefined)),
      true, // isPending is true
    ] as [ChangePasswordState, (payload: unknown) => void, boolean]);

    render(<ChangePasswordForm />);

    // Check if the button is disabled and shows "Changing..."
    const submitButton = screen.getByRole('button', { name: /changing.../i });
    expect(submitButton).toBeDisabled();
  });
}); 