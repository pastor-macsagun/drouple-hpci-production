/**
 * Unit Tests for Shared Packages
 * Target: ≥85% coverage for shared packages
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import shared package modules
import {
  validateData,
  createValidationMiddleware,
  LoginSchema,
  CreateUserSchema,
  RegisterDeviceSchema,
  PaginationSchema,
} from '../../packages/shared/src/validation';

import {
  hasPermission,
  hasAnyPermission,
  getMinimumRole,
  getMaximumRole,
  canManageUser,
  getAssignableRoles,
  canAccessRoute,
  getDefaultRoute,
  UserRole,
} from '../../packages/shared/src/auth';

import {
  ApiClient,
  buildEndpoint,
  API_VERSIONS,
  API_ENDPOINTS,
  API_ERROR_CODES,
} from '../../packages/shared/src/api';

import {
  decodeJwt,
  isTokenExpired,
  getTokenTimeLeft,
  shouldRefreshToken,
  TOKEN_REFRESH_THRESHOLD,
} from '../../packages/shared/src/auth';

describe('Shared Packages - Validation', () => {
  describe('validateData', () => {
    it('should validate valid data successfully', () => {
      const validData = { email: 'test@example.com', password: 'password123' };
      const result = validateData(LoginSchema, validData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.password).toBe('password123');
      }
    });

    it('should reject invalid email format', () => {
      const invalidData = { email: 'invalid-email', password: 'password123' };
      const result = validateData(LoginSchema, invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid email address');
      }
    });

    it('should reject short password', () => {
      const invalidData = { email: 'test@example.com', password: '123' };
      const result = validateData(LoginSchema, invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Password must be at least 8 characters');
      }
    });

    it('should handle missing required fields', () => {
      const invalidData = { email: 'test@example.com' };
      const result = validateData(LoginSchema, invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('password');
      }
    });
  });

  describe('createValidationMiddleware', () => {
    it('should create middleware that validates data', () => {
      const middleware = createValidationMiddleware(LoginSchema);
      const validData = { email: 'test@example.com', password: 'password123' };
      
      const result = middleware(validData);
      expect(result.email).toBe('test@example.com');
      expect(result.password).toBe('password123');
    });

    it('should throw error for invalid data', () => {
      const middleware = createValidationMiddleware(LoginSchema);
      const invalidData = { email: 'invalid-email', password: '123' };
      
      expect(() => middleware(invalidData)).toThrow();
    });
  });

  describe('Schema Validations', () => {
    it('should validate CreateUserSchema correctly', () => {
      const validUser = {
        email: 'user@example.com',
        name: 'Test User',
        role: UserRole.MEMBER,
        phone: '+1234567890',
      };

      const result = validateData(CreateUserSchema, validUser);
      expect(result.success).toBe(true);
    });

    it('should validate RegisterDeviceSchema correctly', () => {
      const validDevice = {
        deviceId: 'device_123',
        platform: 'ios' as const,
        pushToken: 'push_token_123',
        appVersion: '1.0.0',
        osVersion: '17.0',
      };

      const result = validateData(RegisterDeviceSchema, validDevice);
      expect(result.success).toBe(true);
    });

    it('should validate PaginationSchema with defaults', () => {
      const paginationData = {};
      const result = validateData(PaginationSchema, paginationData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sortOrder).toBe('asc');
      }
    });

    it('should enforce pagination limits', () => {
      const invalidPagination = { limit: 150 }; // Over max of 100
      const result = validateData(PaginationSchema, invalidPagination);
      
      expect(result.success).toBe(false);
    });
  });
});

describe('Shared Packages - RBAC (Role-Based Access Control)', () => {
  describe('hasPermission', () => {
    it('should allow higher roles to access lower role resources', () => {
      expect(hasPermission(UserRole.ADMIN, UserRole.MEMBER)).toBe(true);
      expect(hasPermission(UserRole.PASTOR, UserRole.ADMIN)).toBe(true);
      expect(hasPermission(UserRole.SUPER_ADMIN, UserRole.PASTOR)).toBe(true);
    });

    it('should deny lower roles access to higher role resources', () => {
      expect(hasPermission(UserRole.MEMBER, UserRole.ADMIN)).toBe(false);
      expect(hasPermission(UserRole.LEADER, UserRole.VIP)).toBe(false);
      expect(hasPermission(UserRole.VIP, UserRole.PASTOR)).toBe(false);
    });

    it('should allow same role access', () => {
      expect(hasPermission(UserRole.ADMIN, UserRole.ADMIN)).toBe(true);
      expect(hasPermission(UserRole.MEMBER, UserRole.MEMBER)).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    it('should grant access if user has any of the required roles', () => {
      const result = hasAnyPermission(UserRole.VIP, [UserRole.VIP, UserRole.ADMIN]);
      expect(result).toBe(true);
    });

    it('should deny access if user has none of the required roles', () => {
      const result = hasAnyPermission(UserRole.MEMBER, [UserRole.ADMIN, UserRole.PASTOR]);
      expect(result).toBe(false);
    });
  });

  describe('getMinimumRole and getMaximumRole', () => {
    it('should identify minimum role correctly', () => {
      const roles = [UserRole.ADMIN, UserRole.MEMBER, UserRole.PASTOR];
      const minRole = getMinimumRole(roles);
      expect(minRole).toBe(UserRole.MEMBER);
    });

    it('should identify maximum role correctly', () => {
      const roles = [UserRole.ADMIN, UserRole.MEMBER, UserRole.PASTOR];
      const maxRole = getMaximumRole(roles);
      expect(maxRole).toBe(UserRole.PASTOR);
    });
  });

  describe('canManageUser', () => {
    it('should allow SUPER_ADMIN to manage anyone', () => {
      expect(canManageUser(UserRole.SUPER_ADMIN, UserRole.PASTOR)).toBe(true);
      expect(canManageUser(UserRole.SUPER_ADMIN, UserRole.SUPER_ADMIN)).toBe(true);
    });

    it('should prevent managing users of equal or higher role', () => {
      expect(canManageUser(UserRole.ADMIN, UserRole.ADMIN)).toBe(false);
      expect(canManageUser(UserRole.ADMIN, UserRole.PASTOR)).toBe(false);
    });

    it('should allow managing users of lower role', () => {
      expect(canManageUser(UserRole.ADMIN, UserRole.VIP)).toBe(true);
      expect(canManageUser(UserRole.VIP, UserRole.MEMBER)).toBe(true);
    });
  });

  describe('getAssignableRoles', () => {
    it('should return roles that can be assigned by ADMIN', () => {
      const assignableRoles = getAssignableRoles(UserRole.ADMIN);
      expect(assignableRoles).toContain(UserRole.MEMBER);
      expect(assignableRoles).toContain(UserRole.LEADER);
      expect(assignableRoles).toContain(UserRole.VIP);
      expect(assignableRoles).not.toContain(UserRole.ADMIN);
    });

    it('should return limited roles for lower privileged users', () => {
      const assignableRoles = getAssignableRoles(UserRole.LEADER);
      expect(assignableRoles).toContain(UserRole.MEMBER);
      expect(assignableRoles).not.toContain(UserRole.LEADER);
      expect(assignableRoles).not.toContain(UserRole.ADMIN);
    });
  });

  describe('canAccessRoute', () => {
    it('should allow admin access to admin routes', () => {
      expect(canAccessRoute(UserRole.ADMIN, '/admin')).toBe(true);
      expect(canAccessRoute(UserRole.ADMIN, '/admin/members')).toBe(true);
    });

    it('should deny member access to admin routes', () => {
      expect(canAccessRoute(UserRole.MEMBER, '/admin')).toBe(false);
      expect(canAccessRoute(UserRole.MEMBER, '/super')).toBe(false);
    });

    it('should allow all roles to access member routes', () => {
      expect(canAccessRoute(UserRole.MEMBER, '/checkin')).toBe(true);
      expect(canAccessRoute(UserRole.ADMIN, '/events')).toBe(true);
    });
  });

  describe('getDefaultRoute', () => {
    it('should return correct default routes for each role', () => {
      expect(getDefaultRoute(UserRole.SUPER_ADMIN)).toBe('/super');
      expect(getDefaultRoute(UserRole.ADMIN)).toBe('/admin');
      expect(getDefaultRoute(UserRole.PASTOR)).toBe('/admin');
      expect(getDefaultRoute(UserRole.VIP)).toBe('/vip');
      expect(getDefaultRoute(UserRole.LEADER)).toBe('/leader');
      expect(getDefaultRoute(UserRole.MEMBER)).toBe('/dashboard');
    });
  });
});

describe('Shared Packages - API Client', () => {
  let apiClient: ApiClient;
  let fetchSpy: any;

  beforeEach(() => {
    fetchSpy = vi.fn();
    global.fetch = fetchSpy;
    
    apiClient = new ApiClient({
      baseUrl: 'https://api.example.com',
      timeout: 5000,
    });
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with correct base URL', () => {
      const client = new ApiClient({ baseUrl: 'https://api.test.com/' });
      expect(client['baseUrl']).toBe('https://api.test.com');
    });

    it('should set default timeout', () => {
      const client = new ApiClient({ baseUrl: 'https://api.test.com' });
      expect(client['timeout']).toBe(30000);
    });

    it('should accept custom headers', () => {
      const customHeaders = { 'Custom-Header': 'test-value' };
      const client = new ApiClient({
        baseUrl: 'https://api.test.com',
        headers: customHeaders,
      });
      
      expect(client['defaultHeaders']).toEqual(customHeaders);
    });
  });

  describe('HTTP Methods', () => {
    beforeEach(() => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, data: { id: 1 } }),
      });
    });

    it('should make GET requests correctly', async () => {
      await apiClient.get('/users');
      
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should make POST requests with data', async () => {
      const postData = { name: 'Test User' };
      await apiClient.post('/users', postData);
      
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle query parameters in GET requests', async () => {
      const params = { page: 1, limit: 10, search: 'test' };
      await apiClient.get('/users', params);
      
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.example.com/users?page=1&limit=10&search=test',
        expect.anything()
      );
    });

    it('should include idempotency key when provided', async () => {
      const idempotencyKey = 'test-key-123';
      await apiClient.post('/users', { name: 'Test' }, idempotencyKey);
      
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Idempotency-Key': idempotencyKey,
          }),
        })
      );
    });
  });

  describe('Authentication', () => {
    it('should set auth token correctly', () => {
      const token = 'bearer-token-123';
      apiClient.setAuthToken(token);
      
      expect(apiClient['defaultHeaders']['Authorization']).toBe(`Bearer ${token}`);
    });

    it('should remove auth token correctly', () => {
      apiClient.setAuthToken('token');
      apiClient.removeAuthToken();
      
      expect(apiClient['defaultHeaders']['Authorization']).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors correctly', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({ error: 'Not found' }),
      });

      await expect(apiClient.get('/users/999')).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      fetchSpy.mockRejectedValue(new Error('Network error'));

      await expect(apiClient.get('/users')).rejects.toThrow('Network error');
    });

    it('should call error callback when provided', async () => {
      const onError = vi.fn();
      const client = new ApiClient({
        baseUrl: 'https://api.test.com',
        onError,
      });

      fetchSpy.mockRejectedValue(new Error('Test error'));

      await expect(client.get('/test')).rejects.toThrow();
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Utility Functions', () => {
    it('should build versioned endpoints correctly', () => {
      expect(buildEndpoint('V1', '/users')).toBe('/api/v1/users');
      expect(buildEndpoint('V2', '/auth/token')).toBe('/api/v2/auth/token');
    });

    it('should provide correct API endpoints', () => {
      expect(API_ENDPOINTS.AUTH.LOGIN).toBe('/auth/login');
      expect(API_ENDPOINTS.AUTH.TOKEN).toBe('/auth/token');
      expect(API_ENDPOINTS.EVENTS).toBe('/events');
    });

    it('should define error codes', () => {
      expect(API_ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(API_ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN');
      expect(API_ERROR_CODES.TENANT_ISOLATION_ERROR).toBe('TENANT_ISOLATION_ERROR');
    });
  });
});

describe('Shared Packages - JWT Utilities', () => {
  describe('decodeJwt', () => {
    it('should decode valid JWT token', () => {
      // Create a mock JWT payload (base64 encoded)
      const payload = { sub: 'user123', iat: 1234567890, exp: 9999999999 };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockToken = `header.${encodedPayload}.signature`;
      
      const decoded = decodeJwt(mockToken);
      expect(decoded.sub).toBe('user123');
      expect(decoded.iat).toBe(1234567890);
    });

    it('should return null for invalid JWT', () => {
      const invalidToken = 'invalid.token';
      const decoded = decodeJwt(invalidToken);
      expect(decoded).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should detect expired tokens', () => {
      const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 3600 }; // 1 hour ago
      const encodedPayload = btoa(JSON.stringify(expiredPayload));
      const expiredToken = `header.${encodedPayload}.signature`;
      
      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it('should detect valid tokens', () => {
      const validPayload = { exp: Math.floor(Date.now() / 1000) + 3600 }; // 1 hour from now
      const encodedPayload = btoa(JSON.stringify(validPayload));
      const validToken = `header.${encodedPayload}.signature`;
      
      expect(isTokenExpired(validToken)).toBe(false);
    });

    it('should return true for tokens without exp claim', () => {
      const noExpPayload = { sub: 'user123' };
      const encodedPayload = btoa(JSON.stringify(noExpPayload));
      const tokenWithoutExp = `header.${encodedPayload}.signature`;
      
      expect(isTokenExpired(tokenWithoutExp)).toBe(true);
    });
  });

  describe('getTokenTimeLeft', () => {
    it('should calculate correct time left', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 300; // 5 minutes from now
      const payload = { exp: futureExp };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      const timeLeft = getTokenTimeLeft(token);
      expect(timeLeft).toBeGreaterThan(250); // Should be close to 300 seconds
      expect(timeLeft).toBeLessThanOrEqual(300);
    });

    it('should return 0 for expired tokens', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 300; // 5 minutes ago
      const payload = { exp: pastExp };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      const timeLeft = getTokenTimeLeft(token);
      expect(timeLeft).toBe(0);
    });
  });

  describe('shouldRefreshToken', () => {
    it('should suggest refresh when within threshold', () => {
      const soonToExpire = Math.floor(Date.now() / 1000) + 200; // 200 seconds from now
      const payload = { exp: soonToExpire };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      expect(shouldRefreshToken(token)).toBe(true);
    });

    it('should not suggest refresh when plenty of time left', () => {
      const farFuture = Math.floor(Date.now() / 1000) + 1800; // 30 minutes from now
      const payload = { exp: farFuture };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      expect(shouldRefreshToken(token)).toBe(false);
    });

    it('should not suggest refresh for expired tokens', () => {
      const expired = Math.floor(Date.now() / 1000) - 100; // 100 seconds ago
      const payload = { exp: expired };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      expect(shouldRefreshToken(token)).toBe(false);
    });
  });

  it('should use correct refresh threshold', () => {
    expect(TOKEN_REFRESH_THRESHOLD).toBe(300); // 5 minutes
  });
});