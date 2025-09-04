/**
 * Sentry Monitoring Service
 * Simple Sentry integration for crash reporting and performance monitoring
 */

interface SentryConfig {
  dsn: string;
  environment: string;
  debug?: boolean;
}

class SentryService {
  private initialized = false;

  init(config: SentryConfig): void {
    if (this.initialized) return;

    // Mock Sentry for now - real implementation would use @sentry/react-native
    console.log('Sentry initialized with config:', {
      dsn: config.dsn ? 'REDACTED' : 'NOT_SET',
      environment: config.environment,
      debug: config.debug,
    });

    this.initialized = true;
  }

  setUser(user: { id: string; email?: string }): void {
    if (!this.initialized) return;
    console.log('Sentry user set:', { id: user.id, hasEmail: !!user.email });
  }

  captureError(error: Error, context?: Record<string, any>): void {
    console.error('Captured error:', error.message, context);
  }

  captureMessage(message: string, level = 'info'): void {
    console.log(`[${level}] ${message}`);
  }

  addBreadcrumb(message: string, category = 'custom', level = 'info'): void {
    console.log(`[${category}] ${message}`);
  }

  updateAuthContext(): void {
    // Update Sentry context when auth state changes
  }

  async close(): Promise<void> {
    this.initialized = false;
  }
}

export const sentryService = new SentryService();
export default sentryService;
