import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { AuthHeader } from './AuthHeader'

describe('Layout - AuthHeader', () => {
  it('renders brand link to /landing with label', () => {
    render(<AuthHeader />)
    const link = screen.getByRole('link', { name: /app template/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/landing')
  })

  it('renders a header container with expected classes', () => {
    render(<AuthHeader />)
    const header = screen.getByRole('banner')
    expect(header.className).toContain('sticky')
    expect(header.className).toContain('bg-background/80')
    expect(header.className).toContain('border-b')
  })
})

