import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { prismaMock } from '@/test/setup';
import bcrypt from 'bcrypt';

describe('API - Login Endpoint', () => {
  it('should return a 400 Bad Request if the request body is invalid', async () => {
    // Create a mock request with an empty body.
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({}), // Invalid body
    });

    // Call the handler.
    const response = await POST(request);

    // Expect a 400 status code.
    // This will fail initially because our placeholder returns 200.
    expect(response.status).toBe(400);
  });

  it('should return a 404 Not Found if the user does not exist', async () => {
    // Arrange: Mock findUnique to return null (user not found)
    prismaMock.user.findUnique.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    // Act
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(404);
  });

  it('should return a 401 Unauthorized if the password is incorrect', async () => {
    // Arrange: Mock findUnique to return a user with a hashed password
    const hashedPassword = await bcrypt.hash('correct-password', 10);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'some-user-id',
      email: 'test@example.com',
      password: hashedPassword,
      name: null,
      emailVerified: null,
      avatar: null,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrong-password', // Intentionally wrong password
      }),
    });

    // Act
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(401);
  });

  it('should return a 200 OK with a JWT cookie on successful login', async () => {
    // Arrange
    const user = {
      id: 'some-user-id',
      email: 'test@example.com',
      password: 'hashed-password', // The actual hash doesn't matter here
      name: null,
      emailVerified: null,
      avatar: null,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaMock.user.findUnique.mockResolvedValue(user);
    
    // Mock bcrypt.compare to return true for this test
    vi.mocked(bcrypt).compare.mockResolvedValue(true as never);

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'correct-password',
      }),
    });

    // Act
    const response = await POST(request);

    // Debug: log the response body if status is not 200
    if (response.status !== 200) {
      const body = await response.clone().json();
      console.log('Response status:', response.status);
      console.log('Response body:', body);
    }

    // Assert
    expect(response.status).toBe(200);
    const cookie = response.headers.get('Set-Cookie');
    expect(cookie).toBeDefined();
    expect(cookie).toContain('token=');
    expect(cookie).toContain('HttpOnly');
  });

  it('should return 400 if validation fails', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'not-an-email',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 500 if there is a server error', async () => {
    prismaMock.user.findUnique.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});