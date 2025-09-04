/**
 * Secure Storage Manager
 * Handles encrypted storage of sensitive data using expo-secure-store
 */

import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import type { SecureStorageItem, SecurityConfig } from './types';

export class SecureStorage {
  private static instance: SecureStorage;
  private config: SecurityConfig;
  private encryptionKey: string;

  private constructor(config: SecurityConfig) {
    this.config = config;
    this.encryptionKey = this.generateEncryptionKey();
  }

  public static getInstance(config: SecurityConfig): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage(config);
    }
    return SecureStorage.instance;
  }

  /**
   * Store sensitive data securely
   */
  public async setItem(
    key: string,
    value: string,
    options?: {
      encrypt?: boolean;
      expiresIn?: number; // minutes
    }
  ): Promise<void> {
    try {
      const shouldEncrypt = options?.encrypt ?? true;
      const expiresAt = options?.expiresIn
        ? new Date(Date.now() + options.expiresIn * 60 * 1000)
        : undefined;

      const item: SecureStorageItem = {
        key,
        value: shouldEncrypt ? this.encrypt(value) : value,
        encrypted: shouldEncrypt,
        expiresAt,
      };

      const serializedItem = JSON.stringify(item);

      if (Platform.OS === 'web') {
        // Fallback for web development
        localStorage.setItem(`secure_${key}`, serializedItem);
      } else {
        await SecureStore.setItemAsync(key, serializedItem, {
          requireAuthentication: true,
          authenticationPrompt: 'Authenticate to access secure data',
        });
      }
    } catch (error) {
      console.error('SecureStorage.setItem error:', error);
      throw new Error(`Failed to store secure item: ${key}`);
    }
  }

  /**
   * Retrieve sensitive data securely
   */
  public async getItem(key: string): Promise<string | null> {
    try {
      let serializedItem: string | null;

      if (Platform.OS === 'web') {
        // Fallback for web development
        serializedItem = localStorage.getItem(`secure_${key}`);
      } else {
        serializedItem = await SecureStore.getItemAsync(key, {
          requireAuthentication: true,
          authenticationPrompt: 'Authenticate to access secure data',
        });
      }

      if (!serializedItem) {
        return null;
      }

      const item: SecureStorageItem = JSON.parse(serializedItem);

      // Check expiration
      if (item.expiresAt && new Date() > item.expiresAt) {
        await this.removeItem(key);
        return null;
      }

      return item.encrypted ? this.decrypt(item.value) : item.value;
    } catch (error) {
      console.error('SecureStorage.getItem error:', error);
      return null;
    }
  }

  /**
   * Remove sensitive data
   */
  public async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(`secure_${key}`);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('SecureStorage.removeItem error:', error);
    }
  }

  /**
   * Store authentication tokens securely
   */
  public async setAuthTokens(tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }): Promise<void> {
    await Promise.all([
      this.setItem('access_token', tokens.accessToken, {
        encrypt: true,
        expiresIn: tokens.expiresIn,
      }),
      this.setItem('refresh_token', tokens.refreshToken, {
        encrypt: true,
        expiresIn: tokens.expiresIn * 2, // Refresh token lives longer
      }),
    ]);
  }

  /**
   * Retrieve authentication tokens
   */
  public async getAuthTokens(): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
  }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.getItem('access_token'),
      this.getItem('refresh_token'),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Clear all authentication tokens
   */
  public async clearAuthTokens(): Promise<void> {
    await Promise.all([
      this.removeItem('access_token'),
      this.removeItem('refresh_token'),
    ]);
  }

  /**
   * Store user credentials for biometric authentication
   */
  public async setBiometricCredentials(credentials: {
    email: string;
    encryptedPassword: string;
  }): Promise<void> {
    await this.setItem('biometric_credentials', JSON.stringify(credentials), {
      encrypt: true,
    });
  }

  /**
   * Retrieve user credentials for biometric authentication
   */
  public async getBiometricCredentials(): Promise<{
    email: string;
    encryptedPassword: string;
  } | null> {
    const credentials = await this.getItem('biometric_credentials');
    return credentials ? JSON.parse(credentials) : null;
  }

  /**
   * Clear all stored data (logout/reset)
   */
  public async clearAll(): Promise<void> {
    const keys = [
      'access_token',
      'refresh_token',
      'biometric_credentials',
      'user_preferences',
      'app_settings',
    ];

    await Promise.all(keys.map(key => this.removeItem(key)));
  }

  /**
   * Generate encryption key from device-specific data
   */
  private generateEncryptionKey(): string {
    // In production, this should use device keychain or secure hardware
    const deviceId = Platform.OS === 'web' ? 'web-device' : 'mobile-device';
    const appSecret = 'drouple-mobile-2025'; // Should be from secure config

    return CryptoJS.SHA256(`${deviceId}-${appSecret}`).toString();
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(text: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(
        text,
        this.encryptionKey
      ).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedText: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedText, this.encryptionKey);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Check if key exists in secure storage
   */
  public async hasItem(key: string): Promise<boolean> {
    try {
      const item = await this.getItem(key);
      return item !== null;
    } catch {
      return false;
    }
  }

  /**
   * Store app settings with expiration
   */
  public async setAppSettings(
    settings: Record<string, unknown>
  ): Promise<void> {
    await this.setItem('app_settings', JSON.stringify(settings), {
      encrypt: false,
      expiresIn: 7 * 24 * 60, // 7 days
    });
  }

  /**
   * Retrieve app settings
   */
  public async getAppSettings(): Promise<Record<string, unknown> | null> {
    const settings = await this.getItem('app_settings');
    return settings ? JSON.parse(settings) : null;
  }
}
