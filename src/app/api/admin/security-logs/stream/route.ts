/**
 * Admin Security Logs Stream API Endpoint
 * 
 * This endpoint provides real-time security events via Server-Sent Events (SSE).
 * Protected by RBAC - requires VIEW_SECURITY_LOGS permission.
 */

import { NextRequest, NextResponse } from "next/server";
import { withPermissionProtection } from '@/lib/auth/rbac-middleware';
import { Permission } from '@/lib/auth/roles';
import { EnhancedSecurityLogger } from "@/lib/security/EnhancedSecurityLogger";

async function handleSecurityLogsStream(request: NextRequest, user: any) {
  try {
    // Set up SSE headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Future enhancement: track last event timestamp for efficient updates
        const _lastEventTimestamp: string | null = null;
        
        // Send initial data
        const sendEvents = async () => {
          try {
            // Use enhanced security logger metrics for streaming
            const logger = EnhancedSecurityLogger.getInstance();
            const metrics = logger.getMetrics();

            const eventData = {
              metrics,
              timestamp: new Date().toISOString(),
              status: 'active',
              connectedUser: {
                id: user.id,
                email: user.email
              }
            };

            controller.enqueue(`data: ${JSON.stringify(eventData)}\n\n`);
          } catch (error) {
            controller.enqueue(`data: ${JSON.stringify({ error: 'Failed to fetch events' })}\n\n`);
          }
        };

        // Send initial events
        sendEvents();

        // Set up periodic updates (every 30 seconds)
        const interval = setInterval(sendEvents, 30000);

        // Cleanup function
        return () => {
          clearInterval(interval);
        };
      }
    });

    return new Response(stream, { headers });

  } catch (error) {
    console.error('Security logs stream error:', error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

// Export the protected route handler - requires VIEW_SECURITY_LOGS permission
export const GET = withPermissionProtection(
  Permission.VIEW_SECURITY_LOGS,
  handleSecurityLogsStream
);
