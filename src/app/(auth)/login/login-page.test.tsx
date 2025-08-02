import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoginPage from './page'

describe('Login Page', () => {
  it('renders the login form with all fields', () => {
    render(<LoginPage />)

    // Check for the email input using placeholder
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument()

    // Check for the password input using placeholder
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument()

    // Check for the sign in button
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    
    // Check for navigation links
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /forgot your password/i })).toBeInTheDocument()
  })
}) 