import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { LandingHeader } from './LandingHeader'

// Mock next/image to avoid layout warnings
vi.mock('next/image', () => ({
  default: (props: any) => {
    // Use a div instead of img to avoid Next.js warnings
    return <div data-testid="next-image" data-src={props.src} data-alt={props.alt} />
  }
}))

describe('Layout - LandingHeader', () => {
  const noop = () => {}

  it('renders brand text and login/signup links', () => {
    render(
      <LandingHeader isMenuOpen={false} toggleMenu={noop} headerBg="bg-transparent" scrollY={0} />
    )
    expect(screen.getByText(/app template/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup')
  })

  it('applies blur and shadow when header is not transparent and scrolled', () => {
    render(
      <LandingHeader isMenuOpen={false} toggleMenu={noop} headerBg="bg-slate-900/70" scrollY={100} />
    )
    const header = screen.getByRole('banner')
    expect(header.className).toContain('backdrop-blur-lg')
    expect(header.className).toContain('shadow-xl')
  })

  it('does not apply blur when transparent', () => {
    render(
      <LandingHeader isMenuOpen={false} toggleMenu={noop} headerBg="bg-transparent" scrollY={100} />
    )
    const header = screen.getByRole('banner')
    expect(header.className).not.toContain('backdrop-blur-lg')
  })
})

