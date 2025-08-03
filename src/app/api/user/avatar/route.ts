import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

interface JwtPayload {
  userId: string;
}

// Validate avatar path to prevent path traversal attacks
function isValidAvatarPath(avatarPath: string): boolean {
  // Remove leading slash if present
  const normalizedPath = avatarPath.startsWith('/') ? avatarPath.slice(1) : avatarPath;
  
  // Check if path contains any directory traversal patterns
  if (normalizedPath.includes('..') || normalizedPath.includes('./') || normalizedPath.includes('\\')) {
    return false;
  }
  
  // Ensure the path starts with uploads/avatars/
  if (!normalizedPath.startsWith('uploads/avatars/')) {
    return false;
  }
  
  // Additional check: ensure no absolute paths
  if (path.isAbsolute(normalizedPath)) {
    return false;
  }
  
  return true;
}

async function getUserFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as JwtPayload;
    return decoded.userId;
  } catch (_error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const randomString = randomBytes(16).toString('hex');
    const fileName = `${userId}-${Date.now()}-${randomString}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create public URL
    const avatarUrl = `/uploads/avatars/${fileName}`;

    // Get current user to remove old avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    // Remove old avatar file if it exists and is valid
    if (currentUser?.avatar && isValidAvatarPath(currentUser.avatar)) {
      const publicDir = path.resolve(process.cwd(), 'public');
      const oldFilePath = path.resolve(publicDir, currentUser.avatar);
      const relative = path.relative(publicDir, oldFilePath);
      if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
        try {
          if (existsSync(oldFilePath)) {
            await unlink(oldFilePath);
          }
        } catch (error) {
          console.warn('Failed to delete old avatar file:', error);
        }
      } else {
        console.warn('Attempted path traversal in avatar filename:', currentUser.avatar);
      }
    } else if (currentUser?.avatar) {
      console.warn('Attempted path traversal in avatar filename:', currentUser.avatar);
    }

    // Update user in database
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });

    return NextResponse.json({ 
      success: true, 
      avatarUrl,
      message: 'Avatar updated successfully' 
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user to remove avatar file
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    // Remove avatar file if it exists and is valid
    if (currentUser?.avatar && isValidAvatarPath(currentUser.avatar)) {
      const publicDir = path.resolve(process.cwd(), 'public');
      const filePath = path.join(publicDir, 'uploads', 'avatars',
        path.basename(currentUser.avatar));
      const resolvedFilePath = path.resolve(filePath);
      if (existsSync(resolvedFilePath)) {
        try {
          await unlink(resolvedFilePath);
        } catch (error) {
          console.warn('Failed to delete avatar file:', error);
        }
      }
    } else if (currentUser?.avatar) {
      console.warn('Attempted path traversal in avatar filename:', currentUser.avatar);
    }

    // Update user in database
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Avatar removed successfully' 
    });

  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
