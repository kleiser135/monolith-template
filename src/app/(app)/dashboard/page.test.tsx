import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DashboardPage from './page';

describe('DashboardPage', () => {
  it('renders the dashboard heading and protected content message', () => {
    render(<DashboardPage />);

    // Check for the main heading
    expect(screen.getByRole('heading', { name: /Welcome to Your Dashboard/i })).toBeInTheDocument();

    // Check for the descriptive text
    expect(screen.getByText(/Manage your account, explore features, and access all the tools you need in one place./i)).toBeInTheDocument();
  });
}); 