import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  useFormField,
  FormDescription,
} from './form';
import { Input } from '../input/input';
import { Button } from '../button/button';

// Test component to check the hook's behavior outside of a FormField
const TestHookComponent = () => {
  const SUT = useFormField(); // SUT = System Under Test
  return <div data-testid="name">{SUT.name}</div>;
};

// Simple form schema for testing
const formSchema = z.object({
  username: z
    .string()
    .min(2, { message: 'Username must be at least 2 characters.' }),
});

describe('Form Components', () => {
  it('useFormField should throw an error when used outside of a FormField', () => {
    // Suppress the expected console error from appearing in the test output
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestHookComponent />)).toThrow(
      'useFormField should be used within <FormField>'
    );
    
    consoleErrorSpy.mockRestore();
  });

  it('FormMessage should render an error message when the field is invalid', async () => {
    const user = userEvent.setup();
    const TestFormComponent = () => {
      const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: { username: '' },
      });

      const onSubmit = form.handleSubmit(() => {});

      return (
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      );
    };

    render(<TestFormComponent />);

    // Trigger the validation error
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Check if the error message is rendered
    expect(
      await screen.findByText('Username must be at least 2 characters.')
    ).toBeInTheDocument();
  });

  it('should correctly link form elements and display description', async () => {
    const TestFormComponent = () => {
      const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: { username: 'test' },
      });

      return (
        <Form {...form}>
          <form>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your public display name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      );
    };

    render(<TestFormComponent />);

    const label = screen.getByText('Username');
    const input = screen.getByRole('textbox');
    const description = screen.getByText('This is your public display name.');

    expect(label).toBeInTheDocument();
    expect(input).toBeInTheDocument();
    expect(description).toBeInTheDocument();

    // Check accessibility attributes
    const inputId = input.getAttribute('id');
    expect(label).toHaveAttribute('for', inputId);
    expect(input).toHaveAttribute(
      'aria-describedby',
      `${inputId}-description`
    );
    expect(input).toHaveAttribute('aria-invalid', 'false');

    const message = screen.queryByText(
      'Username must be at least 2 characters.'
    );
    expect(message).not.toBeInTheDocument();
  });

  it('should show error state and link error message', async () => {
    const user = userEvent.setup();
    const TestFormComponent = () => {
      const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: { username: '' },
      });

      const onSubmit = form.handleSubmit(() => {});

      return (
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your public display name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      );
    };

    render(<TestFormComponent />);

    await user.click(screen.getByRole('button', { name: /submit/i }));

    const label = screen.getByText('Username');
    const input = screen.getByRole('textbox');
    const errorMessage = await screen.findByText(
      'Username must be at least 2 characters.'
    );

    expect(label).toHaveAttribute('data-error', 'true');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    const inputId = input.getAttribute('id');
    const messageId = errorMessage.getAttribute('id');

    expect(input).toHaveAttribute('aria-describedby', messageId);
    expect(messageId).toBe(`${inputId}-message`);
  });

  it('FormMessage should render nothing when there is no error and no children', () => {
    const TestFormComponent = () => {
      const form = useForm({
        defaultValues: { username: 'test' },
      });

      return (
        <Form {...form}>
          <form>
            <FormField
              control={form.control}
              name="username"
              render={() => (
                <FormItem>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      );
    };

    const { container } = render(<TestFormComponent />);
    const message = container.querySelector('[data-slot="form-message"]');
    expect(message).not.toBeInTheDocument();
  });

  it('FormMessage should render children when there is no error', () => {
    const TestFormComponent = () => {
      const form = useForm({
        defaultValues: { username: 'test' },
      });

      return (
        <Form {...form}>
          <form>
            <FormField
              control={form.control}
              name="username"
              render={() => (
                <FormItem>
                  <FormMessage>A custom message</FormMessage>
                </FormItem>
              )}
            />
          </form>
        </Form>
      );
    };

    render(<TestFormComponent />);
    expect(screen.getByText('A custom message')).toBeInTheDocument();
  });

  it('FormMessage should render an error message even if children are provided', async () => {
    const user = userEvent.setup();
    const TestFormComponent = () => {
      const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: { username: '' },
      });

      const onSubmit = form.handleSubmit(() => {});

      return (
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage>Should not be rendered</FormMessage>
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      );
    };

    render(<TestFormComponent />);

    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(
      await screen.findByText('Username must be at least 2 characters.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Should not be rendered')
    ).not.toBeInTheDocument();
  });
}); 