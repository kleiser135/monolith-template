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
    expect(body.message).toBe('Password reset email sent');
    expect(prismaMock.passwordResetToken.create).toHaveBeenCalledTimes(1);
  });
}); 