import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  useUser,
  useHasRole,
  useHasAnyRole,
  useHasPermission,
  useHasAnyPermission,
  useUserPermissions,
  useCanAccessResource,
  useCanModifyResource,
  useCanDeleteResource
} from './rbac-hooks'
import { UserRole, Permission } from './roles'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock the roles module functions
vi.mock('./roles', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    hasPermission: vi.fn(),
    hasAnyPermission: vi.fn(),
    getRolePermissions: vi.fn()
  }
})

import { hasPermission, hasAnyPermission, getRolePermissions } from './roles'

describe('RBAC Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    
    // Default fetch response for tests that don't explicitly mock it
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({})
    } as any)
    
    // Reset hasPermission mock to return false by default
    vi.mocked(hasPermission).mockReturnValue(false)
    vi.mocked(hasAnyPermission).mockReturnValue(false)
    vi.mocked(getRolePermissions).mockReturnValue([])
  })

  describe('useUser', () => {
    it('returns user data when API call succeeds', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.USER,
        avatar: null
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })

      const { result } = renderHook(() => useUser())

      // Initially loading
      expect(result.current.loading).toBe(true)
      expect(result.current.user).toBe(null)
      expect(result.current.error).toBe(null)

      // Wait for the hook to update
      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.error).toBe(null)
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/me')
    })

    it('handles authentication failure (401) gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      })

      const { result } = renderHook(() => useUser())

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toBe(null)
      expect(result.current.error).toBe(null) // 401 should not be treated as error
    })

    it('handles other API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const { result } = renderHook(() => useUser())

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toBe(null)
      expect(result.current.error).toBe('Failed to fetch user information')
    })

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useUser())

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toBe(null)
      expect(result.current.error).toBe('Failed to fetch user information')
    })
  })

  describe('useHasRole', () => {
    it('returns true when user has the required role', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.ADMIN
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })

      const { result } = renderHook(() => useHasRole(UserRole.ADMIN))

      await vi.waitFor(() => {
        expect(result.current).toBe(true)
      })
    })

    it('returns false when user does not have the required role', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.USER
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })

      const { result } = renderHook(() => useHasRole(UserRole.ADMIN))

      await vi.waitFor(() => {
        expect(result.current).toBe(false)
      })
    })

    it('returns false when user is not authenticated', () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      })

      const { result } = renderHook(() => useHasRole(UserRole.ADMIN))

      expect(result.current).toBe(false)
    })
  })

  describe('useHasAnyRole', () => {
    it('returns true when user has one of the required roles', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.MODERATOR
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })

      const { result } = renderHook(() => 
        useHasAnyRole([UserRole.ADMIN, UserRole.MODERATOR])
      )

      await vi.waitFor(() => {
        expect(result.current).toBe(true)
      })
    })

    it('returns false when user does not have any of the required roles', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.USER
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })

      const { result } = renderHook(() => 
        useHasAnyRole([UserRole.ADMIN, UserRole.MODERATOR])
      )

      await vi.waitFor(() => {
        expect(result.current).toBe(false)
      })
    })
  })

  describe('useHasPermission', () => {
    it('returns true when user has the required permission', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.ADMIN
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })

      vi.mocked(hasPermission).mockReturnValue(true)

      const { result } = renderHook(() => 
        useHasPermission(Permission.ACCESS_ADMIN_PANEL)
      )

      await vi.waitFor(() => {
        expect(result.current).toBe(true)
      })

      expect(hasPermission).toHaveBeenCalledWith(UserRole.ADMIN, Permission.ACCESS_ADMIN_PANEL)
    })

    it('returns false when user does not have the required permission', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.USER
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })

      vi.mocked(hasPermission).mockReturnValue(false)

      const { result } = renderHook(() => 
        useHasPermission(Permission.ACCESS_ADMIN_PANEL)
      )

      await vi.waitFor(() => {
        expect(result.current).toBe(false)
      })

      // Wait for the user data to be fetched before checking if hasPermission was called
      await vi.waitFor(() => {
        expect(hasPermission).toHaveBeenCalledWith(UserRole.USER, Permission.ACCESS_ADMIN_PANEL)
      })
    })
  })

  describe('useHasAnyPermission', () => {
    it('returns true when user has any of the required permissions', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.ADMIN
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })

      vi.mocked(hasAnyPermission).mockReturnValue(true)

      const { result } = renderHook(() => 
        useHasAnyPermission([Permission.READ_USERS, Permission.UPDATE_USERS])
      )

      await vi.waitFor(() => {
        expect(result.current).toBe(true)
      })

      expect(hasAnyPermission).toHaveBeenCalledWith(
        UserRole.ADMIN, 
        [Permission.READ_USERS, Permission.UPDATE_USERS]
      )
    })

    it('returns false when user does not have any of the required permissions', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.USER
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })

      vi.mocked(hasAnyPermission).mockReturnValue(false)

      const { result } = renderHook(() => 
        useHasAnyPermission([Permission.READ_USERS, Permission.UPDATE_USERS])
      )

      await vi.waitFor(() => {
        expect(result.current).toBe(false)
      })
    })
  })

  describe('useUserPermissions', () => {
    it('returns user permissions when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.ADMIN
      }

      const mockPermissions = [Permission.READ_USERS, Permission.UPDATE_USERS]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })

      vi.mocked(getRolePermissions).mockReturnValue(mockPermissions)

      const { result } = renderHook(() => useUserPermissions())

      await vi.waitFor(() => {
        expect(result.current).toEqual(mockPermissions)
      })

      expect(getRolePermissions).toHaveBeenCalledWith(UserRole.ADMIN)
    })

    it('returns empty array when user is not authenticated', () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      })

      const { result } = renderHook(() => useUserPermissions())

      expect(result.current).toEqual([])
    })
  })

  describe('useCanAccessResource', () => {
    it('returns true when user owns the resource', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.USER
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })

      vi.mocked(hasPermission).mockReturnValue(false)

      const { result } = renderHook(() => useCanAccessResource('user-123'))

      await vi.waitFor(() => {
        expect(result.current).toBe(true)
      })
    })

    it('returns true when user has admin permission', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.ADMIN
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })

      vi.mocked(hasPermission).mockReturnValue(true)

      const { result } = renderHook(() => useCanAccessResource('user-456'))

      // Wait for the hook to initialize and fetch user data
      await vi.waitFor(() => {
        expect(result.current).toBe(true)
      }, { timeout: 3000 })

      expect(hasPermission).toHaveBeenCalledWith(UserRole.ADMIN, Permission.READ_USERS)
    })

    it('returns false when user cannot access resource', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.USER
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })

      vi.mocked(hasPermission).mockReturnValue(false)

      const { result } = renderHook(() => useCanAccessResource('user-456'))

      await vi.waitFor(() => {
        expect(result.current).toBe(false)
      })
    })
  })

  describe('useCanModifyResource', () => {
    it('returns true when user owns the resource', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.USER
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })

      vi.mocked(hasPermission).mockReturnValue(false)

      const { result } = renderHook(() => useCanModifyResource('user-123'))

      await vi.waitFor(() => {
        expect(result.current).toBe(true)
      })
    })

    it('returns true when user has admin permission', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.ADMIN
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })

      vi.mocked(hasPermission).mockReturnValue(true)

      const { result } = renderHook(() => useCanModifyResource('user-456'))

      await vi.waitFor(() => {
        expect(result.current).toBe(true)
      }, { timeout: 3000 })

      expect(hasPermission).toHaveBeenCalledWith(UserRole.ADMIN, Permission.UPDATE_USERS)
    })
  })

  describe('useCanDeleteResource', () => {
    it('returns true when user owns the resource and has delete permission', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.USER
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })

      vi.mocked(hasPermission)
        .mockReturnValueOnce(true) // DELETE_OWN_PROFILE
        .mockReturnValueOnce(false) // DELETE_USERS

      const { result } = renderHook(() => useCanDeleteResource('user-123'))

      await vi.waitFor(() => {
        expect(result.current).toBe(true)
      }, { timeout: 3000 })

      expect(hasPermission).toHaveBeenCalledWith(UserRole.USER, Permission.DELETE_OWN_PROFILE)
    })

    it('returns true when user has admin delete permission', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.ADMIN
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })

      vi.mocked(hasPermission)
        .mockReturnValueOnce(false) // DELETE_OWN_PROFILE (not needed for admin)
        .mockReturnValueOnce(true) // DELETE_USERS

      const { result } = renderHook(() => useCanDeleteResource('user-456'))

      await vi.waitFor(() => {
        expect(result.current).toBe(true)
      }, { timeout: 3000 })

      expect(hasPermission).toHaveBeenCalledWith(UserRole.ADMIN, Permission.DELETE_USERS)
    })

    it('returns false when user cannot delete resource', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.USER
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })

      vi.mocked(hasPermission).mockReturnValue(false)

      const { result } = renderHook(() => useCanDeleteResource('user-456'))

      await vi.waitFor(() => {
        expect(result.current).toBe(false)
      })
    })
  })
})
