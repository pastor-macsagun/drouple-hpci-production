import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Appearance, AccessibilityInfo } from 'react-native';
import { colorSchemes, type ColorScheme } from '@hpci-chms/design-tokens';

interface ThemeContextValue {
  colorScheme: ColorScheme;
  colors: typeof colorSchemes.light | typeof colorSchemes.dark;
  isDark: boolean;
  toggleTheme: () => void;
  setColorScheme: (scheme: ColorScheme | 'system') => void;
  // Tenant theming
  tenantAccent?: string;
  setTenantAccent: (accent?: string) => void;
  // Accessibility
  reduceMotion: boolean;
  highContrast: boolean;
  fontSize: number; // Dynamic Type scaling
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialColorScheme?: ColorScheme | 'system';
  initialTenantAccent?: string;
}

export function ThemeProvider({ 
  children, 
  initialColorScheme = 'system',
  initialTenantAccent 
}: ThemeProviderProps) {
  // Color scheme state
  const [colorSchemePreference, setColorSchemePreference] = useState<ColorScheme | 'system'>(initialColorScheme);
  const [systemColorScheme, setSystemColorScheme] = useState<ColorScheme>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  );
  
  // Tenant accent override
  const [tenantAccent, setTenantAccent] = useState<string | undefined>(initialTenantAccent);
  
  // Accessibility state
  const [reduceMotion, setReduceMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(1.0);

  // Calculate active color scheme
  const colorScheme = colorSchemePreference === 'system' 
    ? systemColorScheme 
    : colorSchemePreference;
  
  const isDark = colorScheme === 'dark';
  const colors = colorSchemes[colorScheme];

  // Listen to system appearance changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme: newScheme }) => {
      setSystemColorScheme(newScheme === 'dark' ? 'dark' : 'light');
    });

    return () => subscription?.remove();
  }, []);

  // Listen to accessibility changes
  useEffect(() => {
    // Reduce Motion
    const checkReduceMotion = async () => {
      const reduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      setReduceMotion(reduceMotionEnabled);
    };

    // High Contrast (iOS only)
    const checkHighContrast = async () => {
      try {
        const highContrastEnabled = await AccessibilityInfo.isHighTextContrastEnabled?.();
        setHighContrast(highContrastEnabled || false);
      } catch {
        // Android doesn't support this API
        setHighContrast(false);
      }
    };

    checkReduceMotion();
    checkHighContrast();

    // Listen for changes
    const reduceMotionListener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    const highContrastListener = AccessibilityInfo.addEventListener('highTextContrastChanged', setHighContrast);

    return () => {
      reduceMotionListener?.remove();
      highContrastListener?.remove();
    };
  }, []);

  // Font size scaling (Dynamic Type support)
  useEffect(() => {
    // This would integrate with OS font size settings
    // For now, we'll use a default scale
    setFontSize(1.0);
  }, []);

  const toggleTheme = () => {
    setColorSchemePreference(prev => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system';
    });
  };

  const setColorScheme = (scheme: ColorScheme | 'system') => {
    setColorSchemePreference(scheme);
  };

  const contextValue: ThemeContextValue = {
    colorScheme,
    colors,
    isDark,
    toggleTheme,
    setColorScheme,
    tenantAccent,
    setTenantAccent,
    reduceMotion,
    highContrast,
    fontSize,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}