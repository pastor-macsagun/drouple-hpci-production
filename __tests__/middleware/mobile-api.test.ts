/**
 * Mobile API Middleware Tests
 * Tests for JWT authorization, CORS, and rate limiting
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { mobileApiMiddleware } from '@/middleware/mobile-api';
import { signAccessToken } from '@/lib/mobileAuth/jwt';
import { rateLimiters } from '@/lib/rate-limit';

// Mock rate limiters
vi.mock('@/lib/rate-limit', () => ({
  rateLimiters: {
    api: {
      check: vi.fn(),
    },
  },
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

// Mock JWT verification
vi.mock('@/lib/mobileAuth/verify', () => ({
  verifyAuthHeader: vi.fn(),
}));

import { verifyAuthHeader } from '@/lib/mobileAuth/verify';

describe('Mobile API Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default rate limit success
    (rateLimiters.api.check as any).mockResolvedValue({
      success: true,
      remaining: 99,
      reset: new Date(Date.now() + 60000),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Helper to create NextRequest
  function createRequest(
    url: string,
    method: string = 'GET',
    headers: Record<string, string> = {}
  ): NextRequest {
    return new NextRequest(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
  }

  describe('CORS Handling', () => {
    it('should handle preflight OPTIONS request with allowed origin', async () => {
      const request = createRequest(
        'http://localhost/api/mobile/v1/profile',
        'OPTIONS',
        { 
          origin: 'http://localhost:19006',
        }
      );

      const response = await mobileApiMiddleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:19006');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, DELETE, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
        'Authorization, Content-Type, X-Idempotency-Key, X-Local-Church-Id'
      );
      expect(response.headers.get('Access-Control-Max-Age')).toBe('300');
    });

    it('should reject preflight OPTIONS request with disallowed origin', async () => {
      const request = createRequest(
        'http://localhost/api/mobile/v1/profile',
        'OPTIONS',
        { 
          origin: 'https://malicious-site.com',
        }
      );

      const response = await mobileApiMiddleware(request);

      expect(response.status).toBe(403);
    });

    it('should handle exp:// scheme origins', async () => {
      const request = createRequest(
        'http://localhost/api/mobile/v1/profile',
        'OPTIONS',
        { 
          origin: 'exp://192.168.1.100:8081',
        }
      );

      const response = await mobileApiMiddleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('exp://192.168.1.100:8081');
    });

    it('should reject non-OPTIONS request with disallowed origin', async () => {
      const request = createRequest(
        'http://localhost/api/mobile/v1/profile',
        'GET',
        { 
          origin: 'https://evil-domain.com',
        }
      );

      const response = await mobileApiMiddleware(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Origin not allowed');
    });
  });

  describe('JWT Authentication', () => {
    it('should allow auth routes without JWT token', async () => {
      const request = createRequest(
        'http://localhost/api/mobile/v1/auth/login',
        'POST',
        { origin: 'http://localhost:19006' }
      );

      // Should not call verifyAuthHeader for auth routes
      const response = await mobileApiMiddleware(request);
      
      expect(verifyAuthHeader).not.toHaveBeenCalled();
      expect(response.status).toBe(200); // NextResponse.next() returns 200
    });

    it('should require JWT token for protected routes', async () => {
      const request = createRequest(
        'http://localhost/api/mobile/v1/profile',
        'GET',
        { origin: 'http://localhost:19006' }
      );

      (verifyAuthHeader as any).mockResolvedValue({
        success: false,
        error: 'Missing Authorization header',
      });

      const response = await mobileApiMiddleware(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Missing Authorization header');
    });

    it('should accept valid JWT token and attach context', async () => {
      const request = createRequest(
        'http://localhost/api/mobile/v1/profile',
        'GET',
        { 
          origin: 'http://localhost:19006',
          authorization: 'Bearer valid-token',
        }
      );

      const mockPayload = {
        userId: 'user123',
        roles: ['MEMBER'],
        tenantId: 'tenant123',
        localChurchId: 'church123',
      };

      (verifyAuthHeader as any).mockResolvedValue({
        success: true,
        payload: mockPayload,
      });

      const response = await mobileApiMiddleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('x-mobile-context')).toBe(JSON.stringify({
        userId: 'user123',
        roles: ['MEMBER'],
        tenantId: 'tenant123',
        localChurchId: 'church123',
      }));
    });

    it('should reject token without tenant information', async () => {
      const request = createRequest(
        'http://localhost/api/mobile/v1/profile',
        'GET',
        { 
          origin: 'http://localhost:19006',
          authorization: 'Bearer invalid-token',
        }
      );

      (verifyAuthHeader as any).mockResolvedValue({
        success: true,
        payload: {
          userId: 'user123',
          roles: ['MEMBER'],
          tenantId: null, // Missing tenant
        },
      });

      const response = await mobileApiMiddleware(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Tenant information missing');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to POST requests', async () => {
      const request = createRequest(
        'http://localhost/api/mobile/v1/profile',
        'POST',
        { 
          origin: 'http://localhost:19006',
          authorization: 'Bearer valid-token',
        }
      );

      (verifyAuthHeader as any).mockResolvedValue({
        success: true,
        payload: {
          userId: 'user123',
          roles: ['MEMBER'],
          tenantId: 'tenant123',
        },
      });

      await mobileApiMiddleware(request);

      expect(rateLimiters.api.check).toHaveBeenCalledWith('mobile-mutation:127.0.0.1:user123');
    });

    it('should not apply rate limiting to GET requests', async () => {
      const request = createRequest(
        'http://localhost/api/mobile/v1/profile',
        'GET',
        { 
          origin: 'http://localhost:19006',
          authorization: 'Bearer valid-token',
        }
      );

      (verifyAuthHeader as any).mockResolvedValue({
        success: true,
        payload: {
          userId: 'user123',
          roles: ['MEMBER'],
          tenantId: 'tenant123',
        },
      });

      await mobileApiMiddleware(request);

      expect(rateLimiters.api.check).not.toHaveBeenCalled();
    });

    it('should reject requests when rate limit exceeded', async () => {
      const request = createRequest(
        'http://localhost/api/mobile/v1/profile',
        'POST',
        { 
          origin: 'http://localhost:19006',
          authorization: 'Bearer valid-token',
        }
      );

      (verifyAuthHeader as any).mockResolvedValue({
        success: true,
        payload: {
          userId: 'user123',
          roles: ['MEMBER'],
          tenantId: 'tenant123',
        },
      });

      const resetTime = new Date(Date.now() + 60000);
      (rateLimiters.api.check as any).mockResolvedValue({
        success: false,
        remaining: 0,
        reset: resetTime,
      });

      const response = await mobileApiMiddleware(request);

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toBe('Rate limit exceeded');
      expect(response.headers.get('Retry-After')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('should use different rate limit keys for different users', async () => {
      const request1 = createRequest(
        'http://localhost/api/mobile/v1/profile',
        'POST',
        { 
          origin: 'http://localhost:19006',
          authorization: 'Bearer token1',
        }
      );

      const request2 = createRequest(
        'http://localhost/api/mobile/v1/profile',
        'POST',
        { 
          origin: 'http://localhost:19006',
          authorization: 'Bearer token2',
        }
      );

      (verifyAuthHeader as any)
        .mockResolvedValueOnce({
          success: true,
          payload: { userId: 'user1', roles: ['MEMBER'], tenantId: 'tenant123' },
        })
        .mockResolvedValueOnce({
          success: true,
          payload: { userId: 'user2', roles: ['MEMBER'], tenantId: 'tenant123' },
        });

      await mobileApiMiddleware(request1);
      await mobileApiMiddleware(request2);

      expect(rateLimiters.api.check).toHaveBeenCalledWith('mobile-mutation:127.0.0.1:user1');
      expect(rateLimiters.api.check).toHaveBeenCalledWith('mobile-mutation:127.0.0.1:user2');
    });
  });

  describe('Integration', () => {
    it('should handle complete flow: CORS + Auth + Rate Limit', async () => {
      const request = createRequest(
        'http://localhost/api/mobile/v1/profile',
        'POST',
        { 
          origin: 'http://localhost:19006',
          authorization: 'Bearer valid-token',
        }
      );

      (verifyAuthHeader as any).mockResolvedValue({
        success: true,
        payload: {
          userId: 'user123',
          roles: ['MEMBER'],
          tenantId: 'tenant123',
          localChurchId: 'church123',
        },
      });

      const response = await mobileApiMiddleware(request);

      // Should pass all checks and continue to route
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:19006');
      expect(response.headers.get('x-mobile-context')).toBeDefined();
      expect(rateLimiters.api.check).toHaveBeenCalled();
    });

    it('should handle auth failure in complete flow', async () => {
      const request = createRequest(
        'http://localhost/api/mobile/v1/profile',
        'POST',
        { 
          origin: 'http://localhost:19006',
          authorization: 'Bearer invalid-token',
        }
      );

      (verifyAuthHeader as any).mockResolvedValue({
        success: false,
        error: 'Invalid token',
      });

      const response = await mobileApiMiddleware(request);

      expect(response.status).toBe(401);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:19006'); // CORS still applied
      expect(rateLimiters.api.check).not.toHaveBeenCalled(); // Rate limit not checked on auth failure
    });
  });
});