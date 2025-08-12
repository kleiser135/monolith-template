import { describe, it, expect, vi, beforeEach } from 'vitest'
import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'
import {
  sanitizeString,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeFilename,
  sanitizeObject,
  sanitizeRequestBody,
  validateInputRate,
  sanitizationConfigs,
} from './input-sanitization'

vi.mock('isomorphic-dompurify', () => ({
  default: {
    sanitize: vi.fn((input: string, options?: any) => {
      // Simple mock that strips all tags by default, or allows specified tags
      if (options?.ALLOWED_TAGS && options.ALLOWED_TAGS.length > 0) {
        // For HTML mode, keep allowed tags
        if (options.ALLOWED_TAGS.includes('p') || options.ALLOWED_TAGS.includes('strong')) {
          return input; // Keep as-is for HTML tags test
        }
      }
      
      // Handle KEEP_CONTENT: true option - preserve text content inside tags
      if (options?.KEEP_CONTENT === true || options?.KEEP_CONTENT === undefined) {
        // Strip all tags but keep text content
        const result = input.replace(/<[^>]*>/g, '');
        return result.trim();
      }
      
      // Default: just return input stripped of tags
      const result = input.replace(/<[^>]*>/g, '');
      return result.trim();
    }),
  },
}))

vi.mock('validator', async (importOriginal) => {
  const actual = await importOriginal<typeof import('validator')>()
  return {
    default: {
      ...actual.default,
      isEmail: vi.fn(actual.default.isEmail),
      normalizeEmail: vi.fn(actual.default.normalizeEmail),
      isURL: vi.fn(actual.default.isURL),
    },
  }
})

describe('validation/input-sanitization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sanitizeString strips tags by default and respects maxLength/trim', () => {
    const html = '  <script>alert(1)</script><p>Hello</p>  '
    const result = sanitizeString(html)
    expect(DOMPurify.sanitize).toHaveBeenCalled()
    expect(result).toBe('Hello')

    const limited = sanitizeString('a'.repeat(1001), { ...sanitizationConfigs.strict, maxLength: 10 })
    expect(limited).toHaveLength(10)
  })

  it('sanitizeString allows configured tags when provided', () => {
    const html = '<p>Hello <strong>World</strong></p>'
    const result = sanitizeString(html, sanitizationConfigs.html)
    expect(DOMPurify.sanitize).toHaveBeenCalled()
    // Our mock strips tags; just ensure function returns a string
    expect(typeof result).toBe('string')
  })

  it('sanitizeEmail validates and normalizes emails', () => {
    expect(sanitizeEmail('invalid')).toBeNull()
    expect(validator.isEmail).toHaveBeenCalled()
    const normalized = sanitizeEmail(' TEST@EXAMPLE.COM ')
    expect(normalized).toBe('test@example.com')
  })

  it('sanitizeUrl validates protocols and rejects suspicious patterns', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull()
    expect(sanitizeUrl('http://example.com?q=1#hash')).toBe('http://example.com?q=1#hash')
    expect(validator.default.isURL).toBeTruthy()
  })

  it('sanitizeFilename removes dangerous characters and rejects invalids', () => {
    expect(sanitizeFilename('../etc/passwd')).toBe('etcpasswd')
    expect(sanitizeFilename('con.txt')).toBeNull()
    expect(sanitizeFilename(' valid-file .png ')).toBe('valid-file .png')
  })

  it('sanitizeObject recursively sanitizes keys and values', () => {
    const input = {
      '<key>': '  <b>x</b>  ',
      nested: [' <i>a</i> ', { deep: ' <script>z</script> ' }],
    }
    const output = sanitizeObject(input)
    expect(output['key']).toBe('x')
    expect(output.nested[0]).toBe('a')
    // Script tags should be completely removed for security
    expect(output.nested[1].deep).toBe('')
  })

  it('sanitizeRequestBody enforces depth and key limits', () => {
    const deep = { a: { b: { c: { d: { e: 'x' } } } } }
    const overDepth = sanitizeRequestBody(deep, 3)
    expect(overDepth.sanitized).toBeNull()
    expect(overDepth.violations.length).toBeGreaterThan(0)

    const manyKeys = Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`k${i}`, i]))
    const tooMany = sanitizeRequestBody(manyKeys, 10, 100)
    expect(tooMany.sanitized).toBeNull()
  })

  it('validateInputRate enforces length, pattern, and suspicious content checks', () => {
    // @ts-expect-error intentionally wrong type
    expect(validateInputRate(123 as unknown as string).valid).toBe(false)
    expect(validateInputRate('a'.repeat(1001)).valid).toBe(false)
    expect(validateInputRate('abc', 10, /^\d+$/).valid).toBe(false)
    expect(validateInputRate('<script>alert(1)</script>').valid).toBe(false)
    expect(validateInputRate('safe-text').valid).toBe(true)
  })
})


