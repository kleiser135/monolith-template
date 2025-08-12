import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';

const emailVerificationSchema = z.object({
  token: z.string().nonempty(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = emailVerificationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid token format.' }, { status: 400 });
    }

    const { token } = parsed.data;

    const verificationToken = await prisma.emailVerificationToken.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verificationToken) {
      return NextResponse.json({ message: 'Invalid or expired verification token.' }, { status: 400 });
    }

    // Use a transaction to update user and delete token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: new Date() },
      }),
      prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      }),
    ]);

    return NextResponse.json({ message: 'Email verified successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 