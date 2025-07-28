import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginForm } from './LoginForm';
import { toast } from 'sonner';

// Mock the router
const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// Mock the login action
vi.mock('@/lib/actions', () => ({
  login: vi.fn(),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import the mocked login function
import { login } from '@/lib/actions';
const mockLogin = vi.mocked(login);

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show success toast and redirect on successful login', async () => {
    // Mock successful login response
    mockLogin.mockResolvedValue({
      success: true,
    });

    render(<LoginForm />);

    // Fill in the form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Wait for the async operation and useEffect to complete
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Login successful!');
      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should show error toast on failed login', async () => {
    // Mock failed login response
    mockLogin.mockResolvedValue({
      success: false,
      message: 'Invalid credentials.',
    });

    render(<LoginForm />);

    // Fill in the form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Wait for the async operation and useEffect to complete
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials.');
    });
  });

  it('should display pending state correctly', async () => {
    // Mock a login that takes some time to resolve
    let resolveLogin: (value: { success: boolean }) => void;
    const loginPromise = new Promise<{ success: boolean }>((resolve) => {
      resolveLogin = resolve;
    });
    mockLogin.mockReturnValue(loginPromise);

    render(<LoginForm />);

    // Fill in the form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    // Check if the button shows pending state
    await waitFor(() => {
      const pendingButton = screen.getByRole('button', { name: /logging in.../i });
      expect(pendingButton).toBeDisabled();
    });

    // Resolve the promise to clean up
    resolveLogin!({ success: true });
  });
}); 