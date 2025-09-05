import { InteractionManager } from 'react-native';

/**
 * Performance utilities for React Native app
 */

/**
 * Run a task after interactions are complete
 * Useful for heavy operations that shouldn't block UI
 */
export const runAfterInteractions = (callback: () => void) => {
  InteractionManager.runAfterInteractions(() => {
    callback();
  });
};

/**
 * Throttle function calls
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Debounce function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

/**
 * Preload screen for better navigation performance
 */
export const preloadScreen = (routeName: string) => {
  // This would be implemented with expo-router's preload functionality
  // when navigating to frequently accessed screens
  console.log(`Preloading screen: ${routeName}`);
};

/**
 * Memory management utility
 */
export const clearImageCache = async () => {
  // This would implement image cache clearing if needed
  // For now, expo-image handles this automatically
  console.log('Image cache cleared');
};

/**
 * Performance monitoring hook
 */
export const usePerformanceMonitor = () => {
  const startTime = Date.now();
  
  return {
    measureRender: (componentName: string) => {
      const endTime = Date.now();
      const renderTime = endTime - startTime;
      
      if (__DEV__ && renderTime > 16) {
        console.warn(`Slow render detected in ${componentName}: ${renderTime}ms`);
      }
      
      return renderTime;
    }
  };
};