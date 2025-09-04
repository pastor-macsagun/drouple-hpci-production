/**
 * Sentry Monitoring Service
 * Provides error tracking and performance monitoring
 * Filters sensitive data and provides business context
 */

import * as Sentry from '@sentry/react-native';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { useAuthStore } from '@/lib/store/authStore';
import { NetworkService } from '@/lib/net/networkService';

export interface ErrorContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  churchId?: string;
  feature?: string;
  action?: string;
  screen?: string;
  networkStatus?: string;
  additionalData?: Record<string, any>;
}

export interface PerformanceTransaction {
  name: string;
  op: string;
  description?: string;
  tags?: Record<string, string>;
  data?: Record<string, any>;
}

export class SentryService {
  private static isInitialized = false;
  private static dsn = 'https://your-sentry-dsn@sentry.io/project-id'; // Replace with actual DSN

  /**
   * Initialize Sentry monitoring
   */
  static initialize(): void {
    try {
      Sentry.init({
        dsn: this.dsn,
        environment: __DEV__ ? 'development' : 'production',
        debug: __DEV__,

        // Performance monitoring
        tracesSampleRate: __DEV__ ? 1.0 : 0.2,
        enableAutoSessionTracking: true,
        sessionTrackingIntervalMillis: 30000,

        // Native crash reporting
        enableNativeCrashHandling: true,
        enableNativeNagger: false,

        // Before send hook to filter sensitive data
        beforeSend: (event, hint) => {
          return this.filterSensitiveData(event, hint);
        },

        // Integration configuration
        integrations: [
          new Sentry.ReactNativeTracing({
            // Disable automatic instrumentation that might capture sensitive data
            tracePropagationTargets: [],

            // Custom routing instrumentation
            routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
          }),
        ],

        // Release and distribution info
        release: '1.0.0', // Should match your app version
        dist: '1',

        // Additional options
        maxBreadcrumbs: 50,
        attachStacktrace: true,
        enableAutoPerformanceReporting: false, // We'll handle this manually for better control
      });

      // Set initial device context
      this.setDeviceContext();

      this.isInitialized = true;
      console.log('Sentry monitoring initialized');
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  /**
   * Set device and app context
   */
  static setDeviceContext(): void {
    try {
      Sentry.setContext('device', {
        name: Device.deviceName || 'Unknown Device',
        model: Device.modelName || 'Unknown Model',
        os: Platform.OS,
        osVersion: Device.osVersion || 'Unknown Version',
        brand: Device.brand || 'Unknown Brand',
        manufacturer: Device.manufacturer || 'Unknown Manufacturer',
      });

      Sentry.setContext('app', {
        version: '1.0.0',
        build: '1',
        environment: __DEV__ ? 'development' : 'production',
      });
    } catch (error) {
      console.error('Error setting device context:', error);
    }
  }

  /**
   * Set user context (call this after authentication)
   */
  static setUserContext(user?: {
    id: string;
    email: string;
    roles: string[];
    tenantId: string;
  }): void {
    try {
      if (user) {
        // Set user context with minimal sensitive data
        Sentry.setUser({
          id: user.id,
          email: this.maskEmail(user.email),
          // Don't include full email or other PII
        });

        Sentry.setContext('user_business', {
          role: user.roles[0] || 'unknown', // Primary role only
          churchId: user.tenantId,
          hasMultipleRoles: user.roles.length > 1,
        });

        Sentry.setTag('user.role', user.roles[0] || 'unknown');
        Sentry.setTag('user.church', user.tenantId);
      } else {
        // Clear user context
        Sentry.setUser(null);
        Sentry.setContext('user_business', null);
      }
    } catch (error) {
      console.error('Error setting user context:', error);
    }
  }

  /**
   * Capture error with business context
   */
  static captureError(
    error: Error,
    context?: ErrorContext,
    level: Sentry.SeverityLevel = 'error'
  ): void {
    try {
      if (!this.isInitialized) {
        console.warn(
          'Sentry not initialized, logging error to console:',
          error
        );
        return;
      }

      // Set scope with context
      Sentry.withScope(scope => {
        scope.setLevel(level);

        // Add business context
        if (context) {
          if (context.feature) {
            scope.setTag('feature', context.feature);
          }

          if (context.action) {
            scope.setTag('action', context.action);
          }

          if (context.screen) {
            scope.setTag('screen', context.screen);
          }

          if (context.networkStatus) {
            scope.setTag('network', context.networkStatus);
          }

          // Set context data (will be filtered for sensitive info)
          scope.setContext('business_context', {
            feature: context.feature,
            action: context.action,
            screen: context.screen,
            ...context.additionalData,
          });
        }

        // Add current network status
        NetworkService.getNetworkState()
          .then(networkState => {
            scope.setContext('network', {
              isConnected: networkState.isConnected,
              type: networkState.type,
              isWiFi: networkState.isWiFi,
            });
          })
          .catch(() => {
            // Ignore network context errors
          });

        // Capture the error
        Sentry.captureException(error);
      });
    } catch (captureError) {
      console.error('Error capturing exception to Sentry:', captureError);
      console.error('Original error:', error);
    }
  }

  /**
   * Capture message with context
   */
  static captureMessage(
    message: string,
    context?: ErrorContext,
    level: Sentry.SeverityLevel = 'info'
  ): void {
    try {
      if (!this.isInitialized) {
        console.log('Sentry not initialized, logging message:', message);
        return;
      }

      Sentry.withScope(scope => {
        scope.setLevel(level);

        if (context) {
          if (context.feature) {
            scope.setTag('feature', context.feature);
          }

          if (context.action) {
            scope.setTag('action', context.action);
          }

          scope.setContext('message_context', {
            feature: context.feature,
            action: context.action,
            screen: context.screen,
            ...context.additionalData,
          });
        }

        Sentry.captureMessage(message);
      });
    } catch (error) {
      console.error('Error capturing message to Sentry:', error);
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  static addBreadcrumb(
    message: string,
    category: string = 'custom',
    level: Sentry.SeverityLevel = 'info',
    data?: Record<string, any>
  ): void {
    try {
      if (!this.isInitialized) {
        return;
      }

      Sentry.addBreadcrumb({
        message,
        category,
        level,
        data: data ? this.filterSensitiveKeys(data) : undefined,
        timestamp: Date.now() / 1000,
      });
    } catch (error) {
      console.error('Error adding breadcrumb:', error);
    }
  }

  /**
   * Start performance transaction
   */
  static startTransaction(
    name: string,
    op: string,
    description?: string
  ): Sentry.Transaction | null {
    try {
      if (!this.isInitialized) {
        return null;
      }

      return Sentry.startTransaction({
        name,
        op,
        description,
        trimEnd: true,
      });
    } catch (error) {
      console.error('Error starting transaction:', error);
      return null;
    }
  }

  /**
   * Measure function execution time
   */
  static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const transaction = this.startTransaction(name, 'function');

    if (tags && transaction) {
      Object.entries(tags).forEach(([key, value]) => {
        transaction.setTag(key, value);
      });
    }

    try {
      const result = await fn();

      if (transaction) {
        transaction.setStatus('ok');
      }

      return result;
    } catch (error) {
      if (transaction) {
        transaction.setStatus('internal_error');
      }

      throw error;
    } finally {
      if (transaction) {
        transaction.finish();
      }
    }
  }

  /**
   * Filter sensitive data from events
   */
  private static filterSensitiveData(
    event: Sentry.Event,
    hint: Sentry.EventHint
  ): Sentry.Event | null {
    try {
      // Filter request data
      if (event.request?.data) {
        event.request.data = this.filterSensitiveKeys(event.request.data);
      }

      // Filter extra data
      if (event.extra) {
        event.extra = this.filterSensitiveKeys(event.extra);
      }

      // Filter context data
      if (event.contexts) {
        Object.keys(event.contexts).forEach(contextKey => {
          if (event.contexts![contextKey]) {
            event.contexts![contextKey] = this.filterSensitiveKeys(
              event.contexts![contextKey] as Record<string, any>
            );
          }
        });
      }

      // Filter breadcrumb data
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => ({
          ...breadcrumb,
          data: breadcrumb.data
            ? this.filterSensitiveKeys(breadcrumb.data)
            : undefined,
        }));
      }

      return event;
    } catch (error) {
      console.error('Error filtering sensitive data:', error);
      return event;
    }
  }

  /**
   * Filter sensitive keys from object
   */
  private static filterSensitiveKeys(
    obj: Record<string, any>
  ): Record<string, any> {
    const sensitiveKeys = [
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'key',
      'authorization',
      'cookie',
      'session',
      'email', // Mask emails instead of removing
      'phone',
      'ssn',
      'credit',
      'card',
      'bank',
    ];

    const filtered: Record<string, any> = {};

    Object.entries(obj).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();

      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        if (lowerKey.includes('email')) {
          // Mask email instead of removing it
          filtered[key] =
            typeof value === 'string' ? this.maskEmail(value) : '[MASKED]';
        } else {
          // Replace other sensitive data
          filtered[key] = '[REDACTED]';
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recursively filter nested objects
        filtered[key] = Array.isArray(value)
          ? value.map(item =>
              typeof item === 'object' ? this.filterSensitiveKeys(item) : item
            )
          : this.filterSensitiveKeys(value);
      } else {
        filtered[key] = value;
      }
    });

    return filtered;
  }

  /**
   * Mask email addresses
   */
  private static maskEmail(email: string): string {
    try {
      const [username, domain] = email.split('@');
      if (!domain) return '[INVALID_EMAIL]';

      const maskedUsername =
        username.length > 2
          ? username.slice(0, 2) + '*'.repeat(Math.max(1, username.length - 2))
          : username;

      return `${maskedUsername}@${domain}`;
    } catch (error) {
      return '[MASKED_EMAIL]';
    }
  }

  /**
   * Update auth context when user signs in/out
   */
  static updateAuthContext(): void {
    try {
      const authState = useAuthStore.getState();

      if (authState.isAuthenticated && authState.user) {
        this.setUserContext({
          id: authState.user.id,
          email: authState.user.email,
          roles: authState.user.roles,
          tenantId: authState.user.tenantId,
        });
      } else {
        this.setUserContext();
      }
    } catch (error) {
      console.error('Error updating auth context:', error);
    }
  }

  /**
   * Check if Sentry is initialized
   */
  static isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Flush events (useful before app closure)
   */
  static async flush(timeout = 2000): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        return true;
      }

      return await Sentry.flush(timeout);
    } catch (error) {
      console.error('Error flushing Sentry events:', error);
      return false;
    }
  }

  /**
   * Close Sentry (call on app shutdown)
   */
  static async close(timeout = 2000): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        return true;
      }

      const result = await Sentry.close(timeout);
      this.isInitialized = false;
      return result;
    } catch (error) {
      console.error('Error closing Sentry:', error);
      return false;
    }
  }
}

export default SentryService;
