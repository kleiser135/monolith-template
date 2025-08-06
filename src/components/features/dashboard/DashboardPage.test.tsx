import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, className, ...props }: { 
    children: React.ReactNode; 
    href: string; 
    className?: string;
  }) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ),
}));

// Mock Button component
vi.mock('@/components/ui/button/button', () => ({
  Button: ({ children, variant, className, ...props }: { 
    children: React.ReactNode; 
    variant?: string;
    className?: string;
  }) => (
    <button data-variant={variant} className={className} {...props}>
      {children}
    </button>
  ),
}));

// Mock LogoutButton component
vi.mock('@/components/features/auth/logout-button/LogoutButton', () => ({
  LogoutButton: () => <button data-testid="logout-button">Sign Out</button>,
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  User: ({ className, ...props }: { className?: string }) => (
    <div data-testid="user-icon" className={className} {...props}>User Icon</div>
  ),
  TestTube: ({ className, ...props }: { className?: string }) => (
    <div data-testid="test-tube-icon" className={className} {...props}>TestTube Icon</div>
  ),
  Shield: ({ className, ...props }: { className?: string }) => (
    <div data-testid="shield-icon" className={className} {...props}>Shield Icon</div>
  ),
  LogOut: ({ className, ...props }: { className?: string }) => (
    <div data-testid="logout-icon" className={className} {...props}>LogOut Icon</div>
  ),
}));

describe('DashboardPage', () => {
  it('should render without crashing', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Welcome to Your Dashboard')).toBeInTheDocument();
  });

  it('should render the main heading with gradient text', () => {
    render(<DashboardPage />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Welcome to Your Dashboard');
    expect(heading).toHaveClass('text-4xl', 'font-bold', 'bg-gradient-to-r', 'from-blue-600', 'to-indigo-600', 'bg-clip-text', 'text-transparent');
  });

  it('should render the main description', () => {
    render(<DashboardPage />);
    const description = screen.getByText('Manage your account, explore features, and access all the tools you need in one place.');
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('text-lg', 'text-muted-foreground', 'max-w-2xl', 'mx-auto');
  });

  it('should render profile card with correct link and content', () => {
    render(<DashboardPage />);
    
    const profileLink = screen.getByRole('link', { name: /profile/i });
    expect(profileLink).toHaveAttribute('href', '/dashboard/profile');
    
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Manage your account')).toBeInTheDocument();
    expect(screen.getByText('View and edit your profile information, change your password, and manage account settings.')).toBeInTheDocument();
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
  });

  it('should render toast demo card with correct link and content', () => {
    render(<DashboardPage />);
    
    const toastDemoLink = screen.getByRole('link', { name: /toast demo/i });
    expect(toastDemoLink).toHaveAttribute('href', '/dashboard/toast-demo');
    
    expect(screen.getByText('Toast Demo')).toBeInTheDocument();
    expect(screen.getByText('Test notifications')).toBeInTheDocument();
    expect(screen.getByText('Explore different types of toast notifications and see how they work in the application.')).toBeInTheDocument();
    expect(screen.getByTestId('test-tube-icon')).toBeInTheDocument();
  });

  it('should render protected actions card with button', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Protected Actions')).toBeInTheDocument();
    expect(screen.getByText('Secure operations')).toBeInTheDocument();
    expect(screen.getByText('Perform secure operations that require authentication and proper authorization.')).toBeInTheDocument();
    
    const protectedButton = screen.getByRole('button', { name: /execute protected action/i });
    expect(protectedButton).toHaveAttribute('data-variant', 'destructive');
    expect(protectedButton).toHaveClass('w-full');
    expect(screen.getAllByTestId('shield-icon')).toHaveLength(2); // One in card header, one in button
  });

  it('should render account overview section with stats', () => {
    render(<DashboardPage />);
    
    expect(screen.getByRole('heading', { name: 'Account Overview' })).toBeInTheDocument();
    
    // Check stats
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Account Status')).toBeInTheDocument();
    expect(screen.getByText('Secure')).toBeInTheDocument();
    expect(screen.getByText('Security Level')).toBeInTheDocument();
    expect(screen.getByText('Protected')).toBeInTheDocument();
    expect(screen.getByText('Data Protection')).toBeInTheDocument();
  });

  it('should render session management section with logout button', () => {
    render(<DashboardPage />);
    
    expect(screen.getByRole('heading', { name: 'Session Management' })).toBeInTheDocument();
    expect(screen.getByText("You are securely authenticated. Sign out when you're done to protect your account.")).toBeInTheDocument();
    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
  });

  it('should have proper responsive grid layout classes', () => {
    render(<DashboardPage />);
    
    // Check main container
    const mainElement = screen.getByRole('main');
    expect(mainElement).toHaveClass('min-h-screen', 'bg-gradient-to-br');
    
    // Check for grid container by finding a link and going up several levels
    const profileLink = screen.getByRole('link', { name: /profile/i });
    const gridContainer = profileLink.parentElement;
    expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6');
  });

  it('should have hover effects and transitions on card links', () => {
    render(<DashboardPage />);
    
    // Get the profile link and check its child div for hover classes
    const profileLink = screen.getByRole('link', { name: /profile/i });
    const profileCard = profileLink.firstElementChild;
    expect(profileCard).toHaveClass('bg-white', 'hover:shadow-xl', 'transition-all', 'duration-300');
    
    // Get the toast demo link and check its child div for hover classes
    const toastDemoLink = screen.getByRole('link', { name: /toast demo/i });
    const toastDemoCard = toastDemoLink.firstElementChild;
    expect(toastDemoCard).toHaveClass('bg-white', 'hover:shadow-xl', 'transition-all', 'duration-300');
  });

  it('should render action arrows in card links', () => {
    render(<DashboardPage />);
    
    // Check for SVG arrows in links
    const viewProfileText = screen.getByText('View Profile');
    const tryDemoText = screen.getByText('Try Demo');
    
    expect(viewProfileText).toBeInTheDocument();
    expect(tryDemoText).toBeInTheDocument();
    
    // Check that the parent divs have the proper hover effects
    expect(viewProfileText.closest('div')).toHaveClass('flex', 'items-center');
    expect(tryDemoText.closest('div')).toHaveClass('flex', 'items-center');
  });
});
