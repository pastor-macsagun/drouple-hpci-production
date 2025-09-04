/**
 * Accessibility Module Index
 * Centralized export for all accessibility services and hooks
 */

export {
  accessibilityService,
  useAccessibility,
  useScreenReaderAnnouncements,
  useDynamicFontSize,
  type AccessibilitySettings,
  type AccessibilityAction,
} from './accessibilityHelpers';

// Re-export all accessibility utilities
export * from './accessibilityHelpers';
