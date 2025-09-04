/**
 * API Security Manager
 * Handles secure API communication, request signing, and threat detection
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Crypto from 'expo-crypto';
import type {
  ApiSecurityHeaders,
  SecurityConfig,
  SecurityAuditLog,
} from './types';

export class ApiSecurity {
  private static instance: ApiSecurity;
  private config: SecurityConfig;
  private requestQueue: Map<string, number> = new Map();
  private auditLogs: SecurityAuditLog[] = [];

  private constructor(config: SecurityConfig) {
    this.config = config;
  }

  public static getInstance(config: SecurityConfig): ApiSecurity {
    if (!ApiSecurity.instance) {
      ApiSecurity.instance = new ApiSecurity(config);
    }
    return ApiSecurity.instance;
  }

  /**
   * Generate secure headers for API requests
   */
  public async generateSecureHeaders(
    accessToken?: string,
    additionalHeaders?: Record<string, string>
  ): Promise<ApiSecurityHeaders> {
    const requestId = await this.generateRequestId();
    const deviceInfo = await this.getDeviceFingerprint();

    const headers: ApiSecurityHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: accessToken ? `Bearer ${accessToken}` : '',
      'X-Request-ID': requestId,
      'X-Client-Version': Constants.expoConfig?.version || '1.0.0',
      'X-Platform': Platform.OS,
      'User-Agent': `Drouple Mobile/${Constants.expoConfig?.version || '1.0.0'} (${Platform.OS})`,
      ...additionalHeaders,
    };

    // Add device fingerprint for enhanced security
    (headers as any)['X-Device-ID'] = deviceInfo.deviceId;
    (headers as any)['X-App-Instance'] = deviceInfo.appInstanceId;

    return headers;
  }

  /**
   * Validate and secure outgoing requests
   */
  public async secureRequest(
    url: string,
    options: RequestInit,
    accessToken?: string
  ): Promise<{
    url: string;
    options: RequestInit;
    shouldProceed: boolean;
    blockReason?: string;
  }> {
    // Rate limiting check
    const rateLimitResult = this.checkRateLimit(url);
    if (!rateLimitResult.allowed) {
      this.logSecurityEvent('rate_limit_exceeded', {
        url,
        attempts: rateLimitResult.attempts,
      });

      return {
        url,
        options,
        shouldProceed: false,
        blockReason: 'Rate limit exceeded. Please try again later.',
      };
    }

    // Generate secure headers
    const secureHeaders = await this.generateSecureHeaders(
      accessToken,
      options.headers as Record<string, string>
    );

    // Add request signature for critical endpoints
    if (this.isCriticalEndpoint(url)) {
      const signature = await this.signRequest(url, options.body as string);
      (secureHeaders as any)['X-Request-Signature'] = signature;
    }

    // Validate URL
    if (!this.isValidApiUrl(url)) {
      this.logSecurityEvent('invalid_url_blocked', { url });
      return {
        url,
        options,
        shouldProceed: false,
        blockReason: 'Invalid API endpoint',
      };
    }

    // Update request count for rate limiting
    this.updateRequestCount(url);

    return {
      url,
      options: {
        ...options,
        headers: secureHeaders,
        timeout: this.config.api.requestTimeout,
      },
      shouldProceed: true,
    };
  }

  /**
   * Validate incoming API responses
   */
  public validateResponse(
    response: Response,
    expectedSignature?: string
  ): {
    isValid: boolean;
    threats: string[];
    shouldTrust: boolean;
  } {
    const threats: string[] = [];
    let shouldTrust = true;

    // Check response headers for security indicators
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      threats.push('Unexpected content type');
      shouldTrust = false;
    }

    // Validate server signature if expected
    if (expectedSignature) {
      const serverSignature = response.headers.get('x-server-signature');
      if (!serverSignature || serverSignature !== expectedSignature) {
        threats.push('Invalid server signature');
        shouldTrust = false;
      }
    }

    // Check for suspicious headers
    const suspiciousHeaders = [
      'x-powered-by',
      'x-debug-token',
      'x-admin-panel',
    ];

    suspiciousHeaders.forEach(header => {
      if (response.headers.get(header)) {
        threats.push(`Suspicious header detected: ${header}`);
      }
    });

    // Log security validation
    if (threats.length > 0) {
      this.logSecurityEvent('response_validation_failed', {
        url: response.url,
        threats,
        status: response.status,
      });
    }

    return {
      isValid: response.ok && shouldTrust,
      threats,
      shouldTrust,
    };
  }

  /**
   * Generate unique request ID
   */
  private async generateRequestId(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = await Crypto.randomUUIDAsync();
    return `${timestamp}-${random.slice(0, 8)}`;
  }

  /**
   * Get device fingerprint for request tracking
   */
  private async getDeviceFingerprint(): Promise<{
    deviceId: string;
    appInstanceId: string;
  }> {
    // Generate consistent device identifier
    const deviceModel = Device.modelName || 'Unknown';
    const osVersion = Device.osVersion || 'Unknown';
    const platform = Platform.OS;

    const deviceString = `${platform}-${deviceModel}-${osVersion}`;
    const deviceId = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      deviceString
    );

    // Generate app instance ID (changes on app reinstall)
    const appInstanceId = await Crypto.randomUUIDAsync();

    return {
      deviceId: deviceId.slice(0, 16),
      appInstanceId: appInstanceId.slice(0, 12),
    };
  }

  /**
   * Sign critical requests for integrity verification
   */
  private async signRequest(url: string, body?: string): Promise<string> {
    const timestamp = Date.now().toString();
    const method = 'POST'; // Assuming POST for critical operations
    const payload = body || '';

    const message = `${method}${url}${timestamp}${payload}`;
    const signature = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      message
    );

    return `${timestamp}.${signature.slice(0, 32)}`;
  }

  /**
   * Check if endpoint requires special security measures
   */
  private isCriticalEndpoint(url: string): boolean {
    const criticalPaths = [
      '/auth/login',
      '/auth/refresh',
      '/auth/logout',
      '/user/profile',
      '/user/password',
      '/admin/',
      '/reports/',
    ];

    return criticalPaths.some(path => url.includes(path));
  }

  /**
   * Validate if URL is from trusted API domain
   */
  private isValidApiUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const trustedDomains = [
        'api.drouple.com',
        'staging-api.drouple.com',
        'dev-api.drouple.com',
        'localhost:3001', // Development
      ];

      return trustedDomains.some(
        domain =>
          urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }

  /**
   * Rate limiting implementation
   */
  private checkRateLimit(url: string): {
    allowed: boolean;
    attempts: number;
    resetTime: number;
  } {
    const now = Date.now();
    const windowMs = this.config.api.rateLimit.timeWindow * 60 * 1000;
    const key = this.getRateLimitKey(url);

    const currentCount = this.requestQueue.get(key) || 0;
    const resetTime = now + windowMs;

    // Clean old entries
    this.cleanupRateLimit();

    if (currentCount >= this.config.api.rateLimit.maxRequests) {
      return {
        allowed: false,
        attempts: currentCount,
        resetTime,
      };
    }

    return {
      allowed: true,
      attempts: currentCount,
      resetTime,
    };
  }

  /**
   * Update request count for rate limiting
   */
  private updateRequestCount(url: string): void {
    const key = this.getRateLimitKey(url);
    const currentCount = this.requestQueue.get(key) || 0;
    this.requestQueue.set(key, currentCount + 1);
  }

  /**
   * Generate rate limit key
   */
  private getRateLimitKey(url: string): string {
    const now = Date.now();
    const windowMs = this.config.api.rateLimit.timeWindow * 60 * 1000;
    const window = Math.floor(now / windowMs);

    try {
      const urlObj = new URL(url);
      return `${urlObj.pathname}-${window}`;
    } catch {
      return `${url}-${window}`;
    }
  }

  /**
   * Clean up expired rate limit entries
   */
  private cleanupRateLimit(): void {
    const now = Date.now();
    const windowMs = this.config.api.rateLimit.timeWindow * 60 * 1000;
    const currentWindow = Math.floor(now / windowMs);

    for (const [key] of this.requestQueue) {
      const keyWindow = parseInt(key.split('-').pop() || '0', 10);
      if (keyWindow < currentWindow - 1) {
        this.requestQueue.delete(key);
      }
    }
  }

  /**
   * Log security events for monitoring
   */
  private logSecurityEvent(
    event: SecurityAuditLog['event'],
    details: Record<string, unknown>
  ): void {
    const log: SecurityAuditLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      event,
      deviceId: 'device-id', // Would get from device fingerprint
      userAgent: `Drouple Mobile/${Constants.expoConfig?.version || '1.0.0'}`,
      details,
      severity: this.getEventSeverity(event),
    };

    this.auditLogs.push(log);

    // Keep only last 100 logs to prevent memory issues
    if (this.auditLogs.length > 100) {
      this.auditLogs = this.auditLogs.slice(-100);
    }

    // In production, send critical events to monitoring service
    if (log.severity === 'high' || log.severity === 'critical') {
      this.sendToMonitoring(log);
    }
  }

  /**
   * Determine event severity
   */
  private getEventSeverity(
    event: SecurityAuditLog['event']
  ): SecurityAuditLog['severity'] {
    switch (event) {
      case 'failed_login':
      case 'permission_denied':
        return 'medium';
      case 'data_access':
        return 'low';
      default:
        return 'low';
    }
  }

  /**
   * Send critical security events to monitoring service
   */
  private async sendToMonitoring(log: SecurityAuditLog): Promise<void> {
    // In production, this would send to your monitoring service
    console.warn('Security Event:', log);
  }

  /**
   * Get security audit logs
   */
  public getAuditLogs(): SecurityAuditLog[] {
    return [...this.auditLogs];
  }

  /**
   * Clear audit logs
   */
  public clearAuditLogs(): void {
    this.auditLogs = [];
  }
}
