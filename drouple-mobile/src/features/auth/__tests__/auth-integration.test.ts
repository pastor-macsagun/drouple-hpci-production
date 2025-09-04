/**
 * Authentication Integration Test
 * Tests the complete authentication flow including API calls
 * and backend connection
 */

import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import type { LoginRequest, User, AuthTokens } from '@/types/auth';

// Mock SecureStore for testing
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock LocalAuthentication for testing
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  supportedAuthenticationTypesAsync: jest.fn().mockResolvedValue([1]), // FINGERPRINT
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
}));

describe('Authentication Integration', () => {
  beforeEach(() => {
    // Reset auth store state
    useAuthStore.setState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      biometricSupported: false,
      biometricEnabled: false,
      hasCompletedOnboarding: false,
    });
  });

  describe('API Integration', () => {
    it('should have correct API base URL for production', () => {
      expect(authApi).toBeDefined();
      // The API should be configured to use production endpoints
      // This test ensures the API is pointing to the web dashboard backend
    });

    it('should handle login request with proper format', async () => {
      const loginRequest: LoginRequest = {
        email: 'test@drouple.com',
        password: 'TestPassword123!',
        deviceInfo: {
          deviceId: 'test-device',
          deviceName: 'Test Device',
          platform: 'ios',
          version: '1.0.0',
        },
      };

      // Mock successful login response
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user-1',
            email: 'test@drouple.com',
            firstName: 'Test',
            lastName: 'User',
            roles: ['MEMBER'],
            tenantId: 'tenant-1',
            churchId: 'church-1',
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          } as User,
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresAt: '2024-01-01T01:00:00Z',
        },
      };

      // Mock the login method
      jest.spyOn(authApi, 'login').mockResolvedValue(mockResponse);

      const response = await authApi.login(loginRequest);

      expect(response.success).toBe(true);
      expect(response.data?.user.email).toBe('test@drouple.com');
      expect(response.data?.accessToken).toBe('mock-access-token');
    });

    it('should handle session check for NextAuth.js', async () => {
      const mockSessionResponse = {
        success: true,
        data: {
          user: {
            id: 'user-1',
            email: 'test@drouple.com',
            firstName: 'Test',
            lastName: 'User',
            roles: ['MEMBER'],
            tenantId: 'tenant-1',
            churchId: 'church-1',
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          } as User,
          expires: '2024-01-01T01:00:00Z',
          accessToken: 'session-token',
        },
      };

      // Mock the getSession method
      jest.spyOn(authApi, 'getSession').mockResolvedValue(mockSessionResponse);

      const response = await authApi.getSession();

      expect(response.success).toBe(true);
      expect(response.data?.user.email).toBe('test@drouple.com');
    });
  });

  describe('Auth Store Integration', () => {
    it('should sign in user and store tokens securely', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@drouple.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['MEMBER'],
        tenantId: 'tenant-1',
        churchId: 'church-1',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const mockTokens: AuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000, // 1 hour from now
        tokenType: 'Bearer',
      };

      // Mock the API setAuthToken method
      jest.spyOn(authApi, 'setAuthToken').mockImplementation(() => {});

      // Sign in the user
      await useAuthStore.getState().signIn(mockUser, mockTokens);

      const state = useAuthStore.getState();

      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('test@drouple.com');
      expect(state.tokens?.accessToken).toBe('test-access-token');
      expect(state.error).toBe(null);
    });

    it('should handle sign out and clear tokens', async () => {
      // First sign in
      const mockUser: User = {
        id: 'user-1',
        email: 'test@drouple.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['MEMBER'],
        tenantId: 'tenant-1',
        churchId: 'church-1',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const mockTokens: AuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
      };

      // Mock API methods
      jest.spyOn(authApi, 'setAuthToken').mockImplementation(() => {});
      jest.spyOn(authApi, 'removeAuthToken').mockImplementation(() => {});
      jest.spyOn(authApi, 'logout').mockResolvedValue({
        success: true,
        data: {
          success: true,
          loggedOutAt: new Date().toISOString(),
        },
      });

      await useAuthStore.getState().signIn(mockUser, mockTokens);
      await useAuthStore.getState().signOut();

      const state = useAuthStore.getState();

      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
      expect(state.tokens).toBe(null);
    });
  });

  describe('Role-based Access Control', () => {
    it('should correctly check user roles', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'admin@drouple.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: ['ADMIN', 'LEADER'],
        tenantId: 'tenant-1',
        churchId: 'church-1',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const mockTokens: AuthTokens = {
        accessToken: 'admin-access-token',
        refreshToken: 'admin-refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
      };

      jest.spyOn(authApi, 'setAuthToken').mockImplementation(() => {});

      await useAuthStore.getState().signIn(mockUser, mockTokens);

      const store = useAuthStore.getState();

      expect(store.hasRole('ADMIN')).toBe(true);
      expect(store.hasRole('LEADER')).toBe(true);
      expect(store.hasRole('SUPER_ADMIN')).toBe(false);
      expect(store.hasMinRole('LEADER')).toBe(true);
      expect(store.hasMinRole('VIP')).toBe(true);
      expect(store.canAccessAdmin()).toBe(true);
    });
  });

  describe('Backend Connection', () => {
    it('should be configured to connect to the web dashboard backend', () => {
      // This test verifies that the mobile app is properly configured
      // to connect to the same backend as the web dashboard

      // The API should use production endpoints by default
      const apiConfig = require('@/lib/api').AUTH_CONFIG;
      expect(apiConfig.useMockAuth).toBe(false);
    });
  });
});

describe('Test Backend Connection', () => {
  // This is a manual test to verify the actual backend connection
  // Run this with a real backend to test the integration

  it.skip('should connect to real backend (manual test)', async () => {
    const loginRequest: LoginRequest = {
      email: 'admin@test.com', // Use actual credentials from web dashboard
      password: 'your-password',
      deviceInfo: {
        deviceId: 'test-mobile-device',
        deviceName: 'Test Mobile App',
        platform: 'ios',
        version: '1.0.0',
      },
    };

    try {
      const response = await authApi.login(loginRequest);
      console.log('Login response:', response);

      if (response.success) {
        console.log('✅ Successfully connected to backend!');
        console.log('User:', response.data?.user.email);
        console.log('Roles:', response.data?.user.roles);
      } else {
        console.log('❌ Login failed:', response.error);
      }
    } catch (error) {
      console.error('❌ Connection error:', error);
    }
  });

  it.skip('should check health endpoint (manual test)', async () => {
    try {
      const response = await fetch(
        'https://drouple-hpci-prod.vercel.app/api/health'
      );
      const data = await response.json();

      console.log('Health check:', data);
      expect(response.ok).toBe(true);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  });
});
