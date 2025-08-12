import { describe, it, expect, beforeEach } from 'vitest'
import { useCounterStore } from './counter-store'

describe('CounterStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useCounterStore.setState({ count: 0 })
  })

  it('should initialize with count of 0', () => {
    const { count } = useCounterStore.getState()
    expect(count).toBe(0)
  })

  it('should increment count', () => {
    const { increment } = useCounterStore.getState()
    
    increment()
    expect(useCounterStore.getState().count).toBe(1)
    
    increment()
    expect(useCounterStore.getState().count).toBe(2)
  })

  it('should decrement count', () => {
    const { increment, decrement } = useCounterStore.getState()
    
    // First increment to 2
    increment()
    increment()
    expect(useCounterStore.getState().count).toBe(2)
    
    // Then decrement
    decrement()
    expect(useCounterStore.getState().count).toBe(1)
    
    decrement()
    expect(useCounterStore.getState().count).toBe(0)
  })

  it('should allow decrementing below zero', () => {
    const { decrement } = useCounterStore.getState()
    
    decrement()
    expect(useCounterStore.getState().count).toBe(-1)
    
    decrement()
    expect(useCounterStore.getState().count).toBe(-2)
  })

  it('should maintain state consistency', () => {
    const store = useCounterStore.getState()
    
    // Test multiple operations
    store.increment()
    store.increment()
    store.decrement()
    store.increment()
    
    expect(useCounterStore.getState().count).toBe(2)
  })
})
