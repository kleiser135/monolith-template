import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import * as React from 'react'
import { Badge, badgeVariants } from './badge'

// Mock @/lib/utils
vi.mock('@/lib/utils', () => ({
  cn: vi.fn((...args) => args.filter(Boolean).join(' ')),
}))

describe('Badge Component', () => {
  describe('Basic Rendering', () => {
    it('should render with text content', () => {
      render(<Badge>Test Badge</Badge>)
      expect(screen.getByText('Test Badge')).toBeInTheDocument()
    })

    it('should render as div element', () => {
      render(<Badge data-testid="badge">Badge</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge.tagName).toBe('DIV')
    })

    it('should render with children elements', () => {
      render(
        <Badge>
          <span>Icon</span>
          Badge Text
        </Badge>
      )
      expect(screen.getByText('Icon')).toBeInTheDocument()
      expect(screen.getByText('Badge Text')).toBeInTheDocument()
    })

    it('should render empty badge', () => {
      render(<Badge data-testid="empty-badge"></Badge>)
      const badge = screen.getByTestId('empty-badge')
      expect(badge).toBeInTheDocument()
      expect(badge).toBeEmptyDOMElement()
    })
  })

  describe('Default Variant', () => {
    it('should apply default variant classes when no variant specified', () => {
      render(<Badge data-testid="default-badge">Default</Badge>)
      const badge = screen.getByTestId('default-badge')
      
      // Base classes
      expect(badge).toHaveClass('inline-flex')
      expect(badge).toHaveClass('items-center')
      expect(badge).toHaveClass('rounded-full')
      expect(badge).toHaveClass('border')
      expect(badge).toHaveClass('px-2.5')
      expect(badge).toHaveClass('py-0.5')
      expect(badge).toHaveClass('text-xs')
      expect(badge).toHaveClass('font-semibold')
      expect(badge).toHaveClass('transition-colors')
      
      // Focus classes
      expect(badge).toHaveClass('focus:outline-none')
      expect(badge).toHaveClass('focus:ring-2')
      expect(badge).toHaveClass('focus:ring-ring')
      expect(badge).toHaveClass('focus:ring-offset-2')
      
      // Default variant classes
      expect(badge).toHaveClass('border-transparent')
      expect(badge).toHaveClass('bg-primary')
      expect(badge).toHaveClass('text-primary-foreground')
      expect(badge).toHaveClass('hover:bg-primary/80')
    })

    it('should apply default variant explicitly', () => {
      render(<Badge variant="default" data-testid="explicit-default">Default</Badge>)
      const badge = screen.getByTestId('explicit-default')
      
      expect(badge).toHaveClass('bg-primary')
      expect(badge).toHaveClass('text-primary-foreground')
      expect(badge).toHaveClass('hover:bg-primary/80')
    })
  })

  describe('Secondary Variant', () => {
    it('should apply secondary variant classes', () => {
      render(<Badge variant="secondary" data-testid="secondary-badge">Secondary</Badge>)
      const badge = screen.getByTestId('secondary-badge')
      
      // Base classes should still be present
      expect(badge).toHaveClass('inline-flex')
      expect(badge).toHaveClass('rounded-full')
      
      // Secondary variant classes
      expect(badge).toHaveClass('border-transparent')
      expect(badge).toHaveClass('bg-secondary')
      expect(badge).toHaveClass('text-secondary-foreground')
      expect(badge).toHaveClass('hover:bg-secondary/80')
    })
  })

  describe('Destructive Variant', () => {
    it('should apply destructive variant classes', () => {
      render(<Badge variant="destructive" data-testid="destructive-badge">Error</Badge>)
      const badge = screen.getByTestId('destructive-badge')
      
      // Base classes should still be present
      expect(badge).toHaveClass('inline-flex')
      expect(badge).toHaveClass('rounded-full')
      
      // Destructive variant classes
      expect(badge).toHaveClass('border-transparent')
      expect(badge).toHaveClass('bg-destructive')
      expect(badge).toHaveClass('text-destructive-foreground')
      expect(badge).toHaveClass('hover:bg-destructive/80')
    })
  })

  describe('Outline Variant', () => {
    it('should apply outline variant classes', () => {
      render(<Badge variant="outline" data-testid="outline-badge">Outline</Badge>)
      const badge = screen.getByTestId('outline-badge')
      
      // Base classes should still be present
      expect(badge).toHaveClass('inline-flex')
      expect(badge).toHaveClass('rounded-full')
      expect(badge).toHaveClass('border')
      
      // Outline variant classes
      expect(badge).toHaveClass('text-foreground')
      // Outline variant should not have background color classes
      expect(badge).not.toHaveClass('bg-primary')
      expect(badge).not.toHaveClass('bg-secondary')
      expect(badge).not.toHaveClass('bg-destructive')
    })
  })

  describe('Custom ClassName', () => {
    it('should accept and apply custom className', () => {
      render(<Badge className="custom-badge-class" data-testid="custom-badge">Custom</Badge>)
      const badge = screen.getByTestId('custom-badge')
      
      expect(badge).toHaveClass('custom-badge-class')
      // Should still have default classes
      expect(badge).toHaveClass('inline-flex')
      expect(badge).toHaveClass('bg-primary')
    })

    it('should override default classes with custom className', () => {
      render(<Badge className="bg-yellow-500 text-black" data-testid="override-badge">Override</Badge>)
      const badge = screen.getByTestId('override-badge')
      
      expect(badge).toHaveClass('bg-yellow-500')
      expect(badge).toHaveClass('text-black')
      // Base structural classes should remain
      expect(badge).toHaveClass('inline-flex')
      expect(badge).toHaveClass('rounded-full')
    })

    it('should combine variant with custom className', () => {
      render(<Badge variant="secondary" className="custom-class" data-testid="combined-badge">Combined</Badge>)
      const badge = screen.getByTestId('combined-badge')
      
      expect(badge).toHaveClass('custom-class')
      expect(badge).toHaveClass('bg-secondary') // From variant
      expect(badge).toHaveClass('inline-flex') // From base
    })
  })

  describe('HTML Attributes', () => {
    it('should forward HTML div attributes', () => {
      render(
        <Badge 
          data-testid="attrs-badge"
          id="test-badge"
          role="status"
          aria-label="Test badge"
          title="Badge tooltip"
        >
          Attributes
        </Badge>
      )
      
      const badge = screen.getByTestId('attrs-badge')
      expect(badge).toHaveAttribute('id', 'test-badge')
      expect(badge).toHaveAttribute('role', 'status')
      expect(badge).toHaveAttribute('aria-label', 'Test badge')
      expect(badge).toHaveAttribute('title', 'Badge tooltip')
    })

    it('should handle data attributes', () => {
      render(
        <Badge 
          data-testid="data-badge"
          data-value="123"
          data-category="important"
        >
          Data Badge
        </Badge>
      )
      
      const badge = screen.getByTestId('data-badge')
      expect(badge).toHaveAttribute('data-value', '123')
      expect(badge).toHaveAttribute('data-category', 'important')
    })
  })

  describe('Event Handling', () => {
    it('should handle click events', () => {
      const handleClick = vi.fn()
      render(<Badge onClick={handleClick} data-testid="clickable-badge">Clickable</Badge>)
      
      const badge = screen.getByTestId('clickable-badge')
      badge.click()
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should handle mouse events', () => {
      const handleMouseEnter = vi.fn()
      const handleMouseLeave = vi.fn()
      
      render(
        <Badge 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          data-testid="hoverable-badge"
        >
          Hoverable
        </Badge>
      )
      
      const badge = screen.getByTestId('hoverable-badge')
      
      fireEvent.mouseEnter(badge)
      expect(handleMouseEnter).toHaveBeenCalledTimes(1)
      
      fireEvent.mouseLeave(badge)
      expect(handleMouseLeave).toHaveBeenCalledTimes(1)
    })

    it('should handle keyboard events', () => {
      const handleKeyDown = vi.fn()
      render(<Badge onKeyDown={handleKeyDown} data-testid="keyboard-badge">Keyboard</Badge>)
      
      const badge = screen.getByTestId('keyboard-badge')
      badge.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      
      expect(handleKeyDown).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should support ARIA attributes', () => {
      render(
        <Badge 
          role="status"
          aria-live="polite"
          aria-label="Notification count"
          data-testid="aria-badge"
        >
          5
        </Badge>
      )
      
      const badge = screen.getByTestId('aria-badge')
      expect(badge).toHaveAttribute('role', 'status')
      expect(badge).toHaveAttribute('aria-live', 'polite')
      expect(badge).toHaveAttribute('aria-label', 'Notification count')
    })

    it('should be focusable when tabIndex is provided', () => {
      render(<Badge tabIndex={0} data-testid="focusable-badge">Focusable</Badge>)
      const badge = screen.getByTestId('focusable-badge')
      
      expect(badge).toHaveAttribute('tabIndex', '0')
      badge.focus()
      expect(document.activeElement).toBe(badge)
    })

    it('should support semantic roles', () => {
      render(<Badge role="button" data-testid="button-badge">Button Badge</Badge>)
      const badge = screen.getByTestId('button-badge')
      expect(badge).toHaveAttribute('role', 'button')
    })
  })

  describe('Badge Variants Function', () => {
    it('should export badgeVariants function', () => {
      expect(typeof badgeVariants).toBe('function')
    })

    it('should generate correct classes for default variant', () => {
      const classes = badgeVariants({ variant: 'default' })
      expect(classes).toContain('bg-primary')
      expect(classes).toContain('text-primary-foreground')
    })

    it('should generate correct classes for secondary variant', () => {
      const classes = badgeVariants({ variant: 'secondary' })
      expect(classes).toContain('bg-secondary')
      expect(classes).toContain('text-secondary-foreground')
    })

    it('should generate correct classes for destructive variant', () => {
      const classes = badgeVariants({ variant: 'destructive' })
      expect(classes).toContain('bg-destructive')
      expect(classes).toContain('text-destructive-foreground')
    })

    it('should generate correct classes for outline variant', () => {
      const classes = badgeVariants({ variant: 'outline' })
      expect(classes).toContain('text-foreground')
    })

    it('should use default variant when no variant provided', () => {
      const defaultClasses = badgeVariants({})
      const explicitDefaultClasses = badgeVariants({ variant: 'default' })
      expect(defaultClasses).toBe(explicitDefaultClasses)
    })
  })

  describe('TypeScript Integration', () => {
    it('should accept valid variant props', () => {
      // These should not cause TypeScript errors
      render(<Badge variant="default">Default</Badge>)
      render(<Badge variant="secondary">Secondary</Badge>)
      render(<Badge variant="destructive">Destructive</Badge>)
      render(<Badge variant="outline">Outline</Badge>)
    })
  })

  describe('Real-world Usage Scenarios', () => {
    it('should work as notification badge', () => {
      render(
        <div>
          <span>Messages</span>
          <Badge variant="destructive" role="status" aria-label="3 unread messages">
            3
          </Badge>
        </div>
      )
      
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByLabelText('3 unread messages')).toBeInTheDocument()
    })

    it('should work as status indicator', () => {
      render(
        <Badge variant="secondary" role="status">
          Active
        </Badge>
      )
      
      const badge = screen.getByRole('status')
      expect(badge).toHaveTextContent('Active')
      expect(badge).toHaveClass('bg-secondary')
    })

    it('should work with icons', () => {
      const IconComponent = () => <span data-testid="icon">🔥</span>
      
      render(
        <Badge variant="outline">
          <IconComponent />
          Hot
        </Badge>
      )
      
      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByText('Hot')).toBeInTheDocument()
    })

    it('should work as clickable tag', () => {
      const handleRemove = vi.fn()
      
      render(
        <Badge 
          variant="secondary" 
          onClick={handleRemove}
          role="button"
          aria-label="Remove tag"
          data-testid="tag-badge"
        >
          JavaScript
          <span>×</span>
        </Badge>
      )
      
      const badge = screen.getByTestId('tag-badge')
      badge.click()
      
      expect(handleRemove).toHaveBeenCalledTimes(1)
      expect(badge).toHaveAttribute('role', 'button')
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined/null props gracefully', () => {
      render(
        <Badge 
          variant={undefined}
          className={undefined}
          onClick={undefined}
          data-testid="undefined-props"
        >
          Undefined Props
        </Badge>
      )
      
      const badge = screen.getByTestId('undefined-props')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-primary') // Should default to default variant
    })

    it('should handle special characters and Unicode', () => {
      render(<Badge>Special: @#$%^&*()! 🎉 ñáéíóú</Badge>)
      expect(screen.getByText('Special: @#$%^&*()! 🎉 ñáéíóú')).toBeInTheDocument()
    })

    it('should handle very long text content', () => {
      const longText = 'This is a very long badge text that might overflow or wrap'
      render(<Badge data-testid="long-badge">{longText}</Badge>)
      
      const badge = screen.getByTestId('long-badge')
      expect(badge).toHaveTextContent(longText)
    })

    it('should handle numeric content', () => {
      render(<Badge>{999}</Badge>)
      expect(screen.getByText('999')).toBeInTheDocument()
    })

    it('should handle boolean content', () => {
      render(<Badge>{true ? 'Active' : 'Inactive'}</Badge>)
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })
})
