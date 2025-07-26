import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResetPasswordPage from './page';

// Mock the form component since it's tested separately
vi.mock(
  '@/components/features/auth/reset-password/ResetPasswordForm',
  () => ({
    ResetPasswordForm: () => <div data-testid="reset-password-form-mock" />,
  })
);

describe('ResetPasswordPage', () => {
  it('renders the title and subtitle correctly', () => {
    render(<ResetPasswordPage />);

    // Check for the main title
    expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument();

    // Check for the subtitle
    expect(screen.getByText(/enter your new password below/i)).toBeInTheDocument();

    // Check that our mock form is rendered
    expect(screen.getByTestId('reset-password-form-mock')).toBeInTheDocument();
  });
}); 