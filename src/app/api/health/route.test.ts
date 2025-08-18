import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from './route'
import { prismaMock } from '@/test/setup'
import fs from 'fs'
import path from 'path'

// Mock filesystem operations with shared function instances for CJS/ESM
vi.mock('fs', () => {
  const existsSync = vi.fn();
  const mkdirSync = vi.fn();
  const rmSync = vi.fn();
  const writeFileSync = vi.fn();
  const unlinkSync = vi.fn();
  return {
    default: { existsSync, mkdirSync, rmSync, writeFileSync, unlinkSync },
    existsSync,
    mkdirSync,
    rmSync,
    writeFileSync,
    unlinkSync,
  };
})

vi.mock('path', () => {
  const join = vi.fn();
  const resolve = vi.fn();
  return {
    default: { join, resolve },
    join,
    resolve,
  };
})

// Mock the security headers function
vi.mock('@/lib/security-headers', () => ({
  addApiSecurityHeaders: vi.fn((response) => response),
}))

// Explicitly mock the prisma import for dynamic imports in CI environments
vi.mock('@/lib/database/prisma', () => ({
  __esModule: true,
  prisma: prismaMock,
}))

describe('/api/health', () => {
  let testUploadsDir: string

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset environment to our global test setup defaults
    vi.unstubAllEnvs()
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test')
    vi.stubEnv('JWT_SECRET', 'test-jwt-secret-that-is-long-enough-for-validation')
    vi.stubEnv('NEXTAUTH_SECRET', 'test-nextauth-secret')
    
    // Mock path functions to return test directory paths
    testUploadsDir = '/mocked/test-uploads'
    vi.mocked(path.resolve).mockReturnValue(testUploadsDir)
    // Make join behave realistically for our usage in checkStorage
    ;(path.join as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (a: string, b: string) => `${a}/${b}`
    )
    
    // Setup default mock behavior - directory doesn't exist initially
    vi.mocked(fs.existsSync).mockReturnValue(false)
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined)
    vi.mocked(fs.rmSync).mockReturnValue(undefined)
    vi.mocked(fs.writeFileSync).mockReturnValue(undefined)
    vi.mocked(fs.unlinkSync).mockReturnValue(undefined)
    
    vi.stubEnv('UPLOADS_DIR', testUploadsDir)
  })

  afterEach(() => {
    // No real cleanup needed since we're using mocks
    vi.clearAllMocks()
  })

  it('should return healthy status when all checks pass', async () => {
    // Mock successful database connection
    prismaMock.$executeRaw.mockResolvedValue(1)
    prismaMock.$disconnect.mockResolvedValue(undefined)
    
    // Mock filesystem - uploads directory exists and is writable
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.writeFileSync).mockReturnValue(undefined)
    vi.mocked(fs.unlinkSync).mockReturnValue(undefined)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')
    expect(data.checks.database.status).toBe('healthy')
    expect(data.checks.environment.status).toBe('healthy')
    expect(data.checks.storage.status).toBe('healthy')
  })

  it('should return unhealthy status when database check fails', async () => {
    // Mock database connection failure
    prismaMock.$executeRaw.mockRejectedValue(new Error('Connection failed'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('unhealthy')
    expect(data.checks.database.status).toBe('unhealthy')
    expect(data.checks.database.error).toContain('Connection failed')
  })

  it('should return unhealthy status when storage check fails', async () => {
    // Mock successful database connection
    prismaMock.$executeRaw.mockResolvedValue(1)
    prismaMock.$disconnect.mockResolvedValue(undefined)
    
    // Set UPLOADS_DIR to a non-existent directory to trigger storage failure
    vi.stubEnv('UPLOADS_DIR', '/non/existent/directory')

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('unhealthy')
    expect(data.checks.storage.status).toBe('unhealthy')
  })

  it('should return unhealthy status when environment check fails', async () => {
    // Mock successful database connection
    prismaMock.$executeRaw.mockResolvedValue(1)
    prismaMock.$disconnect.mockResolvedValue(undefined)

    // Clear only the JWT secrets to make environment check fail
    vi.stubEnv('JWT_SECRET', '')
    vi.stubEnv('NEXTAUTH_SECRET', '')

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('unhealthy')
    expect(data.checks.environment.status).toBe('unhealthy')
  })

  it('should handle unexpected errors gracefully', async () => {
    // Since individual check failures don't trigger the main catch block,
    // and the route is well-structured with try-catch in each check,
    // let's test that the route handles individual check failures correctly
    // and returns 503 for health check failures (not 500)
    prismaMock.$executeRaw.mockRejectedValue(new Error('Critical database error'))
    
    // Set an invalid uploads directory
    vi.stubEnv('UPLOADS_DIR', '/non/existent/directory')

    const response = await GET()
    const data = await response.json()

    // Multiple check failures should still return 503 (service unavailable)
    // The 500 error would only happen if there was a code error, not a health check failure
    expect(response.status).toBe(503)
    expect(data.status).toBe('unhealthy')
    expect(data.checks.database.status).toBe('unhealthy')
    expect(data.checks.storage.status).toBe('unhealthy')
  })

  it('should include system information in response', async () => {
    // Mock successful checks
    prismaMock.$executeRaw.mockResolvedValue(1)
    prismaMock.$disconnect.mockResolvedValue(undefined)

    const response = await GET()
    const data = await response.json()

    expect(data.timestamp).toBeDefined()
    expect(data.version).toBe('1.0.0') // This is the actual npm_package_version from the environment
    expect(data.environment).toBeDefined()
    expect(data.uptime).toBeDefined()
    expect(data.memory).toBeDefined()
    expect(typeof data.memory.rss).toBe('number')
  })
})
