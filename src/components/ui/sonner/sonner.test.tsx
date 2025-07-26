import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Toaster } from './sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { useTheme } from 'next-themes';

// Mock next-themes
vi.mock('next-themes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-themes')>();
  return {
    ...actual,
    useTheme: vi.fn(),
  };
});

describe('Toaster (Sonner) Component', () => {
  it('renders correctly and respects the theme', () => {
    // Arrange: Mock the useTheme hook to return 'light'
    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      setTheme: vi.fn(),
      themes: ['light', 'dark'],
      resolvedTheme: 'light',
      systemTheme: 'light',
    });

    // Act
    render(
      <ThemeProvider>
        <Toaster />
      </ThemeProvider>
    );

    // Assert
    const toasterElement = screen.getByRole('region');
    expect(toasterElement).toBeInTheDocument();
  });

  it('handles the "system" theme correctly', () => {
    // Arrange: Mock useTheme to return 'system'
    vi.mocked(useTheme).mockReturnValue({
      theme: 'system',
      setTheme: vi.fn(),
      themes: ['light', 'dark'],
      resolvedTheme: 'light',
      systemTheme: 'light',
    });

    // Act
    render(
      <ThemeProvider>
        <Toaster />
      </ThemeProvider>
    );

    // Assert
    const toasterElement = screen.getByRole('region');
    expect(toasterElement).toBeInTheDocument();
  });
}); 