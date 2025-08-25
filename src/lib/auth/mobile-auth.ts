/**
 * Mobile authentication utilities
 * Provides helpers for mobile app integration with the API
 */

export interface MobileAuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
  message: string;
  error?: string;
}

export interface MobileAuthRequest {
  email: string;
  password: string;
}

/**
 * Headers that should be included with mobile API requests
 */
export const MOBILE_HEADERS = {
  'Content-Type': 'application/json',
  'X-Client-Type': 'mobile',
} as const;

/**
 * Creates headers for authenticated mobile requests
 */
export function createAuthHeaders(token: string): Record<string, string> {
  return {
    ...MOBILE_HEADERS,
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Validates a mobile authentication response
 */
export function validateMobileAuthResponse(response: any): response is MobileAuthResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof response.success === 'boolean' &&
    typeof response.message === 'string' &&
    (response.success ? typeof response.token === 'string' : true)
  );
}

/**
 * Error types that mobile clients should handle
 */
export const MOBILE_AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  RATE_LIMITED: 'RATE_LIMITED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export type MobileAuthError = typeof MOBILE_AUTH_ERRORS[keyof typeof MOBILE_AUTH_ERRORS];

/**
 * Example mobile authentication flow for documentation
 */
export const MOBILE_AUTH_FLOW_EXAMPLE = {
  login: {
    method: 'POST',
    url: '/api/auth/login',
    headers: MOBILE_HEADERS,
    body: {
      email: 'user@example.com',
      password: 'password123',
    },
    response: {
      success: true,
      message: 'Login successful',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: {
        id: 'user-id',
        email: 'user@example.com',
        name: 'John Doe',
      },
    },
  },
  authenticatedRequest: {
    method: 'GET',
    url: '/api/auth/me',
    headers: {
      ...MOBILE_HEADERS,
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  },
} as const;
