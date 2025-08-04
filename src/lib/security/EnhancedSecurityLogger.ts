/**
 * Enterprise-grade security logger with circuit breaker pattern
 * Prevents logging system failures from affecting application performance
 */

import { EventEmitter } from 'events';

interface SecurityEvent {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'critical';
  category: 'auth' | 'upload' | 'access' | 'validation' | 'system';
  action: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  metadata?: Record<string, any>;
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  maxQueueSize: number;
}

interface LoggingMetrics {
  totalEvents: number;
  successfulLogs: number;
  failedLogs: number;
  circuitBreakerTrips: number;
  averageResponseTime: number;
  lastResetTime: Date;
}

type CircuitState = 'closed' | 'open' | 'half-open';

export class EnhancedSecurityLogger extends EventEmitter {
  private static instance: EnhancedSecurityLogger | null = null;
  
  private circuitState: CircuitState = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  private eventQueue: SecurityEvent[] = [];
  private metrics: LoggingMetrics;
  private config: CircuitBreakerConfig;
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor(config: Partial<CircuitBreakerConfig> = {}) {
    super();
    
    this.config = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 10000, // 10 seconds
      maxQueueSize: 10000,
      ...config
    };

    this.metrics = {
      totalEvents: 0,
      successfulLogs: 0,
      failedLogs: 0,
      circuitBreakerTrips: 0,
      averageResponseTime: 0,
      lastResetTime: new Date()
    };

    this.startQueueProcessor();
    this.setupHealthMonitoring();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<CircuitBreakerConfig>): EnhancedSecurityLogger {
    if (!this.instance) {
      this.instance = new EnhancedSecurityLogger(config);
    }
    return this.instance;
  }

  /**
   * Log a security event with circuit breaker protection
   */
  public async logSecurityEvent(
    level: SecurityEvent['level'],
    category: SecurityEvent['category'],
    action: string,
    details: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      level,
      category,
      action,
      details,
      metadata
    };

    this.metrics.totalEvents++;

    // Check circuit breaker state
    if (this.circuitState === 'open') {
      if (this.shouldAttemptReset()) {
        this.circuitState = 'half-open';
        this.successCount = 0;
      } else {
        // Circuit is open, queue event for later
        this.queueEvent(event);
        return false;
      }
    }

    try {
      const startTime = Date.now();
      const success = await this.writeSecurityLog(event);
      const responseTime = Date.now() - startTime;
      
      this.updateMetrics(responseTime, success);
      
      if (success) {
        this.onLogSuccess();
        return true;
      } else {
        this.onLogFailure();
        this.queueEvent(event);
        return false;
      }
    } catch (error) {
      this.onLogFailure();
      this.queueEvent(event);
      this.emit('loggingError', { event, error });
      return false;
    }
  }

  /**
   * Log authentication events
   */
  public async logAuth(
    action: 'login' | 'logout' | 'failed_login' | 'password_reset' | 'account_locked',
    userId: string | null,
    details: Record<string, any>,
    request?: { ip?: string; userAgent?: string; sessionId?: string }
  ): Promise<boolean> {
    const level = action === 'failed_login' || action === 'account_locked' ? 'warn' : 'info';
    
    return this.logSecurityEvent(level, 'auth', action, {
      userId,
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
      sessionId: request?.sessionId,
      ...details
    });
  }

  /**
   * Log file upload events
   */
  public async logUpload(
    action: 'upload_success' | 'upload_rejected' | 'validation_failed',
    userId: string,
    details: Record<string, any>,
    request?: { ip?: string; userAgent?: string }
  ): Promise<boolean> {
    const level = action === 'upload_success' ? 'info' : 'warn';
    
    return this.logSecurityEvent(level, 'upload', action, {
      userId,
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
      ...details
    });
  }

  /**
   * Log critical security events
   */
  public async logCritical(
    action: string,
    details: Record<string, any>,
    request?: { ip?: string; userAgent?: string; userId?: string }
  ): Promise<boolean> {
    return this.logSecurityEvent('critical', 'system', action, {
      userId: request?.userId,
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
      ...details
    });
  }

  /**
   * Get current metrics and circuit breaker status
   */
  public getMetrics(): LoggingMetrics & { circuitState: CircuitState; queueSize: number } {
    return {
      ...this.metrics,
      circuitState: this.circuitState,
      queueSize: this.eventQueue.length
    };
  }

  /**
   * Force reset circuit breaker (admin function)
   */
  public resetCircuitBreaker(): void {
    this.circuitState = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.metrics.lastResetTime = new Date();
    this.emit('circuitReset');
  }

  /**
   * Flush queued events (when circuit recovers)
   */
  public async flushQueue(): Promise<number> {
    const _originalQueueSize = this.eventQueue.length;
    let processedCount = 0;

    while (this.eventQueue.length > 0 && this.circuitState !== 'open') {
      const event = this.eventQueue.shift()!;
      try {
        const success = await this.writeSecurityLog(event);
        if (success) {
          processedCount++;
        } else {
          // Put event back at front of queue
          this.eventQueue.unshift(event);
          break;
        }
      } catch {
        // Put event back at front of queue
        this.eventQueue.unshift(event);
        break;
      }
    }

    return processedCount;
  }

  private async writeSecurityLog(event: SecurityEvent): Promise<boolean> {
    try {
      // In a real implementation, this would write to your logging system
      // (e.g., database, file, external service like Splunk, DataDog, etc.)
      
      // For now, use console with structured format
      const logEntry = {
        ...event,
        environment: process.env.NODE_ENV || 'development',
        application: 'monolith-template',
        version: process.env.npm_package_version || '1.0.0'
      };

      // Simulate potential logging failures for testing
      if (process.env.NODE_ENV === 'test' && Math.random() < 0.1) {
        throw new Error('Simulated logging failure');
      }

      console.log(JSON.stringify(logEntry, null, 2));
      
      // In production, you might write to multiple destinations:
      // await Promise.all([
      //   this.writeToDatabase(event),
      //   this.writeToFile(event),
      //   this.sendToSIEM(event)
      // ]);

      return true;
    } catch (error) {
      console.error('Security logging failed:', error);
      return false;
    }
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  private queueEvent(event: SecurityEvent): void {
    if (this.eventQueue.length < this.config.maxQueueSize) {
      this.eventQueue.push(event);
    } else {
      // Queue is full, remove oldest event
      this.eventQueue.shift();
      this.eventQueue.push(event);
      this.emit('queueOverflow', { droppedEvent: event });
    }
  }

  private onLogSuccess(): void {
    if (this.circuitState === 'half-open') {
      this.successCount++;
      if (this.successCount >= 3) {
        // Circuit recovered
        this.circuitState = 'closed';
        this.failureCount = 0;
        this.emit('circuitClosed');
      }
    } else if (this.circuitState === 'closed') {
      // Reset failure count on success
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }

  private onLogFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.circuitState = 'open';
      this.metrics.circuitBreakerTrips++;
      this.emit('circuitOpened', { failureCount: this.failureCount });
    }
  }

  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastFailureTime >= this.config.resetTimeout;
  }

  private updateMetrics(responseTime: number, success: boolean): void {
    if (success) {
      this.metrics.successfulLogs++;
    } else {
      this.metrics.failedLogs++;
    }

    // Update rolling average response time
    const totalLogs = this.metrics.successfulLogs + this.metrics.failedLogs;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalLogs - 1) + responseTime) / totalLogs;
  }

  private startQueueProcessor(): void {
    this.processingInterval = setInterval(async () => {
      if (this.eventQueue.length > 0 && this.circuitState === 'closed') {
        await this.flushQueue();
      }
    }, this.config.monitoringPeriod);
  }

  private setupHealthMonitoring(): void {
    setInterval(() => {
      this.emit('healthCheck', this.getMetrics());
    }, this.config.monitoringPeriod * 6); // Every minute by default
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    this.removeAllListeners();
    EnhancedSecurityLogger.instance = null;
  }
}

// Export singleton instance for convenience
export const securityLogger = EnhancedSecurityLogger.getInstance();
