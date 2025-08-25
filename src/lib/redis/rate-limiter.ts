import { getRedisClient, isRedisAvailable } from './client';

export interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  maxRequests: number; // Max requests per window
  blockDurationMs?: number; // How long to block after limit exceeded
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  blocked: boolean;
  retryAfter?: number;
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // Authentication endpoints
  LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
  REFRESH: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 refreshes per minute
  LOGOUT: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 logouts per minute
  
  // Password operations
  FORGOT_PASSWORD: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 attempts per hour
  RESET_PASSWORD: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 resets per hour
  
  // API endpoints
  API_GENERAL: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
  API_INTENSIVE: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 requests per minute
  
  // User registration
  REGISTRATION: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 registrations per hour
} as const;

class MemoryStore {
  private store = new Map<string, { count: number; reset: number; blocked?: number }>();

  async get(key: string): Promise<{ count: number; reset: number; blocked?: number } | null> {
    const now = Date.now();
    const record = this.store.get(key);
    
    if (!record) return null;
    
    // Clean up expired records
    if (record.reset < now && !record.blocked) {
      this.store.delete(key);
      return null;
    }
    
    return record;
  }

  async set(key: string, value: { count: number; reset: number; blocked?: number }): Promise<void> {
    this.store.set(key, value);
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; reset: number }> {
    const now = Date.now();
    const record = this.store.get(key);
    
    if (!record || record.reset < now) {
      const newRecord = { count: 1, reset: now + windowMs };
      this.store.set(key, newRecord);
      return newRecord;
    }
    
    record.count++;
    this.store.set(key, record);
    return record;
  }

  async block(key: string, durationMs: number): Promise<void> {
    const now = Date.now();
    const record = this.store.get(key) || { count: 0, reset: now };
    record.blocked = now + durationMs;
    this.store.set(key, record);
  }
}

const memoryStore = new MemoryStore();

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
  category: string = 'default'
): Promise<RateLimitResult> {
  const key = `rate_limit:${category}:${identifier}`;
  const now = Date.now();

  try {
    const redisAvailable = await isRedisAvailable();
    
    if (redisAvailable) {
      return await checkRateLimitRedis(key, config, now);
    } else {
      return await checkRateLimitMemory(key, config, now);
    }
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open - allow request if rate limiting fails
    return {
      success: true,
      remaining: config.maxRequests,
      reset: now + config.windowMs,
      blocked: false,
    };
  }
}

async function checkRateLimitRedis(
  key: string,
  config: RateLimitConfig,
  now: number
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  
  // Check if currently blocked
  const blockKey = `${key}:blocked`;
  const blockedUntil = await redis.get(blockKey);
  
  if (blockedUntil && parseInt(blockedUntil) > now) {
    return {
      success: false,
      remaining: 0,
      reset: parseInt(blockedUntil),
      blocked: true,
      retryAfter: parseInt(blockedUntil) - now,
    };
  }

  // Use sliding window log approach
  const windowStart = now - config.windowMs;
  
  // Remove old entries and count current requests
  await redis.zremrangebyscore(key, '-inf', windowStart);
  const currentCount = await redis.zcard(key);
  
  if (currentCount >= config.maxRequests) {
    // Block if configured
    if (config.blockDurationMs) {
      const blockUntil = now + config.blockDurationMs;
      await redis.setex(blockKey, Math.ceil(config.blockDurationMs / 1000), blockUntil.toString());
      
      return {
        success: false,
        remaining: 0,
        reset: blockUntil,
        blocked: true,
        retryAfter: config.blockDurationMs,
      };
    }
    
    return {
      success: false,
      remaining: 0,
      reset: now + config.windowMs,
      blocked: false,
    };
  }

  // Add current request
  await redis.zadd(key, now, `${now}-${Math.random()}`);
  await redis.expire(key, Math.ceil(config.windowMs / 1000));

  return {
    success: true,
    remaining: config.maxRequests - currentCount - 1,
    reset: now + config.windowMs,
    blocked: false,
  };
}

async function checkRateLimitMemory(
  key: string,
  config: RateLimitConfig,
  now: number
): Promise<RateLimitResult> {
  // Check if currently blocked
  const record = await memoryStore.get(key);
  
  if (record?.blocked && record.blocked > now) {
    return {
      success: false,
      remaining: 0,
      reset: record.blocked,
      blocked: true,
      retryAfter: record.blocked - now,
    };
  }

  // Increment counter
  const current = await memoryStore.increment(key, config.windowMs);
  
  if (current.count > config.maxRequests) {
    // Block if configured
    if (config.blockDurationMs) {
      await memoryStore.block(key, config.blockDurationMs);
      
      return {
        success: false,
        remaining: 0,
        reset: now + config.blockDurationMs,
        blocked: true,
        retryAfter: config.blockDurationMs,
      };
    }
    
    return {
      success: false,
      remaining: 0,
      reset: current.reset,
      blocked: false,
    };
  }

  return {
    success: true,
    remaining: config.maxRequests - current.count,
    reset: current.reset,
    blocked: false,
  };
}

// Helper function to get rate limit identifier from request
export function getRateLimitIdentifier(req: Request): string {
  // Try to get user ID from authenticated request
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    try {
      // This would need to be implemented based on your auth system
      // For now, use a hash of the auth header
      return `user:${btoa(authHeader).slice(0, 16)}`;
    } catch {
      // Fall through to IP-based limiting
    }
  }

  // Fall back to IP-based limiting
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return `ip:${ip}`;
}

// Helper to create rate limit middleware
export function createRateLimitMiddleware(config: RateLimitConfig, category: string) {
  return async (req: Request): Promise<Response | null> => {
    const identifier = getRateLimitIdentifier(req);
    const result = await checkRateLimit(identifier, config, category);

    if (!result.success) {
      const headers = new Headers({
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.reset).toISOString(),
      });

      if (result.retryAfter) {
        headers.set('Retry-After', Math.ceil(result.retryAfter / 1000).toString());
      }

      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: result.blocked 
            ? 'You have been temporarily blocked due to too many requests'
            : 'Rate limit exceeded. Please try again later.',
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers,
        }
      );
    }

    return null; // Allow request to proceed
  };
}
