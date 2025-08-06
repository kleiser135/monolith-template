import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock usePathname from Next.js FIRST
vi.mock('next/navigation', () => ({
  usePathname: vi.fn()
}))

// Mock the entire headers module
vi.mock('@/components/layout/headers', () => ({
  AppHeader: vi.fn(({ isLoggedIn }: { isLoggedIn: boolean }) => (
    <div data-testid="app-header">AppHeader: {isLoggedIn ? 'logged-in' : 'logged-out'}</div>
  ))
}))

// Import mocked modules
import { usePathname } from 'next/navigation'
import { AppHeader } from '@/components/layout/headers'

// Import the component after mocking
import { ConditionalHeader } from '@/components/layout/ConditionalHeader'

const mockUsePathname = vi.mocked(usePathname)
const mockAppHeader = vi.mocked(AppHeader)

describe('ConditionalHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render nothing for landing page', () => {
    mockUsePathname.mockReturnValue('/')
    
    const { container } = render(<ConditionalHeader isLoggedIn={false} />)
    
    expect(container.firstChild).toBeNull()
    expect(mockAppHeader).not.toHaveBeenCalled()
  })

  it('should render nothing for auth pages when not logged in', () => {
    mockUsePathname.mockReturnValue('/login')
    
    const { container } = render(<ConditionalHeader isLoggedIn={false} />)
    
    expect(container.firstChild).toBeNull()
    expect(mockAppHeader).not.toHaveBeenCalled()
  })

  it('should render nothing for signup page when not logged in', () => {
    mockUsePathname.mockReturnValue('/signup')
    
    const { container } = render(<ConditionalHeader isLoggedIn={false} />)
    
    expect(container.firstChild).toBeNull()
    expect(mockAppHeader).not.toHaveBeenCalled()
  })

  it('should render nothing for forgot password page when not logged in', () => {
    mockUsePathname.mockReturnValue('/forgot-password')
    
    const { container } = render(<ConditionalHeader isLoggedIn={false} />)
    
    expect(container.firstChild).toBeNull()
    expect(mockAppHeader).not.toHaveBeenCalled()
  })

  it('should render nothing for reset password page when not logged in', () => {
    mockUsePathname.mockReturnValue('/reset-password')
    
    const { container } = render(<ConditionalHeader isLoggedIn={false} />)
    
    expect(container.firstChild).toBeNull()
    expect(mockAppHeader).not.toHaveBeenCalled()
  })

  it('should render nothing for email verification page when not logged in', () => {
    mockUsePathname.mockReturnValue('/email-verification')
    
    const { container } = render(<ConditionalHeader isLoggedIn={false} />)
    
    expect(container.firstChild).toBeNull()
    expect(mockAppHeader).not.toHaveBeenCalled()
  })

  it('should render AppHeader for dashboard when logged in', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    
    const { getByTestId } = render(<ConditionalHeader isLoggedIn={true} />)
    
    expect(getByTestId('app-header')).toBeInTheDocument()
    expect(mockAppHeader).toHaveBeenCalledWith({ isLoggedIn: true }, {})
  })

  it('should render AppHeader for profile page when logged in', () => {
    mockUsePathname.mockReturnValue('/dashboard/profile')
    
    const { getByTestId } = render(<ConditionalHeader isLoggedIn={true} />)
    
    expect(getByTestId('app-header')).toBeInTheDocument()
    expect(mockAppHeader).toHaveBeenCalledWith({ isLoggedIn: true }, {})
  })

  it('should render AppHeader for other app pages when logged in', () => {
    mockUsePathname.mockReturnValue('/dashboard/settings')
    
    const { getByTestId } = render(<ConditionalHeader isLoggedIn={true} />)
    
    expect(getByTestId('app-header')).toBeInTheDocument()
    expect(mockAppHeader).toHaveBeenCalledWith({ isLoggedIn: true }, {})
  })

  it('should render AppHeader when logged in even on auth pages (redirect scenario)', () => {
    mockUsePathname.mockReturnValue('/login')
    
    const { getByTestId } = render(<ConditionalHeader isLoggedIn={true} />)
    
    expect(getByTestId('app-header')).toBeInTheDocument()
    expect(mockAppHeader).toHaveBeenCalledWith({ isLoggedIn: true }, {})
  })

  it('should handle unknown paths appropriately when not logged in', () => {
    mockUsePathname.mockReturnValue('/unknown-path')
    
    const { getByTestId } = render(<ConditionalHeader isLoggedIn={false} />)
    
    // Unknown paths should show the header even when not logged in
    // because '/unknown-path' is not in the noHeaderRoutes list
    expect(getByTestId('app-header')).toBeInTheDocument()
    expect(mockAppHeader).toHaveBeenCalledWith({ isLoggedIn: false }, {})
  })

  it('should handle unknown paths appropriately when logged in', () => {
    mockUsePathname.mockReturnValue('/unknown-path')
    
    const { getByTestId } = render(<ConditionalHeader isLoggedIn={true} />)
    
    expect(getByTestId('app-header')).toBeInTheDocument()
    expect(mockAppHeader).toHaveBeenCalledWith({ isLoggedIn: true }, {})
  })

  it('should handle root path variations', () => {
    mockUsePathname.mockReturnValue('/')
    
    const { container } = render(<ConditionalHeader isLoggedIn={false} />)
    
    expect(container.firstChild).toBeNull()
    
    // Test with logged in user on root - should show header
    const { getByTestId } = render(<ConditionalHeader isLoggedIn={true} />)
    expect(getByTestId('app-header')).toBeInTheDocument()
  })

  it('should pass isLoggedIn prop correctly to AppHeader', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    
    // Test with logged in
    render(<ConditionalHeader isLoggedIn={true} />)
    expect(mockAppHeader).toHaveBeenCalledWith({ isLoggedIn: true }, {})
    
    vi.clearAllMocks()
    
    // Test with logged out on a non-auth page
    mockUsePathname.mockReturnValue('/some-page')
    render(<ConditionalHeader isLoggedIn={false} />)
    expect(mockAppHeader).toHaveBeenCalledWith({ isLoggedIn: false }, {})
  })
})
