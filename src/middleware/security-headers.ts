import { NextResponse } from 'next/server';

export function addSecurityHeaders(response: NextResponse, isUploadedFile: boolean = false): NextResponse {
  // Basic security headers for all responses
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Enhanced CSP for uploaded files
  if (isUploadedFile) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; script-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none';"
    );
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  return response;
}

export function createSecureUploadResponse(data: any, message: string): NextResponse {
  const response = NextResponse.json({ ...data, message });
  return addSecurityHeaders(response, false);
}
