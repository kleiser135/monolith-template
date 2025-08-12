import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from './page'

// Mock the TemplateLanding component since it's tested separately
vi.mock('@/components/features/landing/TemplateLanding', () => ({
  TemplateLanding: () => <div data-testid="template-landing">TemplateLanding Component</div>
}))

describe('HomePage', () => {
  it('should render without crashing', () => {
    render(<HomePage />)
    
    expect(screen.getByTestId('template-landing')).toBeInTheDocument()
  })

  it('should render the TemplateLanding component', () => {
    render(<HomePage />)
    
    const templateLanding = screen.getByTestId('template-landing')
    expect(templateLanding).toBeInTheDocument()
    expect(templateLanding).toHaveTextContent('TemplateLanding Component')
  })

  it('should be the default export', () => {
    expect(HomePage).toBeDefined()
    expect(typeof HomePage).toBe('function')
  })

  it('should not have any props', () => {
    // Test that HomePage doesn't expect any props
    expect(HomePage.length).toBe(0)
  })
})
