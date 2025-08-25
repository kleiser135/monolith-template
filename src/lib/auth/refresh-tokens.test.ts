/**
 * Refresh Token System Tests
 * Tests for refresh token creation, validation, and management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  createRefreshToken, 
  validateRefreshToken, 
  revokeRefreshToken,
  revokeAllUserTokens,
  revokeDeviceTokens,
  cleanupUserTokens,
  cleanupExpiredTokens,
  getUserTokenStats,
  REFRESH_TOKEN_CONFIG
} from '@/lib/auth/refresh-tokens';
import { prismaMock } from '@/test/setup';

// Mock crypto module
vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    randomBytes: vi.fn(() => Buffer.from('test-token-'.repeat(8), 'utf8')),
    createHash: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn(() => 'hashed-token-123')
    }))
  };
});

describe('Refresh Token System', () => {
  const mockUserId = 'test-user-id';
  const mockDeviceId = 'test-device-id';
  const mockIpAddress = '192.168.1.1';
  const mockUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createRefreshToken', () => {
    it('should create a new refresh token successfully', async () => {
      const mockCreatedToken = {
        id: 'token-id',
        token: 'hashed-token-123',
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        deviceId: mockDeviceId,
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        isRevoked: false,
        createdAt: new Date(),
        lastUsed: null,
      };

      prismaMock.refreshToken.create.mockResolvedValue(mockCreatedToken);
      prismaMock.refreshToken.findMany.mockResolvedValue([]);

      const result = await createRefreshToken({
        userId: mockUserId,
        deviceId: mockDeviceId,
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
      });

      expect(result.token).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.deviceId).toBe(mockDeviceId);
      expect(result.ipAddress).toBe(mockIpAddress);
      expect(result.userAgent).toBe(mockUserAgent);

      expect(prismaMock.refreshToken.create).toHaveBeenCalledWith({
        data: {
          token: expect.any(String),
          userId: mockUserId,
          expiresAt: expect.any(Date),
          deviceId: mockDeviceId,
          ipAddress: mockIpAddress,
          userAgent: mockUserAgent,
        },
      });
    });

    it('should clean up old tokens when user has too many', async () => {
      const oldTokens = Array.from({ length: 6 }, (_, i) => ({
        id: `token-${i}`,
        token: `hash-${i}`,
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - i * 1000),
        isRevoked: false,
        deviceId: null,
        ipAddress: null,
        userAgent: null,
        lastUsed: null,
      }));

      prismaMock.refreshToken.findMany.mockResolvedValue(oldTokens);
      prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 2 });
      prismaMock.refreshToken.create.mockResolvedValue({
        id: 'new-token-id',
        token: 'hashed-token-123',
        userId: mockUserId,
        expiresAt: new Date(),
        deviceId: null,
        ipAddress: null,
        userAgent: null,
        isRevoked: false,
        createdAt: new Date(),
        lastUsed: null,
      });

      await createRefreshToken({ userId: mockUserId });

      expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: expect.arrayContaining(['token-4', 'token-5']),
          },
        },
        data: {
          isRevoked: true,
        },
      });
    });
  });

  describe('validateRefreshToken', () => {
    it('should validate a valid refresh token', async () => {
      const mockToken = {
        id: 'token-id',
        token: 'hashed-token-123',
        userId: mockUserId,
        deviceId: mockDeviceId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        isRevoked: false,
        user: {
          id: mockUserId,
          email: 'test@example.com',
          role: 'user',
        },
        createdAt: new Date(),
        lastUsed: null,
        ipAddress: null,
        userAgent: null,
      };

      prismaMock.refreshToken.findFirst.mockResolvedValue(mockToken);
      prismaMock.refreshToken.update.mockResolvedValue({
        ...mockToken,
        lastUsed: new Date(),
      });

      const result = await validateRefreshToken('raw-token');

      expect(result).toEqual({
        userId: mockUserId,
        deviceId: mockDeviceId,
      });

      expect(prismaMock.refreshToken.findFirst).toHaveBeenCalledWith({
        where: {
          token: expect.any(String),
          isRevoked: false,
          expiresAt: {
            gt: expect.any(Date),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });

      expect(prismaMock.refreshToken.update).toHaveBeenCalledWith({
        where: {
          id: 'token-id',
        },
        data: {
          lastUsed: expect.any(Date),
        },
      });
    });

    it('should return null for invalid token', async () => {
      prismaMock.refreshToken.findFirst.mockResolvedValue(null);

      const result = await validateRefreshToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for empty token', async () => {
      const result = await validateRefreshToken('');

      expect(result).toBeNull();
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke a specific refresh token', async () => {
      prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const result = await revokeRefreshToken('raw-token');

      expect(result).toBe(true);
      expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          token: expect.any(String),
          isRevoked: false,
        },
        data: {
          isRevoked: true,
        },
      });
    });

    it('should return false if token not found', async () => {
      prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 0 });

      const result = await revokeRefreshToken('invalid-token');

      expect(result).toBe(false);
    });

    it('should return false for empty token', async () => {
      const result = await revokeRefreshToken('');

      expect(result).toBe(false);
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all tokens for a user', async () => {
      prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 3 });

      const result = await revokeAllUserTokens(mockUserId);

      expect(result).toBe(3);
      expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
        },
      });
    });
  });

  describe('revokeDeviceTokens', () => {
    it('should revoke all tokens for a specific device', async () => {
      prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      const result = await revokeDeviceTokens(mockUserId, mockDeviceId);

      expect(result).toBe(2);
      expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          deviceId: mockDeviceId,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
        },
      });
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired and old revoked tokens', async () => {
      prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 5 });

      const result = await cleanupExpiredTokens();

      expect(result).toBe(5);
      expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              expiresAt: {
                lt: expect.any(Date),
              },
            },
            {
              isRevoked: true,
              createdAt: {
                lt: expect.any(Date),
              },
            },
          ],
        },
      });
    });
  });

  describe('getUserTokenStats', () => {
    it('should return token statistics for a user', async () => {
      prismaMock.refreshToken.groupBy.mockResolvedValue([
        { isRevoked: false, _count: { _all: 3 } },
        { isRevoked: true, _count: { _all: 2 } },
      ]);

      const result = await getUserTokenStats(mockUserId);

      expect(result).toEqual({
        total: 5,
        active: 3,
        revoked: 2,
      });
    });

    it('should handle empty result', async () => {
      prismaMock.refreshToken.groupBy.mockResolvedValue([]);

      const result = await getUserTokenStats(mockUserId);

      expect(result).toEqual({
        total: 0,
        active: 0,
        revoked: 0,
      });
    });
  });

  describe('Configuration', () => {
    it('should have correct default configuration', () => {
      expect(REFRESH_TOKEN_CONFIG.EXPIRY_DAYS).toBe(30);
      expect(REFRESH_TOKEN_CONFIG.MAX_TOKENS_PER_USER).toBe(5);
      expect(REFRESH_TOKEN_CONFIG.TOKEN_LENGTH).toBe(64);
    });
  });
});
