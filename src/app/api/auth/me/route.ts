/**
 * Get Current User API Endpoint
 * 
 * This endpoint returns the current authenticated user's information
 * including their role for RBAC purposes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/database/prisma';

interface JwtPayload {
  userId: string;
}

export async function GET(request: NextRequest) {
  try {
    // Extract token from cookie (web) or Authorization header (mobile)
    const cookieStore = await cookies();
    let token = cookieStore.get('token')?.value;

    // Check for Bearer token if no cookie token
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true, 
        avatar: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}
