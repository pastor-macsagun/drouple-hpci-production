/**
 * Toast Utility
 * Simple toast notifications using Snackbar
 */

import { colors } from '@/theme/colors';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// Toast message interface
export interface ToastMessage {
  message: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

// Toast manager class
class ToastManager {
  private listeners: ((toast: ToastMessage) => void)[] = [];

  // Subscribe to toast events
  subscribe(listener: (toast: ToastMessage) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Show toast message
  private show(toast: ToastMessage): void {
    this.listeners.forEach(listener => listener(toast));
  }

  // Success toast
  success(message: string, duration = 4000): void {
    this.show({
      message,
      type: 'success',
      duration,
    });
  }

  // Error toast
  error(message: string, duration = 6000): void {
    this.show({
      message,
      type: 'error',
      duration,
    });
  }

  // Warning toast
  warning(message: string, duration = 5000): void {
    this.show({
      message,
      type: 'warning',
      duration,
    });
  }

  // Info toast
  info(message: string, duration = 4000): void {
    this.show({
      message,
      type: 'info',
      duration,
    });
  }

  // Generic toast with custom options
  showCustom(message: string, type?: ToastType, duration?: number): void {
    this.show({
      message,
      type: type || 'info',
      duration: duration || 4000,
    });
  }
}

// Create singleton instance
export const toast = new ToastManager();

// Color helper for toast types
export const getToastColor = (type: ToastType): string => {
  switch (type) {
    case 'success':
      return colors.success.main;
    case 'error':
      return colors.error.main;
    case 'warning':
      return colors.warning.main;
    case 'info':
      return colors.info.main;
    default:
      return colors.primary.main;
  }
};

// Icon helper for toast types
export const getToastIcon = (type: ToastType): string => {
  switch (type) {
    case 'success':
      return 'check-circle';
    case 'error':
      return 'alert-circle';
    case 'warning':
      return 'alert';
    case 'info':
      return 'information';
    default:
      return 'information';
  }
};

export default toast;
