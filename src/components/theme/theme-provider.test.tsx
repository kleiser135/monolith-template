import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThemeProvider } from './theme-provider';

describe('ThemeProvider', () => {
  it('renders children correctly', () => {
    // Arrange
    const childText = 'Hello, World!';
    const ChildComponent = () => <div>{childText}</div>;

    // Act
    render(
      <ThemeProvider>
        <ChildComponent />
      </ThemeProvider>
    );

    // Assert
    const childElement = screen.getByText(childText);
    expect(childElement).toBeInTheDocument();
  });
}); 