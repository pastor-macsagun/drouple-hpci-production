/**
 * Root Layout with Performance Optimizations
 * Implements route code-splitting and performance monitoring
 */

import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client-core';

// Performance monitoring
import { LazyRouteMonitor, RoutePreloader } from '@/lib/performance/lazy-loader';
import { initializeNotifications } from '@/lib/notifications/handlers';

// Create query client for data fetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

// Route preloading configuration
const CRITICAL_ROUTES = [
  {
    name: 'dashboard',
    import: () => import('../(tabs)/dashboard'),
  },
  {
    name: 'checkin',
    import: () => import('../(tabs)/checkin'),
  },
  {
    name: 'events',
    import: () => import('../(tabs)/events'),
  },
];

export default function RootLayout() {
  useEffect(() => {
    // Initialize performance monitoring
    LazyRouteMonitor.startLoad('app');
    
    // Initialize notifications
    const cleanupNotifications = initializeNotifications();
    
    // Preload critical routes after initial render
    const preloadTimer = setTimeout(() => {
      RoutePreloader.preloadRoutes(CRITICAL_ROUTES);
    }, 1000); // Delay to avoid blocking initial render
    
    LazyRouteMonitor.endLoad('app');
    
    return () => {
      cleanupNotifications();
      clearTimeout(preloadTimer);
    };
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <Slot />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}