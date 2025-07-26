import { describe, it, expect } from 'vitest';
import { POST } from './route'; 
import { NextRequest } from 'next/server';
import { prismaMock } from '@/test/setup';
import { hash } from 'bcrypt';

describe('POST /api/auth/forgot-password', () => {
  it('should return 200 even if user is not found to prevent email enumeration', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nouser@example.com' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('If a user with that email exists, a password reset link has been sent.');
  });

  it('should return 400 if the email is invalid', async () => {
    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Invalid input');
    expect(body.errors.email).toContain('Invalid email address');
  });

  it('should return 200 and create a password reset token if user is found', async () => {
    const user = {
      id: '1',
      email: 'test@example.com',
      password: await hash('password123', 10),
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: new Date(),
      name: 'Test User'
    };
    prismaMock.user.findUnique.mockResolvedValue(user);
    prismaMock.passwordResetToken.create.mockResolvedValue({
        id: 'token123',
        token: 'hashed-reset-token',
        userId: user.id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    });
    
    // Mocking the email sending logic would go here in a real scenario

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('If a user with that email exists, a password reset link has been sent.');
    expect(prismaMock.passwordResetToken.create).toHaveBeenCalledTimes(1);
  });

  it('should not create a new token if a valid one already exists', async () => {
    const user = {
      id: '1',
      email: 'test@example.com',
      password: await hash('password123', 10),
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: new Date(),
      name: 'Test User'
    };
    const existingToken = {
        id: 'token123',
        token: 'hashed-reset-token',
        userId: user.id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    };

    prismaMock.user.findUnique.mockResolvedValue(user);
    prismaMock.passwordResetToken.findFirst.mockResolvedValue(existingToken);

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('If a user with that email exists, a password reset link has been sent.');
    expect(prismaMock.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it('should return 500 if there is a server error', async () => {
    prismaMock.user.findUnique.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe('Internal Server Error');
  });
}); 