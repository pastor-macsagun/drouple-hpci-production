/**
 * Mobile utilities for native-like PWA experience
 */

/**
 * Enhanced haptic feedback patterns for native-like feel
 */
export type HapticType = 
  | 'selection' | 'impact-light' | 'impact-medium' | 'impact-heavy'
  | 'success' | 'warning' | 'error' | 'notification'
  | 'tap' | 'double-tap' | 'long-press' | 'swipe'
  | 'refresh' | 'delete' | 'toggle' | 'scroll-end';

export function triggerHapticFeedback(type: HapticType = 'selection') {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  const patterns = {
    // Basic impacts (compatible with legacy calls)
    'selection': 10,
    'impact-light': 10,
    'impact-medium': 20,
    'impact-heavy': 30,
    
    // Contextual feedback
    'success': [50, 30, 100],
    'warning': [100, 50, 100, 50, 100],
    'error': [200, 100, 200],
    'notification': [50, 50, 50],
    
    // Interaction patterns
    'tap': 15,
    'double-tap': [15, 30, 15],
    'long-press': [30, 20, 50],
    'swipe': [20, 10, 20],
    
    // Action feedback
    'refresh': [30, 20, 30, 20, 60],
    'delete': [50, 30, 100, 30, 50],
    'toggle': [15, 10, 25],
    'scroll-end': 40,
  };

  const pattern = patterns[type];
  if (Array.isArray(pattern)) {
    navigator.vibrate(pattern);
  } else {
    navigator.vibrate(pattern);
  }
}

/**
 * Check if device supports haptic feedback
 */
export function supportsHapticFeedback(): boolean {
  return typeof window !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Get safe area insets for notched devices
 */
export function getSafeAreaInsets() {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
  };
}

/**
 * Check if running in PWA standalone mode
 */
export function isPWAStandalone(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Touch target size validation
 */
export function validateTouchTarget(element: HTMLElement): boolean {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const minSize = 44; // 44px minimum per iOS HIG and Android guidelines
  
  return rect.width >= minSize && rect.height >= minSize;
}

/**
 * Add ripple effect to element
 */
export function addRippleEffect(element: HTMLElement, event: MouseEvent | TouchEvent) {
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  
  // Get touch/click position
  const x = 'touches' in event 
    ? event.touches[0].clientX - rect.left
    : event.clientX - rect.left;
  const y = 'touches' in event 
    ? event.touches[0].clientY - rect.top
    : event.clientY - rect.top;

  // Create ripple element
  const ripple = document.createElement('span');
  ripple.style.position = 'absolute';
  ripple.style.borderRadius = '50%';
  ripple.style.background = 'currentColor';
  ripple.style.opacity = '0.3';
  ripple.style.pointerEvents = 'none';
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${x - size / 2}px`;
  ripple.style.top = `${y - size / 2}px`;
  ripple.style.animation = 'ripple 0.6s linear';
  
  element.appendChild(ripple);
  
  // Clean up after animation
  setTimeout(() => {
    ripple.remove();
  }, 600);
}

/**
 * Debounce function for preventing multiple rapid taps
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for limiting event frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}