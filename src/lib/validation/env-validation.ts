import { z } from 'zod'

/**
 * Production-ready environment variable validation
 * Ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/, 'PORT must be a number').default('3000'),
  APP_NAME: z.string().default('Template App'),
  APP_URL: z.string().url('APP_URL must be a valid URL'),
  
  // Security
  BCRYPT_ROUNDS: z.string().regex(/^\d+$/, 'BCRYPT_ROUNDS must be a number').default('12'),
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/, 'RATE_LIMIT_WINDOW_MS must be a number').default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/, 'RATE_LIMIT_MAX_REQUESTS must be a number').default('100'),
  
  // File Upload
  MAX_UPLOAD_SIZE: z.string().regex(/^\d+$/, 'MAX_UPLOAD_SIZE must be a number').default('5242880'),
  UPLOADS_DIR: z.string().default('./public/uploads'),
  
  // Email (optional but recommended for production)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().regex(/^\d+$/, 'SMTP_PORT must be a number').optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email('FROM_EMAIL must be a valid email').optional(),
  
  // Production monitoring (optional)
  SENTRY_DSN: z.string().url('SENTRY_DSN must be a valid URL').optional(),
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  
  // Cloud storage (optional)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Cache (optional)
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL').optional(),
  
  // Monitoring (optional)
  MONITORING_ENDPOINT: z.string().url('MONITORING_ENDPOINT must be a valid URL').optional(),
})

export type EnvConfig = z.infer<typeof envSchema>

/**
 * Validates and parses environment variables
 * Throws an error if validation fails
 */
export function validateEnv(): EnvConfig {
  try {
    const parsed = envSchema.parse(process.env)
    
    // Additional production checks
    if (parsed.NODE_ENV === 'production') {
      validateProductionRequirements(parsed)
    }
    
    return parsed
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:')
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
      process.exit(1)
    }
    throw error
  }
}

/**
 * Additional validation for production environment
 */
function validateProductionRequirements(env: EnvConfig) {
  const warnings: string[] = []
  const errors: string[] = []
  
  // Critical production checks
  if (env.JWT_SECRET === 'your-super-secret-jwt-key-min-32-chars-production') {
    errors.push('JWT_SECRET must be changed from default value in production')
  }
  
  if (env.NEXTAUTH_SECRET === 'your-nextauth-secret-key') {
    errors.push('NEXTAUTH_SECRET must be changed from default value in production')
  }
  
  if (!env.APP_URL.startsWith('https://')) {
    errors.push('APP_URL must use HTTPS in production')
  }
  
  // Recommended production features
  if (!env.SMTP_HOST || !env.SMTP_USER) {
    warnings.push('Email configuration not found - password reset and verification features will not work')
  }
  
  if (!env.SENTRY_DSN) {
    warnings.push('SENTRY_DSN not configured - error monitoring recommended for production')
  }
  
  if (!env.REDIS_URL) {
    warnings.push('REDIS_URL not configured - caching recommended for production performance')
  }
  
  // Security checks
  const bcryptRounds = parseInt(env.BCRYPT_ROUNDS)
  if (bcryptRounds < 12) {
    warnings.push('BCRYPT_ROUNDS should be at least 12 for production security')
  }
  
  // Display warnings and errors
  if (warnings.length > 0) {
    console.warn('⚠️  Production warnings:')
    warnings.forEach(warning => console.warn(`  - ${warning}`))
  }
  
  if (errors.length > 0) {
    console.error('❌ Production errors:')
    errors.forEach(error => console.error(`  - ${error}`))
    process.exit(1)
  }
  
  if (warnings.length === 0 && errors.length === 0) {
    console.log('✅ Environment configuration validated for production')
  }
}

// Note: Automatic validation commented out for testing
// Uncomment for production or call validateEnv() manually where needed
// export const env = validateEnv()
