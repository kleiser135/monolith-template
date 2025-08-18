/**
 * Role-Based Access Control (RBAC) React Hooks
 * 
 * This module provides React hooks for role-based UI rendering
 * and permission checks in React components.
 */

'use client';

import { useEffect, useState } from 'react';
import { UserRole, Permission, hasPermission, hasAnyPermission, getRolePermissions } from './roles';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  avatar?: string | null;
}

/**
 * Hook to get current user information
 */
export function useUser(): { user: User | null; loading: boolean; error: string | null } {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else if (response.status !== 401) {
          // 401 is expected when not logged in, don't treat as error
          setError('Failed to fetch user information');
        }
      } catch (err) {
        setError('Failed to fetch user information');
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return { user, loading, error };
}

/**
 * Hook to check if current user has a specific role
 */
export function useHasRole(requiredRole: UserRole): boolean {
  const { user } = useUser();
  
  if (!user) return false;
  
  return user.role === requiredRole;
}

/**
 * Hook to check if current user has any of the specified roles
 */
export function useHasAnyRole(requiredRoles: UserRole[]): boolean {
  const { user } = useUser();
  
  if (!user) return false;
  
  return requiredRoles.includes(user.role as UserRole);
}

/**
 * Hook to check if current user has a specific permission
 */
export function useHasPermission(permission: Permission): boolean {
  const { user } = useUser();
  
  if (!user) return false;
  
  return hasPermission(user.role, permission);
}

/**
 * Hook to check if current user has any of the specified permissions
 */
export function useHasAnyPermission(permissions: Permission[]): boolean {
  const { user } = useUser();
  
  if (!user) return false;
  
  return hasAnyPermission(user.role, permissions);
}

/**
 * Hook to get all permissions for the current user
 */
export function useUserPermissions(): Permission[] {
  const { user } = useUser();
  
  if (!user) return [];
  
  return getRolePermissions(user.role);
}

/**
 * Hook to check if current user can access a resource
 * (either their own resource or has admin permissions)
 */
export function useCanAccessResource(resourceUserId: string): boolean {
  const { user } = useUser();
  const hasAdminPermission = useHasPermission(Permission.READ_USERS);
  
  if (!user) return false;
  
  return user.id === resourceUserId || hasAdminPermission;
}

/**
 * Hook to check if current user can modify a resource
 */
export function useCanModifyResource(resourceUserId: string): boolean {
  const { user } = useUser();
  const hasAdminPermission = useHasPermission(Permission.UPDATE_USERS);
  
  if (!user) return false;
  
  return user.id === resourceUserId || hasAdminPermission;
}

/**
 * Hook to check if current user can delete a resource
 */
export function useCanDeleteResource(resourceUserId: string): boolean {
  const { user } = useUser();
  const hasOwnDeletePermission = useHasPermission(Permission.DELETE_OWN_PROFILE);
  const hasAdminDeletePermission = useHasPermission(Permission.DELETE_USERS);
  
  if (!user) return false;
  
  // Can delete own resource if they have own delete permission
  if (user.id === resourceUserId && hasOwnDeletePermission) {
    return true;
  }
  
  // Or if they have admin delete permission
  return hasAdminDeletePermission;
}
