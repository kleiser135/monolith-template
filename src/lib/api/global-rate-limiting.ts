/**
 * Global API rate limiting middleware
 * Implements sliding window rate limiting for API endpoints
 */

import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  windowStart: number;
  requests: number[];
}

interface GlobalRateLimitConfig {
  defaultMaxRequests: number;
  windowMs: number;
  authenticatedMaxRequests: number;
  anonymousMaxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

// In-memory store (use Redis in production)
const globalRateLimitStore = new Map<string, RateLimitEntry>();

const defaultConfig: GlobalRateLimitConfig = {
  defaultMaxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  authenticatedMaxRequests: 200,
  anonymousMaxRequests: 50,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
};

/**
 * Get rate limit configuration based on endpoint and user status
 */
function getRateLimitConfig(
  pathname: string, 
  isAuthenticated: boolean,
  baseConfig: GlobalRateLimitConfig = defaultConfig
): { maxRequests: number; windowMs: number } {
  // Special limits for auth endpoints
  if (pathname.startsWith('/api/auth/')) {
    return {
      maxRequests: 20, // Stricter for auth
      windowMs: 15 * 60 * 1000 // 15 minutes
    };
  }

  // Upload endpoints
  if (pathname.includes('/upload') || pathname.includes('/avatar')) {
    return {
      maxRequests: 10,
      windowMs: 60 * 60 * 1000 // 1 hour
    };
  }

  // Public API endpoints
  if (pathname.startsWith('/api/public/')) {
    return {
      maxRequests: 30,
      windowMs: baseConfig.windowMs
    };
  }

  // Default based on authentication status
  return {
    maxRequests: isAuthenticated 
      ? baseConfig.authenticatedMaxRequests 
      : baseConfig.anonymousMaxRequests,
    windowMs: baseConfig.windowMs
  };
}

/**
 * Check if request should be rate limited using sliding window
 */
export function checkGlobalRateLimit(
  request: NextRequest,
  isAuthenticated: boolean = false,
  config: GlobalRateLimitConfig = defaultConfig
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
} {
  const pathname = new URL(request.url).pathname;
  const clientIP = request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown';
  
  // Create identifier based on IP and auth status
  const identifier = isAuthenticated 
    ? `auth:${clientIP}:${pathname}` 
    : `anon:${clientIP}:${pathname}`;

  const { maxRequests, windowMs } = getRateLimitConfig(pathname, isAuthenticated, config);
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = globalRateLimitStore.get(identifier);

  if (!entry || entry.windowStart < windowStart) {
    // Create new window
    entry = {
      count: 1,
      windowStart: now,
      requests: [now]
    };
    globalRateLimitStore.set(identifier, entry);

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
      limit: maxRequests
    };
  }

  // Clean old requests from sliding window
  entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);
  entry.count = entry.requests.length;

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.requests[0] + windowMs,
      limit: maxRequests
    };
  }

  // Add current request
  entry.requests.push(now);
  entry.count++;
  globalRateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.requests[0] + windowMs,
    limit: maxRequests
  };
}

/**
 * Check rate limit specifically for authenticated users
 */
export function checkAuthenticatedRateLimit(
  request: NextRequest,
  userId: string,
  config: GlobalRateLimitConfig = defaultConfig
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
} {
  const pathname = new URL(request.url).pathname;
  const identifier = `user:${userId}:${pathname}`;
  
  const { maxRequests, windowMs } = getRateLimitConfig(pathname, true, config);
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = globalRateLimitStore.get(identifier);

  if (!entry || entry.windowStart < windowStart) {
    entry = {
      count: 1,
      windowStart: now,
      requests: [now]
    };
    globalRateLimitStore.set(identifier, entry);

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
      limit: maxRequests
    };
  }

  entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);
  entry.count = entry.requests.length;

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.requests[0] + windowMs,
      limit: maxRequests
    };
  }

  entry.requests.push(now);
  entry.count++;
  globalRateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.requests[0] + windowMs,
    limit: maxRequests
  };
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupGlobalRateLimit(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [identifier, entry] of globalRateLimitStore.entries()) {
    // Remove entries older than 1 hour
    if (now - entry.windowStart > 60 * 60 * 1000) {
      globalRateLimitStore.delete(identifier);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Get current rate limiting statistics
 */
export function getGlobalRateLimitStats(): {
  totalEntries: number;
  authenticatedEntries: number;
  anonymousEntries: number;
  avgRequestsPerEntry: number;
} {
  let authenticatedEntries = 0;
  let anonymousEntries = 0;
  let totalRequests = 0;

  for (const [identifier, entry] of globalRateLimitStore.entries()) {
    if (identifier.startsWith('auth:') || identifier.startsWith('user:')) {
      authenticatedEntries++;
    } else {
      anonymousEntries++;
    }
    totalRequests += entry.count;
  }

  const totalEntries = globalRateLimitStore.size;

  return {
    totalEntries,
    authenticatedEntries,
    anonymousEntries,
    avgRequestsPerEntry: totalEntries > 0 ? totalRequests / totalEntries : 0
  };
}

/**
 * Reset the global rate limit store (for testing purposes)
 */
export function resetGlobalRateLimitStore(): void {
  globalRateLimitStore.clear();
}
