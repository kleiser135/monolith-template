import { NextRequest, NextResponse } from 'next/server';
import { securityMonitor } from '@/lib/redis/security-monitor';
import { checkRateLimit, RATE_LIMITS } from '@/lib/redis/rate-limiter';
import { isRedisAvailable } from '@/lib/redis/client';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting for dashboard access
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';

    const rateLimitResult = await checkRateLimit(
      `ip:${ip}`,
      RATE_LIMITS.API_GENERAL,
      'security_dashboard'
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Get time window from query params (default: 24 hours)
    const url = new URL(request.url);
    const hours = parseInt(url.searchParams.get('hours') || '24');
    const timeWindow = Math.min(hours, 168) * 60 * 60 * 1000; // Max 7 days

    // Get security metrics
    const metrics = await securityMonitor.getSecurityMetrics(timeWindow);

    // Get Redis status
    const redisStatus = await isRedisAvailable();

    // Additional system information
    const systemInfo = {
      redisAvailable: redisStatus,
      timeWindow: `${timeWindow / (60 * 60 * 1000)} hours`,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        systemInfo,
      },
    });

  } catch (error) {
    console.error('Security dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for manual security actions
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';

    const rateLimitResult = await checkRateLimit(
      `ip:${ip}`,
      { windowMs: 60 * 1000, maxRequests: 5 }, // 5 actions per minute
      'security_actions'
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'test_event':
        // Create a test security event for demonstration
        await securityMonitor.logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          ip: data.ip || ip,
          userAgent: request.headers.get('user-agent') || 'unknown',
          riskLevel: data.riskLevel || 'MEDIUM',
          source: 'API',
          metadata: {
            description: 'Manual test event',
            generatedBy: 'security_dashboard',
            ...data.metadata,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Test security event created',
        });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Security dashboard action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
