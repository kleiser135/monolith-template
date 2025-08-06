import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import * as React from 'react'
import { Textarea } from './textarea'
import { createRef } from 'react'

// Mock @/lib/utils
vi.mock('@/lib/utils', () => ({
  cn: vi.fn((...args) => args.filter(Boolean).join(' ')),
}))

describe('Textarea Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default classes', () => {
      render(<Textarea />)
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toBeInTheDocument()
      expect(textarea.tagName).toBe('TEXTAREA')
      expect(textarea).toHaveAttribute('data-slot', 'textarea')
    })

    it('should render with placeholder text', () => {
      const placeholderText = 'Enter your message'
      render(<Textarea placeholder={placeholderText} />)
      
      expect(screen.getByPlaceholderText(placeholderText)).toBeInTheDocument()
    })

    it('should render with initial value', () => {
      const initialValue = 'Initial message content'
      render(<Textarea defaultValue={initialValue} />)
      
      expect(screen.getByDisplayValue(initialValue)).toBeInTheDocument()
    })

    it('should render empty textarea by default', () => {
      render(<Textarea />)
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toHaveValue('')
    })
  })

  describe('Custom ClassName', () => {
    it('should accept and apply custom className', () => {
      const customClass = 'custom-textarea-class'
      render(<Textarea className={customClass} />)
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toHaveClass(customClass)
    })

    it('should merge custom className with default classes', () => {
      const customClass = 'bg-red-500'
      render(<Textarea className={customClass} />)
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toHaveClass(customClass)
      expect(textarea).toHaveClass('min-h-20') // default class
    })
  })

  describe('HTML Attributes', () => {
    it('should forward HTML textarea attributes', () => {
      render(
        <Textarea
          rows={5}
          cols={40}
          maxLength={500}
          data-testid="custom-textarea"
        />
      )
      const textarea = screen.getByTestId('custom-textarea')
      
      expect(textarea).toHaveAttribute('rows', '5')
      expect(textarea).toHaveAttribute('cols', '40')
      expect(textarea).toHaveAttribute('maxLength', '500')
    })

    it('should handle data attributes', () => {
      render(<Textarea data-custom="test-value" />)
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toHaveAttribute('data-custom', 'test-value')
      expect(textarea).toHaveAttribute('data-slot', 'textarea')
    })

    it('should handle ARIA attributes', () => {
      render(
        <Textarea
          aria-label="Message textarea"
          aria-describedby="help-text"
          aria-required={true}
        />
      )
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toHaveAttribute('aria-label', 'Message textarea')
      expect(textarea).toHaveAttribute('aria-describedby', 'help-text')
      expect(textarea).toHaveAttribute('aria-required', 'true')
    })
  })

  describe('Disabled State', () => {
    it('should render disabled textarea', () => {
      render(<Textarea disabled />)
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toBeDisabled()
      expect(textarea).toHaveClass('disabled:pointer-events-none')
      expect(textarea).toHaveClass('disabled:cursor-not-allowed')
      expect(textarea).toHaveClass('disabled:opacity-50')
    })

    it('should not be focusable when disabled', () => {
      render(<Textarea disabled />)
      const textarea = screen.getByRole('textbox')
      
      textarea.focus()
      expect(textarea).not.toHaveFocus()
    })
  })

  describe('Event Handling', () => {
    it('should handle onChange events', () => {
      const handleChange = vi.fn()
      render(<Textarea onChange={handleChange} />)
      const textarea = screen.getByRole('textbox')
      
      fireEvent.change(textarea, { target: { value: 'New text content' } })
      
      expect(handleChange).toHaveBeenCalledTimes(1)
      expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
        target: expect.objectContaining({
          value: 'New text content'
        })
      }))
    })

    it('should handle onFocus events', () => {
      const handleFocus = vi.fn()
      render(<Textarea onFocus={handleFocus} />)
      const textarea = screen.getByRole('textbox')
      
      fireEvent.focus(textarea)
      
      expect(handleFocus).toHaveBeenCalledTimes(1)
    })

    it('should handle onBlur events', () => {
      const handleBlur = vi.fn()
      render(<Textarea onBlur={handleBlur} />)
      const textarea = screen.getByRole('textbox')
      
      fireEvent.focus(textarea)
      fireEvent.blur(textarea)
      
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })

    it('should handle onKeyDown events', () => {
      const handleKeyDown = vi.fn()
      render(<Textarea onKeyDown={handleKeyDown} />)
      const textarea = screen.getByRole('textbox')
      
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' })
      
      expect(handleKeyDown).toHaveBeenCalledTimes(1)
      expect(handleKeyDown).toHaveBeenCalledWith(expect.objectContaining({
        key: 'Enter'
      }))
    })
  })

  describe('Focus and Interaction', () => {
    it('should be focusable', () => {
      render(<Textarea />)
      const textarea = screen.getByRole('textbox')
      
      textarea.focus()
      expect(textarea).toHaveFocus()
    })

    it('should show focus-visible styles when focused', () => {
      render(<Textarea />)
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toHaveClass('focus-visible:border-ring')
      expect(textarea).toHaveClass('focus-visible:ring-ring/50')
      expect(textarea).toHaveClass('focus-visible:ring-[3px]')
    })

    it('should support tabIndex', () => {
      render(<Textarea tabIndex={5} />)
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toHaveAttribute('tabIndex', '5')
    })
  })

  describe('Form Integration', () => {
    it('should work with forms using name attribute', () => {
      render(
        <form>
          <Textarea name="message" defaultValue="Form content" />
        </form>
      )
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toHaveAttribute('name', 'message')
      expect(textarea).toHaveValue('Form content')
    })

    it('should handle required attribute', () => {
      render(<Textarea required />)
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toBeRequired()
    })

    it('should handle maxLength validation', () => {
      render(<Textarea maxLength={10} />)
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toHaveAttribute('maxLength', '10')
    })
  })

  describe('Accessibility', () => {
    it('should support aria-invalid for validation states', () => {
      render(<Textarea aria-invalid={true} />)
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toHaveAttribute('aria-invalid', 'true')
      expect(textarea).toHaveClass('aria-invalid:ring-destructive/20')
      expect(textarea).toHaveClass('aria-invalid:border-destructive')
    })

    it('should support aria-describedby for help text', () => {
      render(
        <div>
          <Textarea aria-describedby="help-text" />
          <div id="help-text">Help text for textarea</div>
        </div>
      )
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toHaveAttribute('aria-describedby', 'help-text')
    })

    it('should be properly labeled', () => {
      render(
        <div>
          <label htmlFor="message-textarea">Message</label>
          <Textarea id="message-textarea" />
        </div>
      )
      
      expect(screen.getByLabelText('Message')).toBeInTheDocument()
    })
  })

  describe('CSS Classes', () => {
    it('should apply default styling classes', () => {
      render(<Textarea />)
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toHaveClass('min-h-20')
      expect(textarea).toHaveClass('w-full')
      expect(textarea).toHaveClass('rounded-md')
      expect(textarea).toHaveClass('border')
      expect(textarea).toHaveClass('bg-transparent')
      expect(textarea).toHaveClass('px-3')
      expect(textarea).toHaveClass('py-2')
    })

    it('should apply placeholder styling classes', () => {
      render(<Textarea />)
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toHaveClass('placeholder:text-muted-foreground')
    })

    it('should apply selection styling classes', () => {
      render(<Textarea />)
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toHaveClass('selection:bg-primary')
      expect(textarea).toHaveClass('selection:text-primary-foreground')
    })

    it('should apply dark mode classes', () => {
      render(<Textarea />)
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toHaveClass('dark:bg-input/30')
      expect(textarea).toHaveClass('dark:aria-invalid:ring-destructive/40')
    })
  })

  describe('Real-world Usage Scenarios', () => {
    it('should work as a message textarea', () => {
      render(
        <Textarea
          placeholder="Enter your message"
          rows={4}
          maxLength={1000}
        />
      )
      const textarea = screen.getByPlaceholderText('Enter your message')
      
      fireEvent.change(textarea, { target: { value: 'Hello, world!' } })
      
      expect(textarea).toHaveValue('Hello, world!')
      expect(textarea).toHaveAttribute('rows', '4')
      expect(textarea).toHaveAttribute('maxLength', '1000')
    })

    it('should work as a comment textarea', () => {
      const handleSubmit = vi.fn()
      render(
        <form onSubmit={handleSubmit}>
          <Textarea
            name="comment"
            placeholder="Add a comment..."
            required
          />
        </form>
      )
      const textarea = screen.getByPlaceholderText('Add a comment...')
      
      expect(textarea).toHaveAttribute('name', 'comment')
      expect(textarea).toBeRequired()
    })

    it('should work with controlled value', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('Initial value')
        return (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )
      }
      
      render(<TestComponent />)
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toHaveValue('Initial value')
      
      fireEvent.change(textarea, { target: { value: 'Updated value' } })
      expect(textarea).toHaveValue('Updated value')
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined/null props gracefully', () => {
      expect(() => {
        render(<Textarea className={undefined} />)
      }).not.toThrow()
    })

    it('should handle empty string values', () => {
      render(<Textarea value="" onChange={() => {}} />)
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toHaveValue('')
    })

    it('should handle very long text content', () => {
      const longText = 'A'.repeat(5000)
      render(<Textarea defaultValue={longText} />)
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toHaveValue(longText)
    })

    it('should handle special characters and Unicode', () => {
      const specialText = 'Special chars: äöü 你好 🚀 €£¥'
      render(<Textarea defaultValue={specialText} />)
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toHaveValue(specialText)
    })

    it('should handle line breaks in content', () => {
      const multilineText = 'Line 1\nLine 2\nLine 3'
      render(<Textarea defaultValue={multilineText} />)
      const textarea = screen.getByRole('textbox')
      
      expect(textarea).toHaveValue(multilineText)
    })
  })
})