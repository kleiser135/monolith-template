/**
 * Role-Based Access Control (RBAC) React Components
 * 
 * This module provides React components for conditional rendering
 * based on user roles and permissions.
 */

'use client';

import React from 'react';
import { UserRole, Permission } from '@/lib/auth/roles';
import { 
  useHasRole, 
  useHasAnyRole, 
  useHasPermission, 
  useHasAnyPermission,
  useCanAccessResource,
  useCanModifyResource,
  useCanDeleteResource
} from '@/lib/auth/rbac-hooks';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  fallback?: React.ReactNode;
}

/**
 * Component that renders children only if user has the required role
 */
export function RoleGuard({ children, requiredRole, fallback = null }: RoleGuardProps) {
  const hasRole = useHasRole(requiredRole);
  
  return hasRole ? <>{children}</> : <>{fallback}</>;
}

interface AnyRoleGuardProps {
  children: React.ReactNode;
  requiredRoles: UserRole[];
  fallback?: React.ReactNode;
}

/**
 * Component that renders children only if user has any of the required roles
 */
export function AnyRoleGuard({ children, requiredRoles, fallback = null }: AnyRoleGuardProps) {
  const hasAnyRole = useHasAnyRole(requiredRoles);
  
  return hasAnyRole ? <>{children}</> : <>{fallback}</>;
}

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission: Permission;
  fallback?: React.ReactNode;
}

/**
 * Component that renders children only if user has the required permission
 */
export function PermissionGuard({ children, requiredPermission, fallback = null }: PermissionGuardProps) {
  const hasPermission = useHasPermission(requiredPermission);
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

interface AnyPermissionGuardProps {
  children: React.ReactNode;
  requiredPermissions: Permission[];
  fallback?: React.ReactNode;
}

/**
 * Component that renders children only if user has any of the required permissions
 */
export function AnyPermissionGuard({ children, requiredPermissions, fallback = null }: AnyPermissionGuardProps) {
  const hasAnyPermission = useHasAnyPermission(requiredPermissions);
  
  return hasAnyPermission ? <>{children}</> : <>{fallback}</>;
}

interface ResourceGuardProps {
  children: React.ReactNode;
  resourceUserId: string;
  action: 'read' | 'write' | 'delete';
  fallback?: React.ReactNode;
}

/**
 * Component that renders children only if user can perform the action on the resource
 */
export function ResourceGuard({ children, resourceUserId, action, fallback = null }: ResourceGuardProps) {
  const canRead = useCanAccessResource(resourceUserId);
  const canWrite = useCanModifyResource(resourceUserId);
  const canDelete = useCanDeleteResource(resourceUserId);
  
  let hasAccess = false;
  
  switch (action) {
    case 'read':
      hasAccess = canRead;
      break;
    case 'write':
      hasAccess = canWrite;
      break;
    case 'delete':
      hasAccess = canDelete;
      break;
  }
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

interface AdminPanelGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that renders children only if user can access admin panel
 */
export function AdminPanelGuard({ children, fallback = null }: AdminPanelGuardProps) {
  return (
    <PermissionGuard requiredPermission={Permission.ACCESS_ADMIN_PANEL} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

interface ModeratorGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that renders children only if user has moderator or higher privileges
 */
export function ModeratorGuard({ children, fallback = null }: ModeratorGuardProps) {
  return (
    <AnyRoleGuard 
      requiredRoles={[UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]} 
      fallback={fallback}
    >
      {children}
    </AnyRoleGuard>
  );
}

interface SuperAdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that renders children only if user is a super admin
 */
export function SuperAdminGuard({ children, fallback = null }: SuperAdminGuardProps) {
  return (
    <RoleGuard requiredRole={UserRole.SUPER_ADMIN} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}
