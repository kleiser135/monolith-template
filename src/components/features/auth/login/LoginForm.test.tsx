import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginForm } from './LoginForm';
import { useActionState } from 'react';
import { toast } from 'sonner';

// Mock the router
const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// Mock the react module to gain control over useActionState
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

interface LoginState {
  success: boolean;
  message?: string | null;
  errors?: {
    email?: string[];
    password?: string[];
  } | null;
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Provide a default implementation for tests that don't need a specific state
    useActionStateMock.mockReturnValue([
      { success: false, message: null, errors: null },
      () => new Promise<undefined>((resolve) => resolve(undefined)),
      false,
    ] as [LoginState, (payload: unknown) => void, boolean]);
  });

  it('should show success toast and redirect on successful login', async () => {
    // Mock the state for a successful login
    useActionStateMock.mockReturnValue([
      { success: true, message: null, errors: null },
      () => new Promise<undefined>((resolve) => resolve(undefined)),
      false,
    ] as [LoginState, (payload: unknown) => void, boolean]);

    render(<LoginForm />);
    
    expect(toast.success).toHaveBeenCalledWith('Login successful!');
    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
  });

  it('should show error toast on failed login', async () => {
    // Mock the state for a failed login
    useActionStateMock.mockReturnValue([
      { success: false, message: 'Invalid credentials.', errors: null },
      () => new Promise<undefined>((resolve) => resolve(undefined)),
      false,
    ] as [LoginState, (payload: unknown) => void, boolean]);

    render(<LoginForm />);

    expect(toast.error).toHaveBeenCalledWith('Invalid credentials.');
  });

  it('should display pending state correctly', () => {
    useActionStateMock.mockReturnValue([
      { success: false, message: null, errors: null },
      () => new Promise<undefined>((resolve) => resolve(undefined)),
      true, // isPending is true
    ] as [LoginState, (payload: unknown) => void, boolean]);

    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /logging in.../i });
    expect(submitButton).toBeDisabled();
  });
}); 