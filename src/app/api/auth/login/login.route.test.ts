import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { prismaMock } from '@/test/setup';
import bcrypt from 'bcrypt';
import * as accountLockout from '@/lib/auth/account-lockout';

// Mock bcrypt
vi.mock('bcrypt', () => {
  const compare = vi.fn();
  const hash = vi.fn();
  return {
    default: { compare, hash },
    compare,
    hash,
  };
});

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

  it('should return a 401 Unauthorized if the user does not exist', async () => {
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
    expect(response.status).toBe(401);
  });

  it('should return a 401 Unauthorized if the password is incorrect', async () => {
    // Arrange: Mock findUnique to return a user with a hashed password
    const hashedPassword = 'hashed-correct-password';
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

    // Mock bcrypt.compare to return false (password doesn't match)
    vi.mocked(bcrypt.compare).mockResolvedValue(false);

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
    vi.mocked(bcrypt.compare).mockResolvedValue(true);

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

  describe('Account Lockout Protection', () => {
    beforeEach(() => {
      // Reset all mocks before each test
      vi.clearAllMocks();
    });

    it('should return 429 if user account is locked out', async () => {
      // Mock isLockedOut to return locked state for user
      const mockIsLockedOut = vi.spyOn(accountLockout, 'isLockedOut');
      mockIsLockedOut
        .mockReturnValueOnce({ locked: true, remainingTime: 300000, attempts: 5 }) // User locked
        .mockReturnValueOnce({ locked: false, remainingTime: 0, attempts: 0 }); // IP not locked

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(429);
      expect(body.message).toBe('Account temporarily locked due to too many failed attempts');
      expect(body.remainingTime).toBe(300000);
    });

    it('should return 429 if IP address is locked out', async () => {
      // Mock isLockedOut to return locked state for IP
      const mockIsLockedOut = vi.spyOn(accountLockout, 'isLockedOut');
      mockIsLockedOut
        .mockReturnValueOnce({ locked: false, remainingTime: 0, attempts: 0 }) // User not locked
        .mockReturnValueOnce({ locked: true, remainingTime: 120000, attempts: 3 }); // IP locked

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(429);
      expect(body.message).toBe('Too many failed attempts from this IP address');
      expect(body.remainingTime).toBe(120000);
    });

    it('should call recordFailedAttempt on login failure', async () => {
      // Mock lockout checks to allow login attempt
      const mockIsLockedOut = vi.spyOn(accountLockout, 'isLockedOut');
      mockIsLockedOut.mockReturnValue({ locked: false, remainingTime: 0, attempts: 0 });

      // Mock recordFailedAttempt
      const mockRecordFailedAttempt = vi.spyOn(accountLockout, 'recordFailedAttempt');
      mockRecordFailedAttempt.mockReturnValue({ shouldLock: false, attempts: 1 });

      // Mock user not found
      prismaMock.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      expect(mockRecordFailedAttempt).toHaveBeenCalledTimes(2); // Once for user, once for IP
      expect(mockRecordFailedAttempt).toHaveBeenCalledWith('test@example.com');
      expect(mockRecordFailedAttempt).toHaveBeenCalledWith('ip:unknown');
    });

    it('should call recordSuccessfulLogin on successful login', async () => {
      // Mock lockout checks to allow login attempt
      const mockIsLockedOut = vi.spyOn(accountLockout, 'isLockedOut');
      mockIsLockedOut.mockReturnValue({ locked: false, remainingTime: 0, attempts: 1 });

      // Mock getProgressiveDelay to return no delay
      const mockGetProgressiveDelay = vi.spyOn(accountLockout, 'getProgressiveDelay');
      mockGetProgressiveDelay.mockReturnValue(0);

      // Mock recordSuccessfulLogin
      const mockRecordSuccessfulLogin = vi.spyOn(accountLockout, 'recordSuccessfulLogin');
      mockRecordSuccessfulLogin.mockImplementation(() => {});

      // Mock successful user authentication
      const user = {
        id: 'some-user-id',
        email: 'test@example.com',
        password: 'hashed-password',
        name: null,
        emailVerified: null,
        avatar: null,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.user.findUnique.mockResolvedValue(user);
      vi.mocked(bcrypt.compare).mockResolvedValue(true);

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'correct-password',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockRecordSuccessfulLogin).toHaveBeenCalledTimes(2); // Once for user, once for IP
      expect(mockRecordSuccessfulLogin).toHaveBeenCalledWith('test@example.com');
      expect(mockRecordSuccessfulLogin).toHaveBeenCalledWith('ip:unknown');
    });

    afterEach(() => {
      // Restore all mocks after each test
      vi.restoreAllMocks();
    });
  });
});