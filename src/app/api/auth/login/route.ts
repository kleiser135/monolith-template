import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { loginSchema } from '@/lib/validation/validators';
import { z } from 'zod';
import { 
  isLockedOut, 
  recordFailedAttempt, 
  recordSuccessfulLogin, 
  getProgressiveDelay 
} from '@/lib/auth/account-lockout';
import { createRefreshToken } from '@/lib/auth/refresh-tokens';
import { checkRateLimit, RATE_LIMITS, getRateLimitIdentifier } from '@/lib/redis/rate-limiter';
import { logLoginAttempt, logRateLimitExceeded } from '@/lib/redis/security-monitor';

export async function POST(req: NextRequest) {
  let userAgent = 'unknown';
  let clientIP = 'unknown';
  let source: 'WEB' | 'MOBILE' | 'API' = 'WEB';

  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    // Extract request metadata for security monitoring
    clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';
    userAgent = req.headers.get('User-Agent') || 'unknown';
    const clientType = req.headers.get('X-Client-Type');
    const isMobile = clientType === 'mobile' || /Mobile|Android|iPhone|iPad|React Native/i.test(userAgent);
    source = isMobile ? 'MOBILE' : 'WEB';

    // Phase 4: Advanced rate limiting with Redis
    const rateLimitIdentifier = getRateLimitIdentifier(req);
    const rateLimitResult = await checkRateLimit(
      rateLimitIdentifier,
      RATE_LIMITS.LOGIN,
      'login'
    );

    if (!rateLimitResult.success) {
      // Log rate limit exceeded event
      await logRateLimitExceeded(clientIP, userAgent, source, {
        endpoint: 'login',
        identifier: rateLimitIdentifier,
        remaining: rateLimitResult.remaining,
        retryAfter: rateLimitResult.retryAfter,
      });

      const headers = new Headers({
        'X-RateLimit-Limit': RATE_LIMITS.LOGIN.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
      });

      if (rateLimitResult.retryAfter) {
        headers.set('Retry-After', Math.ceil(rateLimitResult.retryAfter / 1000).toString());
      }

      return NextResponse.json(
        { 
          message: rateLimitResult.blocked 
            ? 'Too many login attempts. You have been temporarily blocked.'
            : 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429, headers }
      );
    }

    const userIdentifier = email.toLowerCase();
    const ipIdentifier = `ip:${clientIP}`;

    // Check if user or IP is locked out
    const userLockout = isLockedOut(userIdentifier);
    const ipLockout = isLockedOut(ipIdentifier);

    if (userLockout.locked) {
      return NextResponse.json({
        message: 'Account temporarily locked due to too many failed attempts',
        remainingTime: userLockout.remainingTime
      }, { status: 429 });
    }

    if (ipLockout.locked) {
      return NextResponse.json({
        message: 'Too many failed attempts from this IP address',
        remainingTime: ipLockout.remainingTime
      }, { status: 429 });
    }

    // Add progressive delay for repeated failures
    const attempts = userLockout.attempts || 0;
    if (attempts > 0) {
      const delay = getProgressiveDelay(attempts);
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Prevent user enumeration by using constant-time comparison
    let passwordMatch = false;
    if (user) {
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      // Perform a dummy bcrypt operation to maintain constant time
      await bcrypt.compare(password, '$2b$10$dummy.hash.to.prevent.timing.attacks.dummy.hash');
    }

    if (!user || !passwordMatch) {
      // Record failed attempts for both user and IP
      recordFailedAttempt(userIdentifier);
      recordFailedAttempt(ipIdentifier);
      
      // Phase 4: Log security event
      await logLoginAttempt(false, user?.id, clientIP, userAgent, source, {
        email: email.toLowerCase(),
        reason: !user ? 'user_not_found' : 'invalid_password',
        userAgent,
        attempts: (userLockout.attempts || 0) + 1,
      });
      
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Clear any previous failed attempts on successful login
    recordSuccessfulLogin(userIdentifier);
    recordSuccessfulLogin(ipIdentifier);

    // Phase 4: Log successful login
    await logLoginAttempt(true, user.id, clientIP, userAgent, source, {
      email: user.email,
      deviceId: req.headers.get('X-Device-ID'),
      loginMethod: 'password',
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });

    if (isMobile) {
      // For mobile clients, create refresh token and return both tokens
      const deviceId = req.headers.get('X-Device-ID') || undefined;
      
      const refreshTokenData = await createRefreshToken({
        userId: user.id,
        deviceId,
        ipAddress: clientIP,
        userAgent,
      });

      return NextResponse.json({
        message: 'Login successful',
        token,
        refreshToken: refreshTokenData.token,
        refreshTokenExpiresAt: refreshTokenData.expiresAt,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    }

    // For web clients, set HttpOnly cookie
    const response = NextResponse.json({ message: 'Login successful' });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 