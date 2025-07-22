import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SignupPage from './page'

describe('Signup Page', () => {
  it('renders the signup form with all fields', () => {
    render(<SignupPage />)

    // Check for the main heading
    expect(
      screen.getByRole('heading', { name: /create an account/i })
    ).toBeInTheDocument()

    // Check for the email input
    expect(screen.getByLabelText("Email")).toBeInTheDocument()

    // Check for the password input - use exact match to avoid ambiguity
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument()

    // Check for the confirm password input
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()

    // Check for the signup button
    expect(
      screen.getByRole('button', { name: /create account/i })
    ).toBeInTheDocument()
  })
}) 