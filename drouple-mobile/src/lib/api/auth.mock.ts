/**
 * Mock Authentication API
 * Default implementation for development and testing
 * Simulates backend auth behavior with realistic delays and responses
 */

import * as Device from 'expo-device';

import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  SessionResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  BiometricSetupRequest,
  BiometricSetupResponse,
  LogoutRequest,
  LogoutResponse,
} from './contracts';
import type { User } from '@/types/auth';

// Mock delay to simulate network
const mockDelay = (ms: number = 800) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Mock users database
const MOCK_USERS: Record<string, User> = {
  'admin@drouple.com': {
    id: 'user-admin-1',
    email: 'admin@drouple.com',
    firstName: 'Church',
    lastName: 'Administrator',
    roles: ['ADMIN'],
    tenantId: 'tenant-hpci',
    churchId: 'church-manila',
    isActive: true,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-12-01T10:30:00Z',
    preferences: {
      biometricEnabled: true,
      notificationsEnabled: true,
      darkMode: false,
      language: 'en',
    },
  },
  'pastor@drouple.com': {
    id: 'user-pastor-1',
    email: 'pastor@drouple.com',
    firstName: 'Lead',
    lastName: 'Pastor',
    roles: ['PASTOR', 'ADMIN'],
    tenantId: 'tenant-hpci',
    churchId: 'church-manila',
    isActive: true,
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-12-01T09:00:00Z',
    preferences: {
      biometricEnabled: false,
      notificationsEnabled: true,
      darkMode: false,
      language: 'en',
    },
  },
  'leader@drouple.com': {
    id: 'user-leader-1',
    email: 'leader@drouple.com',
    firstName: 'Ministry',
    lastName: 'Leader',
    roles: ['LEADER'],
    tenantId: 'tenant-hpci',
    churchId: 'church-manila',
    isActive: true,
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-11-15T16:45:00Z',
    preferences: {
      biometricEnabled: true,
      notificationsEnabled: true,
      darkMode: true,
      language: 'en',
    },
  },
  'vip@drouple.com': {
    id: 'user-vip-1',
    email: 'vip@drouple.com',
    firstName: 'VIP',
    lastName: 'Team',
    roles: ['VIP'],
    tenantId: 'tenant-hpci',
    churchId: 'church-manila',
    isActive: true,
    createdAt: '2024-03-01T08:00:00Z',
    updatedAt: '2024-11-20T12:00:00Z',
  },
  'member@drouple.com': {
    id: 'user-member-1',
    email: 'member@drouple.com',
    firstName: 'Church',
    lastName: 'Member',
    roles: ['MEMBER'],
    tenantId: 'tenant-hpci',
    churchId: 'church-manila',
    isActive: true,
    createdAt: '2024-04-01T08:00:00Z',
    updatedAt: '2024-10-15T14:30:00Z',
  },
  'superadmin@drouple.com': {
    id: 'user-superadmin-1',
    email: 'superadmin@drouple.com',
    firstName: 'Super',
    lastName: 'Admin',
    roles: ['SUPER_ADMIN'],
    tenantId: 'tenant-system',
    churchId: 'church-system',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-12-01T08:00:00Z',
    preferences: {
      biometricEnabled: false,
      notificationsEnabled: true,
      darkMode: true,
      language: 'en',
    },
  },
};

// Mock password (same for all users in development)
const MOCK_PASSWORD = 'Drouple123!';

// Mock token generation
const generateMockToken = (user: User): string => {
  const payload = {
    sub: user.id,
    email: user.email,
    roles: user.roles,
    tenantId: user.tenantId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
  };
  return `mock.${btoa(JSON.stringify(payload))}.signature`;
};

// Mock refresh token generation
const generateRefreshToken = (userId: string): string => {
  return `refresh_${userId}_${Date.now()}_${Math.random().toString(36)}`;
};

// Mock Authentication API Class
export class MockAuthApi {
  /**
   * Login with email and password
   */
  async login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    await mockDelay(600); // Simulate network delay

    const { email, password } = request;

    // Validate credentials
    const user = MOCK_USERS[email.toLowerCase()];
    if (!user || password !== MOCK_PASSWORD) {
      return {
        success: false,
        error: 'Invalid email or password',
        message: 'Please check your credentials and try again',
        timestamp: new Date().toISOString(),
      };
    }

    // Check if user is active
    if (!user.isActive) {
      return {
        success: false,
        error: 'Account inactive',
        message:
          'Your account has been deactivated. Please contact your administrator.',
        timestamp: new Date().toISOString(),
      };
    }

    // Generate tokens
    const accessToken = generateMockToken(user);
    const refreshToken = generateRefreshToken(user.id);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    return {
      success: true,
      data: {
        user,
        accessToken,
        refreshToken,
        expiresAt,
        sessionId: `session_${user.id}_${Date.now()}`,
        lastLoginAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    request: RefreshTokenRequest
  ): Promise<ApiResponse<RefreshTokenResponse>> {
    await mockDelay(300);

    const { refreshToken } = request;

    // Simple validation (in real API, this would verify JWT signature)
    if (!refreshToken.startsWith('refresh_')) {
      return {
        success: false,
        error: 'Invalid refresh token',
        message: 'The refresh token is invalid or expired',
        timestamp: new Date().toISOString(),
      };
    }

    // Extract user ID from refresh token (mock logic)
    const parts = refreshToken.split('_');
    const userId = parts[1];

    // Find user by ID
    const user = Object.values(MOCK_USERS).find(u => u.id === userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found',
        message: 'The user associated with this token no longer exists',
        timestamp: new Date().toISOString(),
      };
    }

    // Generate new tokens
    const accessToken = generateMockToken(user);
    const newRefreshToken = generateRefreshToken(user.id);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    return {
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresAt,
        user, // Include updated user data
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(
    request: UpdateProfileRequest
  ): Promise<ApiResponse<UpdateProfileResponse>> {
    await mockDelay(400);

    // Mock: Would normally validate auth token and get user ID
    const userId = 'user-admin-1'; // Mock current user
    const user = Object.values(MOCK_USERS).find(u => u.id === userId);

    if (!user) {
      return {
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString(),
      };
    }

    // Update user data
    const updatedUser: User = {
      ...user,
      ...request,
      preferences: {
        biometricEnabled: user.preferences?.biometricEnabled ?? false,
        notificationsEnabled: user.preferences?.notificationsEnabled ?? true,
        darkMode: user.preferences?.darkMode ?? false,
        language: user.preferences?.language ?? 'en',
        ...request.preferences,
      },
      updatedAt: new Date().toISOString(),
    };

    // Update mock database
    MOCK_USERS[user.email] = updatedUser;

    const updatedFields = Object.keys(request).filter(
      key => request[key as keyof typeof request] !== undefined
    );

    return {
      success: true,
      data: {
        user: updatedUser,
        updatedFields,
        updatedAt: updatedUser.updatedAt,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Setup biometric authentication
   */
  async setupBiometric(
    request: BiometricSetupRequest
  ): Promise<ApiResponse<BiometricSetupResponse>> {
    await mockDelay(200);

    // Mock validation
    if (!request.userId || !Device.isDevice) {
      return {
        success: false,
        error: 'Biometric setup not available',
        message: 'Biometric authentication is not available on this device',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: {
        success: true,
        setupAt: new Date().toISOString(),
        backupRequired: !request.enabled, // Require backup when disabling
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Logout
   */
  async logout(request: LogoutRequest): Promise<ApiResponse<LogoutResponse>> {
    await mockDelay(300);

    // Mock: Would invalidate tokens on server
    const devicesLoggedOut = request.logoutAllDevices ? 3 : 1;

    return {
      success: true,
      data: {
        success: true,
        loggedOutAt: new Date().toISOString(),
        devicesLoggedOut,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Set authentication token for API requests (mock)
   */
  setAuthToken(token: string): void {
    // In mock, we can just store for reference but don't need actual HTTP client
    console.log(
      'Mock: setAuthToken called with:',
      token.substring(0, 10) + '...'
    );
  }

  /**
   * Remove authentication token (mock)
   */
  removeAuthToken(): void {
    // In mock, just log the action
    console.log('Mock: removeAuthToken called');
  }

  /**
   * Get current session (mock)
   */
  async getSession(): Promise<ApiResponse<SessionResponse>> {
    await mockDelay(200);

    // Mock: Return a valid session for testing
    return {
      success: true,
      data: {
        user: MOCK_USERS['admin@drouple.com']!,
        expires: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      },
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const mockAuthApi = new MockAuthApi();

// Export individual methods for easier testing
export const authMockMethods = {
  login: mockAuthApi.login.bind(mockAuthApi),
  getSession: mockAuthApi.getSession.bind(mockAuthApi),
  refreshToken: mockAuthApi.refreshToken.bind(mockAuthApi),
  updateProfile: mockAuthApi.updateProfile.bind(mockAuthApi),
  setupBiometric: mockAuthApi.setupBiometric.bind(mockAuthApi),
  logout: mockAuthApi.logout.bind(mockAuthApi),
  setAuthToken: mockAuthApi.setAuthToken.bind(mockAuthApi),
  removeAuthToken: mockAuthApi.removeAuthToken.bind(mockAuthApi),
};

export default mockAuthApi;
