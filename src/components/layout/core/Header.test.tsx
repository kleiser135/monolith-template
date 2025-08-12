import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, Mock } from 'vitest';
import { Header } from './Header';
import { cookies } from 'next/headers';

// Mock the AppHeader component to simplify testing
vi.mock('../headers', () => ({
  AppHeader: ({ isLoggedIn }: { isLoggedIn: boolean }) => (
    <div data-testid="app-header-mock" data-is-logged-in={isLoggedIn} />
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
  it('renders AppHeader with isLoggedIn=true when a token exists', async () => {
    // Arrange: Mock cookies to return a token
    mockCookies.mockResolvedValue(createMockCookies('fake-token'));

    // Act
    const element = await Header();
    render(element);

    // Assert
    const appHeaderMock = screen.getByTestId('app-header-mock');
    expect(appHeaderMock).toBeInTheDocument();
    expect(appHeaderMock).toHaveAttribute('data-is-logged-in', 'true');
  });

  it('renders AppHeader with isLoggedIn=false when no token exists', async () => {
    // Arrange: Mock cookies to return an empty map
    mockCookies.mockResolvedValue(createMockCookies());

    // Act
    const element = await Header();
    render(element);

    // Assert
    const appHeaderMock = screen.getByTestId('app-header-mock');
    expect(appHeaderMock).toBeInTheDocument();
    expect(appHeaderMock).toHaveAttribute('data-is-logged-in', 'false');
  });
}); 