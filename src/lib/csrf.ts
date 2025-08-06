/**
 * CSRF Protection Implementation
 * Implements double-submit cookie pattern for CSRF protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export interface CSRFConfig {
  cookieName: string;
  headerName: string;
  secret: string;
  tokenLength: number;
  maxAge: number; // in seconds
}

const defaultConfig: CSRFConfig = {
  cookieName: '__Host-csrf-token',
  headerName: 'X-CSRF-Token',
  secret: process.env.CSRF_SECRET || process.env.JWT_SECRET || 'fallback-csrf-secret',
  tokenLength: 32,
  maxAge: 24 * 60 * 60, // 24 hours
};

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(config: CSRFConfig = defaultConfig): string {
  const timestamp = Date.now().toString();
  const randomBytes = crypto.randomBytes(config.tokenLength);
  const tokenData = `${timestamp}.${randomBytes.toString('base64url')}`;
  
  // Create HMAC signature
  const hmac = crypto.createHmac('sha256', config.secret);
  hmac.update(tokenData);
  const signature = hmac.digest('base64url');
  
  return `${tokenData}.${signature}`;
}

/**
 * Verify CSRF token signature and timestamp
 */
export function verifyCSRFToken(token: string, config: CSRFConfig = defaultConfig): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    const [timestamp, randomPart, signature] = parts;
    const tokenData = `${timestamp}.${randomPart}`;

    // Verify signature
    const hmac = crypto.createHmac('sha256', config.secret);
    hmac.update(tokenData);
    const expectedSignature = hmac.digest('base64url');

    if (signature !== expectedSignature) {
      return false;
    }

    // Check token age
    const tokenTime = parseInt(timestamp, 10);
    const now = Date.now();
    const ageInSeconds = (now - tokenTime) / 1000;

    if (ageInSeconds > config.maxAge) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Set CSRF token in response cookies
 */
export function setCSRFCookie(response: NextResponse, token: string, config: CSRFConfig = defaultConfig): NextResponse {
  response.cookies.set(config.cookieName, token, {
    httpOnly: false, // Must be readable by JavaScript for form submission
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: config.maxAge,
    path: '/',
  });

  return response;
}

/**
 * Middleware function to validate CSRF tokens on state-changing requests
 */
export function validateCSRF(request: NextRequest, config: CSRFConfig = defaultConfig): { valid: boolean; error?: string } {
  const method = request.method.toUpperCase();
  
  // Skip CSRF validation for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true };
  }

  // Check Origin/Referer headers first
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  
  if (origin) {
    const originHost = new URL(origin).host;
    if (originHost !== host) {
      return { valid: false, error: 'Origin header validation failed' };
    }
  } else if (referer) {
    const refererHost = new URL(referer).host;
    if (refererHost !== host) {
      return { valid: false, error: 'Referer header validation failed' };
    }
  } else {
    return { valid: false, error: 'Missing Origin and Referer headers' };
  }

  // Get token from header
  const headerToken = request.headers.get(config.headerName);
  if (!headerToken) {
    return { valid: false, error: 'Missing CSRF token in header' };
  }

  // Get token from cookie
  const cookieToken = request.cookies.get(config.cookieName)?.value;
  if (!cookieToken) {
    return { valid: false, error: 'Missing CSRF token in cookie' };
  }

  // Double-submit cookie pattern: tokens must match
  if (headerToken !== cookieToken) {
    return { valid: false, error: 'CSRF token mismatch' };
  }

  // Verify token signature and timestamp
  if (!verifyCSRFToken(headerToken, config)) {
    return { valid: false, error: 'Invalid CSRF token' };
  }

  return { valid: true };
}

/**
 * Get or generate CSRF token for forms
 */
export async function getCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(defaultConfig.cookieName)?.value;

  if (existingToken && verifyCSRFToken(existingToken)) {
    return existingToken;
  }

  return generateCSRFToken();
}
