import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SharedBackground } from './SharedBackground';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: vi.fn(({ children, style, className, animate, transition, ...props }) => (
      <div 
        className={className} 
        style={style} 
        data-animate={animate ? JSON.stringify(animate) : undefined}
        data-transition={transition ? JSON.stringify(transition) : undefined}
        {...props}
      >
        {children}
      </div>
    )),
  },
}));

describe('SharedBackground', () => {
  it('should render without crashing', () => {
    render(
      <SharedBackground>
        <div>Test content</div>
      </SharedBackground>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render children in relative z-10 container', () => {
    render(
      <SharedBackground>
        <div data-testid="test-content">Test content</div>
      </SharedBackground>
    );
    
    const testContent = screen.getByTestId('test-content');
    const contentContainer = testContent.parentElement;
    expect(contentContainer).toHaveClass('relative', 'z-10');
  });

  it('should use landing variant by default', () => {
    const { container } = render(
      <SharedBackground>
        <div>Test content</div>
      </SharedBackground>
    );
    
    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer).toHaveClass('min-h-screen', 'bg-slate-900', 'relative', 'overflow-hidden');
    
    // Should have landing background style
    expect(mainContainer.style.background).toContain('linear-gradient');
    expect(mainContainer.style.backgroundAttachment).toBe('fixed');
  });

  it('should apply auth variant styles when specified', () => {
    const { container } = render(
      <SharedBackground variant="auth">
        <div>Test content</div>
      </SharedBackground>
    );
    
    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer).toHaveClass('min-h-screen', 'bg-slate-900', 'relative', 'overflow-hidden');
    expect(mainContainer.style.backgroundColor).toBe('rgb(15, 23, 42)'); // #0f172a converted to rgb
  });

  it('should render auth background gradient when variant is auth', () => {
    const { container } = render(
      <SharedBackground variant="auth">
        <div>Test content</div>
      </SharedBackground>
    );
    
    // Find the auth gradient layer
    const gradientLayer = container.querySelector('.absolute.inset-0');
    expect(gradientLayer).toBeInTheDocument();
    expect(gradientLayer).toHaveStyle({ opacity: '0.9' });
    expect(gradientLayer?.getAttribute('style')).toContain('linear-gradient(45deg');
  });

  it('should render landing background when variant is landing', () => {
    render(
      <SharedBackground variant="landing">
        <div>Test content</div>
      </SharedBackground>
    );
    
    // Should have the landing background applied to container
    const { container } = render(
      <SharedBackground variant="landing">
        <div>Test content</div>
      </SharedBackground>
    );
    
    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer.style.background).toContain('linear-gradient(135deg');
  });

  it('should render 10 floating dots with motion divs', () => {
    const { container } = render(
      <SharedBackground>
        <div>Test content</div>
      </SharedBackground>
    );
    
    // Look for motion dots by their classes
    const dots = container.querySelectorAll('.absolute.w-2.h-2.bg-orange-400\\/30.rounded-full');
    expect(dots).toHaveLength(10);
  });

  it('should render floating dots with deterministic positions', () => {
    const { container } = render(
      <SharedBackground>
        <div>Test content</div>
      </SharedBackground>
    );
    
    // Check that dots have the expected positioning styles
    const dots = container.querySelectorAll('.absolute.w-2.h-2.bg-orange-400\\/30.rounded-full');
    
    // Check first few dots have expected positions
    expect(dots[0]).toHaveStyle({
      left: '15.2%',
      top: '23.4%',
    });
    
    expect(dots[1]).toHaveStyle({
      left: '67.8%',
      top: '78.1%',
    });
  });

  it('should apply correct animation properties to floating dots', () => {
    const { container } = render(
      <SharedBackground>
        <div>Test content</div>
      </SharedBackground>
    );
    
    const dots = container.querySelectorAll('.absolute.w-2.h-2.bg-orange-400\\/30.rounded-full');
    
    // Check animation properties are present as data attributes
    dots.forEach(dot => {
      expect(dot).toHaveAttribute('data-animate');
      expect(dot).toHaveAttribute('data-transition');
    });
  });

  it('should have floating dots container with correct classes', () => {
    const { container } = render(
      <SharedBackground>
        <div>Test content</div>
      </SharedBackground>
    );
    
    const dotsContainer = container.querySelector('.absolute.inset-0.overflow-hidden');
    expect(dotsContainer).toBeInTheDocument();
    expect(dotsContainer).toHaveClass('absolute', 'inset-0', 'overflow-hidden');
  });

  it('should render floating dots with correct styling classes', () => {
    const { container } = render(
      <SharedBackground>
        <div>Test content</div>
      </SharedBackground>
    );
    
    const dots = container.querySelectorAll('.absolute.w-2.h-2.bg-orange-400\\/30.rounded-full');
    
    dots.forEach(dot => {
      expect(dot).toHaveClass('absolute', 'w-2', 'h-2', 'bg-orange-400/30', 'rounded-full');
    });
  });

  it('should handle different content types as children', () => {
    const { rerender } = render(
      <SharedBackground>
        <p>Paragraph content</p>
      </SharedBackground>
    );
    
    expect(screen.getByText('Paragraph content')).toBeInTheDocument();
    
    rerender(
      <SharedBackground>
        <div>
          <h1>Title</h1>
          <span>Span content</span>
        </div>
      </SharedBackground>
    );
    
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Span content')).toBeInTheDocument();
  });
});
