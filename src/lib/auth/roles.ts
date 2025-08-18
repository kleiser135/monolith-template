/**
 * Role-Based Access Control (RBAC) System
 * 
 * This module defines user roles, permissions, and access control utilities
 * for the application. It provides a flexible and extensible RBAC implementation.
 */

// Define available user roles
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  SUPER_ADMIN = 'super_admin'
}

// Define available permissions
export enum Permission {
  // User management
  READ_USERS = 'read:users',
  CREATE_USERS = 'create:users',
  UPDATE_USERS = 'update:users',
  DELETE_USERS = 'delete:users',
  
  // Profile management
  READ_OWN_PROFILE = 'read:own_profile',
  UPDATE_OWN_PROFILE = 'update:own_profile',
  DELETE_OWN_PROFILE = 'delete:own_profile',
  
  // Admin functions
  ACCESS_ADMIN_PANEL = 'access:admin_panel',
  VIEW_SECURITY_LOGS = 'view:security_logs',
  MANAGE_SYSTEM_SETTINGS = 'manage:system_settings',
  
  // Content moderation
  MODERATE_CONTENT = 'moderate:content',
  BAN_USERS = 'ban:users',
  
  // Super admin functions
  MANAGE_ADMINS = 'manage:admins',
  SYSTEM_MAINTENANCE = 'system:maintenance'
}

// Define role-permission mappings with explicit definitions
const USER_PERMISSIONS = [
  Permission.READ_OWN_PROFILE,
  Permission.UPDATE_OWN_PROFILE,
  Permission.DELETE_OWN_PROFILE
];

const MODERATOR_PERMISSIONS = [
  ...USER_PERMISSIONS,
  Permission.MODERATE_CONTENT,
  Permission.READ_USERS
];

const ADMIN_PERMISSIONS = [
  ...MODERATOR_PERMISSIONS,
  Permission.ACCESS_ADMIN_PANEL,
  Permission.VIEW_SECURITY_LOGS,
  Permission.CREATE_USERS,
  Permission.UPDATE_USERS,
  Permission.DELETE_USERS,
  Permission.BAN_USERS,
  Permission.MANAGE_SYSTEM_SETTINGS
];

const SUPER_ADMIN_PERMISSIONS = [
  ...ADMIN_PERMISSIONS,
  Permission.MANAGE_ADMINS,
  Permission.SYSTEM_MAINTENANCE
];

// Export the role-permission mappings
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: USER_PERMISSIONS,
  [UserRole.MODERATOR]: MODERATOR_PERMISSIONS,
  [UserRole.ADMIN]: ADMIN_PERMISSIONS,
  [UserRole.SUPER_ADMIN]: SUPER_ADMIN_PERMISSIONS
};

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(userRole: string, permission: Permission): boolean {
  // Validate the role exists
  if (!Object.values(UserRole).includes(userRole as UserRole)) {
    return false;
  }
  
  const role = userRole as UserRole;
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  
  return rolePermissions.includes(permission);
}

/**
 * Check if a user role has any of the specified permissions
 */
export function hasAnyPermission(userRole: string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user role has all of the specified permissions
 */
export function hasAllPermissions(userRole: string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a given user role
 */
export function getRolePermissions(userRole: string): Permission[] {
  if (!Object.values(UserRole).includes(userRole as UserRole)) {
    return [];
  }
  
  const role = userRole as UserRole;
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role is higher than another role (for hierarchy checks)
 */
export function isRoleHigherThan(userRole: string, targetRole: string): boolean {
  const roleHierarchy = {
    [UserRole.USER]: 0,
    [UserRole.MODERATOR]: 1,
    [UserRole.ADMIN]: 2,
    [UserRole.SUPER_ADMIN]: 3
  };
  
  const userLevel = roleHierarchy[userRole as UserRole] ?? -1;
  const targetLevel = roleHierarchy[targetRole as UserRole] ?? -1;
  
  return userLevel > targetLevel;
}

/**
 * Validate if a role string is a valid UserRole
 */
export function isValidRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

/**
 * Get a human-readable role name
 */
export function getRoleDisplayName(role: string): string {
  const roleNames = {
    [UserRole.USER]: 'User',
    [UserRole.MODERATOR]: 'Moderator',
    [UserRole.ADMIN]: 'Administrator',
    [UserRole.SUPER_ADMIN]: 'Super Administrator'
  };
  
  return roleNames[role as UserRole] || 'Unknown Role';
}
