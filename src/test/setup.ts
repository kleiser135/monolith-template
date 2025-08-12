import { afterEach, vi, beforeEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import dotenv from 'dotenv'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import { PrismaClient } from '@prisma/client'

// Polyfill for TextEncoder/TextDecoder if not available (fixes esbuild CI issue)
if (typeof globalThis.TextEncoder === 'undefined') {
  // Dynamic import would be preferred but causes type issues in test environment
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const util = require('util');
  globalThis.TextEncoder = util.TextEncoder;
  globalThis.TextDecoder = util.TextDecoder;
}

// Additional polyfills for Node.js environment
if (typeof globalThis.crypto === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require('crypto');
  globalThis.crypto = crypto.webcrypto;
}

dotenv.config({ path: '.env' })

// Set test environment variables before any imports
beforeAll(() => {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    JWT_SECRET: 'test-jwt-secret-that-is-long-enough-for-validation',
    NEXTAUTH_URL: 'http://localhost:3000',
    NEXTAUTH_SECRET: 'test-nextauth-secret',
    APP_URL: 'http://localhost:3000',
  })
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/headers for API route tests
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    getAll: vi.fn(() => []),
    has: vi.fn(() => false),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => ({
    get: vi.fn(),
    has: vi.fn(),
    getAll: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    entries: vi.fn(),
    forEach: vi.fn(),
  }))
}))

// Mock bcryptjs for authentication tests
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  }
}))

// Mock bcrypt for authentication tests (some modules use bcrypt instead of bcryptjs)
vi.mock('bcrypt', () => {
  const mockCompare = vi.fn().mockResolvedValue(false); // Default to false
  const mockHash = vi.fn().mockResolvedValue('$2b$10$mocked-hash');

  return {
    default: {
      compare: mockCompare,
      hash: mockHash,
      hashSync: vi.fn(() => '$2b$10$mocked-hash-sync'),
      compareSync: vi.fn(() => false),
      genSalt: vi.fn().mockResolvedValue('$2b$10$mocked-salt'),
      genSaltSync: vi.fn(() => '$2b$10$mocked-salt-sync'),
      getRounds: vi.fn(() => 10),
    },
    // Named exports
    compare: mockCompare,
    hash: mockHash,
    hashSync: vi.fn(() => '$2b$10$mocked-hash-sync'),
    compareSync: vi.fn(() => false),
    genSalt: vi.fn().mockResolvedValue('$2b$10$mocked-salt'),
    genSaltSync: vi.fn(() => '$2b$10$mocked-salt-sync'),
    getRounds: vi.fn(() => 10),
  };
})

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mocked-jwt-token'),
    verify: vi.fn(() => ({ userId: 'test-user-id' })),
  },
  sign: vi.fn(() => 'mocked-jwt-token'),
  verify: vi.fn(() => ({ userId: 'test-user-id' })),
}))

export const prismaMock = mockDeep<PrismaClient>()

// Mock Prisma Client
vi.mock('@/lib/database/prisma', () => ({
  __esModule: true,
  prisma: prismaMock,
}))

beforeEach(() => {
  mockReset(prismaMock)
  vi.clearAllMocks()
})

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia for next-themes
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
