/**
 * Test mocks for mobile API tests
 */

import { vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the rate limiter
export const mockRateLimiter = {
  check: vi.fn().mockResolvedValue({
    success: true,
    limit: 60,
    remaining: 59,
    reset: new Date(Date.now() + 60000)
  })
};

// Mock the getClientIp function to handle missing headers in tests
export const mockGetClientIp = vi.fn().mockReturnValue('127.0.0.1');

// Mock the entire rate-limit module at the top level
vi.mock('@/lib/rate-limit', () => ({
  getClientIp: mockGetClientIp,
  rateLimiters: {
    auth: mockRateLimiter,
    api: mockRateLimiter,
    default: mockRateLimiter,
  },
  InMemoryRateLimiter: vi.fn().mockImplementation(() => mockRateLimiter),
}));

// Mock JWT functions to avoid jose library issues in tests
vi.mock('@/lib/mobileAuth/jwt', () => ({
  signAccessToken: vi.fn().mockImplementation((payload: any) => {
    // Return a fake JWT that encodes the payload information
    const encodedPayload = btoa(JSON.stringify(payload));
    return Promise.resolve(`fake-jwt-header.${encodedPayload}.fake-signature`);
  }),
  verifyAccessToken: vi.fn().mockImplementation((token: string) => {
    try {
      // Extract payload from fake JWT
      const [, encodedPayload] = token.split('.');
      const payload = JSON.parse(atob(encodedPayload));
      return Promise.resolve({
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 15 * 60
      });
    } catch {
      // Return static mock for invalid tokens
      return Promise.resolve({
        sub: 'test-user-id',
        userId: 'test-user-id',
        roles: ['MEMBER'],
        tenantId: 'test-tenant',
        localChurchId: 'test-local-church-id',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 15 * 60
      });
    }
  }),
  verifyRefreshToken: vi.fn().mockImplementation((token: string) => {
    try {
      // Extract payload from fake JWT  
      const [, encodedPayload] = token.split('.');
      const payload = JSON.parse(atob(encodedPayload));
      return Promise.resolve({
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
      });
    } catch {
      // Return static mock for invalid tokens
      return Promise.resolve({
        sub: 'test-user-id',
        rotationId: 'test-rotation-id',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
      });
    }
  })
}));

// Mock refresh token rotation
vi.mock('@/lib/mobileAuth/rotate', () => ({
  createRefreshToken: vi.fn().mockImplementation((userId: string) => {
    // Return a fake refresh JWT that encodes user and rotation info
    const payload = {
      sub: userId,
      rotationId: `rotation-${Date.now()}-${Math.random().toString(36).substring(2)}`
    };
    const encodedPayload = btoa(JSON.stringify(payload));
    return Promise.resolve(`fake-refresh-header.${encodedPayload}.fake-signature`);
  }),
  rotateRefreshToken: vi.fn().mockImplementation((oldToken: string, userId: string) => {
    // Return a mock token rotation result
    return Promise.resolve({
      success: true,
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token'
    });
  })
}));

// Setup function for additional mock configuration
export function setupRateLimitMocks() {
  // Reset mock call counts and ensure proper return values
  mockGetClientIp.mockReturnValue('127.0.0.1');
  mockRateLimiter.check.mockResolvedValue({
    success: true,
    limit: 60,
    remaining: 59,
    reset: new Date(Date.now() + 60000)
  });
}

// Helper to create a NextRequest with proper headers for tests
export function createMockRequest(url: string, options: RequestInit & { headers?: Record<string, string> } = {}) {
  const headers = new Headers({
    'x-forwarded-for': '127.0.0.1',
    'user-agent': 'test-client',
    'content-type': 'application/json',
    ...options.headers,
  });

  const requestOptions = {
    method: 'GET',
    ...options,
    headers,
  };

  // Create NextRequest directly with URL and options
  return new NextRequest(url, requestOptions);
}