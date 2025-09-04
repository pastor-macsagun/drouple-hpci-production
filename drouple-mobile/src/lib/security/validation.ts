/**
 * Security Validation & Input Sanitization
 * Comprehensive security measures for user inputs and data handling
 */

import { z } from 'zod';
import CryptoJS from 'crypto-js';
import * as SecureStore from 'expo-secure-store';
import { APP_CONFIG } from '../../config/app';

// Security constants
const SENSITIVE_DATA_PATTERNS = [
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card numbers
  /\b\d{3}[\s-]?\d{2}[\s-]?\d{4}\b/, // SSN
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
  /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/, // Phone numbers
  /(?:bearer\s+|token\s+)?[a-zA-Z0-9\-_.~+/]+=*$/i, // Potential tokens
];

const SQL_INJECTION_PATTERNS = [
  /('|(\\')|(;)|(\\)|(--|#|\*\/|\*|\/\*))/i,
  /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
  /(script|javascript|vbscript|onload|onerror|onclick)/i,
];

const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
];

// Input validation schemas
export const secureSchemas = {
  email: z.string().email().max(255).transform(val => val.toLowerCase().trim()),
  
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in name')
    .transform(val => val.trim()),
    
  phone: z.string()
    .regex(/^\+?[\d\s()-]+$/, 'Invalid phone number format')
    .max(20, 'Phone number too long')
    .transform(val => val.replace(/[^\d+]/g, '')),
    
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number, and special character'),
           
  textContent: z.string()
    .max(2000, 'Text content too long')
    .transform(val => sanitizeHtml(val)),
    
  url: z.string()
    .url('Invalid URL format')
    .max(500, 'URL too long')
    .refine(val => isSecureUrl(val), 'URL must use HTTPS'),
};

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove script tags and dangerous attributes
  XSS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Encode HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized.trim();
}

/**
 * Validate input against SQL injection patterns
 */
export function validateSqlInjection(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return true;
  }

  return !SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Check if input contains sensitive data patterns
 */
export function containsSensitiveData(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  return SENSITIVE_DATA_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Validate URL security
 */
export function isSecureUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // Only allow HTTPS in production
    if (APP_CONFIG.isProduction && parsed.protocol !== 'https:') {
      return false;
    }
    
    // Block localhost/private IPs in production
    if (APP_CONFIG.isProduction) {
      const hostname = parsed.hostname;
      if (
        hostname === 'localhost' ||
        hostname.startsWith('127.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')
      ) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Secure data encryption for sensitive storage
 */
export class SecureStorage {
  private static readonly ENCRYPTION_KEY = 'drouple-mobile-secure-key';

  /**
   * Encrypt sensitive data before storage
   */
  static encrypt(data: string): string {
    try {
      return CryptoJS.AES.encrypt(data, this.ENCRYPTION_KEY).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  /**
   * Decrypt sensitive data after retrieval
   */
  static decrypt(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Decryption failed');
      }
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  /**
   * Store encrypted sensitive data
   */
  static async storeSecure(key: string, value: string): Promise<void> {
    try {
      const encrypted = this.encrypt(value);
      await SecureStore.setItemAsync(key, encrypted);
    } catch (error) {
      console.error('Secure store failed:', error);
      throw new Error('Failed to store sensitive data');
    }
  }

  /**
   * Retrieve and decrypt sensitive data
   */
  static async getSecure(key: string): Promise<string | null> {
    try {
      const encrypted = await SecureStore.getItemAsync(key);
      if (!encrypted) {
        return null;
      }
      
      return this.decrypt(encrypted);
    } catch (error) {
      console.error('Secure retrieve failed:', error);
      return null;
    }
  }

  /**
   * Delete sensitive data
   */
  static async deleteSecure(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Secure delete failed:', error);
    }
  }
}

/**
 * Rate limiting for security-critical operations
 */
export class SecurityRateLimit {
  private static attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  /**
   * Check if operation is allowed within rate limits
   */
  static checkLimit(
    operation: string, 
    maxAttempts: number = 5, 
    windowMs: number = 15 * 60 * 1000 // 15 minutes
  ): boolean {
    const now = Date.now();
    const key = operation;
    const record = this.attempts.get(key);
    
    if (!record || now > record.resetTime) {
      // First attempt or window expired
      this.attempts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (record.count >= maxAttempts) {
      return false;
    }
    
    // Increment attempt count
    record.count++;
    this.attempts.set(key, record);
    return true;
  }
  
  /**
   * Reset rate limit for operation
   */
  static resetLimit(operation: string): void {
    this.attempts.delete(operation);
  }
  
  /**
   * Get remaining attempts
   */
  static getRemainingAttempts(operation: string, maxAttempts: number = 5): number {
    const record = this.attempts.get(operation);
    if (!record || Date.now() > record.resetTime) {
      return maxAttempts;
    }
    
    return Math.max(0, maxAttempts - record.count);
  }
}

/**
 * Input validation with security checks
 */
export function validateInput(input: any, schema: z.ZodSchema): {
  success: boolean;
  data?: any;
  error?: string;
} {
  try {
    // Check for SQL injection
    if (typeof input === 'string' && !validateSqlInjection(input)) {
      return { success: false, error: 'Invalid input detected' };
    }
    
    // Check for sensitive data in logs/errors
    if (typeof input === 'string' && containsSensitiveData(input)) {
      console.warn('Sensitive data detected in input validation');
    }
    
    // Validate with schema
    const result = schema.safeParse(input);
    if (!result.success) {
      const errorMessage = result.error.errors.map(e => e.message).join(', ');
      return { success: false, error: errorMessage };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Input validation error:', error);
    return { success: false, error: 'Validation failed' };
  }
}

/**
 * Secure logging that filters sensitive data
 */
export class SecureLogger {
  private static readonly REDACTED = '[REDACTED]';
  
  /**
   * Log with sensitive data filtering
   */
  static log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!APP_CONFIG.isDevelopment && level === 'info') {
      return; // Only log info in development
    }
    
    const sanitizedMessage = this.sanitizeLogMessage(message);
    const sanitizedData = data ? this.sanitizeLogData(data) : undefined;
    
    switch (level) {
      case 'info':
        console.log(sanitizedMessage, sanitizedData);
        break;
      case 'warn':
        console.warn(sanitizedMessage, sanitizedData);
        break;
      case 'error':
        console.error(sanitizedMessage, sanitizedData);
        break;
    }
  }
  
  /**
   * Sanitize log message
   */
  private static sanitizeLogMessage(message: string): string {
    let sanitized = message;
    
    SENSITIVE_DATA_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, this.REDACTED);
    });
    
    return sanitized;
  }
  
  /**
   * Sanitize log data object
   */
  private static sanitizeLogData(data: any): any {
    if (typeof data === 'string') {
      return this.sanitizeLogMessage(data);
    }
    
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    const sanitized: any = Array.isArray(data) ? [] : {};
    
    for (const [key, value] of Object.entries(data)) {
      // Redact sensitive keys
      const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
        sanitized[key] = this.REDACTED;
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeLogData(value);
      } else if (typeof value === 'string') {
        sanitized[key] = this.sanitizeLogMessage(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  static info(message: string, data?: any) {
    this.log('info', message, data);
  }
  
  static warn(message: string, data?: any) {
    this.log('warn', message, data);
  }
  
  static error(message: string, data?: any) {
    this.log('error', message, data);
  }
}

export default {
  secureSchemas,
  sanitizeHtml,
  validateSqlInjection,
  containsSensitiveData,
  isSecureUrl,
  SecureStorage,
  SecurityRateLimit,
  validateInput,
  SecureLogger,
};