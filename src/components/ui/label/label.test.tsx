import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import * as React from 'react'
import { Label } from './label'

describe('Label Component', () => {
  describe('Basic Rendering', () => {
    it('should render with text content', () => {
      render(<Label>Test Label</Label>)
      expect(screen.getByText('Test Label')).toBeInTheDocument()
    })

    it('should render as a label element by default', () => {
      render(<Label>Test Label</Label>)
      const label = screen.getByText('Test Label')
      expect(label.tagName).toBe('LABEL')
    })

    it('should render with custom children', () => {
      render(
        <Label>
          <span>Custom</span> Label Content
        </Label>
      )
      expect(screen.getByText('Custom')).toBeInTheDocument()
      expect(screen.getByText('Label Content')).toBeInTheDocument()
    })
  })

  describe('Styling and Classes', () => {
    it('should apply default classes', () => {
      render(<Label>Test Label</Label>)
      const label = screen.getByText('Test Label')
      
      expect(label).toHaveClass('flex')
      expect(label).toHaveClass('items-center')
      expect(label).toHaveClass('gap-2')
      expect(label).toHaveClass('text-sm')
      expect(label).toHaveClass('leading-none')
      expect(label).toHaveClass('font-medium')
      expect(label).toHaveClass('select-none')
    })

    it('should apply disabled styles classes', () => {
      render(<Label>Test Label</Label>)
      const label = screen.getByText('Test Label')
      
      expect(label).toHaveClass('group-data-[disabled=true]:pointer-events-none')
      expect(label).toHaveClass('group-data-[disabled=true]:opacity-50')
      expect(label).toHaveClass('peer-disabled:cursor-not-allowed')
      expect(label).toHaveClass('peer-disabled:opacity-50')
    })

    it('should accept and merge custom className', () => {
      render(<Label className="custom-class text-lg">Test Label</Label>)
      const label = screen.getByText('Test Label')
      
      expect(label).toHaveClass('custom-class')
      expect(label).toHaveClass('text-lg')
      expect(label).toHaveClass('flex') // Default class should still be present
    })

    it('should override default classes when conflicting', () => {
      render(<Label className="text-lg">Test Label</Label>)
      const label = screen.getByText('Test Label')
      
      // Should have the custom size class
      expect(label).toHaveClass('text-lg')
      // Should still have non-conflicting default classes
      expect(label).toHaveClass('flex')
      expect(label).toHaveClass('font-medium')
    })
  })

  describe('Data Attributes', () => {
    it('should have data-slot attribute set to "label"', () => {
      render(<Label>Test Label</Label>)
      const label = screen.getByText('Test Label')
      expect(label).toHaveAttribute('data-slot', 'label')
    })

    it('should preserve custom data attributes', () => {
      render(<Label data-testid="custom-label" data-custom="value">Test Label</Label>)
      const label = screen.getByText('Test Label')
      
      expect(label).toHaveAttribute('data-testid', 'custom-label')
      expect(label).toHaveAttribute('data-custom', 'value')
      expect(label).toHaveAttribute('data-slot', 'label')
    })
  })

  describe('Form Integration', () => {
    it('should associate with form control using htmlFor', () => {
      render(
        <>
          <Label htmlFor="test-input">Test Label</Label>
          <input id="test-input" type="text" />
        </>
      )
      
      const label = screen.getByText('Test Label')
      const input = screen.getByRole('textbox')
      
      expect(label).toHaveAttribute('for', 'test-input')
      expect(input).toHaveAttribute('id', 'test-input')
    })

    it('should work with nested form controls', () => {
      render(
        <Label>
          Test Label
          <input type="checkbox" />
        </Label>
      )
      
      const label = screen.getByText('Test Label')
      const checkbox = screen.getByRole('checkbox')
      
      // Label should contain the checkbox
      expect(label).toContainElement(checkbox)
    })
  })

  describe('Accessibility', () => {
    it('should have proper role when used as label', () => {
      render(<Label>Accessible Label</Label>)
      const label = screen.getByText('Accessible Label')
      
      // Should be recognized as a label by screen readers
      expect(label.tagName).toBe('LABEL')
    })

    it('should support aria attributes', () => {
      render(
        <Label 
          aria-describedby="help-text"
          aria-required="true"
        >
          Required Label
        </Label>
      )
      
      const label = screen.getByText('Required Label')
      expect(label).toHaveAttribute('aria-describedby', 'help-text')
      expect(label).toHaveAttribute('aria-required', 'true')
    })

    it('should be keyboard accessible', () => {
      render(
        <Label htmlFor="test-input" tabIndex={0}>
          Focusable Label
        </Label>
      )
      
      const label = screen.getByText('Focusable Label')
      expect(label).toHaveAttribute('tabIndex', '0')
    })
  })

  describe('Event Handling', () => {
    it('should handle click events', () => {
      const handleClick = vi.fn()
      render(<Label onClick={handleClick}>Clickable Label</Label>)
      
      const label = screen.getByText('Clickable Label')
      label.click()
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should handle mouse events', () => {
      const handleMouseEnter = vi.fn()
      const handleMouseLeave = vi.fn()
      
      render(
        <Label 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          Hoverable Label
        </Label>
      )
      
      const label = screen.getByText('Hoverable Label')
      
      // Use fireEvent for these interactions
      fireEvent.mouseEnter(label)
      expect(handleMouseEnter).toHaveBeenCalledTimes(1)
      
      fireEvent.mouseLeave(label)
      expect(handleMouseLeave).toHaveBeenCalledTimes(1)
    })
  })

  describe('Radix Integration', () => {
    it('should work with Radix LabelPrimitive features', () => {
      render(<Label>Radix Label</Label>)
      const label = screen.getByText('Radix Label')
      
      // Should be a proper label element from Radix
      expect(label.tagName).toBe('LABEL')
      expect(label).toHaveAttribute('data-slot', 'label')
    })

    it('should support Radix event handling', () => {
      const handleClick = vi.fn()
      render(<Label onClick={handleClick}>Clickable Radix Label</Label>)
      
      const label = screen.getByText('Clickable Radix Label')
      label.click()
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Edge Cases', () => {
    it('should render with empty content', () => {
      const { container } = render(<Label></Label>)
      const label = container.querySelector('label')
      expect(label).toBeInTheDocument()
      expect(label).toHaveAttribute('data-slot', 'label')
    })

    it('should handle boolean props correctly', () => {
      render(
        <Label 
          hidden={false}
        >
          Boolean Props Label
        </Label>
      )
      
      const label = screen.getByText('Boolean Props Label')
      expect(label).not.toHaveAttribute('hidden')
    })

    it('should handle undefined/null props gracefully', () => {
      render(
        <Label 
          className={undefined}
          onClick={undefined}
        >
          Undefined Props Label
        </Label>
      )
      
      const label = screen.getByText('Undefined Props Label')
      expect(label).toBeInTheDocument()
      expect(label).toHaveClass('flex') // Default classes should still apply
    })

    it('should work with special characters in content', () => {
      render(<Label>Label with émojis 🏷️ & symbols! @#$%</Label>)
      expect(screen.getByText('Label with émojis 🏷️ & symbols! @#$%')).toBeInTheDocument()
    })
  })

  describe('Radix Primitive Integration', () => {
    it('should pass through Radix-specific props', () => {
      render(
        <Label 
          asChild={false}
          dir="rtl"
        >
          Radix Props Label
        </Label>
      )
      
      const label = screen.getByText('Radix Props Label')
      expect(label).toHaveAttribute('dir', 'rtl')
    })

    it('should support all native label element attributes', () => {
      render(
        <Label 
          htmlFor="target"
          form="test-form"
          title="Label tooltip"
        >
          Native Attributes Label
        </Label>
      )
      
      const label = screen.getByText('Native Attributes Label')
      expect(label).toHaveAttribute('for', 'target')
      expect(label).toHaveAttribute('form', 'test-form')
      expect(label).toHaveAttribute('title', 'Label tooltip')
    })
  })
})
