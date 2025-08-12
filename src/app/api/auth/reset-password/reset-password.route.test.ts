import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { prismaMock } from '@/test/setup';
import crypto from 'crypto';

// Mock bcrypt
vi.mock('bcrypt', () => ({
  hash: vi.fn(),
}));

describe('POST /api/auth/reset-password', () => {
  it('should return 400 if token is invalid or expired', async () => {
    prismaMock.passwordResetToken.findFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'invalid-token',
        password: 'newPassword123',
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Invalid or expired token.');
  });

  it('should return 400 if the password is too short', async () => {
    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-token',
        password: 'short',
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Invalid input');
    expect(body.errors.password).toContain('Password must be at least 8 characters.');
  });

  it('should return 200 and update the user password on successful reset', async () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      password: 'hashed-password123',
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: new Date(),
      name: 'Test User',
      avatar: null,
      role: 'user'
    };
    const resetToken = {
      id: 'token-1',
      token: crypto.createHash('sha256').update('valid-token').digest('hex'),
      userId: user.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000), // Expires in 1 hour
      user: user
    };

    prismaMock.passwordResetToken.findFirst.mockResolvedValue(resetToken);
    prismaMock.user.update.mockResolvedValue({ ...user, password: 'newHashedPassword' });
    prismaMock.passwordResetToken.delete.mockResolvedValue(resetToken);

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-token',
        password: 'newPassword123',
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('Password reset successfully.');
    expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.passwordResetToken.delete).toHaveBeenCalledTimes(1);
  });

  it('should return 500 if there is a server error', async () => {
    prismaMock.passwordResetToken.findFirst.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'any-token',
        password: 'newPassword123',
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe('Internal Server Error');
  });
}); 