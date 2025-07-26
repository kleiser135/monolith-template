import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useSearchParams, ReadonlyURLSearchParams } from 'next/navigation';
import EmailVerificationPage from './page';
import apiClient from '@/lib/api-client';

// Mock the next/navigation module
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation');
  return {
    ...actual,
    useSearchParams: vi.fn(),
  };
});

// Mock the api-client
vi.mock('@/lib/api-client');

describe('Email Verification Page', () => {
  const mockUseSearchParams = vi.mocked(useSearchParams);

  it('shows an error if no token is provided', () => {
    // Arrange: Mock useSearchParams to return no token
    mockUseSearchParams.mockReturnValue(new URLSearchParams() as ReadonlyURLSearchParams);
    
    // Act
    render(<EmailVerificationPage />);

    // Assert
    expect(screen.getByText(/No verification token found./i)).toBeInTheDocument();
  });

  it('shows success message when token verification is successful', async () => {
    // Arrange: Mock useSearchParams to return a token
    mockUseSearchParams.mockReturnValue(new URLSearchParams("token=good-token") as ReadonlyURLSearchParams);

    // Mock the API call to be successful
    vi.mocked(apiClient.post).mockResolvedValue({ message: 'Email verified successfully!' });

    // Act
    render(<EmailVerificationPage />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/Email verified successfully!/i)).toBeInTheDocument();
    });
  });

  it('shows error message when token verification fails', async () => {
    // Arrange: Mock useSearchParams to return a token
    mockUseSearchParams.mockReturnValue(new URLSearchParams("token=bad-token") as ReadonlyURLSearchParams);

    // Mock the API call to fail
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Invalid or expired token.'));

    // Act
    render(<EmailVerificationPage />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/Invalid or expired token./i)).toBeInTheDocument();
    });
  });
}); 