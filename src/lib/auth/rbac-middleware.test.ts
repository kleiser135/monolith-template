import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import {
  getUserContext,
  requireRole,
  requirePermission,
  requireAnyPermission,
  withRoleProtection,
  withPermissionProtection,
  canAccessResource,
  canModifyResource,
  canDeleteResource
} from './rbac-middleware'
import { UserRole, Permission } from './roles'

// Mock dependencies
vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn()
  }
}))

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    }
  }
}))

vi.mock('./roles', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    hasPermission: vi.fn().mockReturnValue(false),
    hasAnyPermission: vi.fn().mockReturnValue(false),
    isValidRole: vi.fn().mockReturnValue(true)
  }
})

import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/database/prisma'
import { hasPermission, hasAnyPermission, isValidRole } from './roles'

const createMockCookies = (token?: string) => ({
  get: vi.fn().mockReturnValue(token ? { value: token } : null),
  getAll: vi.fn().mockReturnValue([]),
  has: vi.fn().mockReturnValue(!!token),
  set: vi.fn(),
  delete: vi.fn(),
  [Symbol.iterator]: vi.fn(),
  size: 0
})

const createMockRequest = (url = 'http://localhost:3000/api/test') => {
  return new NextRequest(url)
}

const createMockUser = (role: UserRole = UserRole.USER) => ({
  id: 'user-123',
  email: 'test@example.com',
  role: role,
  name: 'Test User',
  emailVerified: null,
  password: 'hashed',
  avatar: null,
  createdAt: new Date(),
  updatedAt: new Date()
})

describe('RBAC Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = 'test-jwt-secret'
  })

  describe('getUserContext', () => {
    it('returns user context when valid token is provided', async () => {
      const mockToken = 'valid-jwt-token'
      const mockDecodedToken = { userId: 'user-123' }
      const mockUser = createMockUser()

      vi.mocked(cookies).mockResolvedValue(createMockCookies(mockToken))
      vi.mocked(jwt.verify).mockReturnValue(mockDecodedToken as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(isValidRole).mockReturnValue(true)

      const request = createMockRequest()
      const result = await getUserContext(request)

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.USER,
        permissions: []
      })
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-jwt-secret')
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: { id: true, email: true, role: true }
      })
    })

    it('returns null when no token is provided', async () => {
      vi.mocked(cookies).mockResolvedValue(createMockCookies())

      const request = createMockRequest()
      const result = await getUserContext(request)

      expect(result).toBeNull()
    })

    it('returns null when JWT verification fails', async () => {
      const mockToken = 'invalid-jwt-token'
      
      vi.mocked(cookies).mockResolvedValue(createMockCookies(mockToken))
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const request = createMockRequest()
      const result = await getUserContext(request)

      expect(result).toBeNull()
    })

    it('returns null when user is not found', async () => {
      const mockToken = 'valid-jwt-token'
      const mockDecodedToken = { userId: 'user-123' }

      vi.mocked(cookies).mockResolvedValue(createMockCookies(mockToken))
      vi.mocked(jwt.verify).mockReturnValue(mockDecodedToken as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const request = createMockRequest()
      const result = await getUserContext(request)

      expect(result).toBeNull()
    })

    it('returns null when user role is invalid', async () => {
      const mockToken = 'valid-jwt-token'
      const mockDecodedToken = { userId: 'user-123' }
      const mockUser = createMockUser()

      vi.mocked(cookies).mockResolvedValue(createMockCookies(mockToken))
      vi.mocked(jwt.verify).mockReturnValue(mockDecodedToken as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(isValidRole).mockReturnValue(false)

      const request = createMockRequest()
      const result = await getUserContext(request)

      expect(result).toBeNull()
    })
  })

  describe('requireRole', () => {
    it('allows request when user has required role', async () => {
      const mockUser = createMockUser(UserRole.ADMIN)

      vi.mocked(cookies).mockResolvedValue(createMockCookies('valid-token'))
      vi.mocked(jwt.verify).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(isValidRole).mockReturnValue(true)

      const middleware = requireRole([UserRole.ADMIN])
      const request = createMockRequest()
      const result = await middleware(request)

      expect(result).toBeNull()
    })

    it('returns 401 when user is not authenticated', async () => {
      vi.mocked(cookies).mockResolvedValue(createMockCookies())

      const middleware = requireRole([UserRole.ADMIN])
      const request = createMockRequest()
      const result = await middleware(request)

      expect(result).toBeInstanceOf(NextResponse)
      const response = result as NextResponse
      expect(response.status).toBe(401)
      
      const body = await response.json()
      expect(body.error).toBe('Authentication required')
    })

    it('returns 403 when user does not have required role', async () => {
      const mockUser = createMockUser(UserRole.USER)

      vi.mocked(cookies).mockResolvedValue(createMockCookies('valid-token'))
      vi.mocked(jwt.verify).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(isValidRole).mockReturnValue(true)

      const middleware = requireRole([UserRole.ADMIN])
      const request = createMockRequest()
      const result = await middleware(request)

      expect(result).toBeInstanceOf(NextResponse)
      const response = result as NextResponse
      expect(response.status).toBe(403)
      
      const body = await response.json()
      expect(body.error).toBe('Insufficient permissions')
    })
  })

  describe('requirePermission', () => {
    it('allows request when user has required permission', async () => {
      const mockUser = createMockUser(UserRole.ADMIN)

      vi.mocked(cookies).mockResolvedValue(createMockCookies('valid-token'))
      vi.mocked(jwt.verify).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(isValidRole).mockReturnValue(true)
      vi.mocked(hasPermission).mockReturnValue(true)

      const middleware = requirePermission(Permission.ACCESS_ADMIN_PANEL)
      const request = createMockRequest()
      const result = await middleware(request)

      expect(result).toBeNull()
      expect(hasPermission).toHaveBeenCalledWith(UserRole.ADMIN, Permission.ACCESS_ADMIN_PANEL)
    })

    it('returns 403 when user does not have required permission', async () => {
      const mockUser = createMockUser(UserRole.USER)

      vi.mocked(cookies).mockResolvedValue(createMockCookies('valid-token'))
      vi.mocked(jwt.verify).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(isValidRole).mockReturnValue(true)
      vi.mocked(hasPermission).mockReturnValue(false)

      const middleware = requirePermission(Permission.ACCESS_ADMIN_PANEL)
      const request = createMockRequest()
      const result = await middleware(request)

      expect(result).toBeInstanceOf(NextResponse)
      const response = result as NextResponse
      expect(response.status).toBe(403)
    })
  })

  describe('requireAnyPermission', () => {
    it('allows request when user has any of the required permissions', async () => {
      const mockUser = createMockUser(UserRole.MODERATOR)

      vi.mocked(cookies).mockResolvedValue(createMockCookies('valid-token'))
      vi.mocked(jwt.verify).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(isValidRole).mockReturnValue(true)
      vi.mocked(hasAnyPermission).mockReturnValue(true)

      const middleware = requireAnyPermission([Permission.READ_USERS, Permission.UPDATE_USERS])
      const request = createMockRequest()
      const result = await middleware(request)

      expect(result).toBeNull()
      expect(hasAnyPermission).toHaveBeenCalledWith(
        UserRole.MODERATOR, 
        [Permission.READ_USERS, Permission.UPDATE_USERS]
      )
    })

    it('returns 403 when user does not have any of the required permissions', async () => {
      const mockUser = createMockUser(UserRole.USER)

      vi.mocked(cookies).mockResolvedValue(createMockCookies('valid-token'))
      vi.mocked(jwt.verify).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(isValidRole).mockReturnValue(true)
      vi.mocked(hasAnyPermission).mockReturnValue(false)

      const middleware = requireAnyPermission([Permission.READ_USERS, Permission.UPDATE_USERS])
      const request = createMockRequest()
      const result = await middleware(request)

      expect(result).toBeInstanceOf(NextResponse)
      const response = result as NextResponse
      expect(response.status).toBe(403)
    })
  })

  describe('withRoleProtection', () => {
    it('calls handler when user has required role', async () => {
      const mockHandler = vi.fn().mockResolvedValue(new Response('Success'))
      const mockUser = createMockUser(UserRole.ADMIN)
      
      vi.mocked(cookies).mockResolvedValue(createMockCookies('valid-token'))
      vi.mocked(jwt.verify).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(isValidRole).mockReturnValue(true)

      const protectedHandler = withRoleProtection([UserRole.ADMIN], mockHandler)
      const request = createMockRequest()
      const result = await protectedHandler(request)

      expect(mockHandler).toHaveBeenCalledWith(request, {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.ADMIN,
        permissions: []
      })
      expect(result).toBeInstanceOf(Response)
    })

    it('returns 403 when user does not have required role', async () => {
      const mockHandler = vi.fn()
      const mockUser = createMockUser(UserRole.USER)
      
      vi.mocked(cookies).mockResolvedValue(createMockCookies('valid-token'))
      vi.mocked(jwt.verify).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(isValidRole).mockReturnValue(true)

      const protectedHandler = withRoleProtection([UserRole.ADMIN], mockHandler)
      const request = createMockRequest()
      const result = await protectedHandler(request)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(result).toBeInstanceOf(NextResponse)
      const response = result as NextResponse
      expect(response.status).toBe(403)
    })
  })

  describe('withPermissionProtection', () => {
    it('calls handler when user has required permission', async () => {
      const mockHandler = vi.fn().mockResolvedValue(new Response('Success'))
      const mockUser = createMockUser(UserRole.ADMIN)
      
      vi.mocked(cookies).mockResolvedValue(createMockCookies('valid-token'))
      vi.mocked(jwt.verify).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(isValidRole).mockReturnValue(true)
      vi.mocked(hasPermission).mockReturnValue(true)

      const protectedHandler = withPermissionProtection(Permission.ACCESS_ADMIN_PANEL, mockHandler)
      const request = createMockRequest()
      const result = await protectedHandler(request)

      expect(mockHandler).toHaveBeenCalledWith(request, {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.ADMIN,
        permissions: []
      })
      expect(hasPermission).toHaveBeenCalledWith(UserRole.ADMIN, Permission.ACCESS_ADMIN_PANEL)
    })

    it('returns 403 when user does not have required permission', async () => {
      const mockHandler = vi.fn()
      const mockUser = createMockUser(UserRole.USER)
      
      vi.mocked(cookies).mockResolvedValue(createMockCookies('valid-token'))
      vi.mocked(jwt.verify).mockReturnValue({ userId: 'user-123' } as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(isValidRole).mockReturnValue(true)
      vi.mocked(hasPermission).mockReturnValue(false)

      const protectedHandler = withPermissionProtection(Permission.ACCESS_ADMIN_PANEL, mockHandler)
      const request = createMockRequest()
      const result = await protectedHandler(request)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(result).toBeInstanceOf(NextResponse)
      const response = result as NextResponse
      expect(response.status).toBe(403)
    })
  })

  describe('canAccessResource', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: UserRole.USER,
      permissions: []
    }

    it('returns true when user owns the resource', () => {
      const result = canAccessResource(mockUser, 'user-123')
      expect(result).toBe(true)
    })

    it('returns true when user has admin read permission', () => {
      vi.mocked(hasPermission).mockReturnValue(true)
      
      const result = canAccessResource(mockUser, 'user-456')
      
      expect(result).toBe(true)
      expect(hasPermission).toHaveBeenCalledWith(UserRole.USER, Permission.READ_USERS)
    })

    it('returns false when user cannot access resource', () => {
      vi.mocked(hasPermission).mockReturnValue(false)
      
      const result = canAccessResource(mockUser, 'user-456')
      
      expect(result).toBe(false)
    })
  })

  describe('canModifyResource', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: UserRole.USER,
      permissions: []
    }

    it('returns true when user owns the resource', () => {
      const result = canModifyResource(mockUser, 'user-123')
      expect(result).toBe(true)
    })

    it('returns true when user has admin update permission', () => {
      vi.mocked(hasPermission).mockReturnValue(true)
      
      const result = canModifyResource(mockUser, 'user-456')
      
      expect(result).toBe(true)
      expect(hasPermission).toHaveBeenCalledWith(UserRole.USER, Permission.UPDATE_USERS)
    })

    it('returns false when user cannot modify resource', () => {
      vi.mocked(hasPermission).mockReturnValue(false)
      
      const result = canModifyResource(mockUser, 'user-456')
      
      expect(result).toBe(false)
    })
  })

  describe('canDeleteResource', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: UserRole.USER,
      permissions: []
    }

    beforeEach(() => {
      vi.mocked(hasPermission).mockReset()
    })

    it('returns true when user owns the resource and has delete own permission', () => {
      vi.mocked(hasPermission)
        .mockReturnValueOnce(true) // DELETE_OWN_PROFILE
      
      const result = canDeleteResource(mockUser, 'user-123')
      
      expect(result).toBe(true)
      expect(hasPermission).toHaveBeenCalledWith(UserRole.USER, Permission.DELETE_OWN_PROFILE)
    })

    it('returns true when user has admin delete permission', () => {
      vi.mocked(hasPermission).mockReturnValue(true)
      
      const result = canDeleteResource(mockUser, 'user-456')
      
      expect(result).toBe(true)
      expect(hasPermission).toHaveBeenCalledWith(UserRole.USER, Permission.DELETE_USERS)
    })

    it('returns false when user cannot delete resource', () => {
      vi.mocked(hasPermission).mockReturnValue(false)
      
      const result = canDeleteResource(mockUser, 'user-456')
      
      expect(result).toBe(false)
    })
  })
})
