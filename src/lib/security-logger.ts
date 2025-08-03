export enum SecurityEventType {
  AVATAR_UPLOAD_SUCCESS = 'avatar_upload_success',
  AVATAR_UPLOAD_FAILED = 'avatar_upload_failed',
  AVATAR_DELETE_SUCCESS = 'avatar_delete_success',
  AVATAR_DELETE_FAILED = 'avatar_delete_failed',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_FILE_TYPE = 'invalid_file_type',
  FILE_SIZE_EXCEEDED = 'file_size_exceeded',
  PATH_TRAVERSAL_ATTEMPT = 'path_traversal_attempt',
  SUSPICIOUS_COMPRESSION = 'suspicious_compression'
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
  
  log(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };
    
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Security Event:', securityEvent);
    }
    
    // In production, you would send this to your SIEM/logging service
    // Examples: DataDog, Splunk, ELK Stack, etc.
    this.events.push(securityEvent);
    
    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
    
    // For critical events, consider immediate alerting
    if (securityEvent.severity === 'critical') {
      this.handleCriticalEvent(securityEvent);
    }
  }
  
  private handleCriticalEvent(event: SecurityEvent): void {
    // In production, trigger immediate alerts
    console.error('🚨 CRITICAL SECURITY EVENT:', event);
    
    // Examples of what to do:
    // - Send to alerting system (PagerDuty, etc.)
    // - Temporarily block user if needed
    // - Notify security team
  }
  
  getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.events.slice(-limit);
  }
  
  getEventsByUser(userId: string, limit: number = 50): SecurityEvent[] {
    return this.events
      .filter(event => event.userId === userId)
      .slice(-limit);
  }
}

export const securityLogger = new SecurityLogger();
