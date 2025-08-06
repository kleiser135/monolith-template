import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePathname } from 'next/navigation'
import AuthLayout from './layout'

// Mock the dependencies
vi.mock('@/components/layout/SharedBackground', () => ({
  SharedBackground: ({ children, variant }: { children: React.ReactNode, variant: string }) => (
    <div data-testid="shared-background" data-variant={variant}>{children}</div>
  )
}))

vi.mock('@/components/layout/AnimatedAuthContainer', () => ({
  AnimatedAuthContainer: ({ children, formKey, showLogo, title, subtitle }: any) => (
    <div 
      data-testid="animated-auth-container" 
      data-form-key={formKey}
      data-show-logo={showLogo}
      data-title={title}
      data-subtitle={subtitle}
    >
      {children}
    </div>
  )
}))

vi.mock('next/navigation', () => ({
  usePathname: vi.fn()
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} data-testid="motion-div" {...props}>{children}</div>
    )
  }
}))

const mockUsePathname = vi.mocked(usePathname)

describe('AuthLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render without crashing', () => {
    mockUsePathname.mockReturnValue('/login')
    
    render(
      <AuthLayout>
        <div>Test Child</div>
      </AuthLayout>
    )
    
    expect(screen.getByTestId('shared-background')).toBeInTheDocument()
    expect(screen.getByTestId('animated-auth-container')).toBeInTheDocument()
    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('should render with correct props for login page', () => {
    mockUsePathname.mockReturnValue('/login')
    
    render(
      <AuthLayout>
        <div>Login Form</div>
      </AuthLayout>
    )
    
    const sharedBackground = screen.getByTestId('shared-background')
    expect(sharedBackground).toHaveAttribute('data-variant', 'auth')
    
    const authContainer = screen.getByTestId('animated-auth-container')
    expect(authContainer).toHaveAttribute('data-form-key', 'login')
    expect(authContainer).toHaveAttribute('data-show-logo', 'true')
    expect(authContainer).toHaveAttribute('data-title', 'Welcome back')
    expect(authContainer).toHaveAttribute('data-subtitle', 'Sign in to continue organizing epic game nights')
  })

  it('should render with correct props for signup page', () => {
    mockUsePathname.mockReturnValue('/signup')
    
    render(
      <AuthLayout>
        <div>Signup Form</div>
      </AuthLayout>
    )
    
    const authContainer = screen.getByTestId('animated-auth-container')
    expect(authContainer).toHaveAttribute('data-form-key', 'signup')
    expect(authContainer).toHaveAttribute('data-title', 'Create account')
    expect(authContainer).toHaveAttribute('data-subtitle', 'Enter your details below to create your account')
  })

  it('should render with correct props for forgot-password page', () => {
    mockUsePathname.mockReturnValue('/forgot-password')
    
    render(
      <AuthLayout>
        <div>Forgot Password Form</div>
      </AuthLayout>
    )
    
    const authContainer = screen.getByTestId('animated-auth-container')
    expect(authContainer).toHaveAttribute('data-form-key', 'forgot-password')
    expect(authContainer).toHaveAttribute('data-title', 'Reset password')
    expect(authContainer).toHaveAttribute('data-subtitle', 'Enter your email to receive a password reset link')
  })

  it('should render with correct props for reset-password page', () => {
    mockUsePathname.mockReturnValue('/reset-password')
    
    render(
      <AuthLayout>
        <div>Reset Password Form</div>
      </AuthLayout>
    )
    
    const authContainer = screen.getByTestId('animated-auth-container')
    expect(authContainer).toHaveAttribute('data-form-key', 'reset-password')
    expect(authContainer).toHaveAttribute('data-title', 'New password')
    expect(authContainer).toHaveAttribute('data-subtitle', 'Enter your new password below')
  })

  it('should render with correct props for email-verification page', () => {
    mockUsePathname.mockReturnValue('/email-verification')
    
    render(
      <AuthLayout>
        <div>Email Verification</div>
      </AuthLayout>
    )
    
    const authContainer = screen.getByTestId('animated-auth-container')
    expect(authContainer).toHaveAttribute('data-form-key', 'email-verification')
    expect(authContainer).toHaveAttribute('data-title', 'Verify email')
    expect(authContainer).toHaveAttribute('data-subtitle', 'Check your email and click the verification link')
  })

  it('should render with fallback props for unknown page', () => {
    mockUsePathname.mockReturnValue('/unknown-page')
    
    render(
      <AuthLayout>
        <div>Unknown Form</div>
      </AuthLayout>
    )
    
    const authContainer = screen.getByTestId('animated-auth-container')
    expect(authContainer).toHaveAttribute('data-form-key', 'auth')
    expect(authContainer).toHaveAttribute('data-title', 'Welcome')
    // When subtitle is undefined, the component may not render the attribute
    expect(authContainer.getAttribute('data-subtitle')).toBeNull()
  })

  it('should render children correctly', () => {
    mockUsePathname.mockReturnValue('/login')
    
    render(
      <AuthLayout>
        <div data-testid="test-child">Test Content</div>
      </AuthLayout>
    )
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })
})
