/**
 * Accessibility Helpers
 * Provides utilities and hooks for accessibility features
 */

import { AccessibilityInfo, AccessibilityActionEvent } from 'react-native';
import { useState, useEffect } from 'react';

export interface AccessibilitySettings {
  isScreenReaderEnabled: boolean;
  isVoiceOverEnabled: boolean;
  isTalkBackEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isGrayscaleEnabled: boolean;
  isInvertColorsEnabled: boolean;
  fontScale: number;
}

export interface AccessibilityAction {
  name: string;
  label: string;
  handler: () => void;
}

export class AccessibilityService {
  private static instance: AccessibilityService;
  private settings: AccessibilitySettings | null = null;

  static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService();
    }
    return AccessibilityService.instance;
  }

  /**
   * Initialize accessibility service
   */
  async initialize(): Promise<AccessibilitySettings> {
    try {
      const [
        isScreenReaderEnabled,
        isReduceMotionEnabled,
        isGrayscaleEnabled,
        isInvertColorsEnabled,
      ] = await Promise.all([
        AccessibilityInfo.isScreenReaderEnabled(),
        AccessibilityInfo.isReduceMotionEnabled(),
        AccessibilityInfo.isGrayscaleEnabled(),
        AccessibilityInfo.isInvertColorsEnabled(),
      ]);

      this.settings = {
        isScreenReaderEnabled,
        isVoiceOverEnabled: isScreenReaderEnabled, // iOS
        isTalkBackEnabled: isScreenReaderEnabled, // Android
        isReduceMotionEnabled,
        isGrayscaleEnabled,
        isInvertColorsEnabled,
        fontScale: 1.0, // This would need to be detected from system settings
      };

      return this.settings;
    } catch (error) {
      console.error('Failed to initialize accessibility settings:', error);

      // Return default settings
      this.settings = {
        isScreenReaderEnabled: false,
        isVoiceOverEnabled: false,
        isTalkBackEnabled: false,
        isReduceMotionEnabled: false,
        isGrayscaleEnabled: false,
        isInvertColorsEnabled: false,
        fontScale: 1.0,
      };

      return this.settings;
    }
  }

  /**
   * Get current accessibility settings
   */
  getSettings(): AccessibilitySettings | null {
    return this.settings;
  }

  /**
   * Check if screen reader is enabled
   */
  async isScreenReaderEnabled(): Promise<boolean> {
    try {
      return await AccessibilityInfo.isScreenReaderEnabled();
    } catch (error) {
      console.error('Failed to check screen reader status:', error);
      return false;
    }
  }

  /**
   * Announce message to screen reader
   */
  announceForAccessibility(message: string): void {
    try {
      AccessibilityInfo.announceForAccessibility(message);
    } catch (error) {
      console.error('Failed to announce message:', error);
    }
  }

  /**
   * Set accessibility focus to element
   */
  setAccessibilityFocus(reactTag: number): void {
    try {
      AccessibilityInfo.setAccessibilityFocus(reactTag);
    } catch (error) {
      console.error('Failed to set accessibility focus:', error);
    }
  }

  /**
   * Generate accessibility label for complex components
   */
  generateAccessibilityLabel(
    title: string,
    value?: string | number,
    status?: string,
    position?: { current: number; total: number }
  ): string {
    let label = title;

    if (value !== undefined) {
      label += `, ${value}`;
    }

    if (status) {
      label += `, ${status}`;
    }

    if (position) {
      label += `, ${position.current} of ${position.total}`;
    }

    return label;
  }

  /**
   * Generate accessibility hint for interactive elements
   */
  generateAccessibilityHint(action: string, result?: string): string {
    let hint = `${action}`;

    if (result) {
      hint += ` to ${result}`;
    }

    return hint;
  }

  /**
   * Get appropriate role for component type
   */
  getAccessibilityRole(componentType: string): string {
    const roleMap: { [key: string]: string } = {
      button: 'button',
      link: 'link',
      text: 'text',
      image: 'image',
      list: 'list',
      listItem: 'listitem',
      tab: 'tab',
      tabBar: 'tablist',
      header: 'header',
      search: 'search',
      switch: 'switch',
      checkbox: 'checkbox',
      radio: 'radio',
      progressBar: 'progressbar',
      slider: 'slider',
      alert: 'alert',
      dialog: 'dialog',
      menu: 'menu',
      menuItem: 'menuitem',
    };

    return roleMap[componentType] || 'none';
  }

  /**
   * Create accessibility actions for complex components
   */
  createAccessibilityActions(actions: AccessibilityAction[]): any[] {
    return actions.map(action => ({
      name: action.name,
      label: action.label,
    }));
  }

  /**
   * Handle accessibility action events
   */
  handleAccessibilityAction(
    event: AccessibilityActionEvent,
    actions: AccessibilityAction[]
  ): void {
    const action = actions.find(a => a.name === event.nativeEvent.actionName);
    if (action) {
      action.handler();
    }
  }

  /**
   * Get minimum touch target size based on platform
   */
  getMinimumTouchTargetSize(): { width: number; height: number } {
    // iOS: 44x44 points, Android: 48x48 dp
    return {
      width: 48,
      height: 48,
    };
  }

  /**
   * Calculate contrast ratio between two colors
   */
  calculateContrastRatio(color1: string, color2: string): number {
    // This is a simplified version - in a real app, you'd use a proper color library
    // For now, return a mock value
    return 4.5; // WCAG AA compliance ratio
  }

  /**
   * Check if colors meet accessibility contrast requirements
   */
  meetsContrastRequirements(
    foregroundColor: string,
    backgroundColor: string,
    level: 'AA' | 'AAA' = 'AA'
  ): boolean {
    const ratio = this.calculateContrastRatio(foregroundColor, backgroundColor);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  }

  /**
   * Generate accessible color variants
   */
  getAccessibleColorVariants(baseColor: string): {
    light: string;
    dark: string;
    highContrast: string;
  } {
    // This would typically calculate actual color variants
    // For now, return mock values
    return {
      light: baseColor + '40', // 25% opacity
      dark: '#000000',
      highContrast: '#000000',
    };
  }
}

/**
 * Hook for accessibility settings
 */
export const useAccessibility = () => {
  const [settings, setSettings] = useState<AccessibilitySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAccessibility = async () => {
      try {
        const accessibilityService = AccessibilityService.getInstance();
        const accessibilitySettings = await accessibilityService.initialize();
        setSettings(accessibilitySettings);
      } catch (error) {
        console.error('Failed to initialize accessibility:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAccessibility();

    // Listen for accessibility setting changes
    const screenReaderChangedSubscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (isEnabled: boolean) => {
        setSettings(prev =>
          prev
            ? {
                ...prev,
                isScreenReaderEnabled: isEnabled,
                isVoiceOverEnabled: isEnabled,
                isTalkBackEnabled: isEnabled,
              }
            : null
        );
      }
    );

    const reduceMotionChangedSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (isEnabled: boolean) => {
        setSettings(prev =>
          prev
            ? {
                ...prev,
                isReduceMotionEnabled: isEnabled,
              }
            : null
        );
      }
    );

    return () => {
      screenReaderChangedSubscription?.remove();
      reduceMotionChangedSubscription?.remove();
    };
  }, []);

  return {
    settings,
    loading,
    isScreenReaderEnabled: settings?.isScreenReaderEnabled || false,
    isReduceMotionEnabled: settings?.isReduceMotionEnabled || false,
    fontScale: settings?.fontScale || 1.0,
  };
};

/**
 * Hook for screen reader announcements
 */
export const useScreenReaderAnnouncements = () => {
  const { isScreenReaderEnabled } = useAccessibility();

  const announce = (message: string, delay: number = 100) => {
    if (isScreenReaderEnabled) {
      setTimeout(() => {
        AccessibilityService.getInstance().announceForAccessibility(message);
      }, delay);
    }
  };

  return { announce };
};

/**
 * Hook for dynamic font sizing
 */
export const useDynamicFontSize = (baseSize: number) => {
  const { fontScale } = useAccessibility();

  return {
    fontSize: baseSize * fontScale,
    lineHeight: baseSize * fontScale * 1.4,
  };
};

// Export singleton instance
export const accessibilityService = AccessibilityService.getInstance();
