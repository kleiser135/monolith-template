import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid input', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // To prevent user enumeration, always return a generic success message
    const successResponse = { message: 'If a user with that email exists, a password reset link has been sent.' };

    if (!user) {
      return NextResponse.json(successResponse, { status: 200 });
    }

    const existingToken = await prisma.passwordResetToken.findFirst({
        where: {
            userId: user.id,
            expiresAt: {
                gt: new Date(),
            }
        }
    });

    if(existingToken) {
        return NextResponse.json(successResponse, { status: 200 });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token expiration (e.g., 1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Store the hashed token in the database
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
      },
    });

    // In a real application, you would send an email here.
    // We will simulate this for now.
    console.log(`Password reset link for ${email}: /reset-password?token=${resetToken}`);

    // For test environments, return the token to facilitate E2E testing
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ ...successResponse, token: resetToken }, { status: 200 });
    }

    return NextResponse.json(successResponse, { status: 200 });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 