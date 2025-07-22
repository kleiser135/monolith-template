import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CounterDemo } from './CounterDemo'
import { useCounterStore } from '@/store/counter-store'

// Mock the entire store module
vi.mock('@/store/counter-store')

describe('CounterDemo', () => {
  // Define mock functions
  const mockIncrement = vi.fn()
  const mockDecrement = vi.fn()
  const mockedUseCounterStore = vi.mocked(useCounterStore)

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Set the default return value for the mock
    mockedUseCounterStore.mockReturnValue({
      count: 0,
      increment: mockIncrement,
      decrement: mockDecrement,
    })
  })

  it('renders with initial count of 0', () => {
    render(<CounterDemo />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('calls the increment function when the + button is clicked', () => {
    render(<CounterDemo />)
    const incrementButton = screen.getByRole('button', { name: '+' })
    fireEvent.click(incrementButton)
    expect(mockIncrement).toHaveBeenCalledTimes(1)
  })

  it('calls the decrement function when the - button is clicked', () => {
    render(<CounterDemo />)
    const decrementButton = screen.getByRole('button', { name: '-' })
    fireEvent.click(decrementButton)
    expect(mockDecrement).toHaveBeenCalledTimes(1)
  })

  it('displays the count from the store', () => {
    // We can change what the mock returns for a specific test
    mockedUseCounterStore.mockReturnValue({
      count: 123,
      increment: mockIncrement,
      decrement: mockDecrement,
    })

    render(<CounterDemo />)
    expect(screen.getByText('123')).toBeInTheDocument()
  })
}) 