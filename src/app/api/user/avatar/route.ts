import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join, normalize, isAbsolute, sep } from 'path';
import { randomBytes } from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/database/prisma';
import { realpath } from 'fs/promises';
import { existsSync } from 'fs';
import { checkRateLimit } from '@/lib/api/rate-limiting';
import { securityLogger, SecurityEventType } from '@/lib/security/security-logger';
import { createSecureUploadResponse } from '@/middleware/security-headers';
import { PolyglotDetector } from '@/lib/security/PolyglotDetector';
import { IPValidator } from '@/lib/security/IPValidator';
import { EnhancedSecurityLogger } from '@/lib/security/EnhancedSecurityLogger';

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
  const expectedPrefix = join('uploads', 'avatars') + sep;
  return normalizedPath.startsWith(expectedPrefix);
}

// Enhanced polyglot detection using enterprise security module
function detectPolyglotFile(buffer: Buffer): { isPolyglot: boolean; evidence: string[] } {
  try {
    // Use enterprise PolyglotDetector with comprehensive analysis
    const result = PolyglotDetector.analyze(buffer, 1024 * 1024); // 1MB max analysis
    
    // Convert enterprise result to legacy format for compatibility
    const evidence = result.evidence.map(e => `${e.type}: ${e.description}`);
    
    // Log detection results for monitoring
    if (result.isPolyglot) {
      EnhancedSecurityLogger.getInstance().logCritical('polyglot_file_detected', {
        riskLevel: result.riskLevel,
        recommendation: result.recommendation,
        evidenceCount: result.evidence.length,
        analysisSize: Math.min(buffer.length, 1024 * 1024)
      });
    }
    
    return {
      isPolyglot: result.riskLevel === 'critical' || result.riskLevel === 'high',
      evidence
    };
  } catch (error) {
    // Fallback to basic detection on error
    EnhancedSecurityLogger.getInstance().logCritical('polyglot_detection_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      fallbackToBasicDetection: true
    });
    
    return detectPolyglotFileBasic(buffer);
  }
}

// Fallback basic detection for error scenarios
function detectPolyglotFileBasic(buffer: Buffer): { isPolyglot: boolean; evidence: string[] } {
  const evidence: string[] = [];
  
  // Basic analysis with reduced scope
  const maxAnalysisSize = Math.min(buffer.length, 4096);
  const fileContentLower = buffer.toString('binary', 0, maxAnalysisSize).toLowerCase();
  
  // Critical patterns only
  if (fileContentLower.includes('<script') || fileContentLower.includes('javascript:')) {
    evidence.push('Script content detected');
  }
  
  if (fileContentLower.includes('<?php')) {
    evidence.push('PHP code detected');
  }
  
  return {
    isPolyglot: evidence.length > 0,
    evidence
  };
}

// SSRF prevention - check for embedded URLs in metadata regions only
function checkForSSRFVectors(buffer: Buffer): { hasSSRF: boolean; urls: string[] } {
  const urls: string[] = [];
  
  // Define metadata regions for common image formats
  const metadataRegions = extractMetadataRegions(buffer);
  
  // Only analyze content within metadata regions to reduce false positives
  for (const region of metadataRegions) {
    const content = buffer.toString('binary', region.start, Math.min(region.end, buffer.length));
    
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
  }
  
  // Check for dangerous URLs using enterprise IP validation
  const dangerousUrls = urls.filter(url => {
    try {
      // First check if URL contains an IP address
      const ipValidation = IPValidator.validateURLHost(url);
      if (ipValidation) {
        // URL contains an IP - check if it's safe
        return !ipValidation.allowedForSSRF;
      }
      
      // For domain names, check for suspicious patterns
      const lowercaseUrl = url.toLowerCase();
      return lowercaseUrl.includes('localhost') ||
             lowercaseUrl.includes('127.0.0.1') ||
             lowercaseUrl.includes('0.0.0.0') ||
             lowercaseUrl.includes('::1');
    } catch {
      // If validation fails, consider it dangerous
      return true;
    }
  });
  
  return {
    hasSSRF: dangerousUrls.length > 0,
    urls: dangerousUrls
  };
}

// Extract metadata regions from image buffer based on format
function extractMetadataRegions(buffer: Buffer): Array<{ start: number; end: number }> {
  const regions: Array<{ start: number; end: number }> = [];
  
  // JPEG EXIF data starts after SOI marker (0xFFD8)
  if (buffer.length >= 4 && buffer[0] === 0xFF && buffer[1] === 0xD8) {
    // Look for EXIF APP1 marker (0xFFE1)
    for (let i = 2; i < buffer.length - 4; i++) {
      if (buffer[i] === 0xFF && buffer[i + 1] === 0xE1) {
        const segmentLength = (buffer[i + 2] << 8) | buffer[i + 3];
        regions.push({ start: i + 4, end: i + 4 + segmentLength });
        i += segmentLength + 2;
      }
    }
  }
  
  // PNG metadata chunks (after PNG signature)
  if (buffer.length >= 8 && buffer.toString('ascii', 0, 8) === '\x89PNG\r\n\x1a\n') {
    let offset = 8;
    while (offset < buffer.length - 8) {
      const chunkLength = buffer.readUInt32BE(offset);
      const chunkType = buffer.toString('ascii', offset + 4, offset + 8);
      
      // Only scan text chunks and other metadata
      if (['tEXt', 'zTXt', 'iTXt', 'eXIf', 'pHYs', 'tIME'].includes(chunkType)) {
        regions.push({ start: offset + 8, end: offset + 8 + chunkLength });
      }
      
      offset += 12 + chunkLength; // 4 bytes length + 4 bytes type + data + 4 bytes CRC
    }
  }
  
  // If no specific metadata regions found, scan first 4KB only
  if (regions.length === 0) {
    regions.push({ start: 0, end: Math.min(4096, buffer.length) });
  }
  
  return regions;
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
      await EnhancedSecurityLogger.getInstance().logUpload('validation_failed', userId, {
        reason: 'polyglot_file_detected',
        evidence: polyglotCheck.evidence,
        fileName: file.name,
        fileSize: buffer.length
      }, {
        ip: request?.headers.get('x-forwarded-for') || undefined,
        userAgent: request?.headers.get('user-agent') || undefined
      });
    }
    throw new Error('Suspicious file content detected. File may contain malicious code.');
  }
  
  // SSRF prevention
  const ssrfCheck = checkForSSRFVectors(buffer);
  if (ssrfCheck.hasSSRF) {
    if (userId) {
      await EnhancedSecurityLogger.getInstance().logCritical('ssrf_attempt_detected', {
        suspiciousUrls: ssrfCheck.urls,
        fileName: file.name,
        fileSize: buffer.length
      }, {
        ip: request?.headers.get('x-forwarded-for') || undefined,
        userAgent: request?.headers.get('user-agent') || undefined,
        userId
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
    await EnhancedSecurityLogger.getInstance().logUpload('upload_success', userId, {
      filename,
      fileSize: processedBuffer.length,
      originalSize: file.size,
      compressionRatio: file.size === 0 ? 'N/A' : (Math.max(0, ((file.size - processedBuffer.length) / file.size) * 100)).toFixed(2) + '%'
    }, {
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    });

    return createSecureUploadResponse({ 
      user: updatedUser 
    }, 'Avatar uploaded successfully');

  } catch (error) {
    console.error('Avatar upload error:', error);
    
    // Log failed upload attempt
    const userId = await getUserFromToken();
    if (userId) {
      await EnhancedSecurityLogger.getInstance().logUpload('validation_failed', userId, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stage: 'processing'
      }, {
        ip: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined
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
