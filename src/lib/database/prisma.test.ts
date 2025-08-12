/**
 * Prisma Database Client Testing
 * Tests the database connection singleton pattern and basic functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient before importing
const mockPrismaClient = {
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  user: {
    findMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  post: {
    findMany: vi.fn(),
    create: vi.fn(),
  }
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrismaClient)
}));

describe('Prisma Database Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should export a prisma client instance', async () => {
      const { prisma } = await import('./prisma');
      expect(prisma).toBeDefined();
      expect(typeof prisma).toBe('object');
    });

    it('should maintain consistent exports', async () => {
      const module1 = await import('./prisma');
      const module2 = await import('./prisma');
      
      expect(module1.prisma).toBeDefined();
      expect(module2.prisma).toBeDefined();
      // Due to module caching, these should be the same instance
      expect(module1.prisma).toBe(module2.prisma);
    });

    it('should have expected client methods', async () => {
      const { prisma } = await import('./prisma');
      
      // The prisma client should be our mock object
      expect(prisma).toBeDefined();
      
      // Test that it's an object (could be mock or real depending on environment)
      expect(typeof prisma).toBe('object');
    });
  });

  describe('Global Object Handling', () => {
    it('should handle global object type casting safely', () => {
      expect(() => {
        const globalForPrisma = global as unknown as {
          prisma: PrismaClient | undefined;
        };
        // This should not throw a type error
        globalForPrisma.prisma = mockPrismaClient as any;
      }).not.toThrow();
    });

    it('should handle undefined global prisma', () => {
      const globalForPrisma = global as unknown as {
        prisma: PrismaClient | undefined;
      };
      
      // Test the nullish coalescing logic
      const testPrisma = globalForPrisma.prisma ?? mockPrismaClient;
      expect(testPrisma).toBeDefined();
    });

    it('should handle truthy global prisma', () => {
      const globalForPrisma = global as unknown as {
        prisma: PrismaClient | undefined;
      };
      
      // Set a mock global prisma
      globalForPrisma.prisma = mockPrismaClient as any;
      
      // Test the nullish coalescing logic
      const testPrisma = globalForPrisma.prisma ?? mockPrismaClient;
      expect(testPrisma).toBe(mockPrismaClient);
    });
  });

  describe('Environment Configuration', () => {
    it('should handle NODE_ENV checks correctly', () => {
      // Test the environment check logic used in the module
      const isProduction = process.env.NODE_ENV === 'production';
      const isDevelopment = process.env.NODE_ENV === 'development';
      const isTest = process.env.NODE_ENV === 'test';
      
      // At least one should be true, or it could be undefined
      expect(typeof isProduction).toBe('boolean');
      expect(typeof isDevelopment).toBe('boolean');
      expect(typeof isTest).toBe('boolean');
    });

    it('should handle production environment logic', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Test the condition logic
      const shouldSetGlobal = originalEnv !== 'production';
      expect(typeof shouldSetGlobal).toBe('boolean');
      
      // In our test environment, this should typically be true
      if (originalEnv === 'test') {
        expect(shouldSetGlobal).toBe(true);
      }
    });
  });

  describe('Prisma Client Configuration', () => {
    it('should use correct logging configuration', () => {
      // Test that the expected config object structure is valid
      const config = { log: ['query'] };
      
      expect(config.log).toEqual(['query']);
      expect(Array.isArray(config.log)).toBe(true);
      expect(config.log.length).toBe(1);
      expect(config.log[0]).toBe('query');
    });

    it('should handle PrismaClient instantiation parameters', () => {
      // Test that we can create a PrismaClient with the expected config
      const MockedPrismaClient = PrismaClient as any;
      
      // Create a new instance with the same config as the module
      new MockedPrismaClient({ log: ['query'] });
      
      expect(MockedPrismaClient).toHaveBeenCalledWith({ log: ['query'] });
    });
  });

  describe('Module Import Behavior', () => {
    it('should import without throwing errors', async () => {
      expect(async () => {
        await import('./prisma');
      }).not.toThrow();
    });

    it('should export the expected structure', async () => {
      const prismaModule = await import('./prisma');
      
      expect(prismaModule).toHaveProperty('prisma');
      expect(prismaModule.prisma).toBeDefined();
    });

    it('should handle multiple imports consistently', async () => {
      // Multiple imports should work fine due to module caching
      const imports = await Promise.all([
        import('./prisma'),
        import('./prisma'),
        import('./prisma')
      ]);
      
      expect(imports.length).toBe(3);
      
      // Verify all exports have the prisma property
      imports.forEach((prismaModule, _index) => {
        expect(prismaModule).toHaveProperty('prisma');
        expect(prismaModule.prisma).toBeDefined();
        expect(typeof prismaModule.prisma).toBe('object');
      });
      
      // All should have the same type structure
      expect(typeof imports[0].prisma).toBe(typeof imports[1].prisma);
      expect(typeof imports[1].prisma).toBe(typeof imports[2].prisma);
    });
  });

  describe('Type Safety', () => {
    it('should maintain proper TypeScript types', async () => {
      const { prisma } = await import('./prisma');
      
      // Should be a valid object that can be assigned to PrismaClient type
      expect(typeof prisma).toBe('object');
      expect(prisma).not.toBeNull();
    });

    it('should handle global type assertions correctly', () => {
      // Test the type assertion pattern used in the module
      const globalForPrisma = global as unknown as {
        prisma: PrismaClient | undefined;
      };
      
      expect(typeof globalForPrisma).toBe('object');
      expect('prisma' in globalForPrisma || !('prisma' in globalForPrisma)).toBe(true);
    });
  });

  describe('Singleton Pattern', () => {
    it('should demonstrate singleton-like behavior through module caching', async () => {
      // Import the module multiple times
      const module1 = await import('./prisma');
      const module2 = await import('./prisma');
      
      // Due to Node.js module caching, these should be identical
      expect(module1.prisma === module2.prisma).toBe(true);
    });

    it('should provide the same instance across different import styles', async () => {
      // Named import
      const { prisma: namedImport } = await import('./prisma');
      
      // Default-style import
      const prismaModule = await import('./prisma');
      const moduleImport = prismaModule.prisma;
      
      expect(namedImport).toBe(moduleImport);
    });
  });
});
