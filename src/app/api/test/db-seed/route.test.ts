import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextResponse } from 'next/server';
import { POST } from './route';

// Mock dependencies with proper factory functions
vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    user: { upsert: vi.fn() },
  },
}));

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
}));

vi.mock('@/test/factories/user.factory', () => ({
  userFactory: {
    create: vi.fn(),
  },
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, options) => ({ 
      json: () => data, 
      status: options?.status || 200 
    })),
  },
}));

// Import the mocks after the vi.mock declarations
import { prisma } from '@/lib/database/prisma';
import { hash } from 'bcrypt';
import { userFactory } from '@/test/factories/user.factory';

const mockUpsert = vi.mocked(prisma.user.upsert);
const mockHash = vi.mocked(hash);
const mockUserFactory = vi.mocked(userFactory);

describe('DB Seed Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'test');
    
    // Setup default mock responses
    mockUserFactory.create.mockReturnValue({
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    });
    mockHash.mockResolvedValue('hashedPassword');
    mockUpsert.mockResolvedValue({});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should reject requests in production environment', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    await POST();

    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'Not allowed in production' },
      { status: 403 }
    );
  });

  it('should successfully seed database with test user', async () => {
    await POST();

    expect(mockUserFactory.create).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(mockHash).toHaveBeenCalledWith('password123', 10);

    expect(mockUpsert).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword',
        emailVerified: expect.any(Date),
      },
    });

    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'Test user created/seeded successfully' },
      { status: 200 }
    );
  });

  it('should handle user factory errors gracefully', async () => {
    mockUserFactory.create.mockImplementation(() => {
      throw new Error('Factory error');
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await POST();

    expect(consoleSpy).toHaveBeenCalledWith('Database seed error:', expect.any(Error));
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'Failed to seed database' },
      { status: 500 }
    );

    consoleSpy.mockRestore();
  });

  it('should handle password hashing errors gracefully', async () => {
    mockHash.mockRejectedValue(new Error('Hash error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await POST();

    expect(consoleSpy).toHaveBeenCalledWith('Database seed error:', expect.any(Error));
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'Failed to seed database' },
      { status: 500 }
    );

    consoleSpy.mockRestore();
  });

  it('should handle database upsert errors gracefully', async () => {
    mockUpsert.mockRejectedValue(new Error('Database error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await POST();

    expect(consoleSpy).toHaveBeenCalledWith('Database seed error:', expect.any(Error));
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'Failed to seed database' },
      { status: 500 }
    );

    consoleSpy.mockRestore();
  });

  it('should allow seeding in development environment', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    await POST();

    expect(mockUserFactory.create).toHaveBeenCalled();
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'Test user created/seeded successfully' },
      { status: 200 }
    );
  });

  it('should create user with pre-verified email', async () => {
    await POST();

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          emailVerified: expect.any(Date),
        }),
      })
    );
  });
});
