import { afterEach, vi, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import dotenv from 'dotenv'
import { mockDeep, mockReset} from 'vitest-mock-extended'
import { PrismaClient } from '@prisma/client'

dotenv.config({ path: '.env' })

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

export const prismaMock = mockDeep<PrismaClient>()

// Mock Prisma Client
vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: prismaMock,
}))

beforeEach(() => {
  mockReset(prismaMock)
})

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
}) 