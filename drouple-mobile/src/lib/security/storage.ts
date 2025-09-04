/**
 * Secure Storage Service
 * Handles encrypted storage of sensitive data
 */

import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';

// Encryption key for additional security layer
const ENCRYPTION_KEY = 'drouple_mobile_secure_key_v1';

export interface StorageOptions {
  encrypt?: boolean;
  requireAuthentication?: boolean;
}

export class SecureStorageService {
  private static instance: SecureStorageService;

  static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  /**
   * Store a value securely
   */
  async setItem(
    key: string,
    value: string,
    options: StorageOptions = {}
  ): Promise<void> {
    try {
      let valueToStore = value;

      // Encrypt value if requested
      if (options.encrypt !== false) {
        valueToStore = this.encrypt(value);
      }

      const storeOptions: SecureStore.SecureStoreOptions = {};

      // Require authentication for access if specified
      if (options.requireAuthentication) {
        storeOptions.requireAuthentication = true;
        storeOptions.authenticationPrompt =
          'Please verify your identity to access secure data';
      }

      await SecureStore.setItemAsync(key, valueToStore, storeOptions);
    } catch (error) {
      console.error(`Failed to store item with key ${key}:`, error);
      throw new Error('Failed to store secure data');
    }
  }

  /**
   * Retrieve a value securely
   */
  async getItem(
    key: string,
    options: StorageOptions = {}
  ): Promise<string | null> {
    try {
      const storeOptions: SecureStore.SecureStoreOptions = {};

      if (options.requireAuthentication) {
        storeOptions.requireAuthentication = true;
        storeOptions.authenticationPrompt =
          'Please verify your identity to access secure data';
      }

      const storedValue = await SecureStore.getItemAsync(key, storeOptions);

      if (!storedValue) {
        return null;
      }

      // Decrypt value if it was encrypted
      if (options.encrypt !== false) {
        return this.decrypt(storedValue);
      }

      return storedValue;
    } catch (error) {
      console.error(`Failed to retrieve item with key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete a stored value
   */
  async deleteItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Failed to delete item with key ${key}:`, error);
      throw new Error('Failed to delete secure data');
    }
  }

  /**
   * Check if a key exists in secure storage
   */
  async hasItem(key: string): Promise<boolean> {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value !== null;
    } catch (error) {
      console.error(`Failed to check item existence for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all stored data (use with caution)
   */
  async clear(): Promise<void> {
    try {
      // Note: SecureStore doesn't have a clear all method
      // This would need to be implemented by tracking keys
      console.warn('Clear all not implemented - delete items individually');
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
      throw new Error('Failed to clear secure storage');
    }
  }

  /**
   * Store user credentials securely
   */
  async storeCredentials(
    email: string,
    encryptedPassword: string
  ): Promise<void> {
    const credentials = JSON.stringify({ email, password: encryptedPassword });
    await this.setItem('user_credentials', credentials, {
      encrypt: true,
      requireAuthentication: true,
    });
  }

  /**
   * Retrieve user credentials
   */
  async getCredentials(): Promise<{ email: string; password: string } | null> {
    try {
      const credentialsJson = await this.getItem('user_credentials', {
        encrypt: true,
        requireAuthentication: true,
      });

      if (!credentialsJson) {
        return null;
      }

      return JSON.parse(credentialsJson);
    } catch (error) {
      console.error('Failed to retrieve credentials:', error);
      return null;
    }
  }

  /**
   * Delete stored credentials
   */
  async clearCredentials(): Promise<void> {
    await this.deleteItem('user_credentials');
  }

  /**
   * Store authentication token
   */
  async storeAuthToken(token: string): Promise<void> {
    await this.setItem('auth_token', token, { encrypt: true });
  }

  /**
   * Retrieve authentication token
   */
  async getAuthToken(): Promise<string | null> {
    return await this.getItem('auth_token', { encrypt: true });
  }

  /**
   * Clear authentication token
   */
  async clearAuthToken(): Promise<void> {
    await this.deleteItem('auth_token');
  }

  /**
   * Store refresh token
   */
  async storeRefreshToken(token: string): Promise<void> {
    await this.setItem('refresh_token', token, { encrypt: true });
  }

  /**
   * Retrieve refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    return await this.getItem('refresh_token', { encrypt: true });
  }

  /**
   * Clear refresh token
   */
  async clearRefreshToken(): Promise<void> {
    await this.deleteItem('refresh_token');
  }

  /**
   * Store user preferences
   */
  async storeUserPreferences(preferences: Record<string, any>): Promise<void> {
    const preferencesJson = JSON.stringify(preferences);
    await this.setItem('user_preferences', preferencesJson, { encrypt: true });
  }

  /**
   * Retrieve user preferences
   */
  async getUserPreferences(): Promise<Record<string, any> | null> {
    try {
      const preferencesJson = await this.getItem('user_preferences', {
        encrypt: true,
      });
      return preferencesJson ? JSON.parse(preferencesJson) : null;
    } catch (error) {
      console.error('Failed to retrieve user preferences:', error);
      return null;
    }
  }

  /**
   * Encrypt a string value
   */
  private encrypt(value: string): string {
    try {
      return CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt a string value
   */
  private decrypt(encryptedValue: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedValue, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}

// Export singleton instance
export const secureStore = SecureStorageService.getInstance();
