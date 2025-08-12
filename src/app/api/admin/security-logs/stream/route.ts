import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from '@/lib/database/prisma';
import { EnhancedSecurityLogger } from "@/lib/security/EnhancedSecurityLogger";

interface JwtPayload {
  userId: string;
}

async function getUserFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as JwtPayload;
    return decoded.userId;
  } catch (_error) {
    return null;
  }
}

async function getUserById(userId: string) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });
  } catch (_error) {
    return null;
  }
}

// Helper function to check if user is admin (for template purposes)
function isAdmin(user: { email: string } | null): boolean {
  if (!user) return false;
  // Use environment variable for admin emails, or implement proper role system
  const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
  const adminEmails = adminEmailsEnv.split(',').map(email => email.trim()).filter(email => email.length > 0);
  return adminEmails.includes(user.email);
}

export async function GET(_req: NextRequest) {
  try {
    const userId = await getUserFromToken();
    
    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Enforce role-based access control: only admins can view security logs
    const user = await getUserById(userId);
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

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
              status: 'active'
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
