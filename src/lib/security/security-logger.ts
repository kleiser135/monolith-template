import { prisma } from '../database/prisma';

export enum SecurityEventType {
  AVATAR_UPLOAD_SUCCESS = 'avatar_upload_success',
  AVATAR_UPLOAD_FAILED = 'avatar_upload_failed',
  AVATAR_DELETE_SUCCESS = 'avatar_delete_success',
  AVATAR_DELETE_FAILED = 'avatar_delete_failed',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_FILE_TYPE = 'invalid_file_type',
  FILE_SIZE_EXCEEDED = 'file_size_exceeded',
  PATH_TRAVERSAL_ATTEMPT = 'path_traversal_attempt',
  SUSPICIOUS_COMPRESSION = 'suspicious_compression',
  MALICIOUS_METADATA = 'malicious_metadata',
  DECOMPRESSION_BOMB = 'decompression_bomb',
  MIME_MISMATCH = 'mime_mismatch',
  POLYGLOT_FILE_DETECTED = 'polyglot_file_detected',
  SSRF_ATTEMPT = 'ssrf_attempt',
  CONTENT_ANALYSIS_FAILED = 'content_analysis_failed'
}

export interface SecurityEvent {
  type: SecurityEventType;
  userId: string;
  timestamp: string;
  userAgent?: string;
  ip?: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class SecurityLogger {
  private events: SecurityEvent[] = [];
  
  async log(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };
    
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Security Event:', securityEvent);
    }
    
    // Store in memory for immediate access
    this.events.push(securityEvent);
    
    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
    
    // Store in database asynchronously (don't wait for it)
    this.saveToDatabase(securityEvent).catch(error => {
      try {
        console.error('Failed to save security event to database:', error);
      } catch (fallbackError) {
        // Last-resort: swallow error to avoid unhandled promise rejection
      }
    });
    
    // For critical events, consider immediate alerting
    if (securityEvent.severity === 'critical') {
      this.handleCriticalEvent(securityEvent);
    }
  }
  
  private async saveToDatabase(event: SecurityEvent): Promise<void> {
    try {
      await prisma.securityLog.create({
        data: {
          userId: event.userId,
          eventType: event.type,
          details: JSON.stringify(event.details || {}),
          ipAddress: event.ip || null,
          userAgent: event.userAgent || null,
          severity: event.severity,
          timestamp: new Date(event.timestamp),
        },
      });
    } catch (error) {
      // Fallback: log to file and alert if database logging fails
      console.error('Database error in security logger:', error);
      await this.logToFallbackFile(event, error);
      
      // Optionally, trigger further alerting here (e.g., send email, integrate with monitoring)
    }
  }

  private async logToFallbackFile(event: SecurityEvent, error: unknown): Promise<void> {
    // Implementation for file-based logging fallback would go here
    // For now, ensure the error is properly logged
    const fallbackLog = {
      timestamp: new Date().toISOString(),
      message: 'Security logging database failure',
      originalEvent: event,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    console.error('Fallback security log:', JSON.stringify(fallbackLog, null, 2));
  }
  
  private handleCriticalEvent(event: SecurityEvent): void {
    // In production, trigger immediate alerts
    console.error('🚨 CRITICAL SECURITY EVENT:', event);
    
    // Examples of what to do:
    // - Send to alerting system (PagerDuty, etc.)
    // - Temporarily block user if needed
    // - Notify security team
    // - Consider automatic account suspension for severe attacks
  }
  
  getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.events.slice(-limit);
  }
  
  getEventsByUser(userId: string, limit: number = 50): SecurityEvent[] {
    return this.events
      .filter(event => event.userId === userId)
      .slice(-limit);
  }
  
  async getRecentEventsFromDatabase(limit: number = 100): Promise<any[]> {
    try {
      return await prisma.securityLog.findMany({
        take: limit,
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
    } catch (error) {
      console.error('Failed to fetch security events from database:', error);
      return [];
    }
  }
  
  async getEventsByUserFromDatabase(userId: string, limit: number = 50): Promise<any[]> {
    try {
      return await prisma.securityLog.findMany({
        where: { userId },
        take: limit,
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
    } catch (error) {
      console.error('Failed to fetch user security events from database:', error);
      return [];
    }
  }
}

export const securityLogger = new SecurityLogger();
