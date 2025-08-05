import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { 
  addSecurityHeaders, 
  addApiSecurityHeaders, 
  addUploadSecurityHeaders 
} from '@/lib/security-headers'

describe('Security Headers', () => {
  let mockResponse: NextResponse

  beforeEach(() => {
    // Create a mock NextResponse with headers
    const headers = new Headers()
    mockResponse = {
      headers,
      status: 200
    } as NextResponse

    vi.clearAllMocks()
  })

  describe('addSecurityHeaders', () => {
    it('should add basic security headers', () => {
      const result = addSecurityHeaders(mockResponse)

      expect(result.headers.get('X-Frame-Options')).toBe('DENY')
      expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(result.headers.get('X-XSS-Protection')).toBe('1; mode=block')
      expect(result.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
      expect(result.headers.get('X-DNS-Prefetch-Control')).toBe('off')
      expect(result.headers.get('X-Download-Options')).toBe('noopen')
      expect(result.headers.get('X-Permitted-Cross-Domain-Policies')).toBe('none')
    })

    it('should add Content Security Policy headers', () => {
      const result = addSecurityHeaders(mockResponse)
      const csp = result.headers.get('Content-Security-Policy')

      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'")
      expect(csp).toContain("style-src 'self' 'unsafe-inline'")
      expect(csp).toContain("img-src 'self' data: https:")
      expect(csp).toContain("object-src 'none'")
      expect(csp).toContain("base-uri 'self'")
      expect(csp).toContain("form-action 'self'")
      expect(csp).toContain("frame-ancestors 'none'")
      expect(csp).toContain('upgrade-insecure-requests')
    })

    it('should not add HSTS headers in development environment', () => {
      vi.stubEnv('NODE_ENV', 'development')
      
      const result = addSecurityHeaders(mockResponse)
      
      expect(result.headers.get('Strict-Transport-Security')).toBeNull()
    })

    it('should add HSTS headers in production environment', () => {
      vi.stubEnv('NODE_ENV', 'production')
      
      const result = addSecurityHeaders(mockResponse)
      
      expect(result.headers.get('Strict-Transport-Security')).toBe(
        'max-age=31536000; includeSubDomains; preload'
      )
    })

    it('should return the same response object', () => {
      const result = addSecurityHeaders(mockResponse)
      expect(result).toBe(mockResponse)
    })
  })

  describe('addApiSecurityHeaders', () => {
    it('should add all basic security headers', () => {
      const result = addApiSecurityHeaders(mockResponse)

      expect(result.headers.get('X-Frame-Options')).toBe('DENY')
      expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(result.headers.get('Content-Security-Policy')).toContain("default-src 'self'")
    })

    it('should add API-specific cache control headers', () => {
      const result = addApiSecurityHeaders(mockResponse)

      expect(result.headers.get('Cache-Control')).toBe(
        'no-store, no-cache, must-revalidate, proxy-revalidate'
      )
      expect(result.headers.get('Pragma')).toBe('no-cache')
      expect(result.headers.get('Expires')).toBe('0')
      expect(result.headers.get('Surrogate-Control')).toBe('no-store')
    })

    it('should return the same response object', () => {
      const result = addApiSecurityHeaders(mockResponse)
      expect(result).toBe(mockResponse)
    })
  })

  describe('addUploadSecurityHeaders', () => {
    it('should add all basic security headers', () => {
      const result = addUploadSecurityHeaders(mockResponse)

      expect(result.headers.get('X-Frame-Options')).toBe('DENY')
      expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })

    it('should add strict CSP for uploaded content', () => {
      const result = addUploadSecurityHeaders(mockResponse)
      const csp = result.headers.get('Content-Security-Policy')

      expect(csp).toContain("default-src 'none'")
      expect(csp).toContain("img-src 'self'")
      expect(csp).toContain("style-src 'none'")
      expect(csp).toContain("script-src 'none'")
      expect(csp).toContain("object-src 'none'")
      expect(csp).toContain("base-uri 'none'")
      expect(csp).toContain("form-action 'none'")
      expect(csp).toContain("frame-ancestors 'none'")
    })

    it('should override the base CSP with stricter upload CSP', () => {
      // First add base security headers
      addSecurityHeaders(mockResponse)
      const baseCsp = mockResponse.headers.get('Content-Security-Policy')
      expect(baseCsp).toContain("default-src 'self'")

      // Then add upload security headers which should override
      const result = addUploadSecurityHeaders(mockResponse)
      const uploadCsp = result.headers.get('Content-Security-Policy')
      
      expect(uploadCsp).toContain("default-src 'none'")
      expect(uploadCsp).not.toContain("default-src 'self'")
    })

    it('should return the same response object', () => {
      const result = addUploadSecurityHeaders(mockResponse)
      expect(result).toBe(mockResponse)
    })
  })

  describe('Headers integration', () => {
    it('should handle multiple header additions without conflicts', () => {
      // Add base headers
      addSecurityHeaders(mockResponse)
      expect(mockResponse.headers.get('X-Frame-Options')).toBe('DENY')

      // Add API headers (should not conflict)
      addApiSecurityHeaders(mockResponse)
      expect(mockResponse.headers.get('X-Frame-Options')).toBe('DENY') // Should still be there
      expect(mockResponse.headers.get('Cache-Control')).toBe(
        'no-store, no-cache, must-revalidate, proxy-revalidate'
      )
    })

    it('should allow header overrides when needed', () => {
      // Add base headers
      addSecurityHeaders(mockResponse)
      const originalCsp = mockResponse.headers.get('Content-Security-Policy')
      expect(originalCsp).toContain("default-src 'self'")

      // Add upload headers (should override CSP)
      addUploadSecurityHeaders(mockResponse)
      const newCsp = mockResponse.headers.get('Content-Security-Policy')
      expect(newCsp).toContain("default-src 'none'")
      expect(newCsp).not.toBe(originalCsp)
    })
  })
})
