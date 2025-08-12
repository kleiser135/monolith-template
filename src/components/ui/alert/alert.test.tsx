import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Alert, AlertTitle, AlertDescription } from './alert'

describe('UI - Alert', () => {
  it('renders with role="alert" and default variant classes', () => {
    render(
      <Alert data-testid="alert">
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>This is a default alert.</AlertDescription>
      </Alert>
    )

    const alert = screen.getByTestId('alert')
    expect(alert).toHaveAttribute('role', 'alert')
    expect(alert.className).toContain('bg-background')
    expect(alert.className).toContain('text-foreground')
    expect(screen.getByText('Heads up!')).toBeInTheDocument()
    expect(screen.getByText('This is a default alert.')).toBeInTheDocument()
  })

  it('supports destructive variant styling', () => {
    render(
      <Alert data-testid="alert" variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong.</AlertDescription>
      </Alert>
    )

    const alert = screen.getByTestId('alert')
    expect(alert.className).toContain('text-destructive')
    expect(alert.className).toContain('border-destructive/50')
  })

  it('merges custom className', () => {
    render(
      <Alert data-testid="alert" className="custom-class">
        <AlertDescription>Content</AlertDescription>
      </Alert>
    )

    const alert = screen.getByTestId('alert')
    expect(alert.className).toContain('custom-class')
  })
})

