import Constants from 'expo-constants';

interface SecurityConfig {
  httpsOnly: boolean;
  certificatePinning: boolean;
  appSecret: string;
  apiBaseUrl: string;
  wsBaseUrl: string;
}

class SecurityConfigManager {
  private config: SecurityConfig;

  constructor() {
    this.config = this.loadSecurityConfig();
    this.validateConfig();
  }

  private loadSecurityConfig(): SecurityConfig {
    const extra = Constants.expoConfig?.extra || {};
    
    return {
      httpsOnly: extra.EXPO_PUBLIC_HTTPS_ONLY === 'true' || process.env.NODE_ENV === 'production',
      certificatePinning: extra.EXPO_PUBLIC_CERTIFICATE_PINNING === 'true',
      appSecret: extra.EXPO_PUBLIC_APP_SECRET || process.env.EXPO_PUBLIC_APP_SECRET || '',
      apiBaseUrl: extra.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL || '',
      wsBaseUrl: extra.EXPO_PUBLIC_WS_URL || process.env.EXPO_PUBLIC_WS_URL || '',
    };
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // Validate API URL
    if (!this.config.apiBaseUrl) {
      errors.push('API_BASE_URL is required');
    } else if (this.config.httpsOnly && !this.config.apiBaseUrl.startsWith('https://')) {
      errors.push('API_BASE_URL must use HTTPS in production');
    }

    // Validate WebSocket URL
    if (this.config.wsBaseUrl && this.config.httpsOnly && !this.config.wsBaseUrl.startsWith('wss://')) {
      errors.push('WS_BASE_URL must use WSS in production');
    }

    // Validate app secret
    if (!this.config.appSecret || this.config.appSecret === 'your-secure-app-secret-32-chars-minimum') {
      errors.push('APP_SECRET must be configured with a secure value');
    } else if (this.config.appSecret.length < 32) {
      errors.push('APP_SECRET must be at least 32 characters long');
    }

    if (errors.length > 0) {
      const errorMessage = `Security configuration errors:\n${errors.join('\n')}`;
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`PRODUCTION BUILD BLOCKED: ${errorMessage}`);
      } else {
        console.error(`[SECURITY WARNING] ${errorMessage}`);
      }
    }
  }

  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  isHttpsOnly(): boolean {
    return this.config.httpsOnly;
  }

  isCertificatePinningEnabled(): boolean {
    return this.config.certificatePinning;
  }

  getAppSecret(): string {
    return this.config.appSecret;
  }

  getApiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  getWsBaseUrl(): string {
    return this.config.wsBaseUrl;
  }

  /**
   * Generate device-specific encryption key
   */
  generateDeviceSpecificKey(): string {
    // In a real implementation, this would use device-specific entropy
    // from Keychain/Keystore, device fingerprinting, etc.
    const deviceSeed = this.config.appSecret;
    const timestamp = Date.now().toString();
    
    // Simple hash function for demo purposes
    // In production, use crypto.pbkdf2 or similar
    let hash = 0;
    const input = deviceSeed + timestamp;
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16).padStart(8, '0').repeat(4);
  }

  /**
   * Validate URL against security policy
   */
  validateUrl(url: string): boolean {
    if (!url) return false;
    
    try {
      const parsedUrl = new URL(url);
      
      if (this.config.httpsOnly) {
        return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'wss:';
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize data for logging (remove sensitive information)
   */
  sanitizeForLogging(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'auth', 'authorization',
      'cookie', 'session', 'credential', 'pin', 'ssn', 'social',
      'email', 'phone', 'address', 'firstName', 'lastName', 'name'
    ];

    const sanitized = { ...data };

    for (const key in sanitized) {
      const keyLower = key.toLowerCase();
      const isSensitive = sensitiveKeys.some(sensitiveKey => 
        keyLower.includes(sensitiveKey)
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeForLogging(sanitized[key]);
      }
    }

    return sanitized;
  }
}

export const securityConfig = new SecurityConfigManager();
export type { SecurityConfig };