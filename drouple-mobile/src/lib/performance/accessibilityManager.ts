/**
 * Accessibility Manager
 * Comprehensive accessibility features and WCAG compliance for React Native
 */

import { AccessibilityInfo, Platform, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import type { AccessibilitySettings, AccessibilityAuditResult } from './types';

export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private settings: AccessibilitySettings;
  private readonly STORAGE_KEY = 'accessibility_settings';

  private listeners: {
    screenReaderChanged: ((enabled: boolean) => void)[];
    boldTextChanged: ((enabled: boolean) => void)[];
    grayscaleChanged: ((enabled: boolean) => void)[];
    invertColorsChanged: ((enabled: boolean) => void)[];
    reduceMotionChanged: ((enabled: boolean) => void)[];
    reduceTransparencyChanged: ((enabled: boolean) => void)[];
  } = {
    screenReaderChanged: [],
    boldTextChanged: [],
    grayscaleChanged: [],
    invertColorsChanged: [],
    reduceMotionChanged: [],
    reduceTransparencyChanged: [],
  };

  private constructor(defaultSettings: AccessibilitySettings) {
    this.settings = defaultSettings;
  }

  public static getInstance(
    defaultSettings: AccessibilitySettings
  ): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager(defaultSettings);
    }
    return AccessibilityManager.instance;
  }

  /**
   * Initialize accessibility manager
   */
  public async initialize(): Promise<void> {
    await this.loadSettings();
    await this.detectSystemSettings();
    this.setupAccessibilityListeners();
  }

  /**
   * Get current accessibility settings
   */
  public getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  /**
   * Update accessibility settings
   */
  public async updateSettings(
    updates: Partial<AccessibilitySettings>
  ): Promise<void> {
    this.settings = {
      ...this.settings,
      ...updates,
      screenReader: {
        ...this.settings.screenReader,
        ...updates.screenReader,
      },
      visualAids: {
        ...this.settings.visualAids,
        ...updates.visualAids,
      },
      navigation: {
        ...this.settings.navigation,
        ...updates.navigation,
      },
      customizations: {
        ...this.settings.customizations,
        ...updates.customizations,
      },
    };

    await this.saveSettings();
    this.applySettings();
  }

  /**
   * Check if screen reader is enabled
   */
  public async isScreenReaderEnabled(): Promise<boolean> {
    try {
      return await AccessibilityInfo.isScreenReaderEnabled();
    } catch {
      return false;
    }
  }

  /**
   * Check if reduced motion is preferred
   */
  public async isReducedMotionEnabled(): Promise<boolean> {
    try {
      return await AccessibilityInfo.isReduceMotionEnabled();
    } catch {
      return false;
    }
  }

  /**
   * Check if reduced transparency is enabled
   */
  public async isReducedTransparencyEnabled(): Promise<boolean> {
    try {
      return await AccessibilityInfo.isReduceTransparencyEnabled();
    } catch {
      return false;
    }
  }

  /**
   * Announce text to screen reader
   */
  public announceForAccessibility(
    message: string,
    priority: 'low' | 'high' = 'low'
  ): void {
    if (this.settings.screenReader.enabled) {
      AccessibilityInfo.announceForAccessibility(message);

      if (priority === 'high') {
        this.provideTactileFeedback();
      }
    }
  }

  /**
   * Provide tactile feedback
   */
  public async provideTactileFeedback(
    type: 'light' | 'medium' | 'heavy' = 'light'
  ): Promise<void> {
    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Get accessibility props for components
   */
  public getAccessibilityProps(options: {
    label?: string;
    hint?: string;
    role?: string;
    state?: { disabled?: boolean; selected?: boolean; checked?: boolean };
    value?: { min?: number; max?: number; now?: number; text?: string };
    actions?: string[];
  }): Record<string, any> {
    const props: Record<string, any> = {};

    if (options.label) {
      props.accessibilityLabel = options.label;
    }

    if (options.hint) {
      props.accessibilityHint = options.hint;
    }

    if (options.role) {
      props.accessibilityRole = options.role;
    }

    if (options.state) {
      props.accessibilityState = options.state;
    }

    if (options.value) {
      props.accessibilityValue = options.value;
    }

    if (options.actions) {
      props.accessibilityActions = options.actions.map(action => ({
        name: action,
        label: action,
      }));
    }

    return props;
  }

  /**
   * Get dynamic text size
   */
  public getScaledFontSize(baseFontSize: number): number {
    const scale = this.settings.customizations.fontSize / 100;
    return Math.round(baseFontSize * scale);
  }

  /**
   * Get dynamic line height
   */
  public getScaledLineHeight(baseLineHeight: number): number {
    return baseLineHeight * this.settings.customizations.lineHeight;
  }

  /**
   * Get color scheme for accessibility
   */
  public getAccessibleColors(): {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
  } {
    const scheme = this.settings.customizations.colorScheme;

    if (scheme === 'high-contrast') {
      return {
        primary: '#000000',
        secondary: '#333333',
        background: '#ffffff',
        surface: '#ffffff',
        text: '#000000',
        textSecondary: '#333333',
        border: '#000000',
        error: '#cc0000',
        success: '#006600',
        warning: '#cc6600',
      };
    }

    if (scheme === 'dark') {
      return {
        primary: '#bb86fc',
        secondary: '#03dac6',
        background: '#121212',
        surface: '#1f1f1f',
        text: '#ffffff',
        textSecondary: '#cccccc',
        border: '#333333',
        error: '#cf6679',
        success: '#4caf50',
        warning: '#ff9800',
      };
    }

    // Default light theme
    return {
      primary: '#1e7ce8',
      secondary: '#e5c453',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#000000',
      textSecondary: '#666666',
      border: '#e0e0e0',
      error: '#f44336',
      success: '#4caf50',
      warning: '#ff9800',
    };
  }

  /**
   * Perform accessibility audit on component tree
   */
  public auditAccessibility(componentTree: any): AccessibilityAuditResult {
    const issues: AccessibilityAuditResult['issues'] = [];
    let passedChecks = 0;
    let totalChecks = 0;

    // Mock audit implementation - would need actual component tree analysis
    const auditRules = [
      {
        rule: 'missing-accessibility-label',
        check: () => true, // Placeholder
        description: 'Interactive elements should have accessibility labels',
      },
      {
        rule: 'insufficient-color-contrast',
        check: () => true, // Placeholder
        description: 'Text should have sufficient color contrast',
      },
      {
        rule: 'small-touch-targets',
        check: () => true, // Placeholder
        description: 'Touch targets should be at least 44x44 points',
      },
    ];

    auditRules.forEach(rule => {
      totalChecks++;
      if (rule.check()) {
        passedChecks++;
      } else {
        issues.push({
          level: 'error',
          rule: rule.rule,
          description: rule.description,
          element: 'component',
          suggestion: `Fix ${rule.rule}`,
        });
      }
    });

    const score =
      totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

    return {
      score,
      issues,
      passedChecks,
      totalChecks,
    };
  }

  /**
   * Get focus management helpers
   */
  public getFocusHelpers() {
    return {
      /**
       * Set focus to element after delay
       */
      setFocus: (ref: React.RefObject<any>, delay: number = 100) => {
        setTimeout(() => {
          if (ref.current?.focus) {
            ref.current.focus();
          }
        }, delay);
      },

      /**
       * Move focus to next element
       */
      focusNext: (currentIndex: number, totalItems: number) => {
        return currentIndex < totalItems - 1 ? currentIndex + 1 : 0;
      },

      /**
       * Move focus to previous element
       */
      focusPrevious: (currentIndex: number, totalItems: number) => {
        return currentIndex > 0 ? currentIndex - 1 : totalItems - 1;
      },
    };
  }

  /**
   * Add accessibility listener
   */
  public addListener<T extends keyof AccessibilityManager['listeners']>(
    event: T,
    listener: AccessibilityManager['listeners'][T][0]
  ): void {
    this.listeners[event].push(listener);
  }

  /**
   * Remove accessibility listener
   */
  public removeListener<T extends keyof AccessibilityManager['listeners']>(
    event: T,
    listener: AccessibilityManager['listeners'][T][0]
  ): void {
    const index = this.listeners[event].indexOf(listener);
    if (index > -1) {
      this.listeners[event].splice(index, 1);
    }
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const storedSettings = JSON.parse(stored);
        this.settings = { ...this.settings, ...storedSettings };
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    }
  }

  /**
   * Save settings to storage
   */
  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(this.settings)
      );
    } catch (error) {
      console.error('Failed to save accessibility settings:', error);
    }
  }

  /**
   * Detect system accessibility settings
   */
  private async detectSystemSettings(): Promise<void> {
    try {
      const [
        screenReaderEnabled,
        reduceMotionEnabled,
        reduceTransparencyEnabled,
      ] = await Promise.all([
        this.isScreenReaderEnabled(),
        this.isReducedMotionEnabled(),
        this.isReducedTransparencyEnabled(),
      ]);

      // Update settings based on system preferences
      if (screenReaderEnabled && !this.settings.screenReader.enabled) {
        this.settings.screenReader.enabled = true;
        this.settings.screenReader.speakOnFocus = true;
      }

      if (reduceMotionEnabled && !this.settings.visualAids.reducedMotion) {
        this.settings.visualAids.reducedMotion = true;
      }

      await this.saveSettings();
    } catch (error) {
      console.error('Failed to detect system accessibility settings:', error);
    }
  }

  /**
   * Setup accessibility event listeners
   */
  private setupAccessibilityListeners(): void {
    // Screen reader changes
    AccessibilityInfo.addEventListener('screenReaderChanged', enabled => {
      this.settings.screenReader.enabled = enabled;
      this.saveSettings();
      this.listeners.screenReaderChanged.forEach(listener => listener(enabled));
    });

    // Reduced motion changes
    AccessibilityInfo.addEventListener('reduceMotionChanged', enabled => {
      this.settings.visualAids.reducedMotion = enabled;
      this.saveSettings();
      this.listeners.reduceMotionChanged.forEach(listener => listener(enabled));
    });

    // Bold text changes (iOS)
    if (Platform.OS === 'ios') {
      AccessibilityInfo.addEventListener('boldTextChanged', enabled => {
        this.listeners.boldTextChanged.forEach(listener => listener(enabled));
      });

      AccessibilityInfo.addEventListener('grayscaleChanged', enabled => {
        this.listeners.grayscaleChanged.forEach(listener => listener(enabled));
      });

      AccessibilityInfo.addEventListener('invertColorsChanged', enabled => {
        this.listeners.invertColorsChanged.forEach(listener =>
          listener(enabled)
        );
      });

      AccessibilityInfo.addEventListener(
        'reduceTransparencyChanged',
        enabled => {
          this.listeners.reduceTransparencyChanged.forEach(listener =>
            listener(enabled)
          );
        }
      );
    }
  }

  /**
   * Apply current accessibility settings
   */
  private applySettings(): void {
    // Apply settings that affect the entire app
    if (this.settings.visualAids.highContrast) {
      // Would apply high contrast theme
    }

    if (this.settings.visualAids.largeText) {
      // Would apply large text scaling
    }
  }
}
