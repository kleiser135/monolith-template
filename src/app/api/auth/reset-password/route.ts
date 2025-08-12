import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';
import crypto from 'crypto';
import { hash } from 'bcrypt';

const resetPasswordSchema = z.object({
  token: z.string().nonempty(),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid input', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { token, password } = parsed.data;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const passwordResetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!passwordResetToken) {
      return NextResponse.json({ message: 'Invalid or expired token.' }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);

    // Use a transaction to update password and delete token together
    await prisma.$transaction([
      prisma.user.update({
        where: { id: passwordResetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.delete({
        where: { id: passwordResetToken.id },
      }),
    ]);

    return NextResponse.json({ message: 'Password reset successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 