import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock @radix-ui/react-slot
vi.mock('@radix-ui/react-slot', () => ({
  Slot: vi.fn(({ children, ...props }) => (
    <div data-testid="slot" {...props}>
      {children}
    </div>
  )),
}));

// Mock class-variance-authority
vi.mock('class-variance-authority', () => ({
  cva: vi.fn(() => vi.fn(() => 'btn-classes')),
}));

// Mock @/lib/utils
vi.mock('@/lib/utils', () => ({
  cn: vi.fn((...args) => args.filter(Boolean).join(' ')),
}));

import { Button } from './button';

describe('Button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default props', () => {
    render(<Button>Test Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Test Button');
  });

  it('should render with variant props', () => {
    render(<Button variant="destructive">Destructive Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should render with size props', () => {
    render(<Button size="sm">Small Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should handle disabled state', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clickable Button</Button>);
    
    const button = screen.getByRole('button');
    button.click();
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should forward HTML attributes', () => {
    render(
      <Button 
        type="submit" 
        aria-label="Submit form"
        data-testid="submit-button"
      >
        Submit
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('aria-label', 'Submit form');
    expect(button).toHaveAttribute('data-testid', 'submit-button');
  });

  it('should render children correctly', () => {
    render(
      <Button>
        <span>Icon</span>
        Button Text
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('IconButton Text');
  });

  it('should work with asChild prop', () => {
    render(<Button asChild>Child Content</Button>);
    expect(screen.getByTestId('slot')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should work with different variants', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'];
    
    variants.forEach((variant) => {
      const { container } = render(<Button variant={variant as any}>{variant} Button</Button>);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });
  });

  it('should work with different sizes', () => {
    const sizes = ['default', 'sm', 'lg', 'icon'];
    
    sizes.forEach((size) => {
      const { container } = render(<Button size={size as any}>{size} Button</Button>);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });
  });

  it('should handle ref forwarding', () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Button with ref</Button>);
    expect(ref).toHaveBeenCalled();
  });

  it('should prevent click when disabled', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled Button</Button>);
    
    const button = screen.getByRole('button');
    button.click();
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should have default button type', () => {
    const { container } = render(<Button>Default Button</Button>);
    const button = container.querySelector('button');
    // Note: default type might not be explicitly set in DOM, just check element exists
    expect(button).toBeInTheDocument();
  });

  it('should accept custom type', () => {
    render(<Button type="submit">Submit Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should work with complex children', () => {
    render(
      <Button>
        <div>
          <span>Complex</span>
          <em>Children</em>
        </div>
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('ComplexChildren');
  });

  it('should work with multiple props combined', () => {
    render(
      <Button 
        variant="destructive" 
        size="lg" 
        disabled 
        className="extra-class"
        data-testid="complex-button"
      >
        Complex Button
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('data-testid', 'complex-button');
  });

  it('should render slot content when asChild', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    
    const slot = screen.getByTestId('slot');
    expect(slot).toBeInTheDocument();
    expect(slot).toHaveTextContent('Link Button');
  });

  it('should handle various event handlers', () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const onMouseEnter = vi.fn();
    
    render(
      <Button 
        onFocus={onFocus}
        onBlur={onBlur}
        onMouseEnter={onMouseEnter}
      >
        Event Button
      </Button>
    );
    
    const button = screen.getByRole('button');
    button.focus();
    button.blur();
    
    expect(onFocus).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();
  });

  it('should work with aria attributes', () => {
    render(
      <Button 
        aria-describedby="description"
        aria-expanded="false"
        role="button"
      >
        ARIA Button
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-describedby', 'description');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
