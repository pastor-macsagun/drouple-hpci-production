/**
 * Biometric Authentication Manager
 * Handles Face ID, Touch ID, and fingerprint authentication
 */

import * as LocalAuthentication from 'expo-local-authentication';
import { Platform, Alert } from 'react-native';
import type { BiometricAuthResult, SecurityConfig } from './types';

export class BiometricAuth {
  private static instance: BiometricAuth;
  private config: SecurityConfig;
  private lastAuthTime: number = 0;

  private constructor(config: SecurityConfig) {
    this.config = config;
  }

  public static getInstance(config: SecurityConfig): BiometricAuth {
    if (!BiometricAuth.instance) {
      BiometricAuth.instance = new BiometricAuth(config);
    }
    return BiometricAuth.instance;
  }

  /**
   * Check if biometric authentication is available on device
   */
  public async isAvailable(): Promise<{
    isAvailable: boolean;
    biometryType: LocalAuthentication.AuthenticationType | null;
    error?: string;
  }> {
    try {
      // Check if hardware is available
      const isHardwareAvailable = await LocalAuthentication.hasHardwareAsync();
      if (!isHardwareAvailable) {
        return {
          isAvailable: false,
          biometryType: null,
          error: 'Biometric hardware not available',
        };
      }

      // Check if biometric data is enrolled
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return {
          isAvailable: false,
          biometryType: null,
          error: 'No biometric data enrolled',
        };
      }

      // Get available authentication types
      const authTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();
      const biometryType = authTypes.length > 0 ? authTypes[0] : null;

      return {
        isAvailable: true,
        biometryType,
      };
    } catch (error) {
      return {
        isAvailable: false,
        biometryType: null,
        error: `Biometric check failed: ${error}`,
      };
    }
  }

  /**
   * Authenticate user with biometrics
   */
  public async authenticate(options?: {
    promptMessage?: string;
    cancelLabel?: string;
    disableDeviceFallback?: boolean;
  }): Promise<BiometricAuthResult> {
    try {
      // Check if biometrics are available
      const availability = await this.isAvailable();
      if (!availability.isAvailable) {
        return {
          success: false,
          error: availability.error,
        };
      }

      // Check if authentication is still valid (within timeout)
      if (this.isAuthenticationValid()) {
        return {
          success: true,
          biometryType: this.getBiometryTypeName(availability.biometryType),
        };
      }

      // Perform biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage:
          options?.promptMessage || 'Authenticate to access Drouple',
        cancelLabel: options?.cancelLabel || 'Cancel',
        disableDeviceFallback: options?.disableDeviceFallback ?? false,
        requireConfirmation: true,
      });

      if (result.success) {
        this.lastAuthTime = Date.now();
        return {
          success: true,
          biometryType: this.getBiometryTypeName(availability.biometryType),
        };
      } else {
        return {
          success: false,
          error: result.error || 'Authentication failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Biometric authentication error: ${error}`,
      };
    }
  }

  /**
   * Quick authentication for app unlock
   */
  public async quickAuth(): Promise<BiometricAuthResult> {
    return this.authenticate({
      promptMessage: 'Unlock Drouple',
      cancelLabel: 'Use Password',
      disableDeviceFallback: false,
    });
  }

  /**
   * Authenticate for sensitive operations
   */
  public async sensitiveAuth(): Promise<BiometricAuthResult> {
    return this.authenticate({
      promptMessage: 'Authenticate for sensitive operation',
      cancelLabel: 'Cancel',
      disableDeviceFallback: true,
    });
  }

  /**
   * Check if current authentication is still valid
   */
  public isAuthenticationValid(): boolean {
    if (!this.config.biometric.enabled) {
      return false;
    }

    const timeoutMs = this.config.biometric.invalidationTimeout * 60 * 1000;
    const now = Date.now();

    return now - this.lastAuthTime < timeoutMs;
  }

  /**
   * Invalidate current authentication
   */
  public invalidateAuthentication(): void {
    this.lastAuthTime = 0;
  }

  /**
   * Setup biometric authentication (first time)
   */
  public async setupBiometricAuth(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const availability = await this.isAvailable();

      if (!availability.isAvailable) {
        let message =
          'Biometric authentication is not available on this device.';

        if (availability.error?.includes('not enrolled')) {
          message =
            Platform.OS === 'ios'
              ? 'Please set up Face ID or Touch ID in Settings to use biometric authentication.'
              : 'Please set up fingerprint authentication in Settings to use this feature.';
        }

        return { success: false, message };
      }

      // Test authentication
      const testAuth = await this.authenticate({
        promptMessage: 'Set up biometric authentication for Drouple',
      });

      if (testAuth.success) {
        return {
          success: true,
          message: `${testAuth.biometryType} authentication has been set up successfully!`,
        };
      } else {
        return {
          success: false,
          message:
            testAuth.error || 'Failed to set up biometric authentication',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Setup failed: ${error}`,
      };
    }
  }

  /**
   * Show biometric setup prompt
   */
  public showBiometricSetupPrompt(): void {
    const biometricName =
      Platform.OS === 'ios' ? 'Face ID/Touch ID' : 'Fingerprint';

    Alert.alert(
      'Enable Biometric Authentication',
      `Would you like to use ${biometricName} to quickly and securely access Drouple?`,
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Set Up',
          onPress: async () => {
            const result = await this.setupBiometricAuth();
            Alert.alert(
              result.success ? 'Success' : 'Setup Failed',
              result.message
            );
          },
        },
      ]
    );
  }

  /**
   * Get user-friendly biometry type name
   */
  private getBiometryTypeName(
    biometryType: LocalAuthentication.AuthenticationType | null
  ): BiometricAuthResult['biometryType'] {
    if (!biometryType) return 'None';

    switch (biometryType) {
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return 'FaceID';
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return Platform.OS === 'ios' ? 'TouchID' : 'Fingerprint';
      default:
        return 'None';
    }
  }

  /**
   * Get security level of current biometric method
   */
  public async getSecurityLevel(): Promise<{
    level: 'none' | 'low' | 'medium' | 'high';
    details: string;
  }> {
    const availability = await this.isAvailable();

    if (!availability.isAvailable) {
      return {
        level: 'none',
        details: 'No biometric authentication available',
      };
    }

    // Face recognition typically considered higher security than fingerprint
    switch (availability.biometryType) {
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return { level: 'high', details: 'Face ID provides high security' };
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return {
          level: 'medium',
          details: 'Fingerprint provides medium security',
        };
      default:
        return { level: 'low', details: 'Basic biometric authentication' };
    }
  }

  /**
   * Handle biometric authentication errors gracefully
   */
  public handleBiometricError(error: string): {
    shouldRetry: boolean;
    userMessage: string;
    fallbackToPassword: boolean;
  } {
    const errorLower = error.toLowerCase();

    if (errorLower.includes('user cancel')) {
      return {
        shouldRetry: false,
        userMessage: 'Authentication cancelled',
        fallbackToPassword: this.config.biometric.fallbackToPassword,
      };
    }

    if (errorLower.includes('lockout') || errorLower.includes('too many')) {
      return {
        shouldRetry: false,
        userMessage: 'Too many failed attempts. Please try again later.',
        fallbackToPassword: true,
      };
    }

    if (
      errorLower.includes('not enrolled') ||
      errorLower.includes('not available')
    ) {
      return {
        shouldRetry: false,
        userMessage: 'Biometric authentication is not set up on this device.',
        fallbackToPassword: true,
      };
    }

    return {
      shouldRetry: true,
      userMessage: 'Authentication failed. Please try again.',
      fallbackToPassword: this.config.biometric.fallbackToPassword,
    };
  }
}
