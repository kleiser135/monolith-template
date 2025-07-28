import { NextRequest } from 'next/server';
import { middleware } from './middleware';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock JWT verification for testing
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
  verify: vi.fn(),
}));

import jwt from 'jsonwebtoken';
const mockJwtVerify = vi.mocked(jwt.verify);

describe('Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up a default JWT_SECRET for tests
    process.env.JWT_SECRET = 'test-secret';
  });

  const createMockRequest = (
    pathname: string,
    token: string | undefined
  ): NextRequest => {
    const req = new NextRequest(new URL(pathname, 'http://localhost'));
    if (token) {
      req.cookies.set('token', token);
    }
    return req;
  };

  it('should redirect authenticated user from root to dashboard', () => {
    // Mock valid JWT
    mockJwtVerify.mockReturnValue({ userId: '1', iat: 123, exp: 456 } as any);
    
    const req = createMockRequest('/', 'valid-token');
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/dashboard');
  });

  it('should redirect unauthenticated user from protected route to login', () => {
    // No token provided
    const req = createMockRequest('/dashboard', undefined);
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/login');
  });

  it('should redirect user with invalid token from protected route to login', () => {
    // Mock invalid JWT (throws error)
    mockJwtVerify.mockImplementation(() => {
      throw new Error('Invalid token');
    });
    
    const req = createMockRequest('/dashboard', 'invalid-token');
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/login');
  });

  it('should redirect authenticated user from auth-only route to dashboard', () => {
    // Mock valid JWT
    mockJwtVerify.mockReturnValue({ userId: '1', iat: 123, exp: 456 } as any);
    
    const req = createMockRequest('/login', 'valid-token');
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/dashboard');
  });

  it('should allow unauthenticated user to access auth-only routes', () => {
    // No token provided
    const req = createMockRequest('/login', undefined);
    const res = middleware(req);
    // Should allow access (NextResponse.next())
    expect(res.status).not.toBe(307);
  });

  it('should allow authenticated user to access unprotected routes', () => {
    // Mock valid JWT
    mockJwtVerify.mockReturnValue({ userId: '1', iat: 123, exp: 456 } as any);
    
    // A route that's not in any protected/auth-only lists
    const req = createMockRequest('/some/other/page', 'valid-token');
    const res = middleware(req);
    expect(res.status).not.toBe(307);
  });

  it('should allow unauthenticated user to access public routes', () => {
    // No token provided
    const req = createMockRequest('/email-verification', undefined);
    const res = middleware(req);
    expect(res.status).not.toBe(307);
  });

  it('should redirect unauthenticated user from root to login', () => {
    // No token provided
    const req = createMockRequest('/', undefined);
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/login');
  });
}); 