import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';

// Mock @/lib/utils
vi.mock('@/lib/utils', () => ({
  cn: vi.fn((...args) => args.filter(Boolean).join(' ')),
}));

import { Input } from './input';

describe('Input', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Default rendering', () => {
    it('should render with default props', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('data-slot', 'input');
    });

    it('should have correct default classes', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1');
    });
  });

  describe('Input types', () => {
    it('should render as text input by default', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      // Browser doesn't set type="text" explicitly as it's the default
      expect(input.tagName).toBe('INPUT');
    });

    it('should render as password input', () => {
      render(<Input type="password" />);
      const input = document.querySelector('input[type="password"]');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render as email input', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render as number input', () => {
      render(<Input type="number" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should render as tel input', () => {
      render(<Input type="tel" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'tel');
    });

    it('should render as url input', () => {
      render(<Input type="url" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'url');
    });

    it('should render as search input', () => {
      render(<Input type="search" />);
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('should render as file input', () => {
      render(<Input type="file" />);
      const input = document.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('type', 'file');
    });
  });

  describe('HTML attributes', () => {
    it('should forward HTML attributes', () => {
      render(
        <Input 
          placeholder="Enter text"
          disabled
          required
          aria-label="Test input"
          data-testid="test-input"
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'Enter text');
      expect(input).toBeDisabled();
      expect(input).toBeRequired();
      expect(input).toHaveAttribute('aria-label', 'Test input');
      expect(input).toHaveAttribute('data-testid', 'test-input');
    });

    it('should handle value prop', () => {
      render(<Input value="test value" readOnly />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('test value');
    });

    it('should handle defaultValue prop', () => {
      render(<Input defaultValue="default test" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('default test');
    });

    it('should handle name attribute', () => {
      render(<Input name="username" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'username');
    });

    it('should handle id attribute', () => {
      render(<Input id="user-input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'user-input');
    });
  });

  describe('User interactions', () => {
    it('should handle user input', async () => {
      const user = userEvent.setup();
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello World');
      
      expect(input).toHaveValue('Hello World');
    });

    it('should handle onChange event', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      
      expect(handleChange).toHaveBeenCalledTimes(4); // Once for each character
    });

    it('should handle onFocus event', async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();
      render(<Input onFocus={handleFocus} />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should handle onBlur event', async () => {
      const user = userEvent.setup();
      const handleBlur = vi.fn();
      render(<Input onBlur={handleBlur} />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab(); // Move focus away
      
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should handle onKeyDown event', async () => {
      const user = userEvent.setup();
      const handleKeyDown = vi.fn();
      render(<Input onKeyDown={handleKeyDown} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'a');
      
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ref forwarding', () => {
    it('should forward ref correctly', () => {
      const ref = vi.fn();
      render(<Input ref={ref} />);
      
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
    });

    it('should allow ref to access input methods', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.focus).toBeDefined();
      expect(ref.current?.blur).toBeDefined();
    });
  });

  describe('Custom className', () => {
    it('should accept custom className', () => {
      render(<Input className="custom-input-class" />);
      const input = screen.getByRole('textbox');
      // The cn function will combine the default and custom classes
      expect(input).toHaveClass('custom-input-class');
    });

    it('should combine custom className with default classes', () => {
      render(<Input className="my-custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('my-custom-class');
      expect(input).toHaveClass('flex');
      expect(input).toHaveClass('h-9');
    });
  });

  describe('Accessibility', () => {
    it('should support aria-describedby', () => {
      render(<Input aria-describedby="help-text" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'help-text');
    });

    it('should support aria-invalid', () => {
      render(<Input aria-invalid="true" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should support aria-required', () => {
      render(<Input aria-required="true" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('should support aria-label', () => {
      render(<Input aria-label="Username input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Username input');
    });
  });

  describe('Disabled state', () => {
    it('should handle disabled state', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should not accept input when disabled', async () => {
      const user = userEvent.setup();
      render(<Input disabled />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      
      expect(input).toHaveValue('');
    });

    it('should not trigger events when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const handleFocus = vi.fn();
      
      render(<Input disabled onChange={handleChange} onFocus={handleFocus} />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      
      expect(handleChange).not.toHaveBeenCalled();
      expect(handleFocus).not.toHaveBeenCalled();
    });
  });

  describe('ReadOnly state', () => {
    it('should handle readonly state', () => {
      render(<Input readOnly value="readonly value" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
      expect(input).toHaveValue('readonly value');
    });

    it('should not accept input when readonly', async () => {
      const user = userEvent.setup();
      render(<Input readOnly value="initial" />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      
      expect(input).toHaveValue('initial');
    });
  });

  describe('Form integration', () => {
    it('should work with form submission', () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      
      render(
        <form onSubmit={handleSubmit}>
          <Input name="username" defaultValue="testuser" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const submitButton = screen.getByRole('button');
      submitButton.click();
      
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('should work with labels', () => {
      render(
        <div>
          <label htmlFor="username">Username</label>
          <Input id="username" />
        </div>
      );
      
      const label = screen.getByText('Username');
      const input = screen.getByRole('textbox');
      
      expect(label).toBeInTheDocument();
      expect(input).toHaveAttribute('id', 'username');
    });
  });

  describe('File input specific', () => {
    it('should handle file input attributes', () => {
      render(<Input type="file" accept=".jpg,.png" multiple />);
      const input = document.querySelector('input[type="file"]');
      
      expect(input).toHaveAttribute('accept', '.jpg,.png');
      expect(input).toHaveAttribute('multiple');
    });
  });

  describe('Number input specific', () => {
    it('should handle number input attributes', () => {
      render(<Input type="number" min="0" max="100" step="1" />);
      const input = screen.getByRole('spinbutton');
      
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
      expect(input).toHaveAttribute('step', '1');
    });
  });

  describe('Password input specific', () => {
    it('should handle password input', () => {
      render(<Input type="password" autoComplete="current-password" />);
      const input = document.querySelector('input[type="password"]');
      
      expect(input).toHaveAttribute('type', 'password');
      expect(input).toHaveAttribute('autocomplete', 'current-password');
    });
  });

  describe('Edge cases', () => {
    it('should handle multiple event handlers', async () => {
      const user = userEvent.setup();
      const handleChange1 = vi.fn();
      const handleChange2 = vi.fn();
      
      const TestComponent = () => {
        const handleCombinedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          handleChange1(e);
          handleChange2(e);
        };
        
        return <Input onChange={handleCombinedChange} />;
      };
      
      render(<TestComponent />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'a');
      
      expect(handleChange1).toHaveBeenCalled();
      expect(handleChange2).toHaveBeenCalled();
    });

    it('should handle dynamic type changes', () => {
      const { rerender } = render(<Input type="text" />);
      let input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
      
      rerender(<Input type="email" />);
      input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should handle complex class combinations', () => {
      render(<Input className="border-red-500 focus:border-blue-500" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-500');
      expect(input).toHaveClass('focus:border-blue-500');
    });
  });
});
