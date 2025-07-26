import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignupForm } from './SignupForm';
import { toast } from 'sonner';
import { useActionState, useTransition } from 'react';

// Mock dependencies
const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock the react module to gain control over useActionState
vi.mock('react', async (importActual) => {
  const actual = await importActual<typeof import('react')>();
  return {
    ...actual,
    useActionState: vi.fn(),
    useTransition: vi.fn(),
  };
});

// Get a reference to the mocked functions after the mock is defined
const mockToastError = vi.mocked(toast.error);
const mockToastSuccess = vi.mocked(toast.success);
const useActionStateMock = vi.mocked(useActionState);
const useTransitionMock = vi.mocked(useTransition);

interface SignupState {
  success: boolean;
  message?: string | null;
  errors?: {
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  } | null;
}

describe('SignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Provide a default implementation for tests that don't need a specific state
    useActionStateMock.mockReturnValue([
      { success: false, message: null, errors: null },
      () => new Promise<undefined>((resolve) => resolve(undefined)),
      false,
    ] as [SignupState, (payload: unknown) => void, boolean]);
    useTransitionMock.mockReturnValue([false, vi.fn()]);
  });

  it('should show success toast and redirect on successful signup', async () => {
    // Mock the state for a successful signup
    useActionStateMock.mockReturnValue([
      { success: true, message: 'Account created!', errors: null },
      () => new Promise<undefined>((resolve) => resolve(undefined)),
      false,
    ] as [SignupState, (payload: unknown) => void, boolean]);

    render(<SignupForm />);

    // The useEffect should trigger on render
    expect(mockToastSuccess).toHaveBeenCalledWith('Account created!');
    expect(mockRouterPush).toHaveBeenCalledWith('/login');
  });

  it('should show error toast on failed signup', async () => {
    // Mock the state for a failed signup
    useActionStateMock.mockReturnValue([
      { success: false, message: 'User already exists.', errors: null },
      () => new Promise<undefined>((resolve) => resolve(undefined)),
      false,
    ] as [SignupState, (payload: unknown) => void, boolean]);

    render(<SignupForm />);

    // The useEffect should trigger on render
    expect(mockToastError).toHaveBeenCalledWith('User already exists.');
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('should render the form with all fields', () => {
    render(<SignupForm />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create Account' })
    ).toBeInTheDocument();
  });

  it('should display pending state correctly', () => {
    useTransitionMock.mockReturnValue([true, vi.fn()]); // isPending is true

    render(<SignupForm />);
    const submitButton = screen.getByRole('button', {
      name: /creating account.../i,
    });
    expect(submitButton).toBeDisabled();
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();
    expect(screen.getByLabelText('Confirm Password')).toBeDisabled();
  });
}); 