import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, Mock } from 'vitest';
import { Header } from './Header';
import { cookies } from 'next/headers';

// Mock the HeaderUI component to simplify testing
vi.mock('./HeaderUI', () => ({
  HeaderUI: ({ isLoggedIn }: { isLoggedIn: boolean }) => (
    <div data-testid="header-ui-mock" data-is-logged-in={isLoggedIn} />
  ),
}));

// Mock the next/headers module
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

const mockCookies = cookies as Mock;

const createMockCookies = (token?: string) => {
  const cookieStore = new Map<string, { name: string; value: string }>();
  if (token) {
    cookieStore.set('token', { name: 'token', value: token });
  }
  return {
    get: (name: string) => cookieStore.get(name),
    has: (name: string) => cookieStore.has(name),
  };
};

describe('Header Component', () => {
  it('renders HeaderUI with isLoggedIn=true when a token exists', async () => {
    // Arrange: Mock cookies to return a token
    mockCookies.mockResolvedValue(createMockCookies('fake-token'));

    // Act
    const element = await Header();
    render(element);

    // Assert
    const headerUIMock = screen.getByTestId('header-ui-mock');
    expect(headerUIMock).toBeInTheDocument();
    expect(headerUIMock).toHaveAttribute('data-is-logged-in', 'true');
  });

  it('renders HeaderUI with isLoggedIn=false when no token exists', async () => {
    // Arrange: Mock cookies to return an empty map
    mockCookies.mockResolvedValue(createMockCookies());

    // Act
    const element = await Header();
    render(element);

    // Assert
    const headerUIMock = screen.getByTestId('header-ui-mock');
    expect(headerUIMock).toBeInTheDocument();
    expect(headerUIMock).toHaveAttribute('data-is-logged-in', 'false');
  });
}); 