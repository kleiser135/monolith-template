import { NextRequest, NextResponse } from 'next/server';
import { middleware } from './middleware';
import { describe, it, expect, vi } from 'vitest';

describe('Middleware', () => {
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
    const req = createMockRequest('/', 'fake-token');
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/dashboard');
  });

  it('should redirect unauthenticated user from protected route to login', () => {
    const req = createMockRequest('/dashboard', undefined);
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/login');
  });

  it('should redirect unauthenticated user from another protected route to login', () => {
    const req = createMockRequest('/settings', undefined);
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/login');
  });

  it('should redirect authenticated user from public route to dashboard', () => {
    const req = createMockRequest('/login', 'fake-token');
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/dashboard');
  });

  it('should allow unauthenticated user to access public route', () => {
    const req = createMockRequest('/login', undefined);
    const res = middleware(req);
    // Expecting NextResponse.next(), which doesn't have a redirect status
    expect(res.status).not.toBe(307);
  });

  it('should allow authenticated user to access an unprotected, non-root route', () => {
    // A route that is not in public or protected lists
    const req = createMockRequest('/some/other/page', 'fake-token');
    const res = middleware(req);
    expect(res.status).not.toBe(307);
  });

  it('should allow unauthenticated user to access the email verification page', () => {
    const req = createMockRequest('/email-verification', undefined);
    const res = middleware(req);
    expect(res.status).not.toBe(307);
  });
}); 