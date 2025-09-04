/**
 * Authentication Service Unit Tests
 * Tests for login, refresh, biometric, and offline auth
 */

import { AuthService } from '../../../lib/api/services/auth';
import { SecureStorage } from '../../../lib/security/secureStorage';
import { BiometricAuth } from '../../../lib/security/biometricAuth';
import * as LocalAuthentication from 'expo-local-authentication';

// Mock dependencies
jest.mock('../../../lib/security/secureStorage');
jest.mock('../../../lib/security/biometricAuth');
jest.mock('expo-local-authentication');

describe('AuthService', () => {
  let authService: AuthService;
  const mockSecureStorage = SecureStorage as jest.Mocked<typeof SecureStorage>;
  const mockBiometricAuth = BiometricAuth as jest.Mocked<typeof BiometricAuth>;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: '1', email: 'test@example.com', role: 'MEMBER' },
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await authService.login('test@example.com', 'password');

      expect(result.success).toBe(true);
      expect(result.data?.user.email).toBe('test@example.com');
      expect(mockSecureStorage.setItem).toHaveBeenCalledWith(
        'auth_token',
        'mock-jwt-token'
      );
    });

    it('should handle invalid credentials', async () => {
      const mockResponse = {
        success: false,
        error: 'Invalid credentials',
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await authService.login(
        'test@example.com',
        'wrongpassword'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should handle network errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await authService.login('test@example.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      mockSecureStorage.getItem.mockResolvedValue('old-refresh-token');

      const mockResponse = {
        success: true,
        data: {
          token: 'new-jwt-token',
          refreshToken: 'new-refresh-token',
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await authService.refreshToken();

      expect(result.success).toBe(true);
      expect(mockSecureStorage.setItem).toHaveBeenCalledWith(
        'auth_token',
        'new-jwt-token'
      );
      expect(mockSecureStorage.setItem).toHaveBeenCalledWith(
        'refresh_token',
        'new-refresh-token'
      );
    });

    it('should handle invalid refresh token', async () => {
      mockSecureStorage.getItem.mockResolvedValue('invalid-refresh-token');

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: jest
          .fn()
          .mockResolvedValue({
            success: false,
            error: 'Invalid refresh token',
          }),
      });

      const result = await authService.refreshToken();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid refresh token');
    });
  });

  describe('biometric authentication', () => {
    it('should enable biometric authentication', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(
        true
      );
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(
        true
      );
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await authService.enableBiometric('test@example.com');

      expect(result).toBe(true);
      expect(mockSecureStorage.setItem).toHaveBeenCalledWith(
        'biometric_enabled',
        'true'
      );
      expect(mockSecureStorage.setItem).toHaveBeenCalledWith(
        'biometric_email',
        'test@example.com'
      );
    });

    it('should handle biometric not available', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(
        false
      );

      const result = await authService.enableBiometric('test@example.com');

      expect(result).toBe(false);
    });

    it('should authenticate with biometrics', async () => {
      mockSecureStorage.getItem
        .mockResolvedValueOnce('true') // biometric_enabled
        .mockResolvedValueOnce('test@example.com') // biometric_email
        .mockResolvedValueOnce('stored-refresh-token'); // refresh_token

      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: true,
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            user: { id: '1', email: 'test@example.com' },
            token: 'new-token',
          },
        }),
      });

      const result = await authService.authenticateWithBiometric();

      expect(result.success).toBe(true);
      expect(result.data?.user.email).toBe('test@example.com');
    });
  });

  describe('offline authentication', () => {
    it('should handle offline login with cached credentials', async () => {
      mockSecureStorage.getItem
        .mockResolvedValueOnce('cached-email')
        .mockResolvedValueOnce('cached-password-hash');

      // Mock crypto for password verification
      global.crypto = {
        subtle: {
          digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
        },
      } as any;

      const result = await authService.loginOffline('cached-email', 'password');

      expect(result.success).toBe(true);
    });

    it('should reject offline login with wrong credentials', async () => {
      mockSecureStorage.getItem
        .mockResolvedValueOnce('cached-email')
        .mockResolvedValueOnce('different-hash');

      const result = await authService.loginOffline(
        'cached-email',
        'wrongpassword'
      );

      expect(result.success).toBe(false);
    });
  });
});
