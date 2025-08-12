import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

// Mock environment variables
const _mockEnv = (env: Record<string, string>) => {
  vi.stubEnv('NODE_ENV', env.NODE_ENV || 'test');
  vi.stubEnv('JWT_SECRET', env.JWT_SECRET || 'test-secret');
};

// Helper to create a NextRequest
const createRequest = (url: string, cookies: Record<string, string> = {}) => {
  const request = new NextRequest(url);
  
  // Mock cookies
  Object.entries(cookies).forEach(([name, value]) => {
    request.cookies.set(name, value);
  });
  
  return request;
};

/**
 * TEST-ONLY JWT Token Creation
 * 
 * WARNING: This mock JWT implementation uses simple base64 encoding without proper HMAC validation.
 * It is ONLY suitable for testing purposes and must NEVER be used in production code.
 * 
 * Production JWT handling should use:
 * - Proper cryptographic signing with HMAC-SHA256
 * - Secure secret management
 * - Token expiration validation
 * - Proper signature verification
 * 
 * See: src/middleware.ts for production JWT implementation
 */
const createJWTToken = (payload: Record<string, any>) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = 'mock-signature'; // TEST ONLY: Not cryptographically secure
  return `${header}.${encodedPayload}.${signature}`;
};

describe('Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    // Setup default environment
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('JWT_SECRET', 'test-secret');
  });

  describe('Route Protection', () => {
    it('should redirect unauthenticated users from protected routes to login', () => {
      const request = createRequest('http://localhost:3000/dashboard');
      const response = middleware(request);
      
      expect(response.status).toBe(307); // Redirect status
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('should allow authenticated users to access protected routes', () => {
      const validToken = createJWTToken({
        userId: 'user123',
        exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
        iat: Math.floor(Date.now() / 1000)
      });
      
      const request = createRequest('http://localhost:3000/dashboard', { token: validToken });
      const response = middleware(request);
      
      // Should allow access (no redirect)
      expect(response.status).not.toBe(307);
    });

    it('should redirect authenticated users from auth-only routes to dashboard', () => {
      const validToken = createJWTToken({
        userId: 'user123',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      });
      
      const request = createRequest('http://localhost:3000/login', { token: validToken });
      const response = middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('should allow unauthenticated users to access auth-only routes', () => {
      const request = createRequest('http://localhost:3000/login');
      const response = middleware(request);
      
      expect(response.status).not.toBe(307);
    });

    it('should allow access to public routes regardless of auth status', () => {
      const publicRoutes = ['/email-verification', '/landing'];
      
      publicRoutes.forEach(route => {
        const request = createRequest(`http://localhost:3000${route}`);
        const response = middleware(request);
        expect(response.status).not.toBe(307);
      });
    });
  });

  describe('Root Path Handling', () => {
    it('should redirect authenticated users from root to dashboard', () => {
      const validToken = createJWTToken({
        userId: 'user123',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      });
      
      const request = createRequest('http://localhost:3000/', { token: validToken });
      const response = middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('should allow unauthenticated users to see the landing page at root', () => {
      const request = createRequest('http://localhost:3000/');
      const response = middleware(request);
      
      expect(response.status).not.toBe(307);
    });
  });

  describe('Token Validation', () => {
    it('should reject malformed tokens', () => {
      const malformedToken = 'invalid.token';
      const request = createRequest('http://localhost:3000/dashboard', { token: malformedToken });
      const response = middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('should reject expired tokens', () => {
      const expiredToken = createJWTToken({
        userId: 'user123',
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 7200
      });
      
      const request = createRequest('http://localhost:3000/dashboard', { token: expiredToken });
      const response = middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('should clear invalid tokens and redirect from protected routes', () => {
      const invalidToken = 'invalid-token';
      const request = createRequest('http://localhost:3000/dashboard', { token: invalidToken });
      const response = middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
      
      // Check if token is cleared
      const setCookieHeader = response.headers.get('set-cookie');
      expect(setCookieHeader).toContain('token=;');
      expect(setCookieHeader).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    });

    it('should clear invalid tokens on auth pages but allow access', () => {
      const invalidToken = 'invalid-token';
      const request = createRequest('http://localhost:3000/login', { token: invalidToken });
      const response = middleware(request);
      
      expect(response.status).not.toBe(307); // Should not redirect
      
      // Check if token is cleared
      const setCookieHeader = response.headers.get('set-cookie');
      expect(setCookieHeader).toContain('token=;');
    });

    it('should handle missing JWT_SECRET environment variable', () => {
      vi.stubEnv('JWT_SECRET', '');
      
      const validToken = createJWTToken({
        userId: 'user123',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      });
      
      const request = createRequest('http://localhost:3000/dashboard', { token: validToken });
      const response = middleware(request);
      
      // Should treat as unauthenticated
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('should handle tokens with invalid JSON payload', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const invalidPayload = 'invalid-json';
      const signature = 'mock-signature';
      const invalidToken = `${header}.${invalidPayload}.${signature}`;
      
      const request = createRequest('http://localhost:3000/dashboard', { token: invalidToken });
      const response = middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });
  });

  describe('Upload Security Headers', () => {
    it('should apply security headers to uploaded files', () => {
      const request = createRequest('http://localhost:3000/uploads/avatars/test.jpg');
      const response = middleware(request);
      
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    });

    it('should apply strict CSP for uploaded files', () => {
      const request = createRequest('http://localhost:3000/uploads/documents/file.pdf');
      const response = middleware(request);
      
      const csp = response.headers.get('Content-Security-Policy');
      expect(csp).toContain("default-src 'none'");
      expect(csp).toContain("img-src 'self'");
      expect(csp).toContain("script-src 'none'");
      expect(csp).toContain("object-src 'none'");
    });

    it('should not apply upload headers to non-upload routes', () => {
      const request = createRequest('http://localhost:3000/dashboard');
      const response = middleware(request);
      
      expect(response.headers.get('X-Content-Type-Options')).toBeNull();
      expect(response.headers.get('Cache-Control')).toBeNull();
    });
  });

  describe('Route Matching', () => {
    it('should handle nested protected routes', () => {
      const request = createRequest('http://localhost:3000/dashboard/settings');
      const response = middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('should handle nested auth routes', () => {
      const validToken = createJWTToken({
        userId: 'user123',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      });
      
      const request = createRequest('http://localhost:3000/login/forgot', { token: validToken });
      const response = middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('should handle nested public routes', () => {
      const request = createRequest('http://localhost:3000/landing/features');
      const response = middleware(request);
      
      expect(response.status).not.toBe(307);
    });

    it('should normalize trailing slashes in route matching', () => {
      // Test that /dashboard/ is treated the same as /dashboard
      const request = createRequest('http://localhost:3000/dashboard/');
      const response = middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });
  });

  describe('Cookie Security', () => {
    it('should set secure cookie flags in production', () => {
      vi.stubEnv('NODE_ENV', 'production');
      
      const invalidToken = 'invalid-token';
      const request = createRequest('http://localhost:3000/dashboard', { token: invalidToken });
      const response = middleware(request);
      
      const setCookieHeader = response.headers.get('set-cookie');
      expect(setCookieHeader).toContain('Secure');
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('SameSite=strict');
      expect(setCookieHeader).toContain('Path=/');
    });

    it('should not set secure flag in non-production environments', () => {
      vi.stubEnv('NODE_ENV', 'development');
      
      const invalidToken = 'invalid-token';
      const request = createRequest('http://localhost:3000/dashboard', { token: invalidToken });
      const response = middleware(request);
      
      const setCookieHeader = response.headers.get('set-cookie');
      expect(setCookieHeader).not.toContain('Secure');
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('SameSite=strict');
    });
  });

  describe('Edge Cases', () => {
    it('should handle tokens without expiration', () => {
      const tokenWithoutExp = createJWTToken({
        userId: 'user123',
        iat: Math.floor(Date.now() / 1000)
        // No exp field
      });
      
      const request = createRequest('http://localhost:3000/dashboard', { token: tokenWithoutExp });
      const response = middleware(request);
      
      // Should allow access since no expiration is set
      expect(response.status).not.toBe(307);
    });

    it('should handle completely unknown routes', () => {
      const request = createRequest('http://localhost:3000/unknown-route');
      const response = middleware(request);
      
      // Should allow access to unknown routes (default behavior)
      expect(response.status).not.toBe(307);
    });

    it('should handle API routes (should be ignored by default)', () => {
      const request = createRequest('http://localhost:3000/api/health');
      const response = middleware(request);
      
      expect(response.status).not.toBe(307);
    });
  });

  describe('Development Mode Logging', () => {
    it('should log in development mode', () => {
      vi.stubEnv('NODE_ENV', 'development');
      
      // Mock console.log to test logging
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const request = createRequest('http://localhost:3000/dashboard');
      middleware(request);
      
      expect(consoleSpy).toHaveBeenCalledWith('[Middleware] /dashboard');
      
      consoleSpy.mockRestore();
    });

    it('should not log in production mode', () => {
      vi.stubEnv('NODE_ENV', 'production');
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const request = createRequest('http://localhost:3000/dashboard');
      middleware(request);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});
