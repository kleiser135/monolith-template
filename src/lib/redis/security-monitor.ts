import { getRedisClient, isRedisAvailable } from './client';

export interface SecurityEvent {
  id: string;
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'REFRESH_TOKEN' | 'PASSWORD_RESET' | 'RATE_LIMIT_EXCEEDED' | 'SUSPICIOUS_ACTIVITY' | 'ACCOUNT_LOCKED';
  userId?: string;
  ip: string;
  userAgent: string;
  timestamp: number;
  metadata?: Record<string, any>;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: 'WEB' | 'MOBILE' | 'API';
}

export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByRisk: Record<string, number>;
  recentEvents: SecurityEvent[];
  anomalies: SecurityAnomaly[];
}

export interface SecurityAnomaly {
  type: 'UNUSUAL_LOCATION' | 'HIGH_FREQUENCY' | 'MULTIPLE_FAILURES' | 'SUSPICIOUS_PATTERN';
  description: string;
  userId?: string;
  ip: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: number;
  events: SecurityEvent[];
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private readonly MAX_MEMORY_EVENTS = 1000;

  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now(),
    };

    try {
      const redisAvailable = await isRedisAvailable();
      
      if (redisAvailable) {
        await this.logToRedis(securityEvent);
      } else {
        await this.logToMemory(securityEvent);
      }

      // Log to console for immediate visibility
      console.log(`[SECURITY] ${event.type} - Risk: ${event.riskLevel}`, {
        userId: event.userId,
        ip: event.ip,
        source: event.source,
        metadata: event.metadata,
      });

      // Check for anomalies
      await this.detectAnomalies(securityEvent);

    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  private async logToRedis(event: SecurityEvent): Promise<void> {
    const redis = getRedisClient();
    const eventKey = `security:events:${event.id}`;
    const timeSeriesKey = `security:timeline:${this.getDateKey(event.timestamp)}`;
    const userKey = event.userId ? `security:user:${event.userId}` : null;
    const ipKey = `security:ip:${event.ip}`;

    // Store the full event
    await redis.hset(eventKey, {
      data: JSON.stringify(event),
      type: event.type,
      userId: event.userId || '',
      ip: event.ip,
      timestamp: event.timestamp.toString(),
      riskLevel: event.riskLevel,
    });
    await redis.expire(eventKey, 30 * 24 * 60 * 60); // 30 days

    // Add to timeline
    await redis.zadd(timeSeriesKey, event.timestamp, event.id);
    await redis.expire(timeSeriesKey, 30 * 24 * 60 * 60); // 30 days

    // Track by user
    if (userKey) {
      await redis.zadd(userKey, event.timestamp, event.id);
      await redis.expire(userKey, 30 * 24 * 60 * 60); // 30 days
    }

    // Track by IP
    await redis.zadd(ipKey, event.timestamp, event.id);
    await redis.expire(ipKey, 7 * 24 * 60 * 60); // 7 days for IP tracking
  }

  private async logToMemory(event: SecurityEvent): Promise<void> {
    this.events.push(event);
    
    // Keep only recent events in memory
    if (this.events.length > this.MAX_MEMORY_EVENTS) {
      this.events = this.events.slice(-this.MAX_MEMORY_EVENTS);
    }
  }

  async getSecurityMetrics(timeWindow: number = 24 * 60 * 60 * 1000): Promise<SecurityMetrics> {
    try {
      const redisAvailable = await isRedisAvailable();
      
      if (redisAvailable) {
        return await this.getMetricsFromRedis(timeWindow);
      } else {
        return await this.getMetricsFromMemory(timeWindow);
      }
    } catch (error) {
      console.error('Failed to get security metrics:', error);
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsByRisk: {},
        recentEvents: [],
        anomalies: [],
      };
    }
  }

  private async getMetricsFromRedis(timeWindow: number): Promise<SecurityMetrics> {
    const redis = getRedisClient();
    const now = Date.now();
    const windowStart = now - timeWindow;

    // Get events from the time window
    const eventIds: string[] = [];
    const dateKeys = this.getDateKeysInRange(windowStart, now);
    
    for (const dateKey of dateKeys) {
      const timeSeriesKey = `security:timeline:${dateKey}`;
      const ids = await redis.zrangebyscore(timeSeriesKey, windowStart, now);
      eventIds.push(...ids);
    }

    // Fetch event details
    const events: SecurityEvent[] = [];
    if (eventIds.length > 0) {
      const pipeline = redis.pipeline();
      eventIds.forEach(id => {
        pipeline.hget(`security:events:${id}`, 'data');
      });
      
      const results = await pipeline.exec();
      
      results?.forEach(([err, result]) => {
        if (!err && result) {
          try {
            events.push(JSON.parse(result as string));
          } catch {
            // Skip invalid events
          }
        }
      });
    }

    return this.calculateMetrics(events);
  }

  private async getMetricsFromMemory(timeWindow: number): Promise<SecurityMetrics> {
    const now = Date.now();
    const windowStart = now - timeWindow;
    
    const events = this.events.filter(event => event.timestamp >= windowStart);
    return this.calculateMetrics(events);
  }

  private calculateMetrics(events: SecurityEvent[]): SecurityMetrics {
    const eventsByType: Record<string, number> = {};
    const eventsByRisk: Record<string, number> = {};

    events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsByRisk[event.riskLevel] = (eventsByRisk[event.riskLevel] || 0) + 1;
    });

    // Sort events by timestamp (most recent first)
    const recentEvents = events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);

    // Detect anomalies
    const anomalies = this.detectAnomaliesInEvents(events);

    return {
      totalEvents: events.length,
      eventsByType,
      eventsByRisk,
      recentEvents,
      anomalies,
    };
  }

  private async detectAnomalies(event: SecurityEvent): Promise<void> {
    // Real-time anomaly detection for critical events
    if (event.riskLevel === 'CRITICAL') {
      console.warn(`[SECURITY ALERT] Critical security event detected:`, event);
    }

    // Check for rapid-fire events from same IP
    if (event.type === 'LOGIN_FAILURE') {
      await this.checkForBruteForce(event);
    }
  }

  private async checkForBruteForce(event: SecurityEvent): Promise<void> {
    const redis = await isRedisAvailable() ? getRedisClient() : null;
    const now = Date.now();
    const windowStart = now - (15 * 60 * 1000); // 15 minutes

    let failureCount = 0;

    if (redis) {
      const ipKey = `security:ip:${event.ip}`;
      const eventIds = await redis.zrangebyscore(ipKey, windowStart, now);
      
      for (const eventId of eventIds) {
        const eventData = await redis.hget(`security:events:${eventId}`, 'data');
        if (eventData) {
          const parsedEvent: SecurityEvent = JSON.parse(eventData);
          if (parsedEvent.type === 'LOGIN_FAILURE') {
            failureCount++;
          }
        }
      }
    } else {
      failureCount = this.events.filter(e => 
        e.ip === event.ip && 
        e.type === 'LOGIN_FAILURE' && 
        e.timestamp >= windowStart
      ).length;
    }

    if (failureCount >= 5) {
      await this.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        ip: event.ip,
        userAgent: event.userAgent,
        riskLevel: 'HIGH',
        source: event.source,
        metadata: {
          reason: 'Potential brute force attack',
          failureCount,
          timeWindow: '15 minutes',
        },
      });
    }
  }

  private detectAnomaliesInEvents(events: SecurityEvent[]): SecurityAnomaly[] {
    const anomalies: SecurityAnomaly[] = [];

    // Group events by IP
    const eventsByIp = new Map<string, SecurityEvent[]>();
    events.forEach(event => {
      const ipEvents = eventsByIp.get(event.ip) || [];
      ipEvents.push(event);
      eventsByIp.set(event.ip, ipEvents);
    });

    // Check each IP for anomalies
    eventsByIp.forEach((ipEvents, ip) => {
      // High frequency anomaly
      if (ipEvents.length > 50) {
        anomalies.push({
          type: 'HIGH_FREQUENCY',
          description: `IP ${ip} generated ${ipEvents.length} events in the time window`,
          ip,
          severity: ipEvents.length > 100 ? 'HIGH' : 'MEDIUM',
          timestamp: Date.now(),
          events: ipEvents.slice(0, 10), // Sample events
        });
      }

      // Multiple failures anomaly
      const failures = ipEvents.filter(e => e.type === 'LOGIN_FAILURE');
      if (failures.length > 10) {
        anomalies.push({
          type: 'MULTIPLE_FAILURES',
          description: `IP ${ip} had ${failures.length} login failures`,
          ip,
          severity: failures.length > 20 ? 'HIGH' : 'MEDIUM',
          timestamp: Date.now(),
          events: failures.slice(0, 5),
        });
      }
    });

    return anomalies;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDateKey(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private getDateKeysInRange(start: number, end: number): string[] {
    const keys: string[] = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      keys.push(this.getDateKey(d.getTime()));
    }
    
    return keys;
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor();

// Helper functions for common security events
export async function logLoginAttempt(success: boolean, userId?: string, ip: string = 'unknown', userAgent: string = 'unknown', source: 'WEB' | 'MOBILE' | 'API' = 'WEB', metadata?: Record<string, any>): Promise<void> {
  await securityMonitor.logSecurityEvent({
    type: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILURE',
    userId,
    ip,
    userAgent,
    riskLevel: success ? 'LOW' : 'MEDIUM',
    source,
    metadata,
  });
}

export async function logRefreshToken(userId: string, ip: string = 'unknown', userAgent: string = 'unknown', source: 'WEB' | 'MOBILE' | 'API' = 'WEB'): Promise<void> {
  await securityMonitor.logSecurityEvent({
    type: 'REFRESH_TOKEN',
    userId,
    ip,
    userAgent,
    riskLevel: 'LOW',
    source,
  });
}

export async function logLogout(userId: string, ip: string = 'unknown', userAgent: string = 'unknown', source: 'WEB' | 'MOBILE' | 'API' = 'WEB'): Promise<void> {
  await securityMonitor.logSecurityEvent({
    type: 'LOGOUT',
    userId,
    ip,
    userAgent,
    riskLevel: 'LOW',
    source,
  });
}

export async function logRateLimitExceeded(ip: string = 'unknown', userAgent: string = 'unknown', source: 'WEB' | 'MOBILE' | 'API' = 'WEB', metadata?: Record<string, any>): Promise<void> {
  await securityMonitor.logSecurityEvent({
    type: 'RATE_LIMIT_EXCEEDED',
    ip,
    userAgent,
    riskLevel: 'MEDIUM',
    source,
    metadata,
  });
}
