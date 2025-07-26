import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DashboardPage from './page';

describe('DashboardPage', () => {
  it('renders the dashboard heading and protected content message', () => {
    render(<DashboardPage />);

    // Check for the main heading
    expect(screen.getByRole('heading', { name: /Dashboard \(Protected\)/i })).toBeInTheDocument();

    // Check for the descriptive text
    expect(screen.getByText(/This page should only be visible to logged-in users./i)).toBeInTheDocument();
  });
}); 