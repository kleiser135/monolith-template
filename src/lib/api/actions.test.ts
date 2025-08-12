/// <reference types="@testing-library/jest-dom" />

import { vi, expect, describe, it, beforeEach, Mock } from 'vitest';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { login, signup, logout, deleteAccount, changePassword } from './actions';
import { prismaMock } from '@/test/setup';
import { revalidatePath } from 'next/cache';
import { EmailVerificationToken, User } from '@prisma/client';

// Mock dependencies
vi.mock('bcrypt');
vi.mock('jsonwebtoken');
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const mockCookiesGet = vi.fn();
const mockCookiesSet = vi.fn();
const mockCookiesDelete = vi.fn();
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: mockCookiesGet,
    set: mockCookiesSet,
    delete: mockCookiesDelete,
  })),
}));

const mockBcryptCompare = bcrypt.compare as Mock;
const mockJwtSign = jwt.sign as Mock;
const mockJwtVerify = jwt.verify as Mock;
const mockBcryptHash = bcrypt.hash as Mock;

describe('login action', () => {
  const mockFormData = new FormData();
  mockFormData.append('email', 'test@example.com');
  mockFormData.append('password', 'password123');

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return success on valid login', async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(true);
    mockJwtSign.mockReturnValue('test-token');

    const result = await login({ success: false }, mockFormData);

    expect(result.success).toBe(true);
    expect(result.errors).toBeUndefined();
    expect(result.message).toBeUndefined();
  });

  it('should return validation errors for invalid data', async () => {
    const invalidFormData = new FormData();
    invalidFormData.append('email', 'not-an-email');
    invalidFormData.append('password', '');

    const result = await login({ success: false }, invalidFormData);

    expect(result.success).toBe(false);
    expect(result.errors?.email).toBeDefined();
    expect(result.errors?.password).toBeDefined();
  });

  it("should return 'User not found' error", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await login({ success: false }, mockFormData);

    expect(result.success).toBe(false);
    expect(result.message).toBe('User not found.');
  });

  it("should return 'Invalid credentials' error for wrong password", async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(false);

    const result = await login({ success: false }, mockFormData);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid credentials.');
  });

  it('should handle unexpected errors', async () => {
    prismaMock.user.findUnique.mockRejectedValue(new Error('DB error'));

    const result = await login({ success: false }, mockFormData);

    expect(result.success).toBe(false);
    expect(result.message).toBe('An unexpected error occurred.');
  });
});

describe('signup action', () => {
  const mockFormData = new FormData();
  mockFormData.append('email', 'newuser@example.com');
  mockFormData.append('password', 'password123');
  mockFormData.append('confirmPassword', 'password123');
  mockFormData.append('name', 'New User');

  const mockNewUser: User = {
    id: '2',
    email: 'newuser@example.com',
    name: 'New User',
    password: 'hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: null,
  };

  const mockEmailToken: EmailVerificationToken = {
    id: 'token-id',
    token: 'email-token',
    expiresAt: new Date(Date.now() + 3600 * 1000),
    userId: '2',
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return success on valid signup', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null); // No existing user
    mockBcryptHash.mockResolvedValue(mockNewUser.password);
    prismaMock.user.create.mockResolvedValue(mockNewUser);
    prismaMock.emailVerificationToken.create.mockResolvedValue(mockEmailToken);

    const result = await signup({ success: false }, mockFormData);

    expect(result.success).toBe(true);
    expect(result.message).toContain('Account created!');
    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(prismaMock.emailVerificationToken.create).toHaveBeenCalled();
  });

  it('should return validation errors for invalid data', async () => {
    const invalidFormData = new FormData();
    invalidFormData.append('email', 'not-an-email');
    invalidFormData.append('password', 'short');
    invalidFormData.append('confirmPassword', 'mismatch');

    const result = await signup({ success: false }, invalidFormData);

    expect(result.success).toBe(false);
    expect(result.errors?.email).toBeDefined();
    expect(result.errors?.password).toBeDefined();
    expect(result.errors?.confirmPassword).toBeDefined();
  });

  it('should return an error if the user already exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockNewUser);

    const result = await signup({ success: false }, mockFormData);

    expect(result.success).toBe(false);
    expect(result.message).toBe('User with this email already exists.');
  });

  it('should handle unexpected errors', async () => {
    prismaMock.user.findUnique.mockRejectedValue(new Error('DB error'));

    const result = await signup({ success: false }, mockFormData);

    expect(result.success).toBe(false);
    expect(result.message).toBe('An unexpected error occurred.');
  });
});

describe('logout action', () => {
  it('should delete the token cookie and revalidate the path', async () => {
    await logout();
    expect(mockCookiesDelete).toHaveBeenCalledWith('token');
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });
});

describe('deleteAccount action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete the user and related data successfully', async () => {
    mockCookiesGet.mockReturnValue({ value: 'test-token' });
    mockJwtVerify.mockReturnValue({ userId: '1' } as JwtPayload);
    prismaMock.$transaction.mockResolvedValue([{}, {}, {}]);

    const result = await deleteAccount();

    expect(result.success).toBe(true);
    expect(result.message).toBe('Account deleted successfully.');
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(mockCookiesDelete).toHaveBeenCalledWith('token');
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });

  it('should return an error if not authenticated', async () => {
    mockCookiesGet.mockReturnValue(undefined);

    const result = await deleteAccount();

    expect(result.success).toBe(false);
    expect(result.message).toBe('Authentication required.');
  });

  it('should handle JWT verification errors', async () => {
    mockCookiesGet.mockReturnValue({ value: 'invalid-token' });
    mockJwtVerify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const result = await deleteAccount();

    expect(result.success).toBe(false);
    expect(result.message).toBe('An unexpected error occurred.');
  });

  it('should handle database transaction errors', async () => {
    mockCookiesGet.mockReturnValue({ value: 'test-token' });
    mockJwtVerify.mockReturnValue({ userId: '1' } as JwtPayload);
    prismaMock.$transaction.mockRejectedValue(new Error('DB error'));

    const result = await deleteAccount();

    expect(result.success).toBe(false);
    expect(result.message).toBe('An unexpected error occurred.');
  });
});

describe('changePassword action', () => {
  const mockFormData = new FormData();
  mockFormData.append('currentPassword', 'password123');
  mockFormData.append('newPassword', 'newpassword123');
  mockFormData.append('confirmPassword', 'newpassword123');

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should change the password successfully', async () => {
    mockCookiesGet.mockReturnValue({ value: 'test-token' });
    mockJwtVerify.mockReturnValue({ userId: '1' } as JwtPayload);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(true);
    mockBcryptHash.mockResolvedValue('newhashedpassword');

    const result = await changePassword({ success: false }, mockFormData);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Password changed successfully.');
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: { password: 'newhashedpassword' },
    });
  });

  it('should return an error if not authenticated', async () => {
    mockCookiesGet.mockReturnValue(undefined);
    const result = await changePassword({ success: false }, mockFormData);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Authentication required.');
  });

  it('should return validation errors for invalid data', async () => {
    mockCookiesGet.mockReturnValue({ value: 'test-token' });
    mockJwtVerify.mockReturnValue({ userId: '1' } as JwtPayload);

    const invalidFormData = new FormData();
    invalidFormData.append('currentPassword', 'password123');
    invalidFormData.append('newPassword', 'short');
    invalidFormData.append('confirmPassword', 'mismatch');

    const result = await changePassword({ success: false }, invalidFormData);

    expect(result.success).toBe(false);
    expect(result.errors?.newPassword).toBeDefined();
    expect(result.errors?.confirmPassword).toBeDefined();
  });

  it('should return an error for incorrect current password', async () => {
    mockCookiesGet.mockReturnValue({ value: 'test-token' });
    mockJwtVerify.mockReturnValue({ userId: '1' } as JwtPayload);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(false);

    const result = await changePassword({ success: false }, mockFormData);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Incorrect current password.');
  });

  it('should return an error if user is not found', async () => {
    mockCookiesGet.mockReturnValue({ value: 'test-token' });
    mockJwtVerify.mockReturnValue({ userId: '1' } as JwtPayload);
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await changePassword({ success: false }, mockFormData);

    expect(result.success).toBe(false);
    expect(result.message).toBe('User not found.');
  });

  it('should handle unexpected errors', async () => {
    mockCookiesGet.mockReturnValue({ value: 'test-token' });
    mockJwtVerify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const result = await changePassword({ success: false }, mockFormData);

    expect(result.success).toBe(false);
    expect(result.message).toBe('An unexpected error occurred.');
  });
}); 