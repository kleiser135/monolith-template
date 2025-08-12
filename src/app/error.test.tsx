import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Error from './error'

// Mock console.error to avoid noise in tests
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('Error Component', () => {
  const mockReset = vi.fn()
  const mockError = {
    name: 'Error',
    message: 'Test error message',
    stack: undefined
  } as Error & { digest?: string }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render error message and try again button', () => {
    render(<Error error={mockError} reset={mockReset} />)
    
    expect(screen.getByText('Something went wrong!')).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('should call reset function when try again button is clicked', () => {
    render(<Error error={mockError} reset={mockReset} />)
    
    const tryAgainButton = screen.getByRole('button', { name: 'Try again' })
    fireEvent.click(tryAgainButton)
    
    expect(mockReset).toHaveBeenCalledTimes(1)
  })

  it('should log error to console on mount', () => {
    render(<Error error={mockError} reset={mockReset} />)
    
    expect(mockConsoleError).toHaveBeenCalledWith(mockError)
  })

  it('should display fallback message when error has no message', () => {
    const errorWithoutMessage = {
      name: 'Error',
      message: '',
      stack: undefined
    } as Error & { digest?: string }
    
    render(<Error error={errorWithoutMessage} reset={mockReset} />)
    
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument()
  })

  it('should handle error with digest property', () => {
    const errorWithDigest = {
      name: 'Error',
      message: 'Test error',
      stack: undefined,
      digest: 'abc123'
    } as Error & { digest?: string }
    
    render(<Error error={errorWithDigest} reset={mockReset} />)
    
    expect(screen.getByText('Test error')).toBeInTheDocument()
    expect(mockConsoleError).toHaveBeenCalledWith(errorWithDigest)
  })
})
