import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EmailVerificationPage from './page';

describe('Email Verification Page', () => {
  it('renders the verification message and resend button', () => {
    render(<EmailVerificationPage />);

    // Check for the main heading
    expect(
      screen.getByRole('heading', { name: /check your email/i })
    ).toBeInTheDocument();

    // Check for the instructional paragraph
    expect(
      screen.getByText(/we've sent a verification link to your email address/i)
    ).toBeInTheDocument();

    // Check for the resend button
    expect(
      screen.getByRole('button', { name: /resend email/i })
    ).toBeInTheDocument();
  });
}); 