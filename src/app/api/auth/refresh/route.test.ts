/**
 * Refresh Token API Endpoint Tests
 * Tests for the /api/auth/refresh endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/refresh/route';
import { prismaMock } from '@/test/setup';

// Mock the refresh-tokens module
vi.mock('@/lib/auth/refresh-tokens', () => ({
  validateRefreshToken: vi.fn(),
}));

import { validateRefreshToken } from '@/lib/auth/refresh-tokens';

describe('/api/auth/refresh', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    avatar: null,
    password: 'hashed-password', // Added required field
    emailVerified: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // Mock validateRefreshToken to return valid user data
      vi.mocked(validateRefreshToken).mockResolvedValue({
        userId: 'user-123',
        deviceId: 'device-123',
      });

      // Mock prisma user lookup
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: 'valid-refresh-token',
          deviceId: 'device-123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message', 'Token refreshed successfully');
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('user');
      expect(data.user.id).toBe('user-123');
      expect(data.user.email).toBe('test@example.com');

      expect(validateRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: expect.any(Object),
      });
    });

    it('should return 401 for invalid refresh token', async () => {
      vi.mocked(validateRefreshToken).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: 'invalid-refresh-token',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('Invalid or expired refresh token');
    });

    it('should return 401 for device mismatch', async () => {
      vi.mocked(validateRefreshToken).mockResolvedValue({
        userId: 'user-123',
        deviceId: 'device-456', // Different device ID
      });

      const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: 'valid-refresh-token',
          deviceId: 'device-123', // Different from what's returned
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('Device mismatch');
    });

    it('should return 404 if user not found', async () => {
      vi.mocked(validateRefreshToken).mockResolvedValue({
        userId: 'non-existent-user',
        deviceId: 'device-123',
      });

      prismaMock.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: 'valid-refresh-token',
          deviceId: 'device-123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('User not found');
    });

    it('should return 400 for invalid request data', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing refreshToken
          deviceId: 'device-123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Invalid request data');
      expect(data.errors).toBeDefined();
    });

    it('should work without device ID', async () => {
      vi.mocked(validateRefreshToken).mockResolvedValue({
        userId: 'user-123',
      });

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: 'valid-refresh-token',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Token refreshed successfully');
    });

    it('should handle server errors gracefully', async () => {
      vi.mocked(validateRefreshToken).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: 'valid-refresh-token',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
    });
  });
});
