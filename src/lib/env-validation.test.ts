import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Environment Validation', () => {
  const originalEnv = process.env;
  let mockExit: any;
  let _mockConsoleError: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    
    // Mock process.exit to prevent actual exit during tests
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    // Mock console methods
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
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
});
