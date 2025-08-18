/**
 * Admin Security Logs API Endpoint
 * 
 * This endpoint allows administrators to view security logs with filtering and pagination.
 * Protected by RBAC - requires VIEW_SECURITY_LOGS permission.
 */

import { NextRequest, NextResponse } from "next/server";
import { securityLogger, SecurityEventType } from '@/lib/security/security-logger';
import { withPermissionProtection } from '@/lib/auth/rbac-middleware';
import { Permission } from '@/lib/auth/roles';

async function handleSecurityLogsRequest(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const userFilter = searchParams.get('userId');

    let events;
    if (userFilter) {
      events = await securityLogger.getEventsByUserFromDatabase(userFilter, limit);
    } else {
      events = await securityLogger.getRecentEventsFromDatabase(limit);
    }

    // Format events for frontend consumption
    const formattedEvents = events.map(event => ({
      id: event.id,
      eventType: event.eventType,
      userId: event.userId,
      userEmail: event.user?.email || 'Unknown',
      userName: event.user?.name || 'Unknown',
      timestamp: event.timestamp,
      severity: event.severity,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      details: JSON.parse(event.details || '{}'),
    }));

    // Log admin access to security logs
    securityLogger.log({
      type: SecurityEventType.ADMIN_SECURITY_LOGS_ACCESS,
      userId: user.id,
      details: { 
        accessedBy: user.email,
        filterUserId: userFilter,
        resultCount: formattedEvents.length
      },
      severity: 'low'
    });

    return NextResponse.json({ 
      events: formattedEvents,
      total: events.length,
    });
  } catch (error) {
    console.error("Failed to fetch security logs:", error);
    
    // Log the error for security monitoring
    securityLogger.log({
      type: SecurityEventType.ADMIN_ACTION_ERROR,
      userId: user.id,
      details: { 
        action: 'fetch_security_logs',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      severity: 'medium'
    });
    
    return NextResponse.json(
      { error: "Failed to fetch security logs" },
      { status: 500 }
    );
  }
}

// Export the protected route handler - requires VIEW_SECURITY_LOGS permission
export const GET = withPermissionProtection(
  Permission.VIEW_SECURITY_LOGS,
  handleSecurityLogsRequest
);
