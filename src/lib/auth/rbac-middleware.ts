/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * This middleware provides utilities for protecting API routes and pages
 * based on user roles and permissions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/database/prisma';
import { UserRole, Permission, hasPermission, hasAnyPermission, isValidRole } from './roles';

interface JwtPayload {
  userId: string;
}

interface UserContext {
  id: string;
  email: string;
  role: string;
  permissions: Permission[];
}

/**
 * Get user context from JWT token
 */
export async function getUserContext(request: NextRequest): Promise<UserContext | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as JwtPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true }
    });

    if (!user || !isValidRole(user.role)) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: [] // Will be populated by permission checks
    };
  } catch (error) {
    console.error('Error getting user context:', error);
    return null;
  }
}

/**
 * Middleware factory for role-based route protection
 */
export function requireRole(allowedRoles: UserRole[]) {
  return async function roleMiddleware(request: NextRequest) {
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!allowedRoles.includes(user.role as UserRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return null; // Allow request to continue
  };
}

/**
 * Middleware factory for permission-based route protection
 */
export function requirePermission(requiredPermission: Permission) {
  return async function permissionMiddleware(request: NextRequest) {
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!hasPermission(user.role, requiredPermission)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return null; // Allow request to continue
  };
}

/**
 * Middleware factory for multiple permission check (any of the permissions)
 */
export function requireAnyPermission(requiredPermissions: Permission[]) {
  return async function anyPermissionMiddleware(request: NextRequest) {
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!hasAnyPermission(user.role, requiredPermissions)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return null; // Allow request to continue
  };
}

/**
 * Higher-order function to protect API route handlers
 */
export function withRoleProtection<T extends any[]>(
  allowedRoles: UserRole[],
  handler: (request: NextRequest, user: UserContext, ...args: T) => Promise<Response>
) {
  return async function protectedHandler(request: NextRequest, ...args: T) {
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!allowedRoles.includes(user.role as UserRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(request, user, ...args);
  };
}

/**
 * Higher-order function to protect API route handlers with permission checks
 */
export function withPermissionProtection<T extends any[]>(
  requiredPermission: Permission,
  handler: (request: NextRequest, user: UserContext, ...args: T) => Promise<Response>
) {
  return async function protectedHandler(request: NextRequest, ...args: T) {
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!hasPermission(user.role, requiredPermission)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(request, user, ...args);
  };
}

/**
 * Check if user can access their own resource or has admin permissions
 */
export function canAccessResource(user: UserContext, resourceUserId: string): boolean {
  // User can access their own resources
  if (user.id === resourceUserId) {
    return true;
  }
  
  // Or if they have admin permissions
  return hasPermission(user.role, Permission.READ_USERS);
}

/**
 * Check if user can modify a resource (their own or has admin permissions)
 */
export function canModifyResource(user: UserContext, resourceUserId: string): boolean {
  // User can modify their own resources
  if (user.id === resourceUserId) {
    return true;
  }
  
  // Or if they have admin permissions
  return hasPermission(user.role, Permission.UPDATE_USERS);
}

/**
 * Check if user can delete a resource (their own or has admin permissions)
 */
export function canDeleteResource(user: UserContext, resourceUserId: string): boolean {
  // User can delete their own resources (with own delete permission)
  if (user.id === resourceUserId && hasPermission(user.role, Permission.DELETE_OWN_PROFILE)) {
    return true;
  }
  
  // Or if they have admin delete permissions
  return hasPermission(user.role, Permission.DELETE_USERS);
}
