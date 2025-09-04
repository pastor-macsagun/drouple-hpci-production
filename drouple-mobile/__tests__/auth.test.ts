/**
 * Auth Store Tests
 * Unit tests for authentication functionality
 */

import { useAuthStore } from '../src/lib/store/authStore';

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock the auth API
jest.mock('../src/lib/api', () => ({
  authApi: {
    setAuthToken: jest.fn(),
    removeAuthToken: jest.fn(),
    logout: jest.fn(() => Promise.resolve({ success: true })),
    refreshToken: jest.fn(() => Promise.resolve({ success: false })),
    updateProfile: jest.fn(() => Promise.resolve({ success: false })),
    setupBiometric: jest.fn(() => Promise.resolve({ success: true })),
    getSession: jest.fn(() => Promise.resolve({ success: false })),
  },
}));

// Mock biometric service
jest.mock('../src/lib/biometric/biometricAuth', () => ({
  BiometricAuthService: {
    setupBiometric: jest.fn(() => Promise.resolve({ success: true })),
    disableBiometric: jest.fn(() => Promise.resolve(true)),
    authenticateWithBiometric: jest.fn(() =>
      Promise.resolve({ success: false })
    ),
  },
}));

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.getState().signOut();
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBe(null);
    expect(state.tokens).toBe(null);
    expect(state.isLoading).toBe(true);
  });

  it('should sign in user successfully', async () => {
    const mockUser = {
      id: 'test-user',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: ['MEMBER'],
      tenantId: 'test-tenant',
      churchId: 'test-church',
      isActive: true,
    };

    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() + 3600000,
      tokenType: 'Bearer' as const,
    };

    await useAuthStore.getState().signIn(mockUser, mockTokens);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.tokens).toEqual(mockTokens);
    expect(state.isLoading).toBe(false);
  });

  it('should sign out user successfully', async () => {
    // First sign in
    const mockUser = {
      id: 'test-user',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: ['MEMBER'],
      tenantId: 'test-tenant',
      churchId: 'test-church',
      isActive: true,
    };

    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() + 3600000,
      tokenType: 'Bearer' as const,
    };

    await useAuthStore.getState().signIn(mockUser, mockTokens);

    // Then sign out
    await useAuthStore.getState().signOut();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBe(null);
    expect(state.tokens).toBe(null);
  });

  it('should check user roles correctly', () => {
    const mockUser = {
      id: 'test-user',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: ['LEADER', 'MEMBER'],
      tenantId: 'test-tenant',
      churchId: 'test-church',
      isActive: true,
    };

    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() + 3600000,
      tokenType: 'Bearer' as const,
    };

    useAuthStore.getState().signIn(mockUser, mockTokens);

    expect(useAuthStore.getState().hasRole('MEMBER')).toBe(true);
    expect(useAuthStore.getState().hasRole('LEADER')).toBe(true);
    expect(useAuthStore.getState().hasRole('ADMIN')).toBe(false);
  });

  it('should check minimum roles correctly', () => {
    const mockUser = {
      id: 'test-user',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: ['LEADER'],
      tenantId: 'test-tenant',
      churchId: 'test-church',
      isActive: true,
    };

    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() + 3600000,
      tokenType: 'Bearer' as const,
    };

    useAuthStore.getState().signIn(mockUser, mockTokens);

    expect(useAuthStore.getState().hasMinRole('MEMBER')).toBe(true);
    expect(useAuthStore.getState().hasMinRole('LEADER')).toBe(true);
    expect(useAuthStore.getState().hasMinRole('ADMIN')).toBe(false);
  });
});
