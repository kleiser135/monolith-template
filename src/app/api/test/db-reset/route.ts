import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  // This endpoint should only be available in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not allowed in production' }, { status: 403 });
  }

  try {
    // Use a transaction to ensure all deletes happen or none do
    await prisma.$transaction([
      prisma.user.deleteMany({}),
      prisma.passwordResetToken.deleteMany({}),
      prisma.emailVerificationToken.deleteMany({}),
    ]);
    return NextResponse.json({ message: 'Database reset successfully' }, { status: 200 });
  } catch (error) {
    console.error('Database reset error:', error);
    return NextResponse.json({ message: 'Failed to reset database' }, { status: 500 });
  }
} 