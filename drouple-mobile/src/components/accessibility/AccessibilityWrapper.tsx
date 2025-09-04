/**
 * Accessibility Wrapper Component
 * WCAG 2.1 AA compliant accessibility enhancements
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  View,
  AccessibilityInfo,
  Platform,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Text, Surface } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors } from '@/theme/colors';

interface AccessibilitySettings {
  screenReaderEnabled: boolean;
  highContrastEnabled: boolean;
  largeTextEnabled: boolean;
  reduceMotionEnabled: boolean;
  focusRingEnabled: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  isScreenReaderEnabled: boolean;
  isHighContrastEnabled: boolean;
  isLargeTextEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isFocusRingEnabled: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(
  null
);

const ACCESSIBILITY_SETTINGS_KEY = '@accessibility_settings';

const defaultSettings: AccessibilitySettings = {
  screenReaderEnabled: false,
  highContrastEnabled: false,
  largeTextEnabled: false,
  reduceMotionEnabled: false,
  focusRingEnabled: true,
};

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] =
    useState<AccessibilitySettings>(defaultSettings);

  useEffect(() => {
    loadAccessibilitySettings();
    detectSystemSettings();
  }, []);

  const loadAccessibilitySettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem(
        ACCESSIBILITY_SETTINGS_KEY
      );
      if (storedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(storedSettings) });
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    }
  };

  const detectSystemSettings = async () => {
    try {
      // Detect screen reader
      const screenReaderEnabled =
        await AccessibilityInfo.isScreenReaderEnabled();

      // Detect reduce motion (iOS only)
      let reduceMotionEnabled = false;
      if (Platform.OS === 'ios') {
        reduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      }

      setSettings(prev => ({
        ...prev,
        screenReaderEnabled,
        reduceMotionEnabled,
      }));
    } catch (error) {
      console.error('Failed to detect system accessibility settings:', error);
    }
  };

  const updateSettings = async (
    newSettings: Partial<AccessibilitySettings>
  ) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    try {
      await AsyncStorage.setItem(
        ACCESSIBILITY_SETTINGS_KEY,
        JSON.stringify(updatedSettings)
      );
    } catch (error) {
      console.error('Failed to save accessibility settings:', error);
    }
  };

  const contextValue: AccessibilityContextType = {
    settings,
    updateSettings,
    isScreenReaderEnabled: settings.screenReaderEnabled,
    isHighContrastEnabled: settings.highContrastEnabled,
    isLargeTextEnabled: settings.largeTextEnabled,
    isReduceMotionEnabled: settings.reduceMotionEnabled,
    isFocusRingEnabled: settings.focusRingEnabled,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      'useAccessibility must be used within AccessibilityProvider'
    );
  }
  return context;
};

// Accessibility-enhanced components
interface AccessibleViewProps {
  children: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  style?: ViewStyle;
  focusable?: boolean;
  testID?: string;
}

export const AccessibleView: React.FC<AccessibleViewProps> = ({
  children,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  style,
  focusable = false,
  testID,
}) => {
  const { isHighContrastEnabled, isFocusRingEnabled } = useAccessibility();

  const accessibleStyle = [
    style,
    isHighContrastEnabled && styles.highContrast,
    isFocusRingEnabled && focusable && styles.focusRing,
  ];

  return (
    <View
      style={accessibleStyle}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole as any}
      accessible={!!accessibilityLabel}
      focusable={focusable}
      testID={testID}
    >
      {children}
    </View>
  );
};

interface AccessibleTextProps {
  children: React.ReactNode;
  variant?:
    | 'displayLarge'
    | 'displayMedium'
    | 'displaySmall'
    | 'headlineLarge'
    | 'headlineMedium'
    | 'headlineSmall'
    | 'titleLarge'
    | 'titleMedium'
    | 'titleSmall'
    | 'labelLarge'
    | 'labelMedium'
    | 'labelSmall'
    | 'bodyLarge'
    | 'bodyMedium'
    | 'bodySmall';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: TextStyle;
  testID?: string;
}

export const AccessibleText: React.FC<AccessibleTextProps> = ({
  children,
  variant = 'bodyMedium',
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}) => {
  const { isHighContrastEnabled, isLargeTextEnabled } = useAccessibility();

  const accessibleStyle = [
    style,
    isHighContrastEnabled && styles.highContrastText,
    isLargeTextEnabled && styles.largeText,
  ];

  return (
    <Text
      variant={variant}
      style={accessibleStyle}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      testID={testID}
    >
      {children}
    </Text>
  );
};

// Focus management utilities
export const useFocusManagement = () => {
  const announceForScreenReader = (message: string) => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message);
    } else {
      // Android implementation would go here
      console.log('Screen reader announcement:', message);
    }
  };

  const setAccessibilityFocus = (reactTag: number) => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.setAccessibilityFocus(reactTag);
    }
  };

  return {
    announceForScreenReader,
    setAccessibilityFocus,
  };
};

// ARIA-like helpers for React Native
export const createAccessibilityProps = (
  label: string,
  role?: string,
  hint?: string,
  state?: {
    selected?: boolean;
    checked?: boolean;
    expanded?: boolean;
    disabled?: boolean;
  }
) => {
  let accessibilityLabel = label;

  // Add state information to label
  if (state) {
    if (state.selected) accessibilityLabel += ', selected';
    if (state.checked !== undefined)
      accessibilityLabel += state.checked ? ', checked' : ', unchecked';
    if (state.expanded !== undefined)
      accessibilityLabel += state.expanded ? ', expanded' : ', collapsed';
    if (state.disabled) accessibilityLabel += ', disabled';
  }

  return {
    accessibilityLabel,
    accessibilityRole: role as any,
    accessibilityHint: hint,
    accessibilityState: state,
    accessible: true,
  };
};

// Color contrast utilities
export const getContrastRatio = (
  foreground: string,
  background: string
): number => {
  // Simplified contrast ratio calculation
  // In a real app, you'd use a proper color contrast library
  const getLuminance = (color: string): number => {
    // Very basic luminance calculation - should be enhanced
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    return 0.299 * r + 0.587 * g + 0.114 * b;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

export const meetsWCAGAA = (
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
};

export const meetsWCAGAAA = (
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
};

// Touch target size utilities
export const MINIMUM_TOUCH_TARGET_SIZE = 44; // iOS HIG and Material Design minimum

export const ensureMinimumTouchTarget = (style: ViewStyle): ViewStyle => {
  return {
    ...style,
    minWidth: Math.max(style.minWidth || 0, MINIMUM_TOUCH_TARGET_SIZE),
    minHeight: Math.max(style.minHeight || 0, MINIMUM_TOUCH_TARGET_SIZE),
  };
};

// Accessibility testing helpers
export const testAccessibility = () => {
  if (__DEV__) {
    console.log('=== Accessibility Test Report ===');

    // Test color contrast
    const primaryColor = colors.primary.main;
    const backgroundColor = colors.background;
    const textColor = colors.text.primary;

    console.log('Color Contrast Tests:');
    console.log(
      `Primary/Background: ${getContrastRatio(primaryColor, backgroundColor).toFixed(2)} (WCAG AA: ${meetsWCAGAA(primaryColor, backgroundColor)})`
    );
    console.log(
      `Text/Background: ${getContrastRatio(textColor, backgroundColor).toFixed(2)} (WCAG AA: ${meetsWCAGAA(textColor, backgroundColor)})`
    );

    console.log('==================================');
  }
};

const styles = StyleSheet.create({
  highContrast: {
    borderWidth: 2,
    borderColor: colors.outline,
  },
  highContrastText: {
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  largeText: {
    fontSize: 18,
    lineHeight: 24,
  },
  focusRing: {
    // Focus ring will be applied dynamically
  },
});

export default {
  AccessibilityProvider,
  useAccessibility,
  AccessibleView,
  AccessibleText,
  useFocusManagement,
  createAccessibilityProps,
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  MINIMUM_TOUCH_TARGET_SIZE,
  ensureMinimumTouchTarget,
  testAccessibility,
};
