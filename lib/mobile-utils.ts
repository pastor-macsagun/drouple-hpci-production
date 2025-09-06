/**
 * Mobile utilities for native-like PWA experience
 */

/**
 * Trigger haptic feedback on supported devices
 */
export function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  const patterns = {
    light: 10,
    medium: 20,
    heavy: 30,
  };

  navigator.vibrate(patterns[type]);
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