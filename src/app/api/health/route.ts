import { NextResponse } from 'next/server'
import { addApiSecurityHeaders } from '@/lib/security/security-headers'
import fs from 'fs'
import path from 'path'

/**
 * Production health check endpoint
 * Used by load balancers and monitoring systems to verify application health
 */
export async function GET() {
  try {
    // Basic health checks
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        database: await checkDatabase(),
        environment: checkEnvironment(),
        storage: checkStorage(),
      }
    }
    
    // Determine overall health status
    const allChecksHealthy = Object.values(healthStatus.checks).every(check => check.status === 'healthy')
    const status = allChecksHealthy ? 200 : 503
    
    if (!allChecksHealthy) {
      healthStatus.status = 'unhealthy'
    }
    
    const response = NextResponse.json(healthStatus, { status })
    return addApiSecurityHeaders(response)
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    const errorResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : String(error),
    }
    
    const response = NextResponse.json(errorResponse, { status: 500 })
    return addApiSecurityHeaders(response)
  }
}

/**
 * Check database connectivity
 */
async function checkDatabase() {
  try {
    // Use the global prisma instance to allow for proper mocking in tests
    const { prisma } = await import('@/lib/database/prisma')
    
    // Simple query to test connection
    await prisma.$executeRaw`SELECT 1`
    await prisma.$disconnect()
    
    return {
      status: 'healthy',
      message: 'Database connection successful'
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'production' ? undefined : String(error)
    }
  }
}

/**
 * Check environment configuration
 */
function checkEnvironment() {
  try {
    const required = ['DATABASE_URL', 'JWT_SECRET', 'NEXTAUTH_SECRET']
    const missing = required.filter(key => !process.env[key])
    
    if (missing.length > 0) {
      return {
        status: 'unhealthy',
        message: `Missing environment variables: ${missing.join(', ')}`
      }
    }
    
    return {
      status: 'healthy',
      message: 'Environment configuration valid'
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Environment check failed',
      error: process.env.NODE_ENV === 'production' ? undefined : String(error)
    }
  }
}

/**
 * Check storage availability
 */
function checkStorage() {
  try {
    const uploadsDir = process.env.UPLOADS_DIR || './public/uploads'
    const absolutePath = path.resolve(uploadsDir)
    
    // Check if directory exists and is writable
    if (!fs.existsSync(absolutePath)) {
      return {
        status: 'unhealthy',
        message: 'Uploads directory does not exist'
      }
    }
    
    // Try to write a test file
    const testFile = path.join(absolutePath, '.health-check')
    fs.writeFileSync(testFile, 'test')
    fs.unlinkSync(testFile)
    
    return {
      status: 'healthy',
      message: 'Storage is accessible and writable'
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Storage check failed',
      error: process.env.NODE_ENV === 'production' ? undefined : String(error)
    }
  }
}
