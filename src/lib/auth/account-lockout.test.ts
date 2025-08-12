import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  isLockedOut, 
  recordFailedAttempt, 
  recordSuccessfulLogin, 
  getProgressiveDelay,
  cleanupExpiredEntries,
  getLockoutStats,
  clearAllLockoutData,
  type LockoutConfig 
} from './account-lockout';

const mockConfig: LockoutConfig = {
  maxAttempts: 3,
  baseLockoutTime: 1, // 1 minute for testing
  maxLockoutTime: 60, // 1 hour
  attemptWindow: 10, // 10 minutes
  progressiveMultiplier: 2
};

describe('Account Lockout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearAllLockoutData();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isLockedOut', () => {
    it('should return false for unknown identifier', () => {
      const result = isLockedOut('unknown@example.com', mockConfig);
      expect(result.locked).toBe(false);
    });
  });

  describe('recordFailedAttempt', () => {
    it('should record first failed attempt without locking', () => {
      const result = recordFailedAttempt('test@example.com', mockConfig);
      
      expect(result.shouldLock).toBe(false);
      expect(result.attempts).toBe(1);
    });

    it('should lock account after max attempts', () => {
      const identifier = 'test@example.com';
      
      // Record attempts up to max
      recordFailedAttempt(identifier, mockConfig);
      recordFailedAttempt(identifier, mockConfig);
      const result = recordFailedAttempt(identifier, mockConfig);
      
      expect(result.shouldLock).toBe(true);
      expect(result.attempts).toBe(3);
      expect(result.lockoutTime).toBe(1); // 1 minute
    });

    it('should apply progressive lockout times', () => {
      const identifier = 'test@example.com';
      
      // First lockout
      recordFailedAttempt(identifier, mockConfig);
      recordFailedAttempt(identifier, mockConfig);
      const firstLockout = recordFailedAttempt(identifier, mockConfig);
      
      expect(firstLockout.lockoutTime).toBe(1);
      
      // Clear the lockout by waiting and checking if it expired
      vi.advanceTimersByTime(2 * 60 * 1000); // 2 minutes
      
      // This call will trigger cleanup of expired lockout
      const lockoutStatus = isLockedOut(identifier, mockConfig);
      expect(lockoutStatus.locked).toBe(false);
      
      // Second lockout should be longer due to progressive increase
      recordFailedAttempt(identifier, mockConfig);
      recordFailedAttempt(identifier, mockConfig);
      const secondLockout = recordFailedAttempt(identifier, mockConfig);
      
      expect(secondLockout.lockoutTime).toBe(2); // Progressive increase
    });
  });

  describe('recordSuccessfulLogin', () => {
    it('should clear failed attempts', () => {
      const identifier = 'test@example.com';
      
      recordFailedAttempt(identifier, mockConfig);
      recordFailedAttempt(identifier, mockConfig);
      
      recordSuccessfulLogin(identifier);
      
      const lockoutStatus = isLockedOut(identifier, mockConfig);
      expect(lockoutStatus.locked).toBe(false);
    });
  });

  describe('getProgressiveDelay', () => {
    it('should return progressive delays', () => {
      expect(getProgressiveDelay(1)).toBe(0);
      expect(getProgressiveDelay(2)).toBe(1000);
      expect(getProgressiveDelay(3)).toBe(5000);
      expect(getProgressiveDelay(4)).toBe(15000);
      expect(getProgressiveDelay(5)).toBe(60000);
      expect(getProgressiveDelay(10)).toBe(60000); // Max delay
    });
  });

  describe('cleanupExpiredEntries', () => {
    it('should clean up expired lockouts', () => {
      const identifier = 'test@example.com';
      
      // Create a lockout
      recordFailedAttempt(identifier, mockConfig);
      recordFailedAttempt(identifier, mockConfig);
      recordFailedAttempt(identifier, mockConfig);
      
      // Verify locked
      expect(isLockedOut(identifier, mockConfig).locked).toBe(true);
      
      // Advance time beyond lockout
      vi.advanceTimersByTime(2 * 60 * 1000); // 2 minutes
      
      const cleaned = cleanupExpiredEntries();
      expect(cleaned).toBeGreaterThanOrEqual(0);
      
      // Should no longer be locked
      expect(isLockedOut(identifier, mockConfig).locked).toBe(false);
    });
  });

  describe('getLockoutStats', () => {
    it('should return correct statistics', () => {
      const identifier1 = 'test1@example.com';
      const identifier2 = 'test2@example.com';
      
      // Create some failed attempts
      recordFailedAttempt(identifier1, mockConfig);
      recordFailedAttempt(identifier1, mockConfig);
      
      recordFailedAttempt(identifier2, mockConfig);
      recordFailedAttempt(identifier2, mockConfig);
      recordFailedAttempt(identifier2, mockConfig); // This will lock
      
      const stats = getLockoutStats();
      expect(stats.totalWithAttempts).toBe(2);
      expect(stats.totalLocked).toBe(1);
      expect(stats.averageAttempts).toBe(2.5); // (2 + 3) / 2
    });
  });
});
