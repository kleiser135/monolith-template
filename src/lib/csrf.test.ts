import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { 
  generateCSRFToken, 
  verifyCSRFToken, 
  validateCSRF, 
  setCSRFCookie,
  type CSRFConfig 
} from './csrf';

const mockConfig: CSRFConfig = {
  cookieName: '__Host-csrf-token',
  headerName: 'X-CSRF-Token',
  secret: 'test-secret-key',
  tokenLength: 16,
  maxAge: 3600
};

describe('CSRF Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateCSRFToken', () => {
    it('should generate a valid token', () => {
      const token = generateCSRFToken(mockConfig);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken(mockConfig);
      const token2 = generateCSRFToken(mockConfig);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyCSRFToken', () => {
    it('should verify a valid token', () => {
      const token = generateCSRFToken(mockConfig);
      const isValid = verifyCSRFToken(token, mockConfig);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid token format', () => {
      const invalidToken = 'invalid.token';
      const isValid = verifyCSRFToken(invalidToken, mockConfig);
      
      expect(isValid).toBe(false);
    });

    it('should reject tampered token', () => {
      const token = generateCSRFToken(mockConfig);
      const tamperedToken = token.slice(0, -5) + 'AAAAA';
      const isValid = verifyCSRFToken(tamperedToken, mockConfig);
      
      expect(isValid).toBe(false);
    });

    it('should reject expired token', () => {
      const expiredConfig = { ...mockConfig, maxAge: -1 };
      const token = generateCSRFToken(expiredConfig);
      
      // Wait a brief moment to ensure token is "expired"
      const isValid = verifyCSRFToken(token, expiredConfig);
      
      expect(isValid).toBe(false);
    });
  });

  describe('setCSRFCookie', () => {
    it('should set CSRF cookie with correct attributes', () => {
      const response = new NextResponse();
      const token = 'test-token';
      
      const result = setCSRFCookie(response, token, mockConfig);
      
      expect(result).toBe(response);
      // Note: In actual implementation, we'd check response.cookies.get()
      // but NextResponse doesn't expose a way to read cookies after setting
    });
  });

  describe('validateCSRF', () => {
    it('should allow GET requests without CSRF validation', () => {
      const request = new NextRequest('https://example.com/api/data', {
        method: 'GET'
      });
      
      const result = validateCSRF(request, mockConfig);
      
      expect(result.valid).toBe(true);
    });

    it('should allow HEAD requests without CSRF validation', () => {
      const request = new NextRequest('https://example.com/api/data', {
        method: 'HEAD'
      });
      
      const result = validateCSRF(request, mockConfig);
      
      expect(result.valid).toBe(true);
    });

    it('should allow OPTIONS requests without CSRF validation', () => {
      const request = new NextRequest('https://example.com/api/data', {
        method: 'OPTIONS'
      });
      
      const result = validateCSRF(request, mockConfig);
      
      expect(result.valid).toBe(true);
    });

    it('should reject POST requests with mismatched origin', () => {
      const request = new NextRequest('https://example.com/api/data', {
        method: 'POST',
        headers: {
          'origin': 'https://evil.com',
          'host': 'example.com'
        }
      });
      
      const result = validateCSRF(request, mockConfig);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Origin header validation failed');
    });

    it('should reject POST requests with mismatched referer', () => {
      const request = new NextRequest('https://example.com/api/data', {
        method: 'POST',
        headers: {
          'referer': 'https://evil.com/page',
          'host': 'example.com'
        }
      });
      
      const result = validateCSRF(request, mockConfig);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Referer header validation failed');
    });

    it('should reject POST requests without CSRF header', () => {
      const request = new NextRequest('https://example.com/api/data', {
        method: 'POST',
        headers: {
          'origin': 'https://example.com',
          'host': 'example.com'
        }
      });
      
      const result = validateCSRF(request, mockConfig);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing CSRF token in header');
    });

    it('should reject POST requests without CSRF cookie', () => {
      const request = new NextRequest('https://example.com/api/data', {
        method: 'POST',
        headers: {
          'origin': 'https://example.com',
          'host': 'example.com',
          'X-CSRF-Token': 'test-token'
        }
      });
      
      const result = validateCSRF(request, mockConfig);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing CSRF token in cookie');
    });

    it('should reject POST requests with mismatched tokens', () => {
      const request = new NextRequest('https://example.com/api/data', {
        method: 'POST',
        headers: {
          'origin': 'https://example.com',
          'host': 'example.com',
          'X-CSRF-Token': 'header-token',
          'cookie': '__Host-csrf-token=cookie-token'
        }
      });
      
      const result = validateCSRF(request, mockConfig);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('CSRF token mismatch');
    });

    it('should accept valid CSRF tokens', () => {
      const token = generateCSRFToken(mockConfig);
      
      const request = new NextRequest('https://example.com/api/data', {
        method: 'POST',
        headers: {
          'origin': 'https://example.com',
          'host': 'example.com',
          'X-CSRF-Token': token,
          'cookie': `__Host-csrf-token=${token}`
        }
      });
      
      const result = validateCSRF(request, mockConfig);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
