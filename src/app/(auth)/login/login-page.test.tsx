import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoginPage from './page'

describe('Login Page', () => {
  it('renders the login form with all fields', () => {
    render(<LoginPage />)

    // Check for the main heading
    expect(
      screen.getByRole('heading', { name: /welcome back/i })
    ).toBeInTheDocument()

    // Check for the email input
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()

    // Check for the password input
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()

    // Check for the login button
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })
}) 