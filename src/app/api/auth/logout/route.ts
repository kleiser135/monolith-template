/**
 * Logout API Endpoint
 * POST /api/auth/logout - Logout user and revoke refresh tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { revokeRefreshToken, revokeAllUserTokens, revokeDeviceTokens } from '@/lib/auth/refresh-tokens';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { checkRateLimit, RATE_LIMITS, getRateLimitIdentifier } from '@/lib/redis/rate-limiter';
import { logLogout, logRateLimitExceeded } from '@/lib/redis/security-monitor';

// Request validation schema
const logoutSchema = z.object({
  refreshToken: z.string().optional(),
  deviceId: z.string().optional(),
  logoutAll: z.boolean().optional().default(false), // Logout from all devices
});

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

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
      RATE_LIMITS.LOGOUT,
      'logout'
    );

    if (!rateLimitResult.success) {
      // Log rate limit exceeded event
      await logRateLimitExceeded(clientIP, userAgent, source, {
        endpoint: 'logout',
        identifier: rateLimitIdentifier,
        remaining: rateLimitResult.remaining,
        retryAfter: rateLimitResult.retryAfter,
      });

      const headers = new Headers({
        'X-RateLimit-Limit': RATE_LIMITS.LOGOUT.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
      });

      if (rateLimitResult.retryAfter) {
        headers.set('Retry-After', Math.ceil(rateLimitResult.retryAfter / 1000).toString());
      }

      return NextResponse.json(
        { 
          message: rateLimitResult.blocked 
            ? 'Too many logout attempts. You have been temporarily blocked.'
            : 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429, headers }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = logoutSchema.safeParse(body);

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

    const { refreshToken, deviceId, logoutAll } = validation.data;

    // Get user ID from access token (if available)
    let userId: string | null = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        userId = decoded.userId;
      } catch (error) {
        // Access token might be expired, continue with refresh token approach
      }
    }

    // If no access token, try to get cookies
    if (!userId) {
      const tokenCookie = request.cookies.get('token');
      if (tokenCookie?.value) {
        try {
          const decoded = jwt.verify(tokenCookie.value, process.env.JWT_SECRET!) as JwtPayload;
          userId = decoded.userId;
        } catch (error) {
          // Cookie token might be expired
        }
      }
    }

    let revokedCount = 0;

    if (logoutAll && userId) {
      // Revoke all refresh tokens for the user
      revokedCount = await revokeAllUserTokens(userId);
      console.log(`[Logout] Revoked all tokens for user ${userId}`);
    } else if (deviceId && userId) {
      // Revoke tokens for specific device
      revokedCount = await revokeDeviceTokens(userId, deviceId);
      console.log(`[Logout] Revoked device tokens for user ${userId}, device ${deviceId}`);
    } else if (refreshToken) {
      // Revoke specific refresh token
      const revoked = await revokeRefreshToken(refreshToken);
      revokedCount = revoked ? 1 : 0;
      console.log(`[Logout] Revoked specific refresh token`);
    }

    // Phase 4: Log logout event
    if (userId) {
      await logLogout(userId, clientIP, userAgent, source);
    }

    // For web clients, clear the HTTP-only cookie
    const response = NextResponse.json({
      message: 'Logout successful',
      revokedTokens: revokedCount
    });

    // Clear the cookie if it exists
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
      expires: new Date(0), // Expire immediately
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
