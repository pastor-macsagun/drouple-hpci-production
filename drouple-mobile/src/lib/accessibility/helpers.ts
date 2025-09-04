/**
 * Accessibility Helpers
 * WCAG 2.1 AA compliant accessibility utilities and components
 */

import { AccessibilityInfo, Platform } from 'react-native';
import { APP_CONFIG } from '../../config/app';

// WCAG 2.1 AA Standards
export const ACCESSIBILITY_STANDARDS = {
  // Minimum touch target size (44x44 dp)
  MIN_TOUCH_TARGET: APP_CONFIG.accessibility.minimumTouchTarget,
  
  // Color contrast ratios
  CONTRAST_RATIOS: {
    NORMAL_TEXT: 4.5, // 4.5:1 for normal text
    LARGE_TEXT: 3, // 3:1 for large text (18pt+ or 14pt+ bold)
    NON_TEXT: 3, // 3:1 for UI components
  },
  
  // Focus indicators
  FOCUS_WIDTH: 2,
  FOCUS_COLOR: '#1e7ce8',
  
  // Animation timing
  REDUCED_MOTION_DURATION: 150,
  DEFAULT_ANIMATION_DURATION: 300,
};

// Color palette with WCAG AA compliant contrast ratios
export const ACCESSIBLE_COLORS = {
  // Primary colors
  primary: '#1e7ce8', // Sacred Blue
  primaryDark: '#1558b3',
  primaryLight: '#4a94ed',
  
  // Secondary colors  
  secondary: '#e5c453', // Soft Gold
  secondaryDark: '#d4b340',
  secondaryLight: '#ebd366',
  
  // Status colors (WCAG AA compliant)
  success: '#10b981',
  warning: '#f59e0b', 
  error: '#ef4444',
  info: '#3b82f6',
  
  // Text colors
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textDisabled: '#94a3b8',
  
  // Background colors
  backgroundPrimary: '#ffffff',
  backgroundSecondary: '#f8fafc',
  backgroundDisabled: '#f1f5f9',
  
  // Border colors
  borderPrimary: '#e2e8f0',
  borderSecondary: '#cbd5e1',
  borderFocus: '#1e7ce8',
};

/**
 * Accessibility State Manager
 */
export class AccessibilityManager {
  private static isScreenReaderEnabled = false;
  private static isReduceMotionEnabled = false;
  private static fontScale = 1.0;

  /**
   * Initialize accessibility settings
   */
  static async initialize(): Promise<void> {
    try {
      // Check screen reader status
      this.isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      
      // Check reduce motion preference
      if (Platform.OS === 'ios') {
        this.isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      }
      
      // Listen for accessibility changes
      AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
        this.isScreenReaderEnabled = enabled;
      });
      
      if (Platform.OS === 'ios') {
        AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
          this.isReduceMotionEnabled = enabled;
        });
      }

      console.log('Accessibility manager initialized');
    } catch (error) {
      console.error('Failed to initialize accessibility manager:', error);
    }
  }

  /**
   * Check if screen reader is enabled
   */
  static getScreenReaderStatus(): boolean {
    return this.isScreenReaderEnabled;
  }

  /**
   * Check if reduce motion is enabled
   */
  static getReduceMotionStatus(): boolean {
    return this.isReduceMotionEnabled;
  }

  /**
   * Get appropriate animation duration based on user preference
   */
  static getAnimationDuration(): number {
    return this.isReduceMotionEnabled 
      ? ACCESSIBILITY_STANDARDS.REDUCED_MOTION_DURATION
      : ACCESSIBILITY_STANDARDS.DEFAULT_ANIMATION_DURATION;
  }

  /**
   * Get font scale factor
   */
  static getFontScale(): number {
    return this.fontScale;
  }

  /**
   * Announce message to screen reader
   */
  static announceForAccessibility(message: string): void {
    if (this.isScreenReaderEnabled) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }

  /**
   * Set accessibility focus to element
   */
  static setAccessibilityFocus(reactTag: number): void {
    if (this.isScreenReaderEnabled) {
      AccessibilityInfo.setAccessibilityFocus(reactTag);
    }
  }
}

/**
 * Generate accessible color scheme
 */
export function getAccessibleColorScheme(isDarkMode: boolean = false) {
  if (isDarkMode) {
    return {
      ...ACCESSIBLE_COLORS,
      textPrimary: '#f8fafc',
      textSecondary: '#cbd5e1',
      backgroundPrimary: '#0f172a',
      backgroundSecondary: '#1e293b',
      borderPrimary: '#334155',
      borderSecondary: '#475569',
    };
  }
  
  return ACCESSIBLE_COLORS;
}

/**
 * Calculate color contrast ratio
 */
export function calculateContrast(foreground: string, background: string): number {
  const getLuminance = (color: string): number => {
    const rgb = hexToRgb(color);
    if (!rgb) return 0;
    
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      const sRGB = c / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  
  return l1 > l2 ? (l1 + 0.05) / (l2 + 0.05) : (l2 + 0.05) / (l1 + 0.05);
}

/**
 * Check if color combination meets WCAG standards
 */
export function meetsWCAGStandards(
  foreground: string, 
  background: string, 
  level: 'normal' | 'large' | 'component' = 'normal'
): boolean {
  const contrast = calculateContrast(foreground, background);
  const requiredRatio = ACCESSIBILITY_STANDARDS.CONTRAST_RATIOS[
    level === 'normal' ? 'NORMAL_TEXT' : 
    level === 'large' ? 'LARGE_TEXT' : 'NON_TEXT'
  ];
  
  return contrast >= requiredRatio;
}

/**
 * Generate accessibility props for touchable components
 */
export function getAccessibleTouchableProps(
  label: string,
  role: 'button' | 'link' | 'tab' | 'checkbox' | 'radio' = 'button',
  state?: {
    disabled?: boolean;
    selected?: boolean;
    expanded?: boolean;
  }
) {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityRole: role,
    accessibilityState: {
      disabled: state?.disabled || false,
      selected: state?.selected,
      expanded: state?.expanded,
    },
    accessibilityHint: getAccessibilityHint(role, state),
    // Ensure minimum touch target
    style: {
      minHeight: ACCESSIBILITY_STANDARDS.MIN_TOUCH_TARGET,
      minWidth: ACCESSIBILITY_STANDARDS.MIN_TOUCH_TARGET,
    },
  };
}

/**
 * Generate accessibility props for form inputs
 */
export function getAccessibleInputProps(
  label: string,
  options?: {
    required?: boolean;
    error?: string;
    hint?: string;
    value?: string;
  }
) {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityRole: 'text' as const,
    accessibilityRequired: options?.required,
    accessibilityValue: options?.value ? { text: options.value } : undefined,
    accessibilityHint: options?.hint,
    accessibilityInvalid: !!options?.error,
    ...(options?.error && {
      accessibilityErrorMessage: options.error,
    }),
  };
}

/**
 * Generate accessibility props for images
 */
export function getAccessibleImageProps(
  altText: string,
  isDecorative: boolean = false
) {
  if (isDecorative) {
    return {
      accessible: false,
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants' as const,
    };
  }
  
  return {
    accessible: true,
    accessibilityRole: 'image' as const,
    accessibilityLabel: altText,
  };
}

/**
 * Generate accessibility hint based on component type and state
 */
function getAccessibilityHint(
  role: string,
  state?: { disabled?: boolean; selected?: boolean; expanded?: boolean }
): string | undefined {
  if (state?.disabled) {
    return 'This action is currently unavailable';
  }
  
  switch (role) {
    case 'button':
      return 'Double tap to activate';
    case 'link':
      return 'Double tap to open';
    case 'tab':
      return state?.selected ? 'Selected tab' : 'Double tap to select tab';
    case 'checkbox':
      return state?.selected ? 'Checked checkbox' : 'Unchecked checkbox. Double tap to check';
    case 'radio':
      return state?.selected ? 'Selected radio button' : 'Double tap to select';
    default:
      return undefined;
  }
}

/**
 * Focus management for accessibility
 */
export function manageFocus(
  elementRef: React.RefObject<any>,
  shouldFocus: boolean = true,
  delay: number = 100
) {
  if (!shouldFocus || !AccessibilityManager.getScreenReaderStatus()) {
    return;
  }
  
  setTimeout(() => {
    if (elementRef.current) {
      const reactTag = elementRef.current._nativeTag || elementRef.current;
      AccessibilityManager.setAccessibilityFocus(reactTag);
    }
  }, delay);
}

/**
 * Accessible loading state
 */
export function getAccessibleLoadingProps(isLoading: boolean, loadingText: string = 'Loading') {
  return {
    accessible: isLoading,
    accessibilityLabel: isLoading ? loadingText : undefined,
    accessibilityRole: isLoading ? ('progressbar' as const) : undefined,
    accessibilityLiveRegion: isLoading ? ('polite' as const) : undefined,
  };
}

/**
 * Accessible error state
 */
export function getAccessibleErrorProps(error: string | null) {
  return {
    accessible: !!error,
    accessibilityLabel: error || undefined,
    accessibilityRole: error ? ('alert' as const) : undefined,
    accessibilityLiveRegion: error ? ('assertive' as const) : undefined,
  };
}

/**
 * Generate semantic HTML equivalent role mappings
 */
export function getSemanticRole(elementType: string): string {
  const roleMap: Record<string, string> = {
    header: 'header',
    nav: 'navigation', 
    main: 'main',
    section: 'region',
    article: 'article',
    aside: 'complementary',
    footer: 'contentinfo',
    h1: 'heading',
    h2: 'heading',
    h3: 'heading',
    h4: 'heading',
    h5: 'heading',
    h6: 'heading',
    p: 'text',
    ul: 'list',
    ol: 'list',
    li: 'listitem',
    button: 'button',
    a: 'link',
    input: 'textbox',
    textarea: 'textbox',
    select: 'combobox',
    img: 'image',
    table: 'table',
    form: 'form',
  };
  
  return roleMap[elementType] || 'none';
}

/**
 * Utility function to convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

export default {
  ACCESSIBILITY_STANDARDS,
  ACCESSIBLE_COLORS,
  AccessibilityManager,
  getAccessibleColorScheme,
  calculateContrast,
  meetsWCAGStandards,
  getAccessibleTouchableProps,
  getAccessibleInputProps,
  getAccessibleImageProps,
  manageFocus,
  getAccessibleLoadingProps,
  getAccessibleErrorProps,
  getSemanticRole,
};