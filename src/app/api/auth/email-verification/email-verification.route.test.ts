import { describe, it, expect } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { prismaMock } from '@/test/setup';

describe('POST /api/auth/email-verification', () => {
  it('should return 400 if token is invalid or not found', async () => {
    prismaMock.emailVerificationToken.findFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/auth/email-verification', {
      method: 'POST',
      body: JSON.stringify({ token: 'invalid-token' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Invalid or expired verification token.');
  });

  it('should return 400 if the token is missing', async () => {
    const request = new NextRequest('http://localhost/api/auth/email-verification', {
      method: 'POST',
      body: JSON.stringify({}), // Missing token
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Invalid token format.');
  });

  it('should return 200 and mark user as verified on successful verification', async () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      password: 'hashedpassword',
      name: 'Test User',
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const verificationToken = {
      id: 'token-1',
      token: 'valid-token',
      userId: user.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000), // Expires in 1 hour
    };

    prismaMock.emailVerificationToken.findFirst.mockResolvedValue(verificationToken);
    prismaMock.user.update.mockResolvedValue({ ...user, emailVerified: new Date() });
    prismaMock.emailVerificationToken.delete.mockResolvedValue(verificationToken);

    const request = new NextRequest('http://localhost/api/auth/email-verification', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('Email verified successfully.');
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: user.id },
        data: { emailVerified: expect.any(Date) },
      })
    );
    expect(prismaMock.emailVerificationToken.delete).toHaveBeenCalledTimes(1);
  });

  it('should return 500 if there is a server error', async () => {
    prismaMock.emailVerificationToken.findFirst.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/auth/email-verification', {
      method: 'POST',
      body: JSON.stringify({ token: 'any-token' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe('Internal Server Error');
  });
}); 