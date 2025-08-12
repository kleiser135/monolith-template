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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
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
      
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Clear any previous failed attempts on successful login
    recordSuccessfulLogin(userIdentifier);
    recordSuccessfulLogin(ipIdentifier);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });

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