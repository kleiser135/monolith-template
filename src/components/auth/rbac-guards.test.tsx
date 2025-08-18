import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  RoleGuard,
  AnyRoleGuard,
  PermissionGuard,
  AnyPermissionGuard,
  ResourceGuard,
  AdminPanelGuard,
  ModeratorGuard,
  SuperAdminGuard
} from './rbac-guards'
import { UserRole, Permission } from '@/lib/auth/roles'

// Mock the rbac-hooks module
vi.mock('@/lib/auth/rbac-hooks', () => ({
  useHasRole: vi.fn(),
  useHasAnyRole: vi.fn(),
  useHasPermission: vi.fn(),
  useHasAnyPermission: vi.fn(),
  useCanAccessResource: vi.fn(),
  useCanModifyResource: vi.fn(),
  useCanDeleteResource: vi.fn()
}))

import {
  useHasRole,
  useHasAnyRole,
  useHasPermission,
  useHasAnyPermission,
  useCanAccessResource,
  useCanModifyResource,
  useCanDeleteResource
} from '@/lib/auth/rbac-hooks'

describe('RBAC Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('RoleGuard', () => {
    it('renders children when user has required role', () => {
      vi.mocked(useHasRole).mockReturnValue(true)

      render(
        <RoleGuard requiredRole={UserRole.ADMIN}>
          <div>Protected content</div>
        </RoleGuard>
      )

      expect(screen.getByText('Protected content')).toBeInTheDocument()
      expect(useHasRole).toHaveBeenCalledWith(UserRole.ADMIN)
    })

    it('renders fallback when user does not have required role', () => {
      vi.mocked(useHasRole).mockReturnValue(false)

      render(
        <RoleGuard requiredRole={UserRole.ADMIN} fallback={<div>Access denied</div>}>
          <div>Protected content</div>
        </RoleGuard>
      )

      expect(screen.getByText('Access denied')).toBeInTheDocument()
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    })

    it('renders null when user does not have required role and no fallback', () => {
      vi.mocked(useHasRole).mockReturnValue(false)

      const { container } = render(
        <RoleGuard requiredRole={UserRole.ADMIN}>
          <div>Protected content</div>
        </RoleGuard>
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('AnyRoleGuard', () => {
    it('renders children when user has any of the required roles', () => {
      vi.mocked(useHasAnyRole).mockReturnValue(true)

      render(
        <AnyRoleGuard requiredRoles={[UserRole.ADMIN, UserRole.MODERATOR]}>
          <div>Protected content</div>
        </AnyRoleGuard>
      )

      expect(screen.getByText('Protected content')).toBeInTheDocument()
      expect(useHasAnyRole).toHaveBeenCalledWith([UserRole.ADMIN, UserRole.MODERATOR])
    })

    it('renders fallback when user does not have any of the required roles', () => {
      vi.mocked(useHasAnyRole).mockReturnValue(false)

      render(
        <AnyRoleGuard 
          requiredRoles={[UserRole.ADMIN, UserRole.MODERATOR]} 
          fallback={<div>Access denied</div>}
        >
          <div>Protected content</div>
        </AnyRoleGuard>
      )

      expect(screen.getByText('Access denied')).toBeInTheDocument()
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    })
  })

  describe('PermissionGuard', () => {
    it('renders children when user has required permission', () => {
      vi.mocked(useHasPermission).mockReturnValue(true)

      render(
        <PermissionGuard requiredPermission={Permission.ACCESS_ADMIN_PANEL}>
          <div>Protected content</div>
        </PermissionGuard>
      )

      expect(screen.getByText('Protected content')).toBeInTheDocument()
      expect(useHasPermission).toHaveBeenCalledWith(Permission.ACCESS_ADMIN_PANEL)
    })

    it('renders fallback when user does not have required permission', () => {
      vi.mocked(useHasPermission).mockReturnValue(false)

      render(
        <PermissionGuard 
          requiredPermission={Permission.ACCESS_ADMIN_PANEL} 
          fallback={<div>Access denied</div>}
        >
          <div>Protected content</div>
        </PermissionGuard>
      )

      expect(screen.getByText('Access denied')).toBeInTheDocument()
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    })
  })

  describe('AnyPermissionGuard', () => {
    it('renders children when user has any of the required permissions', () => {
      vi.mocked(useHasAnyPermission).mockReturnValue(true)

      render(
        <AnyPermissionGuard requiredPermissions={[Permission.READ_USERS, Permission.UPDATE_USERS]}>
          <div>Protected content</div>
        </AnyPermissionGuard>
      )

      expect(screen.getByText('Protected content')).toBeInTheDocument()
      expect(useHasAnyPermission).toHaveBeenCalledWith([Permission.READ_USERS, Permission.UPDATE_USERS])
    })

    it('renders fallback when user does not have any of the required permissions', () => {
      vi.mocked(useHasAnyPermission).mockReturnValue(false)

      render(
        <AnyPermissionGuard 
          requiredPermissions={[Permission.READ_USERS, Permission.UPDATE_USERS]} 
          fallback={<div>Access denied</div>}
        >
          <div>Protected content</div>
        </AnyPermissionGuard>
      )

      expect(screen.getByText('Access denied')).toBeInTheDocument()
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    })
  })

  describe('ResourceGuard', () => {
    const resourceUserId = 'user-123'

    it('renders children when user can read the resource', () => {
      vi.mocked(useCanAccessResource).mockReturnValue(true)
      vi.mocked(useCanModifyResource).mockReturnValue(false)
      vi.mocked(useCanDeleteResource).mockReturnValue(false)

      render(
        <ResourceGuard resourceUserId={resourceUserId} action="read">
          <div>Protected content</div>
        </ResourceGuard>
      )

      expect(screen.getByText('Protected content')).toBeInTheDocument()
      expect(useCanAccessResource).toHaveBeenCalledWith(resourceUserId)
    })

    it('renders children when user can write to the resource', () => {
      vi.mocked(useCanAccessResource).mockReturnValue(false)
      vi.mocked(useCanModifyResource).mockReturnValue(true)
      vi.mocked(useCanDeleteResource).mockReturnValue(false)

      render(
        <ResourceGuard resourceUserId={resourceUserId} action="write">
          <div>Protected content</div>
        </ResourceGuard>
      )

      expect(screen.getByText('Protected content')).toBeInTheDocument()
      expect(useCanModifyResource).toHaveBeenCalledWith(resourceUserId)
    })

    it('renders children when user can delete the resource', () => {
      vi.mocked(useCanAccessResource).mockReturnValue(false)
      vi.mocked(useCanModifyResource).mockReturnValue(false)
      vi.mocked(useCanDeleteResource).mockReturnValue(true)

      render(
        <ResourceGuard resourceUserId={resourceUserId} action="delete">
          <div>Protected content</div>
        </ResourceGuard>
      )

      expect(screen.getByText('Protected content')).toBeInTheDocument()
      expect(useCanDeleteResource).toHaveBeenCalledWith(resourceUserId)
    })

    it('renders fallback when user cannot access the resource', () => {
      vi.mocked(useCanAccessResource).mockReturnValue(false)
      vi.mocked(useCanModifyResource).mockReturnValue(false)
      vi.mocked(useCanDeleteResource).mockReturnValue(false)

      render(
        <ResourceGuard 
          resourceUserId={resourceUserId} 
          action="read" 
          fallback={<div>Access denied</div>}
        >
          <div>Protected content</div>
        </ResourceGuard>
      )

      expect(screen.getByText('Access denied')).toBeInTheDocument()
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    })
  })

  describe('AdminPanelGuard', () => {
    it('renders children when user has admin panel permission', () => {
      vi.mocked(useHasPermission).mockReturnValue(true)

      render(
        <AdminPanelGuard>
          <div>Admin content</div>
        </AdminPanelGuard>
      )

      expect(screen.getByText('Admin content')).toBeInTheDocument()
      expect(useHasPermission).toHaveBeenCalledWith(Permission.ACCESS_ADMIN_PANEL)
    })

    it('renders fallback when user does not have admin panel permission', () => {
      vi.mocked(useHasPermission).mockReturnValue(false)

      render(
        <AdminPanelGuard fallback={<div>Admin access denied</div>}>
          <div>Admin content</div>
        </AdminPanelGuard>
      )

      expect(screen.getByText('Admin access denied')).toBeInTheDocument()
      expect(screen.queryByText('Admin content')).not.toBeInTheDocument()
    })
  })

  describe('ModeratorGuard', () => {
    it('renders children when user has moderator or higher role', () => {
      vi.mocked(useHasAnyRole).mockReturnValue(true)

      render(
        <ModeratorGuard>
          <div>Moderator content</div>
        </ModeratorGuard>
      )

      expect(screen.getByText('Moderator content')).toBeInTheDocument()
      expect(useHasAnyRole).toHaveBeenCalledWith([
        UserRole.MODERATOR, 
        UserRole.ADMIN, 
        UserRole.SUPER_ADMIN
      ])
    })

    it('renders fallback when user does not have moderator or higher role', () => {
      vi.mocked(useHasAnyRole).mockReturnValue(false)

      render(
        <ModeratorGuard fallback={<div>Moderator access denied</div>}>
          <div>Moderator content</div>
        </ModeratorGuard>
      )

      expect(screen.getByText('Moderator access denied')).toBeInTheDocument()
      expect(screen.queryByText('Moderator content')).not.toBeInTheDocument()
    })
  })

  describe('SuperAdminGuard', () => {
    it('renders children when user is a super admin', () => {
      vi.mocked(useHasRole).mockReturnValue(true)

      render(
        <SuperAdminGuard>
          <div>Super admin content</div>
        </SuperAdminGuard>
      )

      expect(screen.getByText('Super admin content')).toBeInTheDocument()
      expect(useHasRole).toHaveBeenCalledWith(UserRole.SUPER_ADMIN)
    })

    it('renders fallback when user is not a super admin', () => {
      vi.mocked(useHasRole).mockReturnValue(false)

      render(
        <SuperAdminGuard fallback={<div>Super admin access denied</div>}>
          <div>Super admin content</div>
        </SuperAdminGuard>
      )

      expect(screen.getByText('Super admin access denied')).toBeInTheDocument()
      expect(screen.queryByText('Super admin content')).not.toBeInTheDocument()
    })
  })
})
