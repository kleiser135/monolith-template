import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { prismaMock } from '@/test/setup'
import { NextRequest } from 'next/server'

// Mock account lockout functions
vi.mock('@/lib/auth/account-lockout', () => ({
  isLockedOut: vi.fn(() => ({ locked: false, attempts: 0 })),
  recordFailedAttempt: vi.fn(),
  recordSuccessfulLogin: vi.fn(),
  getProgressiveDelay: vi.fn(() => 0),
}))

// Mock refresh token functions
const refreshTokenMocks = vi.hoisted(() => ({
  createRefreshToken: vi.fn(() => Promise.resolve({
    token: 'mock-refresh-token',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  }))
}))

vi.mock('@/lib/auth/refresh-tokens', () => refreshTokenMocks)

// Get the bcrypt mock from the setup
const bcryptMock = vi.hoisted(() => ({
  compare: vi.fn(),
  hash: vi.fn(),
}))

vi.mock('bcrypt', () => ({
  default: bcryptMock,
  ...bcryptMock,
}))

describe('/api/auth/login - Mobile Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    password: '$2b$10$hashed-password',
    emailVerified: new Date(),
    avatar: null,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    // Include all the extended profile fields we added
    bio: null,
    phone: null,
    company: null,
    jobTitle: null,
    location: null,
    website: null,
    settings: {},
    emailNotifications: true,
    marketingEmails: false,
    twoFactorEnabled: false,
  }

  describe('Mobile Client Authentication', () => {
    it('should return JWT token and refresh token for mobile clients', async () => {
      // Setup mocks
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      bcryptMock.compare.mockResolvedValue(true)
      refreshTokenMocks.createRefreshToken.mockClear()

      // Create request with mobile client headers
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Type': 'mobile',
          'User-Agent': 'React Native App',
          'X-Forwarded-For': '192.168.1.100',
          'X-Device-ID': 'device-123',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      // Execute the route handler
      const response = await POST(request)
      
      // Verify response
      expect(response.status).toBe(200)
      
      const responseData = await response.json()
      
      expect(responseData).toHaveProperty('token')
      expect(responseData).toHaveProperty('refreshToken')
      expect(responseData).toHaveProperty('user')
      expect(responseData.message).toBe('Login successful')
      expect(responseData.user.email).toBe('test@example.com')
      expect(responseData.user.id).toBe('test-user-id')
      expect(responseData.user.name).toBe('Test User')
      expect(responseData.refreshToken).toBe('mock-refresh-token')
      
      // Verify refresh token was created
      expect(refreshTokenMocks.createRefreshToken).toHaveBeenCalledWith({
        userId: 'test-user-id',
        deviceId: 'device-123',
        ipAddress: '192.168.1.100',
        userAgent: 'React Native App',
      })
      
      // Verify no cookie is set for mobile clients
      const cookies = response.headers.get('set-cookie')
      expect(cookies).toBeNull()
    })

    it('should detect mobile client by User-Agent when X-Client-Type is not present', async () => {
      // Setup mocks
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      bcryptMock.compare.mockResolvedValue(true)

      // Create request with mobile User-Agent but no X-Client-Type
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      // Execute the route handler
      const response = await POST(request)
      
      // Verify mobile response (token in body)
      const responseData = await response.json()
      expect(responseData).toHaveProperty('token')
      expect(responseData).toHaveProperty('user')
      
      // Verify no cookie is set
      const cookies = response.headers.get('set-cookie')
      expect(cookies).toBeNull()
    })

    it('should detect React Native apps as mobile clients', async () => {
      // Setup mocks
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      bcryptMock.compare.mockResolvedValue(true)

      // Create request with React Native User-Agent
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'React Native/0.72.0',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      // Execute the route handler
      const response = await POST(request)
      
      // Verify mobile response
      const responseData = await response.json()
      expect(responseData).toHaveProperty('token')
      expect(responseData).toHaveProperty('user')
    })
  })

  describe('Web Client Authentication', () => {
    it('should set HttpOnly cookie for web clients', async () => {
      // Setup mocks
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      bcryptMock.compare.mockResolvedValue(true)

      // Create request with web client headers (no mobile indicators)
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      // Execute the route handler
      const response = await POST(request)
      
      // Verify response
      expect(response.status).toBe(200)
      
      const responseData = await response.json()
      expect(responseData.message).toBe('Login successful')
      expect(responseData).not.toHaveProperty('token') // No token in response body for web
      expect(responseData).not.toHaveProperty('refreshToken') // No refresh token for web clients
      
      // Verify cookie is set for web clients
      const cookies = response.headers.get('set-cookie')
      expect(cookies).toContain('token=')
      expect(cookies).toContain('HttpOnly')
    })
  })

  describe('Authentication Failures', () => {
    it('should handle invalid credentials for mobile clients', async () => {
      // Setup mocks for invalid login
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      bcryptMock.compare.mockResolvedValue(false) // Invalid password

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Type': 'mobile',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData.message).toBe('Invalid credentials')
      expect(responseData).not.toHaveProperty('token')
    })

    it('should handle non-existent user for mobile clients', async () => {
      // Setup mocks for non-existent user
      prismaMock.user.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Type': 'mobile',
        },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData.message).toBe('Invalid credentials')
    })

    it('should handle malformed request data', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Type': 'mobile',
        },
        body: JSON.stringify({
          email: 'invalid-email', // Invalid email format
          password: 'a', // Too short password
        }),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData).toHaveProperty('message')
    })
  })

  describe('Client Type Detection', () => {
    const testCases = [
      {
        description: 'X-Client-Type: mobile header',
        headers: { 'X-Client-Type': 'mobile', 'User-Agent': 'Mozilla/5.0' },
        expectMobile: true,
      },
      {
        description: 'Android User-Agent',
        headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 11; SM-G973F)' },
        expectMobile: true,
      },
      {
        description: 'iPhone User-Agent',
        headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)' },
        expectMobile: true,
      },
      {
        description: 'iPad User-Agent',
        headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)' },
        expectMobile: true,
      },
      {
        description: 'React Native User-Agent',
        headers: { 'User-Agent': 'MyApp/1.0 React Native/0.72.0' },
        expectMobile: true,
      },
      {
        description: 'Desktop User-Agent',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        expectMobile: false,
      },
    ]

    testCases.forEach(({ description, headers, expectMobile }) => {
      it(`should detect ${expectMobile ? 'mobile' : 'web'} client for ${description}`, async () => {
        // Setup mocks
        prismaMock.user.findUnique.mockResolvedValue(mockUser)
        bcryptMock.compare.mockResolvedValue(true)

        const request = new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(headers as Record<string, string>),
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        })

        const response = await POST(request)
        const responseData = await response.json()
        const cookies = response.headers.get('set-cookie')

        if (expectMobile) {
          // Mobile client should get token in response body, no cookies
          expect(responseData).toHaveProperty('token')
          expect(responseData).toHaveProperty('user')
          expect(cookies).toBeNull()
        } else {
          // Web client should get cookies, no token in response body
          expect(responseData).not.toHaveProperty('token')
          expect(cookies).toContain('token=')
        }
      })
    })
  })
})
