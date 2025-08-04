import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join, normalize, isAbsolute } from 'path';
import { randomBytes } from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { realpath } from 'fs/promises';
import { existsSync } from 'fs';
import { checkRateLimit } from '@/lib/rate-limiting';
import { securityLogger, SecurityEventType } from '@/lib/security-logger';
import { createSecureUploadResponse } from '@/middleware/security-headers';

interface JwtPayload {
  userId: string;
}

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_DIMENSION = 4096;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads', 'avatars');

// Secure filename generation
function generateSecureFilename(userId: string): string {
  const timestamp = Date.now();
  const randomString = randomBytes(16).toString('hex');
  return `${userId}_${timestamp}_${randomString}`;
}

// Comprehensive path validation
function isValidAvatarPath(userPath: string, userId?: string): boolean {
  const normalizedPath = normalize(userPath);
  
  // Security checks
  if (normalizedPath.includes('\0') || // Null byte
      isAbsolute(normalizedPath) || // Absolute path
      normalizedPath.includes('..') || // Directory traversal
      /[<>:"|?*]/.test(normalizedPath)) { // Invalid characters
    
    if (userId) {
      securityLogger.log({
        type: SecurityEventType.PATH_TRAVERSAL_ATTEMPT,
        userId,
        details: { 
          attemptedPath: userPath,
          normalizedPath,
          reason: 'Invalid path characters or directory traversal'
        },
        severity: 'high'
      });
    }
    return false;
  }
  
  // Check URL encoding attempts
  try {
    const decoded = decodeURIComponent(normalizedPath);
    if (decoded !== normalizedPath && decoded.includes('..')) {
      if (userId) {
        securityLogger.log({
          type: SecurityEventType.PATH_TRAVERSAL_ATTEMPT,
          userId,
          details: { 
            attemptedPath: userPath,
            decodedPath: decoded,
            reason: 'URL encoded directory traversal attempt'
          },
          severity: 'high'
        });
      }
      return false;
    }
  } catch {
    return false;
  }
  
  // Must be in uploads/avatars directory
  return normalizedPath.startsWith('uploads/avatars/');
}

// Advanced polyglot file detection
function detectPolyglotFile(buffer: Buffer): { isPolyglot: boolean; evidence: string[] } {
  const evidence: string[] = [];
  
  // Check for common polyglot signatures
  const fileStart = buffer.subarray(0, 1024).toString('hex');
  
  // Limit analysis to smaller portions for better performance on large files
  const maxAnalysisSize = Math.min(buffer.length, 4096); // Reduced from 8192
  const fileContentLower = buffer.toString('binary', 0, maxAnalysisSize).toLowerCase();
  
  // HTML/JS injection in images
  if (fileContentLower.includes('<script') || fileContentLower.includes('javascript:') || 
      fileContentLower.includes('<iframe') || fileContentLower.includes('onerror=')) {
    evidence.push('HTML/JavaScript content detected');
  }
  
  // PHP injection
  if (fileContentLower.includes('<?php') || fileContentLower.includes('<?=')) {
    evidence.push('PHP code detected');
  }
  
  // Multiple file format headers (polyglot)
  const hasJPEG = fileStart.startsWith('ffd8ff');
  const hasPNG = fileStart.startsWith('89504e47');
  const hasGIF = fileStart.startsWith('474946');
  const hasWebP = fileStart.includes('57454250');
  
  const formatCount = [hasJPEG, hasPNG, hasGIF, hasWebP].filter(Boolean).length;
  if (formatCount > 1) {
    evidence.push('Multiple image format signatures detected');
  }
  
  // SVG with embedded content (even though we don't allow SVG)
  if (fileContentLower.includes('<svg') && (fileContentLower.includes('<script') || fileContentLower.includes('onload='))) {
    evidence.push('SVG with embedded scripts detected');
  }
  
  // Suspicious URLs or protocols
  if (fileContentLower.match(/https?:\/\//) || fileContentLower.includes('ftp://') || 
      fileContentLower.includes('file://') || fileContentLower.includes('data:')) {
    evidence.push('Suspicious URLs or protocols detected');
  }
  
  return {
    isPolyglot: evidence.length > 0,
    evidence
  };
}

// SSRF prevention - check for embedded URLs
function checkForSSRFVectors(buffer: Buffer): { hasSSRF: boolean; urls: string[] } {
  const content = buffer.toString('binary', 0, Math.min(buffer.length, 16384));
  const urls: string[] = [];
  
  // Look for various URL patterns
  const urlPatterns = [
    /https?:\/\/[^\s<>"'{}|\\\^`[\]]+/gi,
    /ftp:\/\/[^\s<>"'{}|\\\^`[\]]+/gi,
    /file:\/\/[^\s<>"'{}|\\\^`[\]]+/gi,
    /gopher:\/\/[^\s<>"'{}|\\\^`[\]]+/gi,
    /ldap:\/\/[^\s<>"'{}|\\\^`[\]]+/gi,
  ];
  
  for (const pattern of urlPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      urls.push(...matches);
    }
  }
  
  // Check for localhost, private IPs, or internal domains
  const dangerousUrls = urls.filter(url => {
    const lowercaseUrl = url.toLowerCase();
    return lowercaseUrl.includes('localhost') ||
           lowercaseUrl.includes('127.0.0.1') ||
           lowercaseUrl.includes('10.') ||
           lowercaseUrl.includes('192.168.') ||
           /172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}/.test(lowercaseUrl) ||
           lowercaseUrl.includes('169.254.') ||
           lowercaseUrl.includes('::1') ||
           lowercaseUrl.includes('0.0.0.0');
  });
  
  return {
    hasSSRF: dangerousUrls.length > 0,
    urls: dangerousUrls
  };
}

// Enhanced metadata analysis
function analyzeImageMetadata(metadata: any): { suspicious: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for excessive metadata size
  if (metadata.exif && Object.keys(metadata.exif).length > 50) {
    issues.push('Excessive EXIF metadata entries');
  }
  
  // Check for suspicious metadata fields
  if (metadata.exif) {
    const suspiciousFields = ['UserComment', 'ImageDescription', 'Software', 'Copyright'];
    for (const field of suspiciousFields) {
      if (metadata.exif[field] && typeof metadata.exif[field] === 'string') {
        const value = metadata.exif[field].toLowerCase();
        if (value.includes('<script') || value.includes('javascript:') || 
            value.includes('http://') || value.includes('https://')) {
          issues.push(`Suspicious content in ${field} metadata`);
        }
      }
    }
  }
  
  return {
    suspicious: issues.length > 0,
    issues
  };
}

// Secure file validation with comprehensive security checks
async function validateAndProcessImage(file: File, userId?: string, request?: NextRequest): Promise<Buffer> {
  // Size check
  if (file.size > MAX_FILE_SIZE) {
    if (userId) {
      securityLogger.log({
        type: SecurityEventType.FILE_SIZE_EXCEEDED,
        userId,
        userAgent: request?.headers.get('user-agent') || undefined,
        ip: request?.headers.get('x-forwarded-for') || undefined,
        details: { fileSize: file.size, maxSize: MAX_FILE_SIZE },
        severity: 'low'
      });
    }
    throw new Error('File size exceeds 5MB limit');
  }
  
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Advanced polyglot file detection
  const polyglotCheck = detectPolyglotFile(buffer);
  if (polyglotCheck.isPolyglot) {
    if (userId) {
      await securityLogger.log({
        type: SecurityEventType.POLYGLOT_FILE_DETECTED,
        userId,
        userAgent: request?.headers.get('user-agent') || undefined,
        ip: request?.headers.get('x-forwarded-for') || undefined,
        details: { 
          evidence: polyglotCheck.evidence,
          fileName: file.name 
        },
        severity: 'high'
      });
    }
    throw new Error('Suspicious file content detected. File may contain malicious code.');
  }
  
  // SSRF prevention
  const ssrfCheck = checkForSSRFVectors(buffer);
  if (ssrfCheck.hasSSRF) {
    if (userId) {
      await securityLogger.log({
        type: SecurityEventType.SSRF_ATTEMPT,
        userId,
        userAgent: request?.headers.get('user-agent') || undefined,
        ip: request?.headers.get('x-forwarded-for') || undefined,
        details: { 
          suspiciousUrls: ssrfCheck.urls,
          fileName: file.name 
        },
        severity: 'critical'
      });
    }
    throw new Error('File contains suspicious network references');
  }

  // Magic number validation
  const fileType = await fileTypeFromBuffer(buffer);
  if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType.mime)) {
    if (userId) {
      securityLogger.log({
        type: SecurityEventType.INVALID_FILE_TYPE,
        userId,
        userAgent: request?.headers.get('user-agent') || undefined,
        ip: request?.headers.get('x-forwarded-for') || undefined,
        details: { 
          detectedType: fileType?.mime || 'unknown',
          allowedTypes: ALLOWED_MIME_TYPES 
        },
        severity: 'medium'
      });
    }
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
      if (userId) {
        securityLogger.log({
          type: SecurityEventType.SUSPICIOUS_COMPRESSION,
          userId,
          userAgent: request?.headers.get('user-agent') || undefined,
          ip: request?.headers.get('x-forwarded-for') || undefined,
          details: { 
            compressionRatio,
            pixels,
            fileSize: file.size 
          },
          severity: 'high'
        });
      }
      throw new Error('Suspicious image compression detected');
    }
    
    // Enhanced metadata analysis
    const metadataAnalysis = analyzeImageMetadata(metadata);
    if (metadataAnalysis.suspicious) {
      if (userId) {
        await securityLogger.log({
          type: SecurityEventType.MALICIOUS_METADATA,
          userId,
          userAgent: request?.headers.get('user-agent') || undefined,
          ip: request?.headers.get('x-forwarded-for') || undefined,
          details: { 
            issues: metadataAnalysis.issues,
            fileName: file.name 
          },
          severity: 'medium'
        });
      }
      throw new Error('Suspicious metadata detected in image file');
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
    let resolvedPath: string;
    
    try {
      resolvedPath = await realpath(filePath);
    } catch (err) {
      console.error('Failed to resolve realpath for avatar file:', err);
      return;
    }
    
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

    // Rate limiting
    const rateLimitResult = checkRateLimit(userId);
    if (!rateLimitResult.allowed) {
      securityLogger.log({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        userId,
        userAgent: request.headers.get('user-agent') || undefined,
        ip: request.headers.get('x-forwarded-for') || undefined,
        details: { resetTime: rateLimitResult.resetTime },
        severity: 'medium'
      });
      
      return NextResponse.json({ 
        error: 'Too many uploads. Please try again later.' 
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
        }
      });
    }

    // Parse and validate request
    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate and process image
    const processedBuffer = await validateAndProcessImage(file, userId, request);
    
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

    // Log successful upload
    securityLogger.log({
      type: SecurityEventType.AVATAR_UPLOAD_SUCCESS,
      userId,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || undefined,
      details: { 
        filename,
        fileSize: processedBuffer.length,
        originalSize: file.size 
      },
      severity: 'low'
    });

    return createSecureUploadResponse({ 
      user: updatedUser 
    }, 'Avatar uploaded successfully');

  } catch (error) {
    console.error('Avatar upload error:', error);
    
    // Log failed upload attempt
    const userId = await getUserFromToken();
    if (userId) {
      securityLogger.log({
        type: SecurityEventType.AVATAR_UPLOAD_FAILED,
        userId,
        userAgent: request.headers.get('user-agent') || undefined,
        ip: request.headers.get('x-forwarded-for') || undefined,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'medium'
      });
    }
    
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

    // Log successful deletion
    securityLogger.log({
      type: SecurityEventType.AVATAR_DELETE_SUCCESS,
      userId,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || undefined,
      details: { deletedFile: user.avatar },
      severity: 'low'
    });

    return NextResponse.json({ message: 'Avatar removed successfully' });

  } catch (error) {
    console.error('Avatar removal error:', error);
    
    // Log failed deletion attempt
    const userId = await getUserFromToken();
    if (userId) {
      securityLogger.log({
        type: SecurityEventType.AVATAR_DELETE_FAILED,
        userId,
        userAgent: request.headers.get('user-agent') || undefined,
        ip: request.headers.get('x-forwarded-for') || undefined,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'medium'
      });
    }
    
    return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 });
  }
}
