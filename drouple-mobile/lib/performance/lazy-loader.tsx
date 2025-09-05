/**
 * Lazy Loading Utilities for Route Code-Splitting
 * Implements dynamic imports with loading states and error boundaries
 */

import React, { Suspense, ComponentType, LazyExoticComponent } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

// Loading component for route transitions
const RouteLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <View style={styles.loaderContainer}>
    <ActivityIndicator size="large" color="#1e7ce8" />
    <Text style={styles.loaderText}>{message}</Text>
  </View>
);

// Error boundary for lazy-loaded routes
class LazyRouteErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Route loading error:', error, errorInfo);
    // You could send this to your error tracking service
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent />;
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC = () => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorTitle}>Oops!</Text>
    <Text style={styles.errorText}>Something went wrong loading this screen.</Text>
    <Text style={styles.errorSubtext}>Please try again.</Text>
  </View>
);

/**
 * Enhanced lazy loader with preloading capability
 */
export function createLazyRoute<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    loadingMessage?: string;
    errorFallback?: ComponentType;
    preload?: boolean;
  } = {}
): LazyExoticComponent<T> {
  const LazyComponent = React.lazy(importFn);
  
  // Preload the component if requested
  if (options.preload) {
    // Preload after a short delay to avoid blocking initial render
    setTimeout(() => {
      importFn().catch(error => {
        console.warn('Preload failed for component:', error);
      });
    }, 100);
  }
  
  // Return wrapped component with proper error boundary and loading state
  const WrappedComponent = (props: any) => (
    <LazyRouteErrorBoundary fallback={options.errorFallback}>
      <Suspense fallback={<RouteLoader message={options.loadingMessage} />}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyRouteErrorBoundary>
  );
  
  // Attach preload method to the component
  (WrappedComponent as any).preload = importFn;
  
  return WrappedComponent as LazyExoticComponent<T>;
}

/**
 * Route preloader utility
 */
export class RoutePreloader {
  private static preloadedRoutes = new Set<string>();
  
  static preload(routeName: string, importFn: () => Promise<any>) {
    if (this.preloadedRoutes.has(routeName)) {
      return Promise.resolve();
    }
    
    this.preloadedRoutes.add(routeName);
    return importFn().catch(error => {
      // Remove from preloaded set if failed
      this.preloadedRoutes.delete(routeName);
      console.warn(`Failed to preload route ${routeName}:`, error);
      throw error;
    });
  }
  
  static isPreloaded(routeName: string): boolean {
    return this.preloadedRoutes.has(routeName);
  }
  
  static preloadRoutes(routes: Array<{ name: string; import: () => Promise<any> }>) {
    return Promise.allSettled(
      routes.map(route => this.preload(route.name, route.import))
    );
  }
}

/**
 * Intersection-based preloader for route tabs
 */
export function useRoutePreloader() {
  const preloadRoute = React.useCallback((routeName: string, importFn: () => Promise<any>) => {
    RoutePreloader.preload(routeName, importFn);
  }, []);
  
  const preloadMultipleRoutes = React.useCallback((
    routes: Array<{ name: string; import: () => Promise<any> }>
  ) => {
    RoutePreloader.preloadRoutes(routes);
  }, []);
  
  return {
    preloadRoute,
    preloadMultipleRoutes,
    isPreloaded: RoutePreloader.isPreloaded,
  };
}

/**
 * Performance monitoring for lazy routes
 */
export class LazyRouteMonitor {
  private static loadTimes = new Map<string, number>();
  
  static startLoad(routeName: string) {
    this.loadTimes.set(routeName, Date.now());
  }
  
  static endLoad(routeName: string) {
    const startTime = this.loadTimes.get(routeName);
    if (startTime) {
      const duration = Date.now() - startTime;
      console.log(`🚀 Route ${routeName} loaded in ${duration}ms`);
      this.loadTimes.delete(routeName);
      
      // Track performance metrics
      this.trackRouteLoadTime(routeName, duration);
    }
  }
  
  private static trackRouteLoadTime(routeName: string, duration: number) {
    // In real implementation, send to analytics service
    if (duration > 1000) { // Warn if route takes longer than 1 second
      console.warn(`⚠️  Slow route load detected: ${routeName} took ${duration}ms`);
    }
  }
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});