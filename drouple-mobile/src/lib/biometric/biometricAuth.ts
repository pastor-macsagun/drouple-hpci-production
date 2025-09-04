/**
 * Biometric Authentication Service
 * Handles biometric authentication using expo-local-authentication
 * Provides fingerprint, face ID, and other biometric authentication methods
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import type { BiometricConfig } from '@/types/auth';
import { BiometricType } from '@/types/auth';

// Storage keys for biometric credentials
const BIOMETRIC_KEYS = {
  CREDENTIALS: 'biometric_credentials',
  ENABLED: 'biometric_enabled',
  SETUP_COMPLETED: 'biometric_setup_completed',
} as const;

export interface BiometricCredentials {
  email: string;
  encryptedToken: string;
  setupAt: string;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  credentials?: BiometricCredentials;
}

export class BiometricAuthService {
  /**
   * Check if biometric authentication is supported on this device
   */
  static async isSupported(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      return compatible;
    } catch (error) {
      console.error('Error checking biometric hardware:', error);
      return false;
    }
  }

  /**
   * Check if biometric credentials are enrolled on the device
   */
  static async isEnrolled(): Promise<boolean> {
    try {
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return enrolled;
    } catch (error) {
      console.error('Error checking biometric enrollment:', error);
      return false;
    }
  }

  /**
   * Get available biometric authentication types
   */
  static async getAvailableTypes(): Promise<BiometricType[]> {
    try {
      const types =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      return types.map(type => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return BiometricType.FINGERPRINT;
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return BiometricType.FACE_ID;
          case LocalAuthentication.AuthenticationType.IRIS:
            return BiometricType.IRIS;
          default:
            return BiometricType.FINGERPRINT; // Default fallback
        }
      });
    } catch (error) {
      console.error('Error getting biometric types:', error);
      return [];
    }
  }

  /**
   * Get biometric configuration for the device
   */
  static async getBiometricConfig(): Promise<BiometricConfig> {
    try {
      const [isSupported, isEnrolled, availableTypes] = await Promise.all([
        BiometricAuthService.isSupported(),
        BiometricAuthService.isEnrolled(),
        BiometricAuthService.getAvailableTypes(),
      ]);

      return {
        isSupported,
        isEnrolled,
        availableTypes,
      };
    } catch (error) {
      console.error('Error getting biometric config:', error);
      return {
        isSupported: false,
        isEnrolled: false,
        availableTypes: [],
      };
    }
  }

  /**
   * Setup biometric authentication by storing encrypted credentials
   */
  static async setupBiometric(
    email: string,
    accessToken: string
  ): Promise<BiometricAuthResult> {
    try {
      // Check if biometric is available
      const config = await BiometricAuthService.getBiometricConfig();
      if (!config.isSupported || !config.isEnrolled) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device',
        };
      }

      // Authenticate user before setup
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Setup biometric authentication',
        disableDeviceFallback: true,
        cancelLabel: 'Cancel',
      });

      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error || 'Biometric authentication failed',
        };
      }

      // Store encrypted credentials
      const credentials: BiometricCredentials = {
        email,
        encryptedToken: accessToken, // In production, this should be properly encrypted
        setupAt: new Date().toISOString(),
      };

      await SecureStore.setItemAsync(
        BIOMETRIC_KEYS.CREDENTIALS,
        JSON.stringify(credentials)
      );
      await SecureStore.setItemAsync(BIOMETRIC_KEYS.ENABLED, 'true');
      await SecureStore.setItemAsync(BIOMETRIC_KEYS.SETUP_COMPLETED, 'true');

      return {
        success: true,
        credentials,
      };
    } catch (error) {
      console.error('Biometric setup error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to setup biometric authentication',
      };
    }
  }

  /**
   * Authenticate using biometric and retrieve stored credentials
   */
  static async authenticateWithBiometric(): Promise<BiometricAuthResult> {
    try {
      // Check if biometric is setup
      const isSetup = await BiometricAuthService.isBiometricSetup();
      if (!isSetup) {
        return {
          success: false,
          error: 'Biometric authentication is not setup',
        };
      }

      // Authenticate user
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate with biometric',
        disableDeviceFallback: false, // Allow fallback to PIN/password
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use PIN',
      });

      if (!authResult.success) {
        let error = 'Authentication failed';

        if (authResult.error === 'user_cancel') {
          error = 'Authentication cancelled by user';
        } else if (authResult.error === 'user_fallback') {
          error = 'User chose to use fallback authentication';
        } else if (authResult.error === 'system_cancel') {
          error = 'Authentication cancelled by system';
        } else if (authResult.error === 'authentication_failed') {
          error = 'Authentication failed - too many attempts';
        }

        return {
          success: false,
          error,
        };
      }

      // Retrieve stored credentials
      const credentialsString = await SecureStore.getItemAsync(
        BIOMETRIC_KEYS.CREDENTIALS
      );
      if (!credentialsString) {
        return {
          success: false,
          error: 'No biometric credentials found',
        };
      }

      const credentials: BiometricCredentials = JSON.parse(credentialsString);

      return {
        success: true,
        credentials,
      };
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Biometric authentication failed',
      };
    }
  }

  /**
   * Check if biometric authentication is setup
   */
  static async isBiometricSetup(): Promise<boolean> {
    try {
      const [enabled, setupCompleted] = await Promise.all([
        SecureStore.getItemAsync(BIOMETRIC_KEYS.ENABLED),
        SecureStore.getItemAsync(BIOMETRIC_KEYS.SETUP_COMPLETED),
      ]);

      return enabled === 'true' && setupCompleted === 'true';
    } catch (error) {
      console.error('Error checking biometric setup:', error);
      return false;
    }
  }

  /**
   * Disable biometric authentication
   */
  static async disableBiometric(): Promise<boolean> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(BIOMETRIC_KEYS.CREDENTIALS),
        SecureStore.deleteItemAsync(BIOMETRIC_KEYS.ENABLED),
        SecureStore.deleteItemAsync(BIOMETRIC_KEYS.SETUP_COMPLETED),
      ]);

      return true;
    } catch (error) {
      console.error('Error disabling biometric:', error);
      return false;
    }
  }

  /**
   * Get user-friendly biometric type name
   */
  static getBiometricTypeName(types: BiometricType[]): string {
    if (types.includes(BiometricType.FACE_ID)) {
      return 'Face ID';
    } else if (types.includes(BiometricType.TOUCH_ID)) {
      return 'Touch ID';
    } else if (types.includes(BiometricType.FINGERPRINT)) {
      return 'Fingerprint';
    } else if (types.includes(BiometricType.IRIS)) {
      return 'Iris';
    } else {
      return 'Biometric';
    }
  }

  /**
   * Get biometric icon name for the available type
   */
  static getBiometricIconName(types: BiometricType[]): string {
    if (types.includes(BiometricType.FACE_ID)) {
      return 'face-recognition';
    } else if (types.includes(BiometricType.TOUCH_ID)) {
      return 'fingerprint';
    } else if (types.includes(BiometricType.FINGERPRINT)) {
      return 'fingerprint';
    } else if (types.includes(BiometricType.IRIS)) {
      return 'eye';
    } else {
      return 'security';
    }
  }
}

export default BiometricAuthService;
