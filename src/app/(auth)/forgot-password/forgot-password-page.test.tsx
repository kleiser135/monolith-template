import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ForgotPasswordPage from './page';

describe('Forgot Password Page', () => {
  it('renders the forgot password form with all fields', () => {
    render(<ForgotPasswordPage />);

    // Check for the main heading
    expect(
      screen.getByRole('heading', { name: /forgot your password/i })
    ).toBeInTheDocument();

    // Check for the email input
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();

    // Check for the submit button
    expect(
      screen.getByRole('button', { name: /send reset link/i })
    ).toBeInTheDocument();
  });
}); 