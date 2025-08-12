import { NextResponse } from 'next/server'

/**
 * Production-ready security headers middleware
 * Adds comprehensive security headers to protect against common attacks
 */
export function addSecurityHeaders(response: NextResponse) {
  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Enable XSS protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Prevent DNS rebinding attacks
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  
  // Control download behavior
  response.headers.set('X-Download-Options', 'noopen')
  
  // Prevent content type sniffing on IE
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  
  // Basic CSP (can be customized per application needs)
  const cspPolicy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: Consider using nonces for production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', cspPolicy)
  
  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security', 
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  
  return response
}

/**
 * Additional security headers for API routes
 */
export function addApiSecurityHeaders(response: NextResponse) {
  // Add base security headers
  addSecurityHeaders(response)
  
  // API-specific headers
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  response.headers.set('Surrogate-Control', 'no-store')
  
  return response
}

/**
 * Security configuration for file uploads
 */
export function addUploadSecurityHeaders(response: NextResponse) {
  // Add base security headers
  addSecurityHeaders(response)
  
  // Strict CSP for uploaded content
  const strictCsp = [
    "default-src 'none'",
    "img-src 'self'",
    "style-src 'none'",
    "script-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', strictCsp)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  return response
}
