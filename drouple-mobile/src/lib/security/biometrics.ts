/**
 * Biometric Authentication Service
 * Handles biometric login and security features
 */

import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';
import { secureStore } from './storage';

export interface BiometricConfig {
  enabled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  isEnrolled: boolean;
  isAvailable: boolean;
}

export class BiometricService {
  private static instance: BiometricService;
  private config: BiometricConfig | null = null;

  static getInstance(): BiometricService {
    if (!BiometricService.instance) {
      BiometricService.instance = new BiometricService();
    }
    return BiometricService.instance;
  }

  /**
   * Initialize biometric authentication
   */
  async initialize(): Promise<BiometricConfig> {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const enabled = await this.isBiometricEnabled();

      this.config = {
        enabled,
        supportedTypes,
        isEnrolled,
        isAvailable,
      };

      return this.config;
    } catch (error) {
      console.error('Failed to initialize biometrics:', error);
      throw new Error('Biometric initialization failed');
    }
  }

  /**
   * Check if biometric authentication is available and enrolled
   */
  async isAvailable(): Promise<boolean> {
    if (!this.config) {
      await this.initialize();
    }
    return (this.config?.isAvailable && this.config?.isEnrolled) || false;
  }

  /**
   * Check if biometric authentication is enabled by user
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await secureStore.getItem('biometric_enabled');
      return enabled === 'true';
    } catch (error) {
      console.error('Failed to check biometric status:', error);
      return false;
    }
  }

  /**
   * Enable or disable biometric authentication
   */
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      await secureStore.setItem('biometric_enabled', enabled.toString());
      if (this.config) {
        this.config.enabled = enabled;
      }
    } catch (error) {
      console.error('Failed to set biometric status:', error);
      throw new Error('Failed to update biometric settings');
    }
  }

  /**
   * Authenticate user with biometrics
   */
  async authenticate(reason?: string): Promise<boolean> {
    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        throw new Error('Biometric authentication not available');
      }

      const enabled = await this.isBiometricEnabled();
      if (!enabled) {
        throw new Error('Biometric authentication not enabled');
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || 'Please verify your identity',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        return true;
      } else {
        console.log('Biometric authentication failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      throw error;
    }
  }

  /**
   * Show biometric authentication prompt with user-friendly error handling
   */
  async promptAuthentication(
    reason: string = 'Please verify your identity',
    onSuccess: () => void,
    onError?: (error: string) => void,
    onCancel?: () => void
  ): Promise<void> {
    try {
      const success = await this.authenticate(reason);
      if (success) {
        onSuccess();
      } else {
        onCancel?.();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Biometric authentication failed';

      if (errorMessage.includes('not available')) {
        Alert.alert(
          'Biometric Unavailable',
          'Biometric authentication is not available on this device.',
          [{ text: 'OK' }]
        );
      } else if (errorMessage.includes('not enabled')) {
        Alert.alert(
          'Biometric Disabled',
          'Please enable biometric authentication in settings.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Authentication Error', errorMessage, [{ text: 'OK' }]);
      }

      onError?.(errorMessage);
    }
  }

  /**
   * Get supported biometric types as user-friendly strings
   */
  getSupportedBiometricTypes(): string[] {
    if (!this.config) {
      return [];
    }

    return this.config.supportedTypes.map(type => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return 'Fingerprint';
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return 'Face ID';
        case LocalAuthentication.AuthenticationType.IRIS:
          return 'Iris';
        default:
          return 'Biometric';
      }
    });
  }

  /**
   * Get the primary biometric type icon name
   */
  getPrimaryBiometricIcon(): string {
    if (!this.config || this.config.supportedTypes.length === 0) {
      return 'fingerprint';
    }

    const primaryType = this.config.supportedTypes[0];
    switch (primaryType) {
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return 'face-recognition';
      case LocalAuthentication.AuthenticationType.IRIS:
        return 'eye';
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
      default:
        return 'fingerprint';
    }
  }

  /**
   * Reset biometric settings
   */
  async reset(): Promise<void> {
    try {
      await secureStore.deleteItem('biometric_enabled');
      this.config = null;
    } catch (error) {
      console.error('Failed to reset biometric settings:', error);
      throw new Error('Failed to reset biometric settings');
    }
  }
}

// Export singleton instance
export const biometricService = BiometricService.getInstance();
