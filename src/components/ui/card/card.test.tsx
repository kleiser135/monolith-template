import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import * as React from 'react'
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card'

describe('Card Components', () => {
  describe('Card (Main Container)', () => {
    describe('Basic Rendering', () => {
      it('should render with children', () => {
        render(
          <Card>
            <div>Card content</div>
          </Card>
        )
        expect(screen.getByText('Card content')).toBeInTheDocument()
      })

      it('should render as a div element', () => {
        render(<Card data-testid="card">Test Card</Card>)
        const card = screen.getByTestId('card')
        expect(card.tagName).toBe('DIV')
      })

      it('should apply default classes', () => {
        render(<Card data-testid="card">Card</Card>)
        const card = screen.getByTestId('card')
        
        expect(card).toHaveClass('rounded-lg')
        expect(card).toHaveClass('border')
        expect(card).toHaveClass('bg-card')
        expect(card).toHaveClass('text-card-foreground')
        expect(card).toHaveClass('shadow-sm')
      })

      it('should accept custom className', () => {
        render(<Card data-testid="card" className="custom-card">Card</Card>)
        const card = screen.getByTestId('card')
        
        expect(card).toHaveClass('custom-card')
        expect(card).toHaveClass('rounded-lg') // Default classes should still be present
      })
    })

    describe('Ref Forwarding', () => {
      it('should forward ref correctly', () => {
        const ref = React.createRef<HTMLDivElement>()
        render(<Card ref={ref}>Card with ref</Card>)
        
        expect(ref.current).not.toBeNull()
        expect(ref.current?.tagName).toBe('DIV')
        expect(ref.current?.textContent).toBe('Card with ref')
      })
    })

    describe('Props Forwarding', () => {
      it('should forward HTML div attributes', () => {
        render(
          <Card 
            data-testid="card"
            id="test-card"
            role="region"
            aria-label="Test card"
          >
            Card
          </Card>
        )
        
        const card = screen.getByTestId('card')
        expect(card).toHaveAttribute('id', 'test-card')
        expect(card).toHaveAttribute('role', 'region')
        expect(card).toHaveAttribute('aria-label', 'Test card')
      })
    })
  })

  describe('CardHeader', () => {
    describe('Basic Rendering', () => {
      it('should render with children', () => {
        render(
          <CardHeader>
            <h2>Header content</h2>
          </CardHeader>
        )
        expect(screen.getByText('Header content')).toBeInTheDocument()
      })

      it('should apply default header classes', () => {
        render(<CardHeader data-testid="header">Header</CardHeader>)
        const header = screen.getByTestId('header')
        
        expect(header).toHaveClass('flex')
        expect(header).toHaveClass('flex-col')
        expect(header).toHaveClass('space-y-1.5')
        expect(header).toHaveClass('p-6')
      })

      it('should accept custom className', () => {
        render(<CardHeader data-testid="header" className="custom-header">Header</CardHeader>)
        const header = screen.getByTestId('header')
        
        expect(header).toHaveClass('custom-header')
        expect(header).toHaveClass('flex') // Default classes preserved
      })
    })

    describe('Ref Forwarding', () => {
      it('should forward ref correctly', () => {
        const ref = React.createRef<HTMLDivElement>()
        render(<CardHeader ref={ref}>Header</CardHeader>)
        
        expect(ref.current).not.toBeNull()
        expect(ref.current?.tagName).toBe('DIV')
      })
    })
  })

  describe('CardTitle', () => {
    describe('Basic Rendering', () => {
      it('should render with text content', () => {
        render(<CardTitle>Card Title</CardTitle>)
        expect(screen.getByText('Card Title')).toBeInTheDocument()
      })

      it('should render as h3 element by default', () => {
        render(<CardTitle>Title Text</CardTitle>)
        const title = screen.getByRole('heading', { level: 3 })
        expect(title).toBeInTheDocument()
        expect(title.textContent).toBe('Title Text')
      })

      it('should apply default title classes', () => {
        render(<CardTitle>Title</CardTitle>)
        const title = screen.getByRole('heading')
        
        expect(title).toHaveClass('text-2xl')
        expect(title).toHaveClass('font-semibold')
        expect(title).toHaveClass('leading-none')
        expect(title).toHaveClass('tracking-tight')
      })

      it('should accept custom className', () => {
        render(<CardTitle className="custom-title">Title</CardTitle>)
        const title = screen.getByRole('heading')
        
        expect(title).toHaveClass('custom-title')
        expect(title).toHaveClass('text-2xl') // Default classes preserved
      })
    })

    describe('Ref Forwarding', () => {
      it('should forward ref correctly', () => {
        const ref = React.createRef<HTMLHeadingElement>()
        render(<CardTitle ref={ref}>Title</CardTitle>)
        
        expect(ref.current).not.toBeNull()
        expect(ref.current?.tagName).toBe('H3')
        expect(ref.current?.textContent).toBe('Title')
      })
    })
  })

  describe('CardDescription', () => {
    describe('Basic Rendering', () => {
      it('should render with text content', () => {
        render(<CardDescription>Card description text</CardDescription>)
        expect(screen.getByText('Card description text')).toBeInTheDocument()
      })

      it('should render as p element', () => {
        render(<CardDescription data-testid="description">Description</CardDescription>)
        const description = screen.getByTestId('description')
        expect(description.tagName).toBe('P')
      })

      it('should apply default description classes', () => {
        render(<CardDescription data-testid="description">Description</CardDescription>)
        const description = screen.getByTestId('description')
        
        expect(description).toHaveClass('text-sm')
        expect(description).toHaveClass('text-muted-foreground')
      })

      it('should accept custom className', () => {
        render(<CardDescription data-testid="description" className="custom-desc">Description</CardDescription>)
        const description = screen.getByTestId('description')
        
        expect(description).toHaveClass('custom-desc')
        expect(description).toHaveClass('text-sm') // Default classes preserved
      })
    })

    describe('Ref Forwarding', () => {
      it('should forward ref correctly', () => {
        const ref = React.createRef<HTMLParagraphElement>()
        render(<CardDescription ref={ref}>Description</CardDescription>)
        
        expect(ref.current).not.toBeNull()
        expect(ref.current?.tagName).toBe('P')
        expect(ref.current?.textContent).toBe('Description')
      })
    })
  })

  describe('CardContent', () => {
    describe('Basic Rendering', () => {
      it('should render with children', () => {
        render(
          <CardContent>
            <p>Content text</p>
          </CardContent>
        )
        expect(screen.getByText('Content text')).toBeInTheDocument()
      })

      it('should apply default content classes', () => {
        render(<CardContent data-testid="content">Content</CardContent>)
        const content = screen.getByTestId('content')
        
        expect(content).toHaveClass('p-6')
        expect(content).toHaveClass('pt-0')
      })

      it('should accept custom className', () => {
        render(<CardContent data-testid="content" className="custom-content">Content</CardContent>)
        const content = screen.getByTestId('content')
        
        expect(content).toHaveClass('custom-content')
        expect(content).toHaveClass('p-6') // Default classes preserved
      })
    })

    describe('Ref Forwarding', () => {
      it('should forward ref correctly', () => {
        const ref = React.createRef<HTMLDivElement>()
        render(<CardContent ref={ref}>Content</CardContent>)
        
        expect(ref.current).not.toBeNull()
        expect(ref.current?.tagName).toBe('DIV')
      })
    })
  })

  describe('CardFooter', () => {
    describe('Basic Rendering', () => {
      it('should render with children', () => {
        render(
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        )
        expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
      })

      it('should apply default footer classes', () => {
        render(<CardFooter data-testid="footer">Footer</CardFooter>)
        const footer = screen.getByTestId('footer')
        
        expect(footer).toHaveClass('flex')
        expect(footer).toHaveClass('items-center')
        expect(footer).toHaveClass('p-6')
        expect(footer).toHaveClass('pt-0')
      })

      it('should accept custom className', () => {
        render(<CardFooter data-testid="footer" className="custom-footer">Footer</CardFooter>)
        const footer = screen.getByTestId('footer')
        
        expect(footer).toHaveClass('custom-footer')
        expect(footer).toHaveClass('flex') // Default classes preserved
      })
    })

    describe('Ref Forwarding', () => {
      it('should forward ref correctly', () => {
        const ref = React.createRef<HTMLDivElement>()
        render(<CardFooter ref={ref}>Footer</CardFooter>)
        
        expect(ref.current).not.toBeNull()
        expect(ref.current?.tagName).toBe('DIV')
      })
    })
  })

  describe('Complete Card Structure', () => {
    it('should render a complete card with all components', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Complete Card Title</CardTitle>
            <CardDescription>This is a complete card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main card content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Primary Action</button>
            <button>Secondary Action</button>
          </CardFooter>
        </Card>
      )

      // Check all parts are rendered
      expect(screen.getByTestId('complete-card')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Complete Card Title' })).toBeInTheDocument()
      expect(screen.getByText('This is a complete card description')).toBeInTheDocument()
      expect(screen.getByText('Main card content goes here')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Primary Action' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Secondary Action' })).toBeInTheDocument()
    })

    it('should work with minimal card structure', () => {
      render(
        <Card>
          <CardContent>
            Simple card content
          </CardContent>
        </Card>
      )

      expect(screen.getByText('Simple card content')).toBeInTheDocument()
    })

    it('should work with custom components inside', () => {
      const CustomComponent = () => <div>Custom element</div>
      
      render(
        <Card>
          <CardHeader>
            <CustomComponent />
          </CardHeader>
          <CardContent>
            <CustomComponent />
          </CardContent>
        </Card>
      )

      expect(screen.getAllByText('Custom element')).toHaveLength(2)
    })
  })

  describe('Accessibility', () => {
    it('should support aria attributes on card', () => {
      render(
        <Card 
          data-testid="accessible-card"
          role="article"
          aria-labelledby="card-title"
          aria-describedby="card-desc"
        >
          <CardTitle id="card-title">Accessible Title</CardTitle>
          <CardDescription id="card-desc">Accessible description</CardDescription>
        </Card>
      )

      const card = screen.getByTestId('accessible-card')
      expect(card).toHaveAttribute('role', 'article')
      expect(card).toHaveAttribute('aria-labelledby', 'card-title')
      expect(card).toHaveAttribute('aria-describedby', 'card-desc')
    })

    it('should maintain semantic heading hierarchy', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Main Title</CardTitle>
          </CardHeader>
        </Card>
      )

      // Should be h3 by default
      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toHaveTextContent('Main Title')
    })
  })

  describe('Event Handling', () => {
    it('should handle click events on card', () => {
      const handleClick = vi.fn()
      render(
        <Card data-testid="clickable-card" onClick={handleClick}>
          Clickable card
        </Card>
      )

      const card = screen.getByTestId('clickable-card')
      card.click()
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should handle events on card components', () => {
      const handleHeaderClick = vi.fn()
      const handleFooterClick = vi.fn()
      
      render(
        <Card>
          <CardHeader onClick={handleHeaderClick} data-testid="header">
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardFooter onClick={handleFooterClick} data-testid="footer">
            Footer
          </CardFooter>
        </Card>
      )

      screen.getByTestId('header').click()
      screen.getByTestId('footer').click()
      
      expect(handleHeaderClick).toHaveBeenCalledTimes(1)
      expect(handleFooterClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Edge Cases', () => {
    it('should render empty cards gracefully', () => {
      render(<Card data-testid="empty-card"></Card>)
      const card = screen.getByTestId('empty-card')
      expect(card).toBeInTheDocument()
      expect(card).toBeEmptyDOMElement()
    })

    it('should handle undefined props gracefully', () => {
      render(
        <Card 
          className={undefined}
          onClick={undefined}
          data-testid="undefined-props-card"
        >
          Card with undefined props
        </Card>
      )
      
      const card = screen.getByTestId('undefined-props-card')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('rounded-lg') // Default classes still applied
    })

    it('should work with special characters and content', () => {
      render(
        <Card>
          <CardTitle>Special Title: @#$%^&*()!</CardTitle>
          <CardDescription>Description with émojis 🎉 and unicode ñáéíóú</CardDescription>
          <CardContent>
            Content with <strong>HTML</strong> elements
          </CardContent>
        </Card>
      )

      expect(screen.getByText('Special Title: @#$%^&*()!')).toBeInTheDocument()
      expect(screen.getByText('Description with émojis 🎉 and unicode ñáéíóú')).toBeInTheDocument()
      expect(screen.getByText('HTML')).toBeInTheDocument()
    })
  })

  describe('Display Names', () => {
    it('should have correct display names for debugging', () => {
      expect(Card.displayName).toBe('Card')
      expect(CardHeader.displayName).toBe('CardHeader')
      expect(CardTitle.displayName).toBe('CardTitle')
      expect(CardDescription.displayName).toBe('CardDescription')
      expect(CardContent.displayName).toBe('CardContent')
      expect(CardFooter.displayName).toBe('CardFooter')
    })
  })
})
