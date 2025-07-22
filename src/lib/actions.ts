'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { loginSchema, signupSchema } from '@/lib/validators';
import { cookies } from 'next/headers';

type LoginState = {
  message?: string | null;
  errors?: {
    email?: string[];
    password?: string[];
  };
  success: boolean;
};

type SignupState = {
  message?: string | null;
  errors?: {
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
  success: boolean;
};

export async function login(prevState: LoginState, formData: FormData): Promise<LoginState> {
  const validation = loginSchema.safeParse(Object.fromEntries(formData));

  if (!validation.success) {
    return {
      errors: validation.error.flatten().fieldErrors,
      success: false,
    };
  }

  const { email, password } = validation.data;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      return {
        message: 'User not found.',
        success: false,
      };
    }

    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (!passwordsMatch) {
      return {
        message: 'Invalid credentials.',
        success: false,
      };
    }

    // Create JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return {
      success: true,
    };
  } catch (_error) {
    return {
      message: 'An unexpected error occurred.',
      success: false,
    };
  }
}

export async function signup(
  prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const validation = signupSchema.safeParse(Object.fromEntries(formData));

  if (!validation.success) {
    return {
      errors: validation.error.flatten().fieldErrors,
      success: false,
    };
  }

  const { email, password } = validation.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      return {
        message: 'User with this email already exists.',
        success: false,
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    return {
      success: true,
      message: 'Account created successfully! Please log in.',
    };
  } catch (_error) {
    return {
      message: 'An unexpected error occurred.',
      success: false,
    };
  }
} 