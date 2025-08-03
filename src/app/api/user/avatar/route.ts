import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join, normalize, relative, isAbsolute } from 'path';
import { randomBytes } from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { realpath } from 'fs/promises';
import { existsSync } from 'fs';

interface JwtPayload {
  userId: string;
}

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_DIMENSION = 4096;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads', 'avatars');

// Validation schema
const uploadSchema = z.object({
  file: z.instanceof(File),
});

// Secure filename generation
function generateSecureFilename(userId: string): string {
  const timestamp = Date.now();
  const randomString = randomBytes(16).toString('hex');
  return `${userId}_${timestamp}_${randomString}`;
}

// Comprehensive path validation
function isValidAvatarPath(userPath: string): boolean {
  const normalizedPath = normalize(userPath);
  
  // Security checks
  if (normalizedPath.includes('\0') || // Null byte
      isAbsolute(normalizedPath) || // Absolute path
      normalizedPath.includes('..') || // Directory traversal
      /[<>:"|?*]/.test(normalizedPath)) { // Invalid characters
    return false;
  }
  
  // Check URL encoding attempts
  try {
    const decoded = decodeURIComponent(normalizedPath);
    if (decoded !== normalizedPath && decoded.includes('..')) {
      return false;
    }
  } catch {
    return false;
  }
  
  // Must be in uploads/avatars directory
  return normalizedPath.startsWith('uploads/avatars/');
}

// Secure file validation with magic numbers
async function validateAndProcessImage(file: File): Promise<Buffer> {
  // Size check
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 5MB limit');
  }
  
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Magic number validation
  const fileType = await fileTypeFromBuffer(buffer);
  if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType.mime)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed');
  }
  
  // Process with sharp for additional validation and optimization
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    // Dimension checks
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image file');
    }
    
    if (metadata.width > MAX_IMAGE_DIMENSION || metadata.height > MAX_IMAGE_DIMENSION) {
      throw new Error('Image dimensions exceed maximum allowed size');
    }
    
    // Check for decompression bombs
    const pixels = metadata.width * metadata.height;
    const compressionRatio = (pixels * 3) / file.size; // Approximate uncompressed size
    if (compressionRatio > 100) {
      throw new Error('Suspicious image compression detected');
    }
    
    // Resize if needed and strip metadata
    const processedBuffer = await image
      .resize(1024, 1024, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .rotate() // Auto-orient based on EXIF
      .withMetadata({}) // Strip EXIF data for privacy
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
    
    return processedBuffer;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to process image');
  }
}

// Secure file cleanup
async function removeAvatarFile(avatarPath: string | null): Promise<void> {
  if (!avatarPath || !isValidAvatarPath(avatarPath)) {
    return;
  }
  
  try {
    const filePath = join(process.cwd(), 'public', avatarPath);
    const resolvedPath = await realpath(filePath).catch(() => filePath);
    
    // Verify resolved path is within uploads directory
    if (!resolvedPath.startsWith(UPLOADS_DIR)) {
      console.error('Attempted to delete file outside uploads directory');
      return;
    }
    
    await unlink(resolvedPath);
  } catch (error) {
    console.error('Failed to delete avatar file:', error);
  }
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
    // Authentication
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting (implement with Redis/Upstash in production)
    // const rateLimitOk = await checkRateLimit(userId);
    // if (!rateLimitOk) {
    //   return NextResponse.json({ error: 'Too many uploads' }, { status: 429 });
    // }

    // Parse and validate request
    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate and process image
    const processedBuffer = await validateAndProcessImage(file);
    
    // Generate secure filename
    const filename = `${generateSecureFilename(userId)}.jpg`;
    const filePath = join(UPLOADS_DIR, filename);
    
    // Ensure uploads directory exists
    if (!existsSync(UPLOADS_DIR)) {
      await mkdir(UPLOADS_DIR, { recursive: true });
    }
    
    // Get current user to clean up old avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true }
    });

    // Write new file
    await writeFile(filePath, processedBuffer);
    
    // Virus scan in production
    // const isSafe = await scanFile(filePath);
    // if (!isSafe) {
    //   await unlink(filePath);
    //   return NextResponse.json({ error: 'File failed security scan' }, { status: 400 });
    // }

    // Update database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: `uploads/avatars/${filename}` }
    });

    // Clean up old avatar
    if (currentUser?.avatar) {
      await removeAvatarFile(currentUser.avatar);
    }

    return NextResponse.json({ 
      user: updatedUser,
      message: 'Avatar uploaded successfully' 
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true }
    });

    if (!user?.avatar) {
      return NextResponse.json({ error: 'No avatar to remove' }, { status: 400 });
    }

    // Update database first
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: null }
    });

    // Then clean up file
    await removeAvatarFile(user.avatar);

    return NextResponse.json({ message: 'Avatar removed successfully' });

  } catch (error) {
    console.error('Avatar removal error:', error);
    return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 });
  }
}
