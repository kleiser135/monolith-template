import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Environment Validation', () => {
  const originalEnv = process.env;
  let mockExit: any;
  let _mockConsoleError: any;
  let _mockConsoleWarn: any;
  let _mockConsoleLog: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    
    // Mock process.exit to prevent actual exit during tests
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    // Mock console methods
    _mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    _mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    _mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('should validate successfully with all required environment variables', async () => {
    process.env = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      JWT_SECRET: 'a-very-secure-secret-key-that-is-long-enough',
      NEXTAUTH_URL: 'http://localhost:3000',
      NEXTAUTH_SECRET: 'another-secure-secret-for-nextauth',
      APP_URL: 'http://localhost:3000',
      NODE_ENV: 'test'
    };

    // Dynamically import to avoid module-level execution
    const { validateEnv } = await import('./env-validation');
    
    const env = validateEnv();
    
    expect(env.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/db');
    expect(env.JWT_SECRET).toBe('a-very-secure-secret-key-that-is-long-enough');
    expect(env.NEXTAUTH_URL).toBe('http://localhost:3000');
  });

  it('should fail validation when DATABASE_URL is missing', async () => {
    process.env = {
      JWT_SECRET: 'a-very-secure-secret-key-that-is-long-enough',
      NEXTAUTH_URL: 'http://localhost:3000',
      NEXTAUTH_SECRET: 'another-secure-secret-for-nextauth',
      APP_URL: 'http://localhost:3000',
      NODE_ENV: 'test'
    };

    vi.resetModules();
    const { validateEnv } = await import('./env-validation');

    expect(() => validateEnv()).toThrow('process.exit called');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should fail validation when JWT_SECRET is too short', async () => {
    process.env = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      JWT_SECRET: 'short',
      NEXTAUTH_URL: 'http://localhost:3000',
      NEXTAUTH_SECRET: 'another-secure-secret-for-nextauth',
      APP_URL: 'http://localhost:3000',
      NODE_ENV: 'test'
    };

    vi.resetModules();
    const { validateEnv } = await import('./env-validation');

    expect(() => validateEnv()).toThrow('process.exit called');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('prints production warnings but does not exit when optional items missing', async () => {
    process.env = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      JWT_SECRET: 'a-very-secure-secret-key-that-is-long-enough',
      NEXTAUTH_URL: 'https://example.com',
      NEXTAUTH_SECRET: 'another-secure-secret-for-nextauth',
      APP_URL: 'https://example.com',
      NODE_ENV: 'production',
      BCRYPT_ROUNDS: '10', // triggers warning (<12)
    } as any;

    const { validateEnv } = await import('./env-validation');
    const env = validateEnv();

    expect(env.NODE_ENV).toBe('production');
    expect(_mockConsoleWarn).toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('exits in production if HTTPS not used for APP_URL', async () => {
    process.env = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      JWT_SECRET: 'a-very-secure-secret-key-that-is-long-enough',
      NEXTAUTH_URL: 'https://example.com',
      NEXTAUTH_SECRET: 'another-secure-secret-for-nextauth',
      APP_URL: 'http://insecure.example.com',
      NODE_ENV: 'production',
    } as any;

    const { validateEnv } = await import('./env-validation');
    expect(() => validateEnv()).toThrow('process.exit called');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('logs success when production config passes without warnings', async () => {
    process.env = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      JWT_SECRET: 'a-very-secure-secret-key-that-is-long-enough',
      NEXTAUTH_URL: 'https://example.com',
      NEXTAUTH_SECRET: 'another-secure-secret-for-nextauth',
      APP_URL: 'https://example.com',
      NODE_ENV: 'production',
      BCRYPT_ROUNDS: '12',
      SMTP_HOST: 'smtp.example.com',
      SMTP_USER: 'user@example.com',
      SENTRY_DSN: 'https://example.com/123',
      REDIS_URL: 'https://redis.example.com',
    } as any;

    const { validateEnv } = await import('./env-validation');
    const env = validateEnv();
    expect(env.NODE_ENV).toBe('production');
    expect(_mockConsoleLog).toHaveBeenCalledWith('✅ Environment configuration validated for production');
  });
});
