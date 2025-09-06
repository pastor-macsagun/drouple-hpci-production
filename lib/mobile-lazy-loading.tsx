"use client";

import { Suspense, lazy, ComponentType, ReactNode } from "react";
import { MobileSpinner, MobileListSkeleton } from "@/components/mobile/mobile-loading";

// Lazy load mobile components for better performance
export const LazyPullToRefresh = lazy(() => 
  import("@/components/mobile/pull-to-refresh").then(module => ({
    default: module.PullToRefresh
  }))
);

export const LazySwipeToDelete = lazy(() => 
  import("@/components/mobile/swipe-to-delete").then(module => ({
    default: module.SwipeToDelete  
  }))
);

export const LazyBottomSheet = lazy(() => 
  import("@/components/mobile/bottom-sheet").then(module => ({
    default: module.BottomSheet
  }))
);

export const LazyMobileTabs = lazy(() => 
  import("@/components/mobile/mobile-tabs").then(module => ({
    default: module.MobileTabs
  }))
);

export const LazyMobileStepperForm = lazy(() => 
  import("@/components/mobile/mobile-form").then(module => ({
    default: module.MobileStepperForm
  }))
);

export const LazyOfflineManager = lazy(() => 
  import("@/components/mobile/offline-manager").then(module => ({
    default: module.OfflineManager
  }))
);

export const LazyNotificationManager = lazy(() => 
  import("@/components/mobile/notification-manager").then(module => ({
    default: module.NotificationManager
  }))
);

// Higher-order component for lazy loading with mobile-optimized fallbacks
interface MobileLazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  type?: 'spinner' | 'skeleton' | 'list';
}

export function MobileLazyWrapper({
  children,
  fallback,
  type = 'spinner',
}: MobileLazyWrapperProps) {
  let defaultFallback: ReactNode;
  
  switch (type) {
    case 'skeleton':
      defaultFallback = <MobileListSkeleton count={3} />;
      break;
    case 'list':
      defaultFallback = <MobileListSkeleton count={5} showAvatar />;
      break;
    default:
      defaultFallback = <MobileSpinner className="py-8" />;
  }

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
}

// Route-based lazy loading utility
export function createMobileLazyRoute<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallbackType: 'spinner' | 'skeleton' | 'list' = 'spinner'
) {
  const LazyComponent = lazy(importFn);
  
  return function MobileLazyRoute(props: any) {
    return (
      <MobileLazyWrapper type={fallbackType}>
        <LazyComponent {...props} />
      </MobileLazyWrapper>
    );
  };
}

// Pre-load mobile components on user interaction
export function preloadMobileComponents() {
  if (typeof window === 'undefined') return;
  
  // Preload after user interaction to improve perceived performance
  const preload = () => {
    import("@/components/mobile/pull-to-refresh");
    import("@/components/mobile/bottom-sheet");
    import("@/components/mobile/mobile-tabs");
    
    // Clean up listener after first interaction
    window.removeEventListener('touchstart', preload);
    window.removeEventListener('click', preload);
  };
  
  window.addEventListener('touchstart', preload, { once: true });
  window.addEventListener('click', preload, { once: true });
}

// Performance monitoring for mobile components
export function measureMobileComponentPerformance<T extends any[]>(
  componentName: string,
  fn: (...args: T) => void | Promise<void>
) {
  return async (...args: T) => {
    const startTime = performance.now();
    
    try {
      await fn(...args);
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Log slow components in development
      if (process.env.NODE_ENV === 'development' && duration > 100) {
        console.warn(`Slow mobile component: ${componentName} took ${duration.toFixed(2)}ms`);
      }
      
      // Send performance metrics to analytics if available
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'mobile_component_performance', {
          component_name: componentName,
          duration_ms: Math.round(duration),
        });
      }
    }
  };
}