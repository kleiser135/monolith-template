import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from './route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn()
  }
}))

vi.mock('@/lib/security-logger', () => ({
  securityLogger: {
    getEventsByUserFromDatabase: vi.fn(),
    getRecentEventsFromDatabase: vi.fn()
  }
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    }
  }
}))

import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { securityLogger } from '@/lib/security-logger'
import { prisma } from '@/lib/prisma'

const createMockCookies = (token?: string) => ({
  get: vi.fn().mockReturnValue(token ? { value: token } : null),
  getAll: vi.fn().mockReturnValue([]),
  has: vi.fn().mockReturnValue(!!token),
  set: vi.fn(),
  delete: vi.fn(),
  [Symbol.iterator]: vi.fn(),
  size: 0
})

const createMockRequest = (searchParams: Record<string, string> = {}) => {
  const url = new URL('http://localhost/api/admin/security-logs')
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  
  return {
    url: url.toString()
  } as NextRequest
}

const mockUser = {
  id: 'user123',
  name: 'Admin User',
  email: 'admin@test.com',
  emailVerified: null,
  password: 'hashed',
  avatar: null,
  role: 'admin',
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockSecurityEvent = {
  id: 'event123',
  eventType: 'login_success',
  userId: 'user123',
  timestamp: new Date(),
  severity: 'info',
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
  details: '{"action": "login"}',
  user: {
    email: 'user@test.com',
    name: 'Test User'
  }
}

describe('Security Logs API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mocks
    vi.mocked(cookies).mockResolvedValue(createMockCookies('valid-token') as any)
    vi.mocked(jwt.verify).mockReturnValue({ userId: 'user123' } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
    vi.mocked(securityLogger.getRecentEventsFromDatabase).mockResolvedValue([mockSecurityEvent])
    vi.mocked(securityLogger.getEventsByUserFromDatabase).mockResolvedValue([mockSecurityEvent])
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/admin/security-logs', () => {
    it('should return security logs for admin user', async () => {
      const request = createMockRequest()
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.events).toHaveLength(1)
      expect(data.events[0]).toMatchObject({
        id: 'event123',
        eventType: 'login_success',
        userId: 'user123',
        userEmail: 'user@test.com',
        userName: 'Test User',
        severity: 'info',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        details: { action: 'login' }
      })
      expect(data.total).toBe(1)
    })

    it('should return 401 for unauthenticated request', async () => {
      vi.mocked(cookies).mockResolvedValue(createMockCookies() as any) // No token
      
      const request = createMockRequest()
      const response = await GET(request)
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 for invalid token', async () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token')
      })
      
      const request = createMockRequest()
      const response = await GET(request)
      
      expect(response.status).toBe(401)
    })

    it('should return 403 for non-admin user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        role: 'user',
        email: 'user@test.com'
      } as any)
      
      const request = createMockRequest()
      const response = await GET(request)
      
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Forbidden: Admins only')
    })

    it('should allow admin access based on role property', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        role: 'admin',
        email: 'someuser@test.com'
      })
      
      const request = createMockRequest()
      const response = await GET(request)
      
      expect(response.status).toBe(200)
    })

    it('should allow admin access based on ADMIN_EMAILS env var', async () => {
      const originalEnv = process.env.ADMIN_EMAILS
      process.env.ADMIN_EMAILS = 'admin1@test.com,admin2@test.com'
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        role: 'user', // Not admin role
        email: 'admin1@test.com' // But in admin emails
      })
      
      const request = createMockRequest()
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      // Restore original env
      process.env.ADMIN_EMAILS = originalEnv
    })

    it('should filter events by userId when provided', async () => {
      const request = createMockRequest({ userId: 'specific-user' })
      
      await GET(request)
      
      expect(securityLogger.getEventsByUserFromDatabase).toHaveBeenCalledWith('specific-user', 50)
      expect(securityLogger.getRecentEventsFromDatabase).not.toHaveBeenCalled()
    })

    it('should use custom limit when provided', async () => {
      const request = createMockRequest({ limit: '100' })
      
      await GET(request)
      
      expect(securityLogger.getRecentEventsFromDatabase).toHaveBeenCalledWith(100)
    })

    it('should use default limit of 50 when not provided', async () => {
      const request = createMockRequest()
      
      await GET(request)
      
      expect(securityLogger.getRecentEventsFromDatabase).toHaveBeenCalledWith(50)
    })

    it('should handle events with missing user data', async () => {
      const eventWithoutUser = {
        ...mockSecurityEvent,
        user: null
      }
      vi.mocked(securityLogger.getRecentEventsFromDatabase).mockResolvedValue([eventWithoutUser])
      
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.events[0].userEmail).toBe('Unknown')
      expect(data.events[0].userName).toBe('Unknown')
    })

    it('should handle events with invalid JSON details', async () => {
      const eventWithInvalidDetails = {
        ...mockSecurityEvent,
        details: null
      }
      vi.mocked(securityLogger.getRecentEventsFromDatabase).mockResolvedValue([eventWithInvalidDetails])
      
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.events[0].details).toEqual({})
    })

    it('should return 403 when user not found in database', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      
      const request = createMockRequest()
      const response = await GET(request)
      
      expect(response.status).toBe(403)
    })

    it('should handle database errors gracefully', async () => {
      vi.mocked(securityLogger.getRecentEventsFromDatabase).mockRejectedValue(
        new Error('Database error')
      )
      
      const request = createMockRequest()
      const response = await GET(request)
      
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Failed to fetch security logs')
    })

    it('should handle user lookup database errors', async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('DB Error'))
      
      const request = createMockRequest()
      const response = await GET(request)
      
      expect(response.status).toBe(403) // getUserById returns null on error
    })

    it('should handle empty ADMIN_EMAILS environment variable', async () => {
      const originalEnv = process.env.ADMIN_EMAILS
      process.env.ADMIN_EMAILS = ''
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        role: 'user',
        email: 'user@test.com'
      })
      
      const request = createMockRequest()
      const response = await GET(request)
      
      expect(response.status).toBe(403)
      
      // Restore original env
      process.env.ADMIN_EMAILS = originalEnv
    })

    it('should trim whitespace from admin emails in environment variable', async () => {
      const originalEnv = process.env.ADMIN_EMAILS
      process.env.ADMIN_EMAILS = ' admin1@test.com , admin2@test.com , '
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        role: 'user',
        email: 'admin2@test.com'
      })
      
      const request = createMockRequest()
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      // Restore original env
      process.env.ADMIN_EMAILS = originalEnv
    })
  })
})
