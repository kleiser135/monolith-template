import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextResponse } from 'next/server';
import { POST } from './route';

// Mock prisma with proper factory function
vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    user: { deleteMany: vi.fn() },
    passwordResetToken: { deleteMany: vi.fn() },
    emailVerificationToken: { deleteMany: vi.fn() },
  },
}));

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, options) => ({ 
      json: () => data, 
      status: options?.status || 200 
    })),
  },
}));

// Import the mock after the vi.mock declaration
import { prisma } from '@/lib/database/prisma';

const mockTransaction = vi.mocked(prisma.$transaction);
const _mockDeleteMany = vi.fn();

describe('DB Reset Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment to test by default
    vi.stubEnv('NODE_ENV', 'test');
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

  it('should successfully reset database in non-production', async () => {
    mockTransaction.mockResolvedValue(undefined);

    await POST();

    expect(mockTransaction).toHaveBeenCalledWith(expect.any(Array));
    expect(mockTransaction).toHaveBeenCalledTimes(1);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'Database reset successfully' },
      { status: 200 }
    );
  });

  it('should handle database errors gracefully', async () => {
    mockTransaction.mockRejectedValue(new Error('Database error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await POST();

    expect(consoleSpy).toHaveBeenCalledWith('Database reset error:', expect.any(Error));
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'Failed to reset database' },
      { status: 500 }
    );

    consoleSpy.mockRestore();
  });

  it('should allow reset in development environment', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    mockTransaction.mockResolvedValue(undefined);

    await POST();

    expect(mockTransaction).toHaveBeenCalled();
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'Database reset successfully' },
      { status: 200 }
    );
  });

  it('should allow reset in test environment', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    mockTransaction.mockResolvedValue(undefined);

    await POST();

    expect(mockTransaction).toHaveBeenCalled();
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'Database reset successfully' },
      { status: 200 }
    );
  });
});
