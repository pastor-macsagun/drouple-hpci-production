import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Environment and release tracking
  environment: process.env.NODE_ENV || 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'local-build',
  
  // Edge Runtime specific configuration
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 1.0,
  
  // Minimal integrations for Edge Runtime
  integrations: [],
  
  // Edge runtime specific filtering
  beforeSend(event, hint) {
    // Add edge runtime context
    event.tags = {
      ...event.tags,
      component: 'edge',
      runtime: 'edge',
    };
    
    // Filter out edge runtime specific noise
    const error = hint.originalException;
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String(error.message);
      
      // Skip common edge runtime errors
      if (
        message.includes('Dynamic Code Evaluation') ||
        message.includes('eval is not supported') ||
        message.includes('Function constructor is disabled')
      ) {
        return null;
      }
    }
    
    return event;
  },
  
  // Ignore edge-specific errors
  ignoreErrors: [
    'Dynamic Code Evaluation',
    'eval is not supported',
    'Function constructor is disabled',
    'WebAssembly is not supported',
  ],
});

// Export lightweight error reporting for Edge Runtime
export const captureEdgeError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    scope.setTag('edge_function', true);
    
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setExtra(key, context[key]);
      });
    }
    
    Sentry.captureException(error);
  });
};

export const captureEdgeMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.withScope((scope) => {
    scope.setTag('edge_function', true);
    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
};