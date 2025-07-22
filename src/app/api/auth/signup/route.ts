import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { signupSchema } from '@/lib/validators';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = signupSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
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