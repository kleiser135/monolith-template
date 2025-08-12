import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PageTransition } from './PageTransition';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/test-path'),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: vi.fn(({ children, className, variants, initial, animate, exit, ...props }) => (
      <div 
        className={className}
        data-variants={variants ? JSON.stringify(variants) : undefined}
        data-initial={initial}
        data-animate={animate}
        data-exit={exit}
        {...props}
      >
        {children}
      </div>
    )),
  },
  AnimatePresence: vi.fn(({ children, mode, initial }) => (
    <div data-mode={mode} data-initial={initial}>
      {children}
    </div>
  )),
}));

describe('PageTransition', () => {
  it('should render without crashing', () => {
    render(
      <PageTransition>
        <div>Test content</div>
      </PageTransition>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render children inside motion div', () => {
    render(
      <PageTransition>
        <div data-testid="test-content">Test content</div>
      </PageTransition>
    );
    
    const testContent = screen.getByTestId('test-content');
    expect(testContent).toBeInTheDocument();
    
    const motionDiv = testContent.parentElement;
    expect(motionDiv).toHaveClass('w-full');
  });

  it('should wrap content in AnimatePresence with correct props', () => {
    const { container } = render(
      <PageTransition>
        <div>Test content</div>
      </PageTransition>
    );
    
    const animatePresence = container.querySelector('[data-mode="wait"]');
    expect(animatePresence).toBeInTheDocument();
    expect(animatePresence).toHaveAttribute('data-initial', 'false');
  });

  it('should apply correct motion div props', () => {
    render(
      <PageTransition>
        <div data-testid="test-content">Test content</div>
      </PageTransition>
    );
    
    const testContent = screen.getByTestId('test-content');
    const motionDiv = testContent.parentElement;
    
    expect(motionDiv).toHaveAttribute('data-initial', 'initial');
    expect(motionDiv).toHaveAttribute('data-animate', 'enter');
    expect(motionDiv).toHaveAttribute('data-exit', 'exit');
    expect(motionDiv).toHaveClass('w-full');
  });

  it('should have correct page variants structure', () => {
    render(
      <PageTransition>
        <div data-testid="test-content">Test content</div>
      </PageTransition>
    );
    
    const testContent = screen.getByTestId('test-content');
    const motionDiv = testContent.parentElement;
    
    const variants = motionDiv?.getAttribute('data-variants');
    expect(variants).toBeDefined();
    
    if (variants) {
      const parsedVariants = JSON.parse(variants);
      
      // Check initial variant
      expect(parsedVariants.initial).toEqual({
        opacity: 0,
        scale: 0.98,
        y: 20,
      });
      
      // Check enter variant
      expect(parsedVariants.enter.opacity).toBe(1);
      expect(parsedVariants.enter.scale).toBe(1);
      expect(parsedVariants.enter.y).toBe(0);
      expect(parsedVariants.enter.transition.duration).toBe(0.6);
      expect(parsedVariants.enter.transition.ease).toEqual([0.25, 0.4, 0.25, 1]);
      
      // Check exit variant
      expect(parsedVariants.exit).toEqual({
        opacity: 0,
        scale: 0.98,
        y: -20,
        transition: {
          duration: 0.4,
          ease: [0.25, 0.4, 0.25, 1],
        },
      });
    }
  });

  it('should use pathname as key for motion div', async () => {
    const { usePathname } = await import('next/navigation');
    const mockUsePathname = vi.mocked(usePathname);
    mockUsePathname.mockReturnValue('/specific-path');
    
    render(
      <PageTransition>
        <div>Test content</div>
      </PageTransition>
    );
    
    // The key is used internally by React, but we can verify the pathname is being called
    expect(mockUsePathname).toHaveBeenCalled();
  });

  it('should handle different pathnames', async () => {
    const { usePathname } = await import('next/navigation');
    const mockUsePathname = vi.mocked(usePathname);
    
    // Test with different pathname
    mockUsePathname.mockReturnValue('/dashboard');
    
    const { rerender } = render(
      <PageTransition>
        <div>Dashboard content</div>
      </PageTransition>
    );
    
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
    
    // Change pathname and rerender
    mockUsePathname.mockReturnValue('/profile');
    
    rerender(
      <PageTransition>
        <div>Profile content</div>
      </PageTransition>
    );
    
    expect(screen.getByText('Profile content')).toBeInTheDocument();
  });

  it('should handle complex children structures', () => {
    render(
      <PageTransition>
        <div>
          <h1>Title</h1>
          <p>Paragraph</p>
          <button>Button</button>
        </div>
      </PageTransition>
    );
    
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByText('Paragraph')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Button' })).toBeInTheDocument();
  });

  it('should handle empty children', () => {
    render(
      <PageTransition>
        {null}
      </PageTransition>
    );
    
    // Should not throw and should render the motion structure
    const motionContainer = document.querySelector('.w-full');
    expect(motionContainer).toBeInTheDocument();
  });

  it('should handle string children', () => {
    render(
      <PageTransition>
        Simple text content
      </PageTransition>
    );
    
    expect(screen.getByText('Simple text content')).toBeInTheDocument();
  });

  it('should maintain motion div structure with multiple children', () => {
    render(
      <PageTransition>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
      </PageTransition>
    );
    
    const child1 = screen.getByTestId('child1');
    const child2 = screen.getByTestId('child2');
    
    expect(child1).toBeInTheDocument();
    expect(child2).toBeInTheDocument();
    
    // Both children should be in the same motion container
    expect(child1.parentElement).toBe(child2.parentElement);
    expect(child1.parentElement).toHaveClass('w-full');
  });
});
