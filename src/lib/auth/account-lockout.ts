/**
 * Account lockout mechanism to prevent brute force attacks
 * Implements progressive delays and temporary account lockouts
 */

interface LockoutInfo {
  attempts: number;
  lastAttempt: number;
  lockedUntil?: number;
  lockoutLevel: number; // 0-5, increasing severity
}

/**
 * TODO: CRITICAL SECURITY ISSUE - In-memory storage for production environments
 * 
 * This in-memory store poses a significant security risk in production:
 * - Lockout state is lost on server restarts, allowing attackers to bypass rate limiting
 * - Does not work in distributed/multi-instance deployments
 * - Memory usage grows unbounded without proper cleanup
 * 
 * REQUIRED FOR PRODUCTION:
 * - Replace with persistent storage (Redis, PostgreSQL, MongoDB)
 * - Implement proper data expiration/cleanup mechanisms
 * - Add distributed locking for multi-instance environments
 * - Consider using existing rate limiting services (Upstash, Redis Cloud)
 */
const loginAttempts = new Map<string, LockoutInfo>();

export interface LockoutConfig {
  maxAttempts: number;
  baseLockoutTime: number; // minutes
  maxLockoutTime: number; // minutes
  attemptWindow: number; // minutes
  progressiveMultiplier: number;
}

const defaultConfig: LockoutConfig = {
  maxAttempts: 5,
  baseLockoutTime: 15, // 15 minutes
  maxLockoutTime: 24 * 60, // 24 hours
  attemptWindow: 60, // 1 hour window
  progressiveMultiplier: 2
};

/**
 * Check if an account or IP is currently locked out
 */
export function isLockedOut(identifier: string, _config: LockoutConfig = defaultConfig): { 
  locked: boolean; 
  remainingTime?: number;
  attempts?: number;
} {
  const lockoutInfo = loginAttempts.get(identifier);
  if (!lockoutInfo) {
    return { locked: false };
  }

  const now = Date.now();
  
  // Check if lockout has expired
  if (lockoutInfo.lockedUntil && now > lockoutInfo.lockedUntil) {
    // Clear the lockout but keep attempt history for progressive lockouts
    lockoutInfo.lockedUntil = undefined;
    loginAttempts.set(identifier, lockoutInfo);
  }

  // Check if currently locked
  if (lockoutInfo.lockedUntil && now <= lockoutInfo.lockedUntil) {
    const remainingTime = Math.ceil((lockoutInfo.lockedUntil - now) / (1000 * 60)); // minutes
    return { 
      locked: true, 
      remainingTime,
      attempts: lockoutInfo.attempts 
    };
  }

  return { 
    locked: false, 
    attempts: lockoutInfo.attempts 
  };
}

/**
 * Record a failed login attempt
 */
export function recordFailedAttempt(identifier: string, config: LockoutConfig = defaultConfig): {
  shouldLock: boolean;
  lockoutTime?: number;
  attempts: number;
} {
  const now = Date.now();
  const windowStart = now - (config.attemptWindow * 60 * 1000);

  let lockoutInfo = loginAttempts.get(identifier);
  
  if (!lockoutInfo) {
    lockoutInfo = {
      attempts: 0,
      lastAttempt: 0,
      lockoutLevel: 0
    };
  }

  // Reset if last attempt was outside the window
  if (lockoutInfo.lastAttempt < windowStart) {
    lockoutInfo.attempts = 0;
    lockoutInfo.lockoutLevel = 0;
  }

  // Check if currently locked - don't record more attempts while locked
  if (lockoutInfo.lockedUntil && now <= lockoutInfo.lockedUntil) {
    return {
      shouldLock: true,
      lockoutTime: Math.ceil((lockoutInfo.lockedUntil - now) / (60 * 1000)),
      attempts: lockoutInfo.attempts
    };
  }

  // Clear expired lockout and reset attempts
  if (lockoutInfo.lockedUntil && now > lockoutInfo.lockedUntil) {
    lockoutInfo.lockedUntil = undefined;
    lockoutInfo.attempts = 0; // Reset attempts after lockout expires
  }

  lockoutInfo.attempts++;
  lockoutInfo.lastAttempt = now;

  if (lockoutInfo.attempts >= config.maxAttempts) {
    // Calculate progressive lockout time
    const lockoutMinutes = Math.min(
      config.baseLockoutTime * Math.pow(config.progressiveMultiplier, lockoutInfo.lockoutLevel),
      config.maxLockoutTime
    );
    
    lockoutInfo.lockedUntil = now + (lockoutMinutes * 60 * 1000);
    lockoutInfo.lockoutLevel++;
    
    loginAttempts.set(identifier, lockoutInfo);
    
    return {
      shouldLock: true,
      lockoutTime: lockoutMinutes,
      attempts: lockoutInfo.attempts
    };
  }

  loginAttempts.set(identifier, lockoutInfo);
  
  return {
    shouldLock: false,
    attempts: lockoutInfo.attempts
  };
}

/**
 * Record a successful login (clears failed attempts)
 */
export function recordSuccessfulLogin(identifier: string): void {
  loginAttempts.delete(identifier);
}

/**
 * Get delay time for failed attempts (progressive delay)
 */
export function getProgressiveDelay(attempts: number): number {
  const delays = [0, 1000, 5000, 15000, 60000]; // 0s, 1s, 5s, 15s, 60s
  const index = Math.min(attempts - 1, delays.length - 1);
  return index < 0 ? 0 : delays[index];
}

/**
 * Clean up expired entries (should be called periodically)
 */
export function cleanupExpiredEntries(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [identifier, lockoutInfo] of loginAttempts.entries()) {
    if (lockoutInfo.lockedUntil && now > lockoutInfo.lockedUntil) {
      loginAttempts.delete(identifier);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Clear all lockout data (for testing)
 */
export function clearAllLockoutData(): void {
  loginAttempts.clear();
}

/**
 * Get current lockout statistics (for monitoring)
 */
export function getLockoutStats(): {
  totalLocked: number;
  totalWithAttempts: number;
  averageAttempts: number;
} {
  const now = Date.now();
  let totalLocked = 0;
  let totalWithAttempts = 0;
  let totalAttempts = 0;

  for (const [, lockoutInfo] of loginAttempts.entries()) {
    if (lockoutInfo.lockedUntil && now <= lockoutInfo.lockedUntil) {
      totalLocked++;
    }
    if (lockoutInfo.attempts > 0) {
      totalWithAttempts++;
      totalAttempts += lockoutInfo.attempts;
    }
  }

  return {
    totalLocked,
    totalWithAttempts,
    averageAttempts: totalWithAttempts > 0 ? totalAttempts / totalWithAttempts : 0
  };
}
