/**
 * Refresh Token API Endpoint
 * POST /api/auth/refresh - Refresh access token using refresh token
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateRefreshToken } from '@/lib/auth/refresh-tokens';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';
import { checkRateLimit, RATE_LIMITS, getRateLimitIdentifier } from '@/lib/redis/rate-limiter';
import { logRefreshToken, logRateLimitExceeded } from '@/lib/redis/security-monitor';

// Request validation schema
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
  deviceId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  let clientIP = 'unknown';
  let userAgent = 'unknown';
  let source: 'WEB' | 'MOBILE' | 'API' = 'WEB';

  try {
    // Extract request metadata for security monitoring
    clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
    userAgent = request.headers.get('User-Agent') || 'unknown';
    const clientType = request.headers.get('X-Client-Type');
    const isMobile = clientType === 'mobile' || /Mobile|Android|iPhone|iPad|React Native/i.test(userAgent);
    source = isMobile ? 'MOBILE' : 'WEB';

    // Phase 4: Advanced rate limiting
    const rateLimitIdentifier = getRateLimitIdentifier(request);
    const rateLimitResult = await checkRateLimit(
      rateLimitIdentifier,
      RATE_LIMITS.REFRESH,
      'refresh'
    );

    if (!rateLimitResult.success) {
      // Log rate limit exceeded event
      await logRateLimitExceeded(clientIP, userAgent, source, {
        endpoint: 'refresh',
        identifier: rateLimitIdentifier,
        remaining: rateLimitResult.remaining,
        retryAfter: rateLimitResult.retryAfter,
      });

      const headers = new Headers({
        'X-RateLimit-Limit': RATE_LIMITS.REFRESH.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
      });

      if (rateLimitResult.retryAfter) {
        headers.set('Retry-After', Math.ceil(rateLimitResult.retryAfter / 1000).toString());
      }

      return NextResponse.json(
        { 
          message: rateLimitResult.blocked 
            ? 'Too many refresh attempts. You have been temporarily blocked.'
            : 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429, headers }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = refreshTokenSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          message: 'Invalid request data',
          errors: validation.error.issues.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    const { refreshToken, deviceId } = validation.data;

    // Validate refresh token
    const tokenData = await validateRefreshToken(refreshToken);
    if (!tokenData) {
      return NextResponse.json(
        { message: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Verify device ID matches if provided
    if (deviceId && tokenData.deviceId && tokenData.deviceId !== deviceId) {
      return NextResponse.json(
        { message: 'Device mismatch' },
        { status: 401 }
      );
    }

    // Get fresh user data
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role 
      }, 
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Phase 4: Log successful refresh token usage
    await logRefreshToken(user.id, clientIP, userAgent, source);

    return NextResponse.json({
      message: 'Token refreshed successfully',
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        emailVerified: !!user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
