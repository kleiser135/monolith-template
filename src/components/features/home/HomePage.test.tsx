import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HomePage } from './HomePage';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock Button component
vi.mock('@/components/ui/button/button', () => ({
  Button: ({ children, asChild, variant, ...props }: { 
    children: React.ReactNode; 
    asChild?: boolean; 
    variant?: string 
  }) => (
    <button data-variant={variant} data-as-child={asChild} {...props}>
      {children}
    </button>
  ),
}));

describe('HomePage', () => {
  it('should render without crashing', () => {
    render(<HomePage />);
    expect(screen.getByText('Welcome to Your App')).toBeInTheDocument();
  });

  it('should render the main heading correctly', () => {
    render(<HomePage />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Welcome to Your App');
    expect(heading).toHaveClass('text-4xl', 'font-bold', 'tracking-tight', 'lg:text-5xl');
  });

  it('should render the description paragraph', () => {
    render(<HomePage />);
    const description = screen.getByText('Organize epic game nights with the ultimate board game event platform.');
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('mt-4', 'max-w-xl', 'text-lg', 'text-muted-foreground');
  });

  it('should render login button with correct link', () => {
    render(<HomePage />);
    const loginLink = screen.getByRole('link', { name: 'Login' });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('should render sign up button with correct link and variant', () => {
    render(<HomePage />);
    const signupLink = screen.getByRole('link', { name: 'Sign Up' });
    expect(signupLink).toBeInTheDocument();
    expect(signupLink).toHaveAttribute('href', '/signup');
    
    const signupButton = signupLink.closest('button');
    expect(signupButton).toHaveAttribute('data-variant', 'outline');
  });

  it('should render back to landing page button', () => {
    render(<HomePage />);
    const backLink = screen.getByRole('link', { name: 'Back to Landing Page' });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/');
    
    const backButton = backLink.closest('button');
    expect(backButton).toHaveAttribute('data-variant', 'secondary');
  });

  it('should have correct layout classes on main container', () => {
    render(<HomePage />);
    const container = screen.getByText('Welcome to Your App').closest('div');
    expect(container).toHaveClass(
      'flex',
      'flex-col',
      'items-center',
      'justify-center',
      'min-h-[80vh]',
      'text-center'
    );
  });

  it('should render all buttons with asChild prop', () => {
    render(<HomePage />);
    const buttons = screen.getAllByRole('button');
    
    buttons.forEach(button => {
      expect(button).toHaveAttribute('data-as-child', 'true');
    });
    
    expect(buttons).toHaveLength(3);
  });

  it('should have correct button grouping structure', () => {
    render(<HomePage />);
    const actionButtons = screen.getByText('Login').closest('div');
    expect(actionButtons).toHaveClass('mt-8', 'flex', 'gap-4');
    
    const backButtonContainer = screen.getByText('Back to Landing Page').closest('div');
    expect(backButtonContainer).toHaveClass('mt-4');
  });
});
