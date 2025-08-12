import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ToastDemoPage from './page'

// Mock the ToastDemo component
vi.mock('@/components/features/demo/ToastDemo', () => ({
  ToastDemo: () => <div data-testid="toast-demo">Toast Demo Component</div>
}))

describe('ToastDemoPage', () => {
  it('should render without crashing', () => {
    render(<ToastDemoPage />)
    expect(screen.getByTestId('toast-demo')).toBeInTheDocument()
  })

  it('should render the ToastDemo component', () => {
    render(<ToastDemoPage />)
    expect(screen.getByText('Toast Demo Component')).toBeInTheDocument()
  })

  it('should be the default export', () => {
    expect(ToastDemoPage).toBeDefined()
    expect(typeof ToastDemoPage).toBe('function')
  })
})
