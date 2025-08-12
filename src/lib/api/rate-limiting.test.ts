import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkRateLimit, cleanupRateLimitStore, RateLimitConfig } from './rate-limiting';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear the rate limit store before each test
    cleanupRateLimitStore();
    // Clear any existing store entries by setting time far in the future
    vi.setSystemTime(new Date(Date.now() + 24 * 60 * 60 * 1000));
    cleanupRateLimitStore();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('checkRateLimit', () => {
    it('should allow first request and return correct remaining count', () => {
      const config: RateLimitConfig = { maxRequests: 3, windowMs: 60000 }; // 3 requests per minute
      
      const result = checkRateLimit('user123', config);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
      expect(result.resetTime).toBeGreaterThan(Date.now());
      expect(result.resetTime).toBeLessThanOrEqual(Date.now() + config.windowMs);
    });

    it('should use default config when none provided', () => {
      const result = checkRateLimit('user456');
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // Default is 5 requests
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it('should track multiple requests within window', () => {
      const config: RateLimitConfig = { maxRequests: 3, windowMs: 60000 };
      
      // First request
      const result1 = checkRateLimit('user789', config);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(2);
      
      // Second request
      const result2 = checkRateLimit('user789', config);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(1);
      
      // Third request
      const result3 = checkRateLimit('user789', config);
      expect(result3.allowed).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it('should reject requests when rate limit is exceeded', () => {
      const config: RateLimitConfig = { maxRequests: 2, windowMs: 60000 };
      
      // Use up the allowed requests
      checkRateLimit('user999', config);
      checkRateLimit('user999', config);
      
      // This should be rejected
      const result = checkRateLimit('user999', config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should maintain separate limits for different users', () => {
      const config: RateLimitConfig = { maxRequests: 2, windowMs: 60000 };
      
      // User A uses their limit
      checkRateLimit('userA', config);
      checkRateLimit('userA', config);
      
      // User B should still have their full limit
      const resultB = checkRateLimit('userB', config);
      expect(resultB.allowed).toBe(true);
      expect(resultB.remaining).toBe(1);
      
      // User A should be blocked
      const resultA = checkRateLimit('userA', config);
      expect(resultA.allowed).toBe(false);
    });

    it('should reset limits after window expires', () => {
      const config: RateLimitConfig = { maxRequests: 2, windowMs: 1000 }; // 1 second window
      
      // Use up the limit
      checkRateLimit('userTime', config);
      const blockedResult = checkRateLimit('userTime', config);
      expect(blockedResult.allowed).toBe(true);
      expect(blockedResult.remaining).toBe(0);
      
      // Should be blocked on next request
      const finalResult = checkRateLimit('userTime', config);
      expect(finalResult.allowed).toBe(false);
      
      // Fast forward past the window
      vi.setSystemTime(new Date(Date.now() + 1100));
      
      // Should be allowed again
      const resetResult = checkRateLimit('userTime', config);
      expect(resetResult.allowed).toBe(true);
      expect(resetResult.remaining).toBe(1);
    });

    it('should clean up expired entries automatically', () => {
      const config: RateLimitConfig = { maxRequests: 1, windowMs: 1000 };
      
      // Create an entry
      checkRateLimit('userCleanup', config);
      
      // Fast forward past expiration
      vi.setSystemTime(new Date(Date.now() + 1100));
      
      // Next request should treat as first request (entry was cleaned up)
      const result = checkRateLimit('userCleanup', config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0); // maxRequests - 1
    });

    it('should handle edge case with zero maxRequests', () => {
      const config: RateLimitConfig = { maxRequests: 0, windowMs: 60000 };
      
      // First request is allowed but remaining is negative
      const result1 = checkRateLimit('userZero', config);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(-1);

      // Second request should be blocked
      const result2 = checkRateLimit('userZero', config);
      expect(result2.allowed).toBe(false);
      expect(result2.remaining).toBe(0);
    });

    it('should handle very short time windows', () => {
      const config: RateLimitConfig = { maxRequests: 1, windowMs: 1 }; // 1ms window
      
      const result1 = checkRateLimit('userShort', config);
      expect(result1.allowed).toBe(true);
      
      // Wait 2ms
      vi.setSystemTime(new Date(Date.now() + 2));
      
      const result2 = checkRateLimit('userShort', config);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(0);
    });

    it('should return consistent resetTime within same window', () => {
      const config: RateLimitConfig = { maxRequests: 3, windowMs: 60000 };
      
      const result1 = checkRateLimit('userConsistent', config);
      const result2 = checkRateLimit('userConsistent', config);
      
      expect(result1.resetTime).toBe(result2.resetTime);
    });
  });

  describe('cleanupRateLimitStore', () => {
    it('should remove expired entries', () => {
      const config: RateLimitConfig = { maxRequests: 1, windowMs: 1000 };
      
      // Create multiple entries
      checkRateLimit('user1', config);
      checkRateLimit('user2', config);
      checkRateLimit('user3', config);
      
      // Fast forward past expiration
      vi.setSystemTime(new Date(Date.now() + 1100));
      
      // Run cleanup
      cleanupRateLimitStore();
      
      // All users should now have fresh limits
      const result1 = checkRateLimit('user1', config);
      const result2 = checkRateLimit('user2', config);
      const result3 = checkRateLimit('user3', config);
      
      expect(result1.remaining).toBe(0); // First request in new window
      expect(result2.remaining).toBe(0);
      expect(result3.remaining).toBe(0);
    });

    it('should preserve non-expired entries', () => {
      const config: RateLimitConfig = { maxRequests: 3, windowMs: 60000 };
      
      // Create entry that shouldn't expire
      checkRateLimit('userPersist', config);
      checkRateLimit('userPersist', config);
      
      // Run cleanup (entry should not be expired)
      cleanupRateLimitStore();
      
      // Entry should still exist with count=2
      const result = checkRateLimit('userPersist', config);
      expect(result.remaining).toBe(0); // maxRequests(3) - currentCount(3) = 0
    });

    it('should handle empty store gracefully', () => {
      expect(() => cleanupRateLimitStore()).not.toThrow();
    });

    it('should handle mixed expired and non-expired entries', () => {
      const shortConfig: RateLimitConfig = { maxRequests: 1, windowMs: 1000 };
      const longConfig: RateLimitConfig = { maxRequests: 2, windowMs: 60000 };
      
      // Create entries with different expiration times
      checkRateLimit('userShortLived', shortConfig);
      checkRateLimit('userLongLived', longConfig);
      
      // Fast forward to expire only the short-lived entry
      vi.setSystemTime(new Date(Date.now() + 1100));
      
      cleanupRateLimitStore();
      
      // Short-lived should be reset
      const shortResult = checkRateLimit('userShortLived', shortConfig);
      expect(shortResult.remaining).toBe(0);
      
      // Long-lived should still be tracked
      const longResult = checkRateLimit('userLongLived', longConfig);
      expect(longResult.remaining).toBe(0); // Second request in window
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very large maxRequests', () => {
      const config: RateLimitConfig = { maxRequests: 1000000, windowMs: 60000 };
      
      const result = checkRateLimit('userLarge', config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(999999);
    });

    it('should handle very large windowMs', () => {
      const config: RateLimitConfig = { maxRequests: 1, windowMs: 24 * 60 * 60 * 1000 }; // 24 hours
      
      const result = checkRateLimit('userLongWindow', config);
      expect(result.allowed).toBe(true);
      expect(result.resetTime).toBeGreaterThan(Date.now() + 23 * 60 * 60 * 1000);
    });

    it('should handle concurrent requests for same user', () => {
      const config: RateLimitConfig = { maxRequests: 1, windowMs: 60000 };
      
      // Simulate concurrent requests
      const result1 = checkRateLimit('userConcurrent', config);
      const result2 = checkRateLimit('userConcurrent', config);
      
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(false);
    });

    it('should handle special characters in userId', () => {
      const config: RateLimitConfig = { maxRequests: 2, windowMs: 60000 };
      const specialUserId = 'user@domain.com:123-abc_xyz!@#$%';
      
      const result = checkRateLimit(specialUserId, config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it('should handle empty userId string', () => {
      const config: RateLimitConfig = { maxRequests: 1, windowMs: 60000 };
      
      const result = checkRateLimit('', config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('should create proper key format for rate limiting', () => {
      const config: RateLimitConfig = { maxRequests: 2, windowMs: 60000 };
      
      // Different users should have independent limits
      checkRateLimit('123', config);
      checkRateLimit('upload:123', config); // This would be a different key
      
      const result1 = checkRateLimit('123', config);
      const result2 = checkRateLimit('upload:123', config);
      
      expect(result1.remaining).toBe(0); // Second request for '123'
      expect(result2.remaining).toBe(0); // Second request for 'upload:123'
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle realistic upload rate limiting scenario', () => {
      const uploadConfig: RateLimitConfig = { maxRequests: 5, windowMs: 60 * 60 * 1000 }; // 5 uploads per hour
      
      const userId = 'user_uploads_test';
      
      // User makes 5 uploads successfully
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(userId, uploadConfig);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
      
      // 6th upload should be blocked
      const blockedResult = checkRateLimit(userId, uploadConfig);
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.remaining).toBe(0);
    });

    it('should handle burst requests followed by rate limit reset', () => {
      const config: RateLimitConfig = { maxRequests: 3, windowMs: 2000 }; // 3 requests per 2 seconds
      
      const userId = 'user_burst_test';
      
      // Burst of 3 requests
      checkRateLimit(userId, config);
      checkRateLimit(userId, config);
      const lastAllowed = checkRateLimit(userId, config);
      expect(lastAllowed.allowed).toBe(true);
      
      // Next should be blocked
      const blocked = checkRateLimit(userId, config);
      expect(blocked.allowed).toBe(false);
      
      // Wait for window to reset
      vi.setSystemTime(new Date(Date.now() + 2100));
      
      // Should be allowed again
      const afterReset = checkRateLimit(userId, config);
      expect(afterReset.allowed).toBe(true);
      expect(afterReset.remaining).toBe(2);
    });

    it('should demonstrate cleanup effectiveness over time', () => {
      const config: RateLimitConfig = { maxRequests: 1, windowMs: 1000 };
      
      // Create many entries that will expire
      for (let i = 0; i < 10; i++) {
        checkRateLimit(`user${i}`, config);
      }
      
      // Fast forward to expire all entries
      vi.setSystemTime(new Date(Date.now() + 1100));
      
      // Before cleanup - expired entries still in store
      // After cleanup - store should be clean
      cleanupRateLimitStore();
      
      // All users should have fresh limits
      for (let i = 0; i < 10; i++) {
        const result = checkRateLimit(`user${i}`, config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(0);
      }
    });
  });
});
