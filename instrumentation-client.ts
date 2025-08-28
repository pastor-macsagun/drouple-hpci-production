/**
 * Client-side Instrumentation for HPCI-ChMS
 * 
 * This file initializes client-side monitoring and analytics for HPCI-ChMS.
 * It runs before the application's frontend code starts executing.
 * 
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Only initialize Sentry in production or when explicitly enabled
const shouldUseSentry = process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true';

if (shouldUseSentry) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Environment and release tracking
    environment: process.env.NODE_ENV || 'development',
    release: process.env.VERCEL_GIT_COMMIT_SHA || 'local-build',
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Replay Sessions for HPCI-ChMS debugging
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Integration configuration
    integrations: [
      // Replay and tracing integrations are configured automatically by Sentry Next.js
      // Custom integrations can be added here for HPCI-ChMS specific needs
    ],
    
    // Filter out noise and add HPCI-ChMS context
    beforeSend(event, hint) {
      // Add HPCI-ChMS specific context
      event.tags = {
        ...event.tags,
        component: 'client',
        application: 'hpci-chms',
        runtime: 'browser',
      };

      // Add browser context
      if (typeof window !== 'undefined') {
        event.tags.page_url = window.location.pathname;
        
        // Add tenant context if available in localStorage
        try {
          const tenantId = localStorage.getItem('tenantId');
          if (tenantId) {
            event.tags.tenant_id = tenantId;
          }
        } catch (e) {
          // localStorage not available or access denied
        }
      }
      
      // Filter out known development errors
      if (process.env.NODE_ENV === 'development') {
        const error = hint.originalException;
        if (error && typeof error === 'object' && 'message' in error) {
          const message = String(error.message);
          if (
            message.includes('Non-Error promise rejection captured') ||
            message.includes('ResizeObserver loop limit exceeded') ||
            message.includes('Script error') ||
            message.includes('Loading chunk') ||
            message.includes('ChunkLoadError')
          ) {
            return null;
          }
        }
      }
      
      return event;
    },
    
    // Add transaction context for HPCI-ChMS
    beforeSendTransaction(event) {
      // Add custom tags for better organization
      event.tags = {
        ...event.tags,
        component: 'client',
        application: 'hpci-chms',
      };
      
      // Add page route context
      if (typeof window !== 'undefined') {
        event.tags.page_route = window.location.pathname;
      }
      
      return event;
    },
    
    // Error filtering
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'http://tt.epicplay.com',
      "Can't find variable: ZiteReader",
      'jigsaw is not defined',
      'ComboSearch is not defined',
      'http://loading.retry.widdit.com/',
      'atomicFindClose',
      // Facebook borked
      'fb_xd_fragment',
      // ISP "optimizing" proxy - `Cache-Control: no-transform` seems to reduce this. (thanks @acdha)
      // See http://stackoverflow.com/questions/4113268
      'bmi_SafeAddOnload',
      'EBCallBackMessageReceived',
      // See http://toolbar.conduit.com/Developer/HtmlAndGadget/Methods/JSInjection.aspx
      'conduitPage',
    ],
    
    // URL filtering
    denyUrls: [
      // Facebook flakiness
      /graph\.facebook\.com/i,
      // Facebook blocked
      /connect\.facebook\.net\/en_US\/all\.js/i,
      // Woopra flakiness
      /eatdifferent\.com\.woopra-ns\.com/i,
      /static\.woopra\.com\/js\/woopra\.js/i,
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      // Other plugins
      /127\.0\.0\.1:4001\/isrunning/i, // Cacaoweb
      /webappstoolbarba\.texthelp\.com\//i,
      /metrics\.itunes\.apple\.com\.edgesuite\.net\//i,
    ],
  });
}

// Export client-side utility functions for HPCI-ChMS
export const captureClientError = (error: Error, user?: {
  id?: string;
  email?: string;
  role?: string;
  tenantId?: string;
}, extra?: Record<string, unknown>) => {
  if (!shouldUseSentry) return;
  
  Sentry.withScope((scope) => {
    scope.setTag('error_source', 'client');
    scope.setTag('application', 'hpci-chms');
    
    if (user) {
      scope.setUser({
        id: user.id,
        email: user.email,
      });
      
      if (user.role) {
        scope.setTag('user_role', user.role);
      }
      
      if (user.tenantId) {
        scope.setTag('tenant_id', user.tenantId);
      }
    }
    
    // Add page context
    if (typeof window !== 'undefined') {
      scope.setExtra('page_url', window.location.href);
      scope.setExtra('page_title', document.title);
      scope.setExtra('user_agent', window.navigator.userAgent);
    }
    
    if (extra) {
      Object.keys(extra).forEach(key => {
        scope.setExtra(key, extra[key]);
      });
    }
    
    scope.setLevel('error');
    Sentry.captureException(error);
  });
};

export const captureUserAction = (
  action: string,
  context: {
    userId?: string;
    tenantId?: string;
    resource?: string;
    result: 'success' | 'error' | 'warning';
    extra?: Record<string, unknown>;
  }
) => {
  if (!shouldUseSentry) return;
  
  Sentry.withScope((scope) => {
    scope.setTag('event_type', 'user_action');
    scope.setTag('action', action);
    scope.setTag('application', 'hpci-chms');
    scope.setTag('result', context.result);
    
    if (context.resource) {
      scope.setTag('resource', context.resource);
    }
    
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }
    
    if (context.tenantId) {
      scope.setTag('tenant_id', context.tenantId);
    }
    
    if (typeof window !== 'undefined') {
      scope.setExtra('page_url', window.location.pathname);
    }
    
    if (context.extra) {
      Object.keys(context.extra).forEach(key => {
        scope.setExtra(key, context.extra![key]);
      });
    }
    
    scope.setLevel(context.result === 'error' ? 'error' : 'info');
    Sentry.captureMessage(`User action: ${action} - ${context.result}`);
  });
};

export const capturePageLoad = (pageName: string, loadTime: number) => {
  if (!shouldUseSentry) return;
  
  if (typeof window !== 'undefined') {
    Sentry.withScope((scope) => {
      scope.setTag('event_type', 'page_load');
      scope.setTag('page_name', pageName);
      scope.setTag('application', 'hpci-chms');
      scope.setExtra('load_time_ms', loadTime);
      scope.setExtra('page_url', window.location.href);
      
      // Only capture slow page loads
      if (loadTime > 2000) {
        scope.setLevel('warning');
        Sentry.captureMessage(`Slow page load: ${pageName} took ${loadTime}ms`);
      }
    });
  }
};

// Required hook for navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;