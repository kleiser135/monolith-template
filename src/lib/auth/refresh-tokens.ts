/**
 * Refresh Token Management
 * Handles creation, validation, and cleanup of refresh tokens for mobile authentication
 */

import { prisma } from '@/lib/database/prisma';
import { randomBytes, createHash } from 'crypto';

export interface RefreshTokenData {
  token: string;
  expiresAt: Date;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RefreshTokenPayload {
  userId: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Configuration for refresh tokens
 */
export const REFRESH_TOKEN_CONFIG = {
  // Refresh tokens expire after 30 days
  EXPIRY_DAYS: 30,
  // Maximum number of refresh tokens per user
  MAX_TOKENS_PER_USER: 5,
  // Token length in bytes
  TOKEN_LENGTH: 64,
} as const;

/**
 * Generate a cryptographically secure refresh token
 */
function generateRefreshToken(): string {
  const buffer = randomBytes(REFRESH_TOKEN_CONFIG.TOKEN_LENGTH);
  return buffer.toString('hex');
}

/**
 * Hash a refresh token for storage
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Create a new refresh token for a user
 */
export async function createRefreshToken(payload: RefreshTokenPayload): Promise<RefreshTokenData> {
  const token = generateRefreshToken();
  const hashedToken = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_CONFIG.EXPIRY_DAYS);

  // Clean up old tokens if user has too many
  await cleanupUserTokens(payload.userId);

  // Create the new refresh token
  await prisma.refreshToken.create({
    data: {
      token: hashedToken,
      userId: payload.userId,
      expiresAt,
      deviceId: payload.deviceId,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
    },
  });

  return {
    token, // Return the unhashed token to the client
    expiresAt,
    deviceId: payload.deviceId,
    ipAddress: payload.ipAddress,
    userAgent: payload.userAgent,
  };
}

/**
 * Validate and consume a refresh token
 */
export async function validateRefreshToken(token: string): Promise<{ userId: string; deviceId?: string } | null> {
  if (!token) {
    return null;
  }

  const hashedToken = hashToken(token);

  // Find the token in the database
  const refreshToken = await prisma.refreshToken.findFirst({
    where: {
      token: hashedToken,
      isRevoked: false,
      expiresAt: {
        gt: new Date(), // Token must not be expired
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

  if (!refreshToken) {
    return null;
  }

  // Update last used timestamp
  await prisma.refreshToken.update({
    where: {
      id: refreshToken.id,
    },
    data: {
      lastUsed: new Date(),
    },
  });

  return {
    userId: refreshToken.userId,
    deviceId: refreshToken.deviceId || undefined,
  };
}

/**
 * Revoke a specific refresh token
 */
export async function revokeRefreshToken(token: string): Promise<boolean> {
  if (!token) {
    return false;
  }

  const hashedToken = hashToken(token);

  try {
    const result = await prisma.refreshToken.updateMany({
      where: {
        token: hashedToken,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });

    return result.count > 0;
  } catch (error) {
    console.error('Error revoking refresh token:', error);
    return false;
  }
}

/**
 * Revoke all refresh tokens for a user (useful for logout from all devices)
 */
export async function revokeAllUserTokens(userId: string): Promise<number> {
  try {
    const result = await prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });

    return result.count;
  } catch (error) {
    console.error('Error revoking all user tokens:', error);
    return 0;
  }
}

/**
 * Revoke all refresh tokens for a specific device
 */
export async function revokeDeviceTokens(userId: string, deviceId: string): Promise<number> {
  try {
    const result = await prisma.refreshToken.updateMany({
      where: {
        userId,
        deviceId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });

    return result.count;
  } catch (error) {
    console.error('Error revoking device tokens:', error);
    return 0;
  }
}

/**
 * Clean up old tokens for a user (keep only the most recent ones)
 */
export async function cleanupUserTokens(userId: string): Promise<void> {
  try {
    // Get all active tokens for the user, ordered by creation date (newest first)
    const tokens = await prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // If user has too many tokens, revoke the oldest ones
    if (tokens.length >= REFRESH_TOKEN_CONFIG.MAX_TOKENS_PER_USER) {
      const tokensToRevoke = tokens.slice(REFRESH_TOKEN_CONFIG.MAX_TOKENS_PER_USER - 1);
      const idsToRevoke = tokensToRevoke.map((t: { id: string }) => t.id);

      if (idsToRevoke.length > 0) {
        await prisma.refreshToken.updateMany({
          where: {
            id: {
              in: idsToRevoke,
            },
          },
          data: {
            isRevoked: true,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error cleaning up user tokens:', error);
  }
}

/**
 * Clean up expired tokens (run this periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          {
            expiresAt: {
              lt: new Date(),
            },
          },
          {
            isRevoked: true,
            createdAt: {
              lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days old
            },
          },
        ],
      },
    });

    return result.count;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    return 0;
  }
}

/**
 * Get refresh token statistics for a user
 */
export async function getUserTokenStats(userId: string) {
  try {
    const stats = await prisma.refreshToken.groupBy({
      by: ['isRevoked'],
      where: {
        userId,
      },
      _count: {
        _all: true,
      },
    });

    const result = {
      total: 0,
      active: 0,
      revoked: 0,
    };

    stats.forEach((stat: { isRevoked: boolean; _count: { _all: number } }) => {
      result.total += stat._count._all;
      if (stat.isRevoked) {
        result.revoked += stat._count._all;
      } else {
        result.active += stat._count._all;
      }
    });

    return result;
  } catch (error) {
    console.error('Error getting user token stats:', error);
    return { total: 0, active: 0, revoked: 0 };
  }
}
