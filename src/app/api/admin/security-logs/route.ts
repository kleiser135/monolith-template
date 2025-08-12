import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { securityLogger } from '@/lib/security/security-logger';
import { prisma } from '@/lib/database/prisma';

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
      select: { id: true, email: true, role: true }
    });
  } catch (_error) {
    return null;
  }
}

// Helper function to check if user is admin using database role system
function isAdmin(user: { email: string, role?: string } | null): boolean {
  if (!user) return false;
  
  // Enforce role-based access control using the role property
  if (user.role === "admin") {
    return true;
  }
  
  // Fallback: Use environment variable for admin emails (legacy support)
  const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
  const adminEmails = adminEmailsEnv.split(',').map(email => email.trim()).filter(email => email.length > 0);
  return adminEmails.includes(user.email);
}

export async function GET(req: NextRequest) {
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
    
    const { searchParams } = new URL(req.url);
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

    return NextResponse.json({ 
      events: formattedEvents,
      total: events.length,
    });
  } catch (error) {
    console.error("Failed to fetch security logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch security logs" },
      { status: 500 }
    );
  }
}
