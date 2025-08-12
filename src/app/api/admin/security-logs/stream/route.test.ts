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

vi.mock('@/lib/database/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    }
  }
}))

vi.mock('@/lib/security/EnhancedSecurityLogger', () => ({
  EnhancedSecurityLogger: {
    getInstance: vi.fn()
  }
}))

import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/database/prisma'
import { EnhancedSecurityLogger } from '@/lib/security/EnhancedSecurityLogger'

const createMockCookies = (token?: string) => ({
  get: vi.fn().mockReturnValue(token ? { value: token } : null),
  getAll: vi.fn().mockReturnValue([]),
  has: vi.fn().mockReturnValue(!!token),
  set: vi.fn(),
  delete: vi.fn(),
  [Symbol.iterator]: vi.fn(),
  size: 0
})

const mockUser = {
  id: 'user123',
  email: 'admin@test.com'
}

const mockMetrics = {
  totalEvents: 100,
  recentEvents: 5,
  securityAlerts: 2,
  lastEventTime: new Date().toISOString()
}

describe('Security Logs Stream API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mocks
    vi.mocked(cookies).mockResolvedValue(createMockCookies('valid-token') as any)
    vi.mocked(jwt.verify).mockReturnValue({ userId: 'user123' } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
    
    const mockLogger = {
      getMetrics: vi.fn().mockReturnValue(mockMetrics)
    }
    vi.mocked(EnhancedSecurityLogger.getInstance).mockReturnValue(mockLogger as any)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/admin/security-logs/stream', () => {
    it('should return SSE stream for admin user', async () => {
      // Set up admin user

      vi.stubEnv('ADMIN_EMAILS', 'admin@test.com')
      
      const request = {} as NextRequest
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/event-stream')
      expect(response.headers.get('Cache-Control')).toBe('no-cache')
      expect(response.headers.get('Connection')).toBe('keep-alive')
      
      // Restore original env

    })

    it('should return 401 for unauthenticated request', async () => {
      vi.mocked(cookies).mockResolvedValue(createMockCookies() as any) // No token
      
      const request = {} as NextRequest
      const response = await GET(request)
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 for non-admin user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user123',
        email: 'user@test.com' // Not in admin emails
      } as any)
      

      vi.stubEnv('ADMIN_EMAILS', 'admin@test.com')
      
      const request = {} as NextRequest
      const response = await GET(request)
      
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Forbidden: Admins only')
      
      // Restore original env

    })
  })
})
