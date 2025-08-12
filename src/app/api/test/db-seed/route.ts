import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { hash } from 'bcrypt';
import { userFactory } from '@/test/factories/user.factory';

export async function POST() {
  // This endpoint should only be available in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not allowed in production' }, { status: 403 });
  }

  try {
    const testUser = userFactory.create({
      email: 'test@example.com',
      password: 'password123',
    });

    const hashedPassword = await hash(testUser.password, 10);

    await prisma.user.upsert({
      where: { email: testUser.email },
      update: {},
      create: {
        email: testUser.email,
        name: testUser.name,
        password: hashedPassword,
        emailVerified: new Date(), // Pre-verify the user
      },
    });

    return NextResponse.json({ message: 'Test user created/seeded successfully' }, { status: 200 });
  } catch (error) {
    console.error('Database seed error:', error);
    return NextResponse.json({ message: 'Failed to seed database' }, { status: 500 });
  }
} 