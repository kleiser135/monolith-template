import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SignupPage from './page'

describe('Signup Page', () => {
  it('renders the signup form with all fields', () => {
    render(<SignupPage />)

    // Check for the email input using placeholder text
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument()

    // Check for the password input using placeholder text
    expect(screen.getByPlaceholderText(/^Enter your password$/i)).toBeInTheDocument()

    // Check for the confirm password input using placeholder text
    expect(screen.getByPlaceholderText(/confirm your password/i)).toBeInTheDocument()

    // Check for the create account button
    expect(
      screen.getByRole('button', { name: /create account/i })
    ).toBeInTheDocument()
    
    // Check for navigation links
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
  })
}) 