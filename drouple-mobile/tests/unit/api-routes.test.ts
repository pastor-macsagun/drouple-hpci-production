/**
 * Unit Tests for API Routes
 * Target: ≥80% coverage for API routes
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSessionAndUser: vi.fn(),
    },
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

// Import the route handlers after mocking
import { POST as authTokenPOST } from '../../../app/api/v2/auth/token/route';
import { POST as notificationRegisterPOST, GET as notificationRegisterGET } from '../../../app/api/v2/notifications/register/route';

describe('API Routes - Auth Token Exchange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v2/auth/token', () => {
    it('should exchange valid session token for JWT', async () => {
      // Mock valid session
      const mockUser = {
        id: 'user_123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'MEMBER',
        tenantId: 'tenant_123',
        memberStatus: 'ACTIVE',
      };

      vi.mocked(auth.api.getSessionAndUser).mockResolvedValue({
        user: mockUser,
        session: { id: 'session_123' },
      });

      vi.mocked(jwt.sign).mockReturnValue('mock_jwt_token');

      // Mock environment
      process.env.AUTH_SECRET = 'test_secret';

      const request = new NextRequest('http://localhost/api/v2/auth/token', {
        method: 'POST',
        body: JSON.stringify({
          sessionToken: 'valid_session_token',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await authTokenPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.access_token).toBe('mock_jwt_token');
      expect(data.data.token_type).toBe('Bearer');
      expect(data.data.expires_in).toBe(3600);
      expect(data.data.user.id).toBe('user_123');
    });

    it('should reject invalid session token', async () => {
      vi.mocked(auth.api.getSessionAndUser).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/v2/auth/token', {
        method: 'POST',
        body: JSON.stringify({
          sessionToken: 'invalid_session_token',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await authTokenPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid session token');
    });

    it('should handle missing session token', async () => {
      const request = new NextRequest('http://localhost/api/v2/auth/token', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await authTokenPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Validation error');
    });

    it('should handle missing JWT secret', async () => {
      // Mock valid session
      vi.mocked(auth.api.getSessionAndUser).mockResolvedValue({
        user: { id: 'user_123', tenantId: 'tenant_123', role: 'MEMBER' },
        session: { id: 'session_123' },
      });

      // Remove environment variable
      delete process.env.AUTH_SECRET;
      delete process.env.NEXTAUTH_SECRET;

      const request = new NextRequest('http://localhost/api/v2/auth/token', {
        method: 'POST',
        body: JSON.stringify({
          sessionToken: 'valid_session_token',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await authTokenPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Server configuration error');
    });

    it('should handle server errors gracefully', async () => {
      vi.mocked(auth.api.getSessionAndUser).mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost/api/v2/auth/token', {
        method: 'POST',
        body: JSON.stringify({
          sessionToken: 'valid_session_token',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await authTokenPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });
});

describe('API Routes - Notification Registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v2/notifications/register', () => {
    it('should register device with valid token and data', async () => {
      // Mock token verification
      vi.mocked(verifyMobileToken).mockResolvedValue({
        success: true,
        user: {
          sub: 'user_123',
          tenantId: 'tenant_123',
          roles: ['MEMBER'],
          iat: Date.now() / 1000,
          exp: Date.now() / 1000 + 3600,
        },
      });

      const request = new NextRequest('http://localhost/api/v2/notifications/register', {
        method: 'POST',
        body: JSON.stringify({
          deviceId: 'device_123',
          platform: 'ios',
          pushToken: 'push_token_123',
          appVersion: '1.0.0',
          osVersion: '17.0',
          preferences: {
            general: true,
            prayerRequests: true,
            announcements: false,
            events: true,
            pathways: true,
          },
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid_jwt_token',
        },
      });

      const response = await notificationRegisterPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.platform).toBe('ios');
      expect(data.data.preferences.general).toBe(true);
      expect(data.data.preferences.announcements).toBe(false);
    });

    it('should reject registration with invalid token', async () => {
      vi.mocked(verifyMobileToken).mockResolvedValue({
        success: false,
        error: 'Invalid token',
      });

      const request = new NextRequest('http://localhost/api/v2/notifications/register', {
        method: 'POST',
        body: JSON.stringify({
          deviceId: 'device_123',
          platform: 'ios',
          appVersion: '1.0.0',
          osVersion: '17.0',
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid_token',
        },
      });

      const response = await notificationRegisterPOST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid token');
    });

    it('should handle missing required fields', async () => {
      vi.mocked(verifyMobileToken).mockResolvedValue({
        success: true,
        user: { sub: 'user_123', tenantId: 'tenant_123', roles: ['MEMBER'] },
      });

      const request = new NextRequest('http://localhost/api/v2/notifications/register', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
          platform: 'ios',
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid_token',
        },
      });

      const response = await notificationRegisterPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Validation error');
    });

    it('should validate platform enum', async () => {
      vi.mocked(verifyMobileToken).mockResolvedValue({
        success: true,
        user: { sub: 'user_123', tenantId: 'tenant_123', roles: ['MEMBER'] },
      });

      const request = new NextRequest('http://localhost/api/v2/notifications/register', {
        method: 'POST',
        body: JSON.stringify({
          deviceId: 'device_123',
          platform: 'windows', // Invalid platform
          appVersion: '1.0.0',
          osVersion: '11.0',
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid_token',
        },
      });

      const response = await notificationRegisterPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Platform must be ios or android');
    });
  });

  describe('GET /api/v2/notifications/register', () => {
    it('should return device registration status', async () => {
      vi.mocked(verifyMobileToken).mockResolvedValue({
        success: true,
        user: { sub: 'user_123', tenantId: 'tenant_123', roles: ['MEMBER'] },
      });

      const request = new NextRequest('http://localhost/api/v2/notifications/register?deviceId=device_123', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid_token',
        },
      });

      const response = await notificationRegisterGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.platform).toBeDefined();
      expect(data.data.preferences).toBeDefined();
    });

    it('should require deviceId parameter', async () => {
      vi.mocked(verifyMobileToken).mockResolvedValue({
        success: true,
        user: { sub: 'user_123', tenantId: 'tenant_123', roles: ['MEMBER'] },
      });

      const request = new NextRequest('http://localhost/api/v2/notifications/register', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid_token',
        },
      });

      const response = await notificationRegisterGET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Device ID is required');
    });
  });
});

// Mock implementations for the tests
const auth = {
  api: {
    getSessionAndUser: vi.fn(),
  },
};

const jwt = {
  sign: vi.fn(),
  verify: vi.fn(),
};

const verifyMobileToken = vi.fn();