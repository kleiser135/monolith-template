import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { securityLogger } from "@/lib/security-logger";

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

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserFromToken();
    
    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // TODO: In production, implement proper role-based access control
    // For now, any authenticated user can view security logs (template only)
    // Example: Check if user.role === "admin" after fetching user from database
    
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
