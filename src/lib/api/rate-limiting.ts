interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function checkRateLimit(
  userId: string, 
  config: RateLimitConfig = { maxRequests: 5, windowMs: 60 * 60 * 1000 } // 5 requests per hour
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `upload:${userId}`;
  
  const entry = rateLimitStore.get(key);
  
  // Clean up expired entries
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(key);
  }
  
  const currentEntry = rateLimitStore.get(key);
  
  if (!currentEntry) {
    // First request in window
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: config.maxRequests - 1, resetTime };
  }
  
  if (currentEntry.count >= config.maxRequests) {
    // Rate limit exceeded
    return { 
      allowed: false, 
      remaining: 0, 
      resetTime: currentEntry.resetTime 
    };
  }
  
  // Increment count
  currentEntry.count++;
  rateLimitStore.set(key, currentEntry);
  
  return { 
    allowed: true, 
    remaining: config.maxRequests - currentEntry.count, 
    resetTime: currentEntry.resetTime 
  };
}

// Cleanup function to remove expired entries (call periodically)
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Set up periodic cleanup (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
