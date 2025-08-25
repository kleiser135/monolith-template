import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkRateLimit, RATE_LIMITS, getRateLimitIdentifier, createRateLimitMiddleware } from '@/lib/redis/rate-limiter';

// Mock Redis client
vi.mock('@/lib/redis/client', () => ({
  getRedisClient: vi.fn().mockReturnValue({
    get: vi.fn().mockResolvedValue(null),
    zremrangebyscore: vi.fn().mockResolvedValue(0),
    zcard: vi.fn().mockResolvedValue(0),
    zadd: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    setex: vi.fn().mockResolvedValue('OK'),
  }),
  isRedisAvailable: vi.fn().mockResolvedValue(false), // Default to memory store for testing
}));

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RATE_LIMITS constants', () => {
    it('should have predefined rate limit configurations', () => {
      expect(RATE_LIMITS.LOGIN).toEqual({
        windowMs: 15 * 60 * 1000,
        maxRequests: 5,
      });
      
      expect(RATE_LIMITS.REFRESH).toEqual({
        windowMs: 60 * 1000,
        maxRequests: 10,
      });
      
      expect(RATE_LIMITS.API_GENERAL).toEqual({
        windowMs: 60 * 1000,
        maxRequests: 100,
      });
    });
  });

  describe('getRateLimitIdentifier', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const mockRequest = new Request('http://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      });

      const identifier = getRateLimitIdentifier(mockRequest);
      expect(identifier).toBe('ip:192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const mockRequest = new Request('http://example.com', {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
      });

      const identifier = getRateLimitIdentifier(mockRequest);
      expect(identifier).toBe('ip:192.168.1.2');
    });

    it('should fallback to unknown for missing IP headers', () => {
      const mockRequest = new Request('http://example.com');

      const identifier = getRateLimitIdentifier(mockRequest);
      expect(identifier).toBe('ip:unknown');
    });

    it('should use auth header hash when available', () => {
      const mockRequest = new Request('http://example.com', {
        headers: {
          'authorization': 'Bearer test-token-123',
          'x-forwarded-for': '192.168.1.1',
        },
      });

      const identifier = getRateLimitIdentifier(mockRequest);
      expect(identifier).toMatch(/^user:/);
    });
  });

  describe('checkRateLimit', () => {
    it('should allow request when under limit', async () => {
      const config = { windowMs: 60000, maxRequests: 10 };
      const result = await checkRateLimit('test-ip', config);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.blocked).toBe(false);
    });

    it('should block request when over limit', async () => {
      const config = { windowMs: 60000, maxRequests: 1 };
      
      // First request should succeed
      const result1 = await checkRateLimit('test-ip-2', config);
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(0);

      // Second request should be blocked
      const result2 = await checkRateLimit('test-ip-2', config);
      expect(result2.success).toBe(false);
      expect(result2.remaining).toBe(0);
      expect(result2.blocked).toBe(false);
    });

    it('should handle block duration configuration', async () => {
      const config = { 
        windowMs: 60000, 
        maxRequests: 1, 
        blockDurationMs: 30000 
      };
      
      // Exceed the limit
      await checkRateLimit('test-ip-3', config);
      const result = await checkRateLimit('test-ip-3', config);

      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.retryAfter).toBe(30000);
    });

    it('should fail open on error', async () => {
      // Mock an error scenario
      const { isRedisAvailable } = await import('@/lib/redis/client');
      vi.mocked(isRedisAvailable).mockRejectedValueOnce(new Error('Redis error'));

      const config = { windowMs: 60000, maxRequests: 10 };
      const result = await checkRateLimit('test-ip-error', config);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(10);
    });
  });

  describe('createRateLimitMiddleware', () => {
    it('should return null when under rate limit', async () => {
      const middleware = createRateLimitMiddleware(
        { windowMs: 60000, maxRequests: 100 },
        'test'
      );

      const mockRequest = new Request('http://example.com', {
        headers: { 'x-forwarded-for': '192.168.1.10' },
      });

      const response = await middleware(mockRequest);
      expect(response).toBeNull();
    });

    it('should return 429 response when over rate limit', async () => {
      const middleware = createRateLimitMiddleware(
        { windowMs: 60000, maxRequests: 1 },
        'test-strict'
      );

      const mockRequest = new Request('http://example.com', {
        headers: { 'x-forwarded-for': '192.168.1.11' },
      });

      // First request - should pass
      const response1 = await middleware(mockRequest);
      expect(response1).toBeNull();

      // Second request - should be blocked
      const response2 = await middleware(mockRequest);
      expect(response2).toBeDefined();
      expect(response2!.status).toBe(429);

      const body = await response2!.json();
      expect(body.error).toBe('Too Many Requests');
    });

    it('should include proper headers in rate limit response', async () => {
      const config = { windowMs: 60000, maxRequests: 1, blockDurationMs: 30000 };
      const middleware = createRateLimitMiddleware(config, 'test-headers');

      const mockRequest = new Request('http://example.com', {
        headers: { 'x-forwarded-for': '192.168.1.12' },
      });

      // Exceed the limit
      await middleware(mockRequest);
      const response = await middleware(mockRequest);

      expect(response).toBeDefined();
      expect(response!.headers.get('X-RateLimit-Limit')).toBe('1');
      expect(response!.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response!.headers.get('X-RateLimit-Reset')).toBeDefined();
      expect(response!.headers.get('Retry-After')).toBeDefined();
    });
  });
});
