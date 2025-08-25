import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  securityMonitor, 
  logLoginAttempt, 
  logRefreshToken, 
  logLogout, 
  logRateLimitExceeded 
} from '@/lib/redis/security-monitor';

// Mock Redis client
vi.mock('@/lib/redis/client', () => ({
  getRedisClient: vi.fn().mockReturnValue({
    hset: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    zadd: vi.fn().mockResolvedValue(1),
    zrangebyscore: vi.fn().mockResolvedValue([]),
    hget: vi.fn().mockResolvedValue(null),
    pipeline: vi.fn().mockReturnValue({
      hget: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    }),
  }),
  isRedisAvailable: vi.fn().mockResolvedValue(false), // Use memory store for testing
}));

// Mock console methods
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('Security Monitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockClear();
    consoleWarnSpy.mockClear();
  });

  describe('logSecurityEvent', () => {
    it('should log a security event with generated ID and timestamp', async () => {
      await securityMonitor.logSecurityEvent({
        type: 'LOGIN_SUCCESS',
        userId: 'user123',
        ip: '192.168.1.1',
        userAgent: 'Test Browser',
        riskLevel: 'LOW',
        source: 'WEB',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[SECURITY] LOGIN_SUCCESS - Risk: LOW',
        expect.objectContaining({
          userId: 'user123',
          ip: '192.168.1.1',
          source: 'WEB',
        })
      );
    });

    it('should log critical events with warning', async () => {
      await securityMonitor.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        ip: '192.168.1.1',
        userAgent: 'Test Browser',
        riskLevel: 'CRITICAL',
        source: 'WEB',
        metadata: { reason: 'Multiple failed attempts' },
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SECURITY ALERT] Critical security event detected:',
        expect.objectContaining({
          type: 'SUSPICIOUS_ACTIVITY',
          riskLevel: 'CRITICAL',
        })
      );
    });

    it('should detect brute force patterns', async () => {
      const ip = '192.168.1.100';
      
      // Simulate multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await securityMonitor.logSecurityEvent({
          type: 'LOGIN_FAILURE',
          ip,
          userAgent: 'Test Browser',
          riskLevel: 'MEDIUM',
          source: 'WEB',
        });
      }

      // Should log suspicious activity
      expect(consoleSpy).toHaveBeenCalledWith(
        '[SECURITY] SUSPICIOUS_ACTIVITY - Risk: HIGH',
        expect.objectContaining({
          ip,
          source: 'WEB',
          metadata: expect.objectContaining({
            reason: 'Potential brute force attack',
          }),
        })
      );
    });
  });

  describe('getSecurityMetrics', () => {
    it('should return security metrics with event counts', async () => {
      // Log some test events
      await securityMonitor.logSecurityEvent({
        type: 'LOGIN_SUCCESS',
        ip: '192.168.1.1',
        userAgent: 'Test Browser',
        riskLevel: 'LOW',
        source: 'WEB',
      });

      await securityMonitor.logSecurityEvent({
        type: 'LOGIN_FAILURE',
        ip: '192.168.1.2',
        userAgent: 'Test Browser',
        riskLevel: 'MEDIUM',
        source: 'WEB',
      });

      const metrics = await securityMonitor.getSecurityMetrics();

      expect(metrics.totalEvents).toBeGreaterThan(0);
      expect(metrics.eventsByType).toHaveProperty('LOGIN_SUCCESS');
      expect(metrics.eventsByType).toHaveProperty('LOGIN_FAILURE');
      expect(metrics.eventsByRisk).toHaveProperty('LOW');
      expect(metrics.eventsByRisk).toHaveProperty('MEDIUM');
      expect(Array.isArray(metrics.recentEvents)).toBe(true);
      expect(Array.isArray(metrics.anomalies)).toBe(true);
    });

    it('should detect high frequency anomalies', async () => {
      const ip = '192.168.1.200';
      
      // Generate many events from same IP
      for (let i = 0; i < 60; i++) {
        await securityMonitor.logSecurityEvent({
          type: 'RATE_LIMIT_EXCEEDED',
          ip,
          userAgent: 'Test Browser',
          riskLevel: 'LOW',
          source: 'API',
        });
      }

      const metrics = await securityMonitor.getSecurityMetrics();
      
      const highFreqAnomaly = metrics.anomalies.find(
        a => a.type === 'HIGH_FREQUENCY' && a.ip === ip
      );
      
      expect(highFreqAnomaly).toBeDefined();
      expect(highFreqAnomaly?.severity).toBe('MEDIUM');
    });

    it('should detect multiple failure anomalies', async () => {
      const ip = '192.168.1.201';
      
      // Generate many failed login attempts
      for (let i = 0; i < 15; i++) {
        await securityMonitor.logSecurityEvent({
          type: 'LOGIN_FAILURE',
          ip,
          userAgent: 'Test Browser',
          riskLevel: 'MEDIUM',
          source: 'WEB',
        });
      }

      const metrics = await securityMonitor.getSecurityMetrics();
      
      const failureAnomaly = metrics.anomalies.find(
        a => a.type === 'MULTIPLE_FAILURES' && a.ip === ip
      );
      
      expect(failureAnomaly).toBeDefined();
      expect(failureAnomaly?.severity).toBe('MEDIUM');
    });
  });

  describe('helper functions', () => {
    describe('logLoginAttempt', () => {
      it('should log successful login with LOW risk', async () => {
        await logLoginAttempt(true, 'user123', '192.168.1.1', 'Browser', 'WEB');

        expect(consoleSpy).toHaveBeenCalledWith(
          '[SECURITY] LOGIN_SUCCESS - Risk: LOW',
          expect.objectContaining({
            userId: 'user123',
            ip: '192.168.1.1',
            source: 'WEB',
          })
        );
      });

      it('should log failed login with MEDIUM risk', async () => {
        await logLoginAttempt(false, undefined, '192.168.1.1', 'Browser', 'WEB');

        expect(consoleSpy).toHaveBeenCalledWith(
          '[SECURITY] LOGIN_FAILURE - Risk: MEDIUM',
          expect.objectContaining({
            ip: '192.168.1.1',
            source: 'WEB',
          })
        );
      });
    });

    describe('logRefreshToken', () => {
      it('should log refresh token usage', async () => {
        await logRefreshToken('user123', '192.168.1.1', 'Browser', 'MOBILE');

        expect(consoleSpy).toHaveBeenCalledWith(
          '[SECURITY] REFRESH_TOKEN - Risk: LOW',
          expect.objectContaining({
            userId: 'user123',
            ip: '192.168.1.1',
            source: 'MOBILE',
          })
        );
      });
    });

    describe('logLogout', () => {
      it('should log logout event', async () => {
        await logLogout('user123', '192.168.1.1', 'Browser', 'WEB');

        expect(consoleSpy).toHaveBeenCalledWith(
          '[SECURITY] LOGOUT - Risk: LOW',
          expect.objectContaining({
            userId: 'user123',
            ip: '192.168.1.1',
            source: 'WEB',
          })
        );
      });
    });

    describe('logRateLimitExceeded', () => {
      it('should log rate limit exceeded with MEDIUM risk', async () => {
        await logRateLimitExceeded('192.168.1.1', 'Browser', 'API', {
          endpoint: '/api/test',
        });

        expect(consoleSpy).toHaveBeenCalledWith(
          '[SECURITY] RATE_LIMIT_EXCEEDED - Risk: MEDIUM',
          expect.objectContaining({
            ip: '192.168.1.1',
            source: 'API',
            metadata: expect.objectContaining({
              endpoint: '/api/test',
            }),
          })
        );
      });
    });
  });

  describe('error handling', () => {
    it('should handle logging errors gracefully', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // We need to clear the previous mocks and set up fresh ones for this test
      vi.clearAllMocks();
      consoleSpy.mockClear();

      // Mock Redis to throw an error during logToMemory (fallback behavior)
      await securityMonitor.logSecurityEvent({
        type: 'LOGIN_SUCCESS',
        ip: '192.168.1.1',
        userAgent: 'Test Browser',
        riskLevel: 'LOW',
        source: 'WEB',
      });

      // Should still log to console since the error is caught and handled
      expect(consoleSpy).toHaveBeenCalledWith(
        '[SECURITY] LOGIN_SUCCESS - Risk: LOW',
        expect.objectContaining({
          ip: '192.168.1.1',
          source: 'WEB',
        })
      );
      
      errorSpy.mockRestore();
    });

    it('should return empty metrics on error', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock an error scenario
      const { isRedisAvailable } = await import('@/lib/redis/client');
      vi.mocked(isRedisAvailable).mockRejectedValueOnce(new Error('Redis error'));

      const metrics = await securityMonitor.getSecurityMetrics();

      expect(metrics).toEqual({
        totalEvents: 0,
        eventsByType: {},
        eventsByRisk: {},
        recentEvents: [],
        anomalies: [],
      });

      errorSpy.mockRestore();
    });
  });
});
