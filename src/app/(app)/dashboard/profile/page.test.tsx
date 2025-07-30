import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import ProfilePage from './page';
import { prisma } from '@/lib/prisma';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { User } from '@prisma/client';
import { redirect } from 'next/navigation';

vi.mock('next/headers', async (importOriginal) => {
  const mod = await importOriginal<typeof import('next/headers')>();
  return {
    ...mod,
    cookies: vi.fn(),
  };
});

vi.mock('next/navigation', async (importOriginal) => {
  const mod = await importOriginal<typeof import('next/navigation')>();
  return {
    ...mod,
    redirect: vi.fn(),
    useRouter: () => ({
      push: vi.fn(),
      refresh: vi.fn(),
    }),
  };
});
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
  verify: vi.fn(),
}));

const mockCookies = cookies as Mock;
const mockPrismaUserFindUnique = prisma.user.findUnique as Mock;
const mockJwtVerify = jwt.verify as Mock;

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

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to login if user is not authenticated', async () => {
    mockCookies.mockResolvedValue(createMockCookies());
    mockPrismaUserFindUnique.mockResolvedValue(null);
    
    const result = await ProfilePage();
    
    expect(result).toBeNull();
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/login');
  });

  it('should redirect to login if token is invalid', async () => {
    mockCookies.mockResolvedValue(createMockCookies('invalid-token'));
    mockPrismaUserFindUnique.mockResolvedValue(null);
    mockJwtVerify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const result = await ProfilePage();
    expect(result).toBeNull();
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/login');
  });

  it('should render user information if authenticated', async () => {
    const mockUser: User = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockCookies.mockResolvedValue(createMockCookies('valid-token'));
    mockJwtVerify.mockReturnValue({ userId: '123' } as JwtPayload);
    mockPrismaUserFindUnique.mockResolvedValue(mockUser);

    render(await ProfilePage());

    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Change Password' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Danger Zone' })).toBeInTheDocument();
  });
}); 