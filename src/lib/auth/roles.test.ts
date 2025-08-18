import { describe, it, expect } from 'vitest'
import {
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  isRoleHigherThan,
  isValidRole,
  getRoleDisplayName
} from './roles'

describe('Roles and Permissions', () => {
  describe('UserRole enum', () => {
    it('defines all expected user roles', () => {
      expect(UserRole.USER).toBe('user')
      expect(UserRole.ADMIN).toBe('admin')
      expect(UserRole.MODERATOR).toBe('moderator')
      expect(UserRole.SUPER_ADMIN).toBe('super_admin')
    })
  })

  describe('Permission enum', () => {
    it('defines all expected permissions', () => {
      // User management
      expect(Permission.READ_USERS).toBe('read:users')
      expect(Permission.CREATE_USERS).toBe('create:users')
      expect(Permission.UPDATE_USERS).toBe('update:users')
      expect(Permission.DELETE_USERS).toBe('delete:users')
      
      // Profile management
      expect(Permission.READ_OWN_PROFILE).toBe('read:own_profile')
      expect(Permission.UPDATE_OWN_PROFILE).toBe('update:own_profile')
      expect(Permission.DELETE_OWN_PROFILE).toBe('delete:own_profile')
      
      // Admin functions
      expect(Permission.ACCESS_ADMIN_PANEL).toBe('access:admin_panel')
      expect(Permission.VIEW_SECURITY_LOGS).toBe('view:security_logs')
      expect(Permission.MANAGE_SYSTEM_SETTINGS).toBe('manage:system_settings')
      
      // Content moderation
      expect(Permission.MODERATE_CONTENT).toBe('moderate:content')
      expect(Permission.BAN_USERS).toBe('ban:users')
      
      // Super admin functions
      expect(Permission.MANAGE_ADMINS).toBe('manage:admins')
      expect(Permission.SYSTEM_MAINTENANCE).toBe('system:maintenance')
    })
  })

  describe('ROLE_PERMISSIONS', () => {
    it('defines correct permissions for USER role', () => {
      const userPermissions = ROLE_PERMISSIONS[UserRole.USER]
      expect(userPermissions).toContain(Permission.READ_OWN_PROFILE)
      expect(userPermissions).toContain(Permission.UPDATE_OWN_PROFILE)
      expect(userPermissions).toContain(Permission.DELETE_OWN_PROFILE)
      expect(userPermissions).toHaveLength(3)
    })

    it('defines correct permissions for MODERATOR role', () => {
      const moderatorPermissions = ROLE_PERMISSIONS[UserRole.MODERATOR]
      
      // Should include all user permissions
      expect(moderatorPermissions).toContain(Permission.READ_OWN_PROFILE)
      expect(moderatorPermissions).toContain(Permission.UPDATE_OWN_PROFILE)
      expect(moderatorPermissions).toContain(Permission.DELETE_OWN_PROFILE)
      
      // Plus moderator-specific permissions
      expect(moderatorPermissions).toContain(Permission.MODERATE_CONTENT)
      expect(moderatorPermissions).toContain(Permission.READ_USERS)
      expect(moderatorPermissions).toHaveLength(5)
    })

    it('defines correct permissions for ADMIN role', () => {
      const adminPermissions = ROLE_PERMISSIONS[UserRole.ADMIN]
      
      // Should include all moderator permissions
      expect(adminPermissions).toContain(Permission.READ_OWN_PROFILE)
      expect(adminPermissions).toContain(Permission.UPDATE_OWN_PROFILE)
      expect(adminPermissions).toContain(Permission.DELETE_OWN_PROFILE)
      expect(adminPermissions).toContain(Permission.MODERATE_CONTENT)
      expect(adminPermissions).toContain(Permission.READ_USERS)
      
      // Plus admin-specific permissions
      expect(adminPermissions).toContain(Permission.ACCESS_ADMIN_PANEL)
      expect(adminPermissions).toContain(Permission.VIEW_SECURITY_LOGS)
      expect(adminPermissions).toContain(Permission.CREATE_USERS)
      expect(adminPermissions).toContain(Permission.UPDATE_USERS)
      expect(adminPermissions).toContain(Permission.DELETE_USERS)
      expect(adminPermissions).toContain(Permission.BAN_USERS)
      expect(adminPermissions).toContain(Permission.MANAGE_SYSTEM_SETTINGS)
      expect(adminPermissions).toHaveLength(12)
    })

    it('defines correct permissions for SUPER_ADMIN role', () => {
      const superAdminPermissions = ROLE_PERMISSIONS[UserRole.SUPER_ADMIN]
      
      // Should include all admin permissions
      expect(superAdminPermissions).toContain(Permission.ACCESS_ADMIN_PANEL)
      expect(superAdminPermissions).toContain(Permission.VIEW_SECURITY_LOGS)
      expect(superAdminPermissions).toContain(Permission.CREATE_USERS)
      
      // Plus super admin-specific permissions
      expect(superAdminPermissions).toContain(Permission.MANAGE_ADMINS)
      expect(superAdminPermissions).toContain(Permission.SYSTEM_MAINTENANCE)
      expect(superAdminPermissions).toHaveLength(14)
    })
  })

  describe('hasPermission', () => {
    it('returns true when user has the specified permission', () => {
      expect(hasPermission(UserRole.ADMIN, Permission.ACCESS_ADMIN_PANEL)).toBe(true)
      expect(hasPermission(UserRole.USER, Permission.READ_OWN_PROFILE)).toBe(true)
      expect(hasPermission(UserRole.MODERATOR, Permission.MODERATE_CONTENT)).toBe(true)
      expect(hasPermission(UserRole.SUPER_ADMIN, Permission.MANAGE_ADMINS)).toBe(true)
    })

    it('returns false when user does not have the specified permission', () => {
      expect(hasPermission(UserRole.USER, Permission.ACCESS_ADMIN_PANEL)).toBe(false)
      expect(hasPermission(UserRole.MODERATOR, Permission.DELETE_USERS)).toBe(false)
      expect(hasPermission(UserRole.ADMIN, Permission.MANAGE_ADMINS)).toBe(false)
    })

    it('returns false for invalid role', () => {
      expect(hasPermission('invalid_role', Permission.READ_OWN_PROFILE)).toBe(false)
    })

    it('inherits permissions from lower roles', () => {
      // Admin should have all moderator permissions
      expect(hasPermission(UserRole.ADMIN, Permission.MODERATE_CONTENT)).toBe(true)
      expect(hasPermission(UserRole.ADMIN, Permission.READ_USERS)).toBe(true)
      
      // Super admin should have all admin permissions
      expect(hasPermission(UserRole.SUPER_ADMIN, Permission.ACCESS_ADMIN_PANEL)).toBe(true)
      expect(hasPermission(UserRole.SUPER_ADMIN, Permission.DELETE_USERS)).toBe(true)
    })
  })

  describe('hasAnyPermission', () => {
    it('returns true when user has at least one of the specified permissions', () => {
      expect(hasAnyPermission(UserRole.ADMIN, [
        Permission.ACCESS_ADMIN_PANEL,
        Permission.MANAGE_ADMINS
      ])).toBe(true)
      
      expect(hasAnyPermission(UserRole.USER, [
        Permission.READ_OWN_PROFILE,
        Permission.ACCESS_ADMIN_PANEL
      ])).toBe(true)
    })

    it('returns false when user has none of the specified permissions', () => {
      expect(hasAnyPermission(UserRole.USER, [
        Permission.ACCESS_ADMIN_PANEL,
        Permission.DELETE_USERS
      ])).toBe(false)
      
      expect(hasAnyPermission(UserRole.MODERATOR, [
        Permission.MANAGE_ADMINS,
        Permission.SYSTEM_MAINTENANCE
      ])).toBe(false)
    })

    it('returns false for empty permissions array', () => {
      expect(hasAnyPermission(UserRole.ADMIN, [])).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('returns true when user has all of the specified permissions', () => {
      expect(hasAllPermissions(UserRole.ADMIN, [
        Permission.ACCESS_ADMIN_PANEL,
        Permission.VIEW_SECURITY_LOGS,
        Permission.CREATE_USERS
      ])).toBe(true)
      
      expect(hasAllPermissions(UserRole.USER, [
        Permission.READ_OWN_PROFILE,
        Permission.UPDATE_OWN_PROFILE
      ])).toBe(true)
    })

    it('returns false when user is missing any of the specified permissions', () => {
      expect(hasAllPermissions(UserRole.USER, [
        Permission.READ_OWN_PROFILE,
        Permission.ACCESS_ADMIN_PANEL
      ])).toBe(false)
      
      expect(hasAllPermissions(UserRole.MODERATOR, [
        Permission.MODERATE_CONTENT,
        Permission.DELETE_USERS
      ])).toBe(false)
    })

    it('returns true for empty permissions array', () => {
      expect(hasAllPermissions(UserRole.USER, [])).toBe(true)
    })
  })

  describe('getRolePermissions', () => {
    it('returns correct permissions for valid roles', () => {
      const userPermissions = getRolePermissions(UserRole.USER)
      expect(userPermissions).toContain(Permission.READ_OWN_PROFILE)
      expect(userPermissions).toHaveLength(3)
      
      const adminPermissions = getRolePermissions(UserRole.ADMIN)
      expect(adminPermissions).toContain(Permission.ACCESS_ADMIN_PANEL)
      expect(adminPermissions).toHaveLength(12)
    })

    it('returns empty array for invalid role', () => {
      expect(getRolePermissions('invalid_role')).toEqual([])
    })
  })

  describe('isRoleHigherThan', () => {
    it('correctly determines role hierarchy', () => {
      expect(isRoleHigherThan(UserRole.ADMIN, UserRole.USER)).toBe(true)
      expect(isRoleHigherThan(UserRole.ADMIN, UserRole.MODERATOR)).toBe(true)
      expect(isRoleHigherThan(UserRole.SUPER_ADMIN, UserRole.ADMIN)).toBe(true)
      expect(isRoleHigherThan(UserRole.MODERATOR, UserRole.USER)).toBe(true)
    })

    it('returns false for same or lower roles', () => {
      expect(isRoleHigherThan(UserRole.USER, UserRole.ADMIN)).toBe(false)
      expect(isRoleHigherThan(UserRole.ADMIN, UserRole.ADMIN)).toBe(false)
      expect(isRoleHigherThan(UserRole.MODERATOR, UserRole.ADMIN)).toBe(false)
    })

    it('returns false for invalid roles', () => {
      expect(isRoleHigherThan('invalid_role', UserRole.USER)).toBe(false)
      expect(isRoleHigherThan(UserRole.ADMIN, 'invalid_role')).toBe(true) // Valid role is higher than invalid (-1)
      expect(isRoleHigherThan('invalid_role', 'invalid_role')).toBe(false)
    })
  })

  describe('isValidRole', () => {
    it('returns true for valid roles', () => {
      expect(isValidRole(UserRole.USER)).toBe(true)
      expect(isValidRole(UserRole.ADMIN)).toBe(true)
      expect(isValidRole(UserRole.MODERATOR)).toBe(true)
      expect(isValidRole(UserRole.SUPER_ADMIN)).toBe(true)
    })

    it('returns false for invalid roles', () => {
      expect(isValidRole('invalid_role')).toBe(false)
      expect(isValidRole('')).toBe(false)
      expect(isValidRole('ADMIN')).toBe(false) // Case sensitive
      expect(isValidRole('user ')).toBe(false) // Extra whitespace
    })
  })

  describe('getRoleDisplayName', () => {
    it('returns correct display names for valid roles', () => {
      expect(getRoleDisplayName(UserRole.USER)).toBe('User')
      expect(getRoleDisplayName(UserRole.ADMIN)).toBe('Administrator')
      expect(getRoleDisplayName(UserRole.MODERATOR)).toBe('Moderator')
      expect(getRoleDisplayName(UserRole.SUPER_ADMIN)).toBe('Super Administrator')
    })

    it('returns "Unknown Role" for invalid roles', () => {
      expect(getRoleDisplayName('invalid_role')).toBe('Unknown Role')
      expect(getRoleDisplayName('')).toBe('Unknown Role')
    })
  })

  describe('Role inheritance hierarchy', () => {
    it('maintains proper permission inheritance', () => {
      const userPerms = getRolePermissions(UserRole.USER)
      const moderatorPerms = getRolePermissions(UserRole.MODERATOR)
      const adminPerms = getRolePermissions(UserRole.ADMIN)
      const superAdminPerms = getRolePermissions(UserRole.SUPER_ADMIN)

      // Each higher role should contain all permissions of lower roles
      userPerms.forEach(permission => {
        expect(moderatorPerms).toContain(permission)
        expect(adminPerms).toContain(permission)
        expect(superAdminPerms).toContain(permission)
      })

      moderatorPerms.forEach(permission => {
        expect(adminPerms).toContain(permission)
        expect(superAdminPerms).toContain(permission)
      })

      adminPerms.forEach(permission => {
        expect(superAdminPerms).toContain(permission)
      })
    })

    it('ensures higher roles have more permissions than lower roles', () => {
      const userPerms = getRolePermissions(UserRole.USER)
      const moderatorPerms = getRolePermissions(UserRole.MODERATOR)
      const adminPerms = getRolePermissions(UserRole.ADMIN)
      const superAdminPerms = getRolePermissions(UserRole.SUPER_ADMIN)

      expect(moderatorPerms.length).toBeGreaterThan(userPerms.length)
      expect(adminPerms.length).toBeGreaterThan(moderatorPerms.length)
      expect(superAdminPerms.length).toBeGreaterThan(adminPerms.length)
    })
  })

  describe('Security scenarios', () => {
    it('prevents privilege escalation through permission checks', () => {
      // Regular users should not have admin permissions
      expect(hasPermission(UserRole.USER, Permission.ACCESS_ADMIN_PANEL)).toBe(false)
      expect(hasPermission(UserRole.USER, Permission.DELETE_USERS)).toBe(false)
      expect(hasPermission(UserRole.USER, Permission.MANAGE_SYSTEM_SETTINGS)).toBe(false)

      // Moderators should not have admin-only permissions
      expect(hasPermission(UserRole.MODERATOR, Permission.ACCESS_ADMIN_PANEL)).toBe(false)
      expect(hasPermission(UserRole.MODERATOR, Permission.DELETE_USERS)).toBe(false)
      expect(hasPermission(UserRole.MODERATOR, Permission.MANAGE_ADMINS)).toBe(false)

      // Admins should not have super admin permissions
      expect(hasPermission(UserRole.ADMIN, Permission.MANAGE_ADMINS)).toBe(false)
      expect(hasPermission(UserRole.ADMIN, Permission.SYSTEM_MAINTENANCE)).toBe(false)
    })

    it('validates that sensitive permissions are restricted to appropriate roles', () => {
      const sensitivePermissions = [
        Permission.DELETE_USERS,
        Permission.MANAGE_SYSTEM_SETTINGS,
        Permission.VIEW_SECURITY_LOGS,
        Permission.MANAGE_ADMINS,
        Permission.SYSTEM_MAINTENANCE
      ]

      sensitivePermissions.forEach(permission => {
        expect(hasPermission(UserRole.USER, permission)).toBe(false)
      })

      // Only super admins should have the most sensitive permissions
      expect(hasPermission(UserRole.ADMIN, Permission.MANAGE_ADMINS)).toBe(false)
      expect(hasPermission(UserRole.ADMIN, Permission.SYSTEM_MAINTENANCE)).toBe(false)
      expect(hasPermission(UserRole.SUPER_ADMIN, Permission.MANAGE_ADMINS)).toBe(true)
      expect(hasPermission(UserRole.SUPER_ADMIN, Permission.SYSTEM_MAINTENANCE)).toBe(true)
    })
  })
})
