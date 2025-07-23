'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  loginSchema,
  signupSchema,
  changePasswordSchema,
} from "@/lib/validators";
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';

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

type ChangePasswordState = {
  message?: string | null;
  errors?: {
    currentPassword?: string[];
    newPassword?: string[];
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

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // Create an email verification token
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // In a real app, you'd send an email here.
    console.log(`Email verification link for ${email}: /email-verification?token=${token}`);

    return {
      success: true,
      message: 'Account created! Please check your email to verify your account.',
    };
  } catch (_error) {
    return {
      message: 'An unexpected error occurred.',
      success: false,
    };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  revalidatePath('/');
}

export async function deleteAccount(): Promise<{ success: boolean; message: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');

  if (!token) {
    return { success: false, message: 'Authentication required.' };
  }

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as { userId: string };

    // Prisma's onDelete: Cascade should handle related tokens, but we do this explicitly
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: decoded.userId } }),
      prisma.emailVerificationToken.deleteMany({ where: { userId: decoded.userId } }),
      prisma.user.delete({ where: { id: decoded.userId } }),
    ]);

    // Log the user out
    cookieStore.delete('token');
    revalidatePath('/');
    
    return { success: true, message: 'Account deleted successfully.' };
  } catch (error) {
    return {
      message: 'An unexpected error occurred.',
      success: false,
    };
  }
}

export async function changePassword(
  prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');

  if (!token) {
    return { success: false, message: 'Authentication required.' };
  }

  const validation = changePasswordSchema.safeParse(Object.fromEntries(formData));

  if (!validation.success) {
    return {
      errors: validation.error.flatten().fieldErrors,
      success: false,
    };
  }

  const { currentPassword, newPassword } = validation.data;

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    const passwordsMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordsMatch) {
      return { success: false, message: 'Incorrect current password.' };
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    return { success: true, message: 'Password changed successfully.' };
  } catch (_error) {
    return {
      message: 'An unexpected error occurred.',
      success: false,
    };
  }
} 