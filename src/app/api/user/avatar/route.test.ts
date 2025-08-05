import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, DELETE } from './route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { checkRateLimit } from '@/lib/rate-limiting';
import { securityLogger } from '@/lib/security-logger';
import { PolyglotDetector } from '@/lib/security/PolyglotDetector';
import { IPValidator } from '@/lib/security/IPValidator';
import { EnhancedSecurityLogger } from '@/lib/security/EnhancedSecurityLogger';
import { join } from 'path';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { realpath } from 'fs/promises';
import { cookies } from 'next/headers';

// Mock all dependencies
vi.mock('next/headers', () => ({
  cookies: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('jsonwebtoken');
vi.mock('@/lib/rate-limiting');
vi.mock('@/lib/security-logger');
vi.mock('@/lib/security/PolyglotDetector');
vi.mock('@/lib/security/IPValidator');
vi.mock('@/lib/security/EnhancedSecurityLogger');
vi.mock('file-type');
vi.mock('sharp');
vi.mock('fs/promises');
vi.mock('fs');
vi.mock('@/middleware/security-headers', () => ({
  createSecureUploadResponse: vi.fn((data, message) => ({
    json: vi.fn().mockResolvedValue({ data, message }),
    status: 200
  }))
}));

const createMockFile = (name: string, size: number, type: string, content?: string) => {
  const mockContent = content || 'mock file content';
  const buffer = Buffer.from(mockContent);
  
  // Create a more complete File mock that matches the Web API
  const mockFile = {
    name,
    size,
    type,
    lastModified: Date.now(),
    webkitRelativePath: '',
    arrayBuffer: vi.fn().mockResolvedValue(buffer.buffer),
    stream: vi.fn(),
    text: vi.fn().mockResolvedValue(mockContent),
    slice: vi.fn(),
    constructor: {
      name: 'File'
    }
  };
  
  return mockFile as unknown as File;
};

const createMockRequest = (file?: File, headers?: Record<string, string>) => {
  // Create a mock FormData that directly returns our file
  const mockFormData = {
    get: vi.fn((key: string) => key === 'avatar' ? file || null : null),
    set: vi.fn(),
    append: vi.fn(),
    delete: vi.fn(),
    has: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    entries: vi.fn(),
    forEach: vi.fn()
  };

  return {
    formData: vi.fn().mockResolvedValue(mockFormData),
    headers: {
      get: vi.fn((key: string) => headers?.[key] || null)
    }
  } as unknown as NextRequest;
};

const createMockCookies = (token?: string) => {
  return {
    get: vi.fn().mockReturnValue(token ? { value: token } : null),
    getAll: vi.fn().mockReturnValue([]),
    has: vi.fn().mockReturnValue(!!token),
    set: vi.fn(),
    delete: vi.fn(),
    [Symbol.iterator]: vi.fn(),
    size: 0
  };
};

describe('Avatar Upload API', () => {
  const mockUserId = 'user123';
  const mockToken = 'valid-jwt-token';
  const mockUser = { 
    id: mockUserId, 
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: null,
    password: 'hashedpassword',
    avatar: null,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock cookies properly
    vi.mocked(cookies).mockResolvedValue(createMockCookies(mockToken));
    
    // Mock JWT verification
    vi.mocked(jwt.verify).mockReturnValue({ userId: mockUserId } as any);
    
    // Mock rate limiting - allow by default
    vi.mocked(checkRateLimit).mockReturnValue({
      allowed: true,
      remaining: 4,
      resetTime: Date.now() + 3600000
    });
    
    // Mock security logger
    vi.mocked(securityLogger.log).mockResolvedValue(undefined);
    
    // Mock EnhancedSecurityLogger
    const mockEnhancedLogger = {
      logCritical: vi.fn().mockResolvedValue(undefined),
      logUpload: vi.fn().mockResolvedValue(undefined),
      getInstance: vi.fn().mockReturnThis()
    };
    vi.mocked(EnhancedSecurityLogger.getInstance).mockReturnValue(mockEnhancedLogger as any);
    
    // Mock file system
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeFile).mockResolvedValue(undefined);
    vi.mocked(unlink).mockResolvedValue(undefined);
    // Don't set a global realpath mock - let individual tests set their own
    
    // Mock PolyglotDetector
    vi.mocked(PolyglotDetector.analyze).mockReturnValue({
      isPolyglot: false,
      riskLevel: 'low',
      evidence: [],
      recommendation: 'File appears safe'
    });
    
    // Mock IPValidator
    vi.mocked(IPValidator.validateURLHost).mockReturnValue({
      isValid: true,
      type: 'ipv4',
      isPrivate: false,
      isReserved: false,
      isLoopback: false,
      isMulticast: false,
      isLinkLocal: false,
      riskLevel: 'low',
      allowedForSSRF: true
    });
    
    // Mock file-type
    vi.mocked(fileTypeFromBuffer).mockResolvedValue({
      ext: 'jpg',
      mime: 'image/jpeg'
    });
    
    // Mock sharp
    const mockSharp = {
      metadata: vi.fn().mockResolvedValue({
        width: 800,
        height: 600,
        format: 'jpeg'
      }),
      resize: vi.fn().mockReturnThis(),
      rotate: vi.fn().mockReturnThis(),
      withMetadata: vi.fn().mockReturnThis(),
      jpeg: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed image'))
    };
    vi.mocked(sharp).mockReturnValue(mockSharp as any);
  });

  describe('POST /api/user/avatar', () => {
    it('should upload avatar successfully', async () => {
      // Setup
      const file = createMockFile('avatar.jpg', 1024 * 1024, 'image/jpeg'); // 1MB
      const request = createMockRequest(file);
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, avatar: 'uploads/avatars/new-avatar.jpg' });
      
      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(200);
      expect(writeFile).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { avatar: expect.stringMatching(/uploads\/avatars\/.*\.jpg/) }
      });
    });

    it('should return 401 for unauthenticated request', async () => {
      // Setup - override the default mock to return no token
      vi.mocked(cookies).mockResolvedValue(createMockCookies()); // No token
      
      const request = createMockRequest();
      
      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 429 when rate limit exceeded', async () => {
      // Setup
      vi.mocked(checkRateLimit).mockReturnValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 3600000
      });
      
      const file = createMockFile('avatar.jpg', 1024, 'image/jpeg');
      const request = createMockRequest(file);
      
      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(429);
      expect(securityLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rate_limit_exceeded'
        })
      );
    });

    it('should return 400 when no file provided', async () => {
      // Setup
      const request = createMockRequest(); // No file provided
      
      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(400);
    });

    it('should reject file exceeding size limit', async () => {
      // Setup
      const file = createMockFile('large-avatar.jpg', 6 * 1024 * 1024, 'image/jpeg'); // 6MB
      const request = createMockRequest(file);
      
      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(400);
      expect(securityLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'file_size_exceeded'
        })
      );
    });

    it('should reject polyglot files', async () => {
      // Setup
      vi.mocked(PolyglotDetector.analyze).mockReturnValue({
        isPolyglot: true,
        riskLevel: 'critical',
        evidence: [{ 
          type: 'script', 
          description: 'JavaScript code detected',
          confidence: 0.9,
          location: 0
        }],
        recommendation: 'Block this file'
      });
      
      const file = createMockFile('malicious.jpg', 1024, 'image/jpeg');
      const request = createMockRequest(file);
      
      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(400);
    });

    it('should reject files with SSRF vectors', async () => {
      // Setup
      const maliciousContent = 'fake image content with http://localhost:3000/admin url';
      const file = createMockFile('ssrf.jpg', maliciousContent.length, 'image/jpeg', maliciousContent);
      const request = createMockRequest(file);
      
      vi.mocked(IPValidator.validateURLHost).mockReturnValue({
        isValid: false,
        type: 'ipv4',
        isPrivate: true,
        isReserved: false,
        isLoopback: true,
        isMulticast: false,
        isLinkLocal: false,
        riskLevel: 'critical',
        allowedForSSRF: false,
        reason: 'Localhost IP detected'
      });
      
      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(400);
    });

    it('should reject invalid file types', async () => {
      // Setup
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        ext: 'exe',
        mime: 'application/exe'
      });
      
      const file = createMockFile('malware.exe', 1024, 'application/exe');
      const request = createMockRequest(file);
      
      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(400);
      expect(securityLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'invalid_file_type'
        })
      );
    });

    it('should reject images with suspicious dimensions', async () => {
      // Setup
      const mockSharp = {
        metadata: vi.fn().mockResolvedValue({
          width: 5000, // Exceeds MAX_IMAGE_DIMENSION
          height: 5000,
          format: 'jpeg'
        }),
        resize: vi.fn().mockReturnThis(),
        rotate: vi.fn().mockReturnThis(),
        withMetadata: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed image'))
      };
      vi.mocked(sharp).mockReturnValue(mockSharp as any);
      
      const file = createMockFile('huge.jpg', 1024, 'image/jpeg');
      const request = createMockRequest(file);
      
      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(400);
    });

    it('should detect decompression bombs', async () => {
      // Setup
      const mockSharp = {
        metadata: vi.fn().mockResolvedValue({
          width: 1000,
          height: 1000,
          format: 'jpeg'
        }),
        resize: vi.fn().mockReturnThis(),
        rotate: vi.fn().mockReturnThis(),
        withMetadata: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed image'))
      };
      vi.mocked(sharp).mockReturnValue(mockSharp as any);
      
      const file = createMockFile('bomb.jpg', 100, 'image/jpeg'); // Very small file, large dimensions
      const request = createMockRequest(file);
      
      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(400);
      expect(securityLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'suspicious_compression'
        })
      );
    });

    it('should clean up old avatar when uploading new one', async () => {
      // Setup
      const userWithAvatar = { ...mockUser, avatar: 'uploads/avatars/old-avatar.jpg' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(userWithAvatar);
      vi.mocked(prisma.user.update).mockResolvedValue({ ...userWithAvatar, avatar: 'uploads/avatars/new-avatar.jpg' });
      
      // Mock realpath to return a path within uploads directory
      const expectedPath = join(process.cwd(), 'public', 'uploads', 'avatars', 'old-avatar.jpg');
      vi.mocked(realpath).mockResolvedValue(expectedPath);
      
      // Mock proper compression ratio for success
      const mockSharp = {
        metadata: vi.fn().mockResolvedValue({
          width: 800,
          height: 600,
          format: 'jpeg'
        }),
        resize: vi.fn().mockReturnThis(),
        rotate: vi.fn().mockReturnThis(),
        withMetadata: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed image'))
      };
      vi.mocked(sharp).mockReturnValue(mockSharp as any);
      
      const file = createMockFile('new-avatar.jpg', 100000, 'image/jpeg'); // 100KB - proper size for compression ratio
      const request = createMockRequest(file);
      
      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(200);
      expect(unlink).toHaveBeenCalled();
    });

    it('should handle JWT verification errors', async () => {
      // Setup
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      const file = createMockFile('avatar.jpg', 1024, 'image/jpeg');
      const request = createMockRequest(file);
      
      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(401);
    });

    it('should create uploads directory if it does not exist', async () => {
      // Setup
      vi.mocked(existsSync).mockReturnValue(false);
      
      // Mock proper compression ratio for success
      const mockSharp = {
        metadata: vi.fn().mockResolvedValue({
          width: 800,
          height: 600,
          format: 'jpeg'
        }),
        resize: vi.fn().mockReturnThis(),
        rotate: vi.fn().mockReturnThis(),
        withMetadata: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed image'))
      };
      vi.mocked(sharp).mockReturnValue(mockSharp as any);
      
      const file = createMockFile('avatar.jpg', 100000, 'image/jpeg'); // 100KB - proper size for compression ratio
      const request = createMockRequest(file);
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, avatar: 'uploads/avatars/new-avatar.jpg' });
      
      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(200);
      expect(mkdir).toHaveBeenCalledWith(expect.stringMatching(/.*public.*uploads.*avatars/), { recursive: true });
    });

    it('should handle PolyglotDetector errors gracefully', async () => {
      // Setup
      vi.mocked(PolyglotDetector.analyze).mockImplementation(() => {
        throw new Error('Analysis failed');
      });
      
      // Mock proper compression ratio for success
      const mockSharp = {
        metadata: vi.fn().mockResolvedValue({
          width: 800,
          height: 600,
          format: 'jpeg'
        }),
        resize: vi.fn().mockReturnThis(),
        rotate: vi.fn().mockReturnThis(),
        withMetadata: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed image'))
      };
      vi.mocked(sharp).mockReturnValue(mockSharp as any);
      
      const file = createMockFile('avatar.jpg', 100000, 'image/jpeg'); // 100KB - proper size for compression ratio
      const request = createMockRequest(file);
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, avatar: 'uploads/avatars/new-avatar.jpg' });
      
      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(200); // Should fall back to basic detection and continue
      expect(EnhancedSecurityLogger.getInstance().logCritical).toHaveBeenCalledWith(
        'polyglot_detection_error',
        expect.any(Object)
      );
    });
  });

  describe('DELETE /api/user/avatar', () => {
    it('should delete avatar successfully', async () => {
      // Setup
      const userWithAvatar = { ...mockUser, avatar: 'uploads/avatars/avatar.jpg' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(userWithAvatar);
      vi.mocked(prisma.user.update).mockResolvedValue({ ...userWithAvatar, avatar: null });
      
      // Mock realpath to return a path within uploads directory
      const expectedPath = join(process.cwd(), 'public', 'uploads', 'avatars', 'avatar.jpg');
      vi.mocked(realpath).mockResolvedValue(expectedPath);
      
      const request = createMockRequest();
      
      // Act
      const response = await DELETE(request);
      
      // Assert
      expect(response.status).toBe(200);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { avatar: null }
      });
      expect(unlink).toHaveBeenCalled();
      expect(securityLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'avatar_delete_success'
        })
      );
    });

    it('should return 401 for unauthenticated request', async () => {
      // Setup - override the default mock to return no token
      vi.mocked(cookies).mockResolvedValue(createMockCookies()); // No token
      
      const request = createMockRequest();
      
      // Act
      const response = await DELETE(request);
      
      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 400 when user has no avatar', async () => {
      // Setup
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser); // No avatar
      
      const request = createMockRequest();
      
      // Act
      const response = await DELETE(request);
      
      // Assert
      expect(response.status).toBe(400);
    });

    it('should handle database errors during deletion', async () => {
      // Setup
      const userWithAvatar = { ...mockUser, avatar: 'uploads/avatars/avatar.jpg' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(userWithAvatar);
      vi.mocked(prisma.user.update).mockRejectedValue(new Error('Database error'));
      
      const request = createMockRequest();
      
      // Act
      const response = await DELETE(request);
      
      // Assert
      expect(response.status).toBe(500);
      expect(securityLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'avatar_delete_failed'
        })
      );
    });

    it('should handle file deletion errors gracefully', async () => {
      // Setup
      const userWithAvatar = { ...mockUser, avatar: 'uploads/avatars/avatar.jpg' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(userWithAvatar);
      vi.mocked(prisma.user.update).mockResolvedValue({ ...userWithAvatar, avatar: null });
      vi.mocked(realpath).mockRejectedValue(new Error('File not found'));
      
      const request = createMockRequest();
      
      // Act
      const response = await DELETE(request);
      
      // Assert
      expect(response.status).toBe(200); // Should still succeed even if file cleanup fails
    });
  });

  describe('Security Functions', () => {
    it('should detect various malicious URL patterns in SSRF check', async () => {
      // Test different malicious patterns
      const maliciousContents = [
        'http://localhost:3000/admin',
        'http://127.0.0.1/internal',
        'http://0.0.0.0/system',
        'http://[::1]/loopback'
      ];
      
      for (const content of maliciousContents) {
        const file = createMockFile('malicious.jpg', content.length, 'image/jpeg', content);
        const request = createMockRequest(file);
        
        vi.mocked(IPValidator.validateURLHost).mockReturnValue({
          isValid: false,
          type: 'ipv4',
          isPrivate: true,
          isReserved: false,
          isLoopback: true,
          isMulticast: false,
          isLinkLocal: false,
          riskLevel: 'critical',
          allowedForSSRF: false,
          reason: 'Malicious IP detected'
        });
        
        const response = await POST(request);
        expect(response.status).toBe(400);
      }
    });

    it('should analyze different image metadata formats', async () => {
      // Setup with EXIF metadata
      const mockSharp = {
        metadata: vi.fn().mockResolvedValue({
          width: 800,
          height: 600,
          format: 'jpeg',
          exif: {
            UserComment: '<script>alert("xss")</script>',
            ImageDescription: 'javascript:void(0)',
            Software: 'http://malicious.com',
            Copyright: 'https://evil.com'
          }
        }),
        resize: vi.fn().mockReturnThis(),
        rotate: vi.fn().mockReturnThis(),
        withMetadata: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed image'))
      };
      vi.mocked(sharp).mockReturnValue(mockSharp as any);
      
      const file = createMockFile('suspicious-metadata.jpg', 1024, 'image/jpeg');
      const request = createMockRequest(file);
      
      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(400);
      expect(securityLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'suspicious_compression'
        })
      );
    });

    it('should handle excessive EXIF metadata', async () => {
      // Setup with many EXIF fields
      const excessiveExif: Record<string, string> = {};
      for (let i = 0; i < 60; i++) {
        excessiveExif[`Field${i}`] = `Value${i}`;
      }
      
      const mockSharp = {
        metadata: vi.fn().mockResolvedValue({
          width: 800,
          height: 600,
          format: 'jpeg',
          exif: excessiveExif
        }),
        resize: vi.fn().mockReturnThis(),
        rotate: vi.fn().mockReturnThis(),
        withMetadata: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed image'))
      };
      vi.mocked(sharp).mockReturnValue(mockSharp as any);
      
      const file = createMockFile('excessive-metadata.jpg', 1024, 'image/jpeg');
      const request = createMockRequest(file);
      
      // Act
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('Path Validation', () => {
    it('should reject various path traversal attempts', async () => {
      // This tests the isValidAvatarPath function indirectly through file operations
      const userWithSuspiciousAvatar = { 
        ...mockUser, 
        avatar: '../../../etc/passwd' // Path traversal attempt
      };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(userWithSuspiciousAvatar);
      
      const request = createMockRequest();
      
      // Act
      const response = await DELETE(request);
      
      // Assert - should handle gracefully and not attempt to delete the suspicious path
      expect(response.status).toBe(200);
      expect(unlink).not.toHaveBeenCalled(); // Should not attempt to delete unsafe path
    });
  });
});
