import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NotFound from './not-found';

describe('NotFound Page', () => {
  it('renders the 404 message and a link to the dashboard', () => {
    render(<NotFound />);

    // Check for the main heading
    expect(screen.getByRole('heading', { name: /404 - Page Not Found/i })).toBeInTheDocument();

    // Check for the descriptive text
    expect(screen.getByText(/Oops! The page you're looking for doesn't exist./i)).toBeInTheDocument();

    // Check for the link and its href
    const link = screen.getByRole('link', { name: /Go back to the Dashboard/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dashboard');
  });
}); 