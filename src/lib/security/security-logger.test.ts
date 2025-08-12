import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SecurityEventType, securityLogger } from './security-logger';
import { prisma } from '../database/prisma';

// Mock the prisma module
vi.mock('../database/prisma', () => ({
  prisma: {
    securityLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('SecurityLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the events array in the singleton
    (securityLogger as any).events = [];
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Event Logging', () => {
    it('should log security events with timestamp', async () => {
      const testEvent = {
        type: SecurityEventType.AVATAR_UPLOAD_SUCCESS,
        userId: 'user123',
        severity: 'low' as const,
        details: { filename: 'avatar.jpg' }
      };

      await securityLogger.log(testEvent);

      const recentEvents = securityLogger.getRecentEvents();
      expect(recentEvents).toHaveLength(1);
      expect(recentEvents[0]).toMatchObject({
        ...testEvent,
        timestamp: expect.any(String)
      });
      expect(new Date(recentEvents[0].timestamp)).toBeInstanceOf(Date);
    });

    it('should log to console in development environment', async () => {
      // Mock process.env
      const _originalEnv = process.env.NODE_ENV;
      vi.stubEnv('NODE_ENV', 'development');

      const testEvent = {
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        userId: 'user456',
        severity: 'medium' as const,
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      await securityLogger.log(testEvent);

      expect(console.log).toHaveBeenCalledWith('🔒 Security Event:', expect.objectContaining(testEvent));
      
      vi.unstubAllEnvs();
    });

    it('should handle critical events with special processing', async () => {
      const criticalEvent = {
        type: SecurityEventType.POLYGLOT_FILE_DETECTED,
        userId: 'user789',
        severity: 'critical' as const,
        details: { threat: 'malicious polyglot file' }
      };

      await securityLogger.log(criticalEvent);

      expect(console.error).toHaveBeenCalledWith('🚨 CRITICAL SECURITY EVENT:', expect.objectContaining(criticalEvent));
    });
  });

  describe('Memory Management', () => {
    it('should maintain only last 1000 events in memory', async () => {
      // Add more than 1000 events
      for (let i = 0; i < 1050; i++) {
        await securityLogger.log({
          type: SecurityEventType.AVATAR_UPLOAD_SUCCESS,
          userId: `user${i}`,
          severity: 'low'
        });
      }

      const recentEvents = securityLogger.getRecentEvents(2000);
      expect(recentEvents).toHaveLength(1000);
      
      // Should contain the last 1000 events (user50 to user1049)
      expect(recentEvents[0].userId).toBe('user50');
      expect(recentEvents[999].userId).toBe('user1049');
    });

    it('should retrieve limited number of recent events', () => {
      // Add some events first
      const events = Array.from({ length: 50 }, (_, i) => ({
        type: SecurityEventType.AVATAR_UPLOAD_SUCCESS,
        userId: `user${i}`,
        severity: 'low' as const,
        timestamp: new Date().toISOString()
      }));

      (securityLogger as any).events = events;

      const recent10 = securityLogger.getRecentEvents(10);
      expect(recent10).toHaveLength(10);
      expect(recent10[0].userId).toBe('user40');
      expect(recent10[9].userId).toBe('user49');
    });

    it('should filter events by user ID', () => {
      // Add mixed events for different users
      const events = [
        { type: SecurityEventType.AVATAR_UPLOAD_SUCCESS, userId: 'user1', severity: 'low' as const, timestamp: '2023-01-01T10:00:00Z' },
        { type: SecurityEventType.RATE_LIMIT_EXCEEDED, userId: 'user2', severity: 'medium' as const, timestamp: '2023-01-01T10:01:00Z' },
        { type: SecurityEventType.AVATAR_DELETE_SUCCESS, userId: 'user1', severity: 'low' as const, timestamp: '2023-01-01T10:02:00Z' },
        { type: SecurityEventType.SUSPICIOUS_COMPRESSION, userId: 'user3', severity: 'high' as const, timestamp: '2023-01-01T10:03:00Z' },
        { type: SecurityEventType.INVALID_FILE_TYPE, userId: 'user1', severity: 'medium' as const, timestamp: '2023-01-01T10:04:00Z' }
      ];

      (securityLogger as any).events = events;

      const user1Events = securityLogger.getEventsByUser('user1');
      expect(user1Events).toHaveLength(3);
      expect(user1Events.every(event => event.userId === 'user1')).toBe(true);
      expect(user1Events.map(e => e.type)).toEqual([
        SecurityEventType.AVATAR_UPLOAD_SUCCESS,
        SecurityEventType.AVATAR_DELETE_SUCCESS,
        SecurityEventType.INVALID_FILE_TYPE
      ]);
    });
  });

  describe('Database Operations', () => {
    it('should save events to database successfully', async () => {
      const mockCreate = vi.mocked(prisma.securityLog.create);
      mockCreate.mockResolvedValue({
        id: 'log123',
        userId: 'user123',
        eventType: SecurityEventType.AVATAR_UPLOAD_SUCCESS,
        details: '{"filename":"test.jpg"}',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        severity: 'low',
        timestamp: new Date()
      });

      const testEvent = {
        type: SecurityEventType.AVATAR_UPLOAD_SUCCESS,
        userId: 'user123',
        severity: 'low' as const,
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: { filename: 'test.jpg' }
      };

      await securityLogger.log(testEvent);

      // Wait a bit for async database operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          userId: 'user123',
          eventType: SecurityEventType.AVATAR_UPLOAD_SUCCESS,
          details: '{"filename":"test.jpg"}',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          severity: 'low',
          timestamp: expect.any(Date),
        },
      });
    });

    it('should handle database save failures gracefully', async () => {
      const mockCreate = vi.mocked(prisma.securityLog.create);
      mockCreate.mockRejectedValue(new Error('Database connection failed'));

      const testEvent = {
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        userId: 'user456',
        severity: 'medium' as const
      };

      await securityLogger.log(testEvent);

      // Wait for async error handling
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(console.error).toHaveBeenCalledWith(
        'Database error in security logger:',
        expect.any(Error)
      );
      expect(console.error).toHaveBeenCalledWith(
        'Fallback security log:',
        expect.stringContaining('Security logging database failure')
      );
    });

    it('should retrieve recent events from database', async () => {
      const mockFindMany = vi.mocked(prisma.securityLog.findMany);
      const mockEvents = [
        {
          id: 'log1',
          userId: 'user1',
          eventType: SecurityEventType.AVATAR_UPLOAD_SUCCESS,
          details: '{"filename":"test1.jpg"}',
          severity: 'low',
          timestamp: new Date('2023-01-01T10:00:00Z'),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          user: { email: 'user1@example.com', name: 'User One' }
        },
        {
          id: 'log2',
          userId: 'user2',
          eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
          details: '{}',
          severity: 'medium',
          timestamp: new Date('2023-01-01T09:30:00Z'),
          ipAddress: '192.168.1.2',
          userAgent: 'Chrome/91.0',
          user: { email: 'user2@example.com', name: 'User Two' }
        }
      ];
      mockFindMany.mockResolvedValue(mockEvents);

      const result = await securityLogger.getRecentEventsFromDatabase(50);

      expect(result).toEqual(mockEvents);
      expect(mockFindMany).toHaveBeenCalledWith({
        take: 50,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });
    });

    it('should handle database query failures for recent events', async () => {
      const mockFindMany = vi.mocked(prisma.securityLog.findMany);
      mockFindMany.mockRejectedValue(new Error('Database query failed'));

      const result = await securityLogger.getRecentEventsFromDatabase();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch security events from database:',
        expect.any(Error)
      );
    });

    it('should retrieve user-specific events from database', async () => {
      const mockFindMany = vi.mocked(prisma.securityLog.findMany);
      const mockUserEvents = [
        {
          id: 'log1',
          userId: 'user123',
          eventType: SecurityEventType.AVATAR_UPLOAD_SUCCESS,
          details: '{"filename":"avatar1.jpg"}',
          severity: 'low',
          timestamp: new Date('2023-01-01T10:00:00Z'),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          user: { email: 'user123@example.com', name: 'Test User' }
        }
      ];
      mockFindMany.mockResolvedValue(mockUserEvents);

      const result = await securityLogger.getEventsByUserFromDatabase('user123', 25);

      expect(result).toEqual(mockUserEvents);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        take: 25,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });
    });

    it('should handle database query failures for user events', async () => {
      const mockFindMany = vi.mocked(prisma.securityLog.findMany);
      mockFindMany.mockRejectedValue(new Error('Database connection timeout'));

      const result = await securityLogger.getEventsByUserFromDatabase('user123');

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch user security events from database:',
        expect.any(Error)
      );
    });
  });

  describe('Security Event Types', () => {
    it('should handle all security event types', async () => {
      const eventTypes = Object.values(SecurityEventType);
      
      for (const eventType of eventTypes) {
        await securityLogger.log({
          type: eventType,
          userId: 'test-user',
          severity: 'medium'
        });
      }

      const recentEvents = securityLogger.getRecentEvents(eventTypes.length);
      expect(recentEvents).toHaveLength(eventTypes.length);
      
      const loggedTypes = recentEvents.map(event => event.type);
      eventTypes.forEach(eventType => {
        expect(loggedTypes).toContain(eventType);
      });
    });

    it('should handle events with optional fields', async () => {
      const minimalEvent = {
        type: SecurityEventType.AVATAR_UPLOAD_SUCCESS,
        userId: 'user123',
        severity: 'low' as const
      };

      const fullEvent = {
        type: SecurityEventType.POLYGLOT_FILE_DETECTED,
        userId: 'user456',
        severity: 'critical' as const,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ip: '192.168.1.100',
        details: {
          filename: 'suspicious.jpg',
          fileSize: 1024000,
          detectedThreats: ['embedded_script', 'polyglot_structure']
        }
      };

      await securityLogger.log(minimalEvent);
      await securityLogger.log(fullEvent);

      const events = securityLogger.getRecentEvents(2);
      expect(events[0]).toMatchObject(minimalEvent);
      expect(events[1]).toMatchObject(fullEvent);
    });
  });

  describe('Error Handling', () => {
    it('should handle fallback logging when database fails', async () => {
      const mockCreate = vi.mocked(prisma.securityLog.create);
      mockCreate.mockRejectedValue(new Error('Connection timeout'));

      const testEvent = {
        type: SecurityEventType.DECOMPRESSION_BOMB,
        userId: 'user123',
        severity: 'critical' as const,
        details: { suspiciousCompressionRatio: 1000 }
      };

      await securityLogger.log(testEvent);

      // Wait for async error handling
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(console.error).toHaveBeenCalledWith(
        'Fallback security log:',
        expect.stringContaining('Security logging database failure')
      );
    });

    it('should handle console.error failures gracefully', async () => {
      // Test a non-critical event to avoid handleCriticalEvent
      const testEvent = {
        type: SecurityEventType.AVATAR_UPLOAD_SUCCESS,
        userId: 'user123',
        severity: 'low' as const
      };

      // Mock database failure to test fallback logging error handling
      const mockCreate = vi.mocked(prisma.securityLog.create);
      mockCreate.mockRejectedValue(new Error('Database failure'));

      // Mock console.error to throw on fallback logging
      const consoleMock = vi.spyOn(console, 'error').mockImplementation((message) => {
        if (typeof message === 'string' && message.includes('Fallback security log:')) {
          throw new Error('Console logging failed');
        }
        // Allow other console.error calls to pass through
      });

      // This should not throw despite console.error failing in fallback
      await securityLogger.log(testEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // The event should still be in memory
      const events = securityLogger.getRecentEvents(1);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject(testEvent);

      consoleMock.mockRestore();
    });

    it('should handle non-Error objects in database failures', async () => {
      const mockCreate = vi.mocked(prisma.securityLog.create);
      mockCreate.mockRejectedValue('String error instead of Error object');

      const testEvent = {
        type: SecurityEventType.MALICIOUS_METADATA,
        userId: 'user123',
        severity: 'high' as const
      };

      await securityLogger.log(testEvent);

      // Wait for async error handling
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(console.error).toHaveBeenCalledWith(
        'Fallback security log:',
        expect.stringContaining('Unknown error')
      );
    });
  });
});
