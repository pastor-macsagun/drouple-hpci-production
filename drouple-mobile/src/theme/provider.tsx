/**
 * Theme Provider - Context for design tokens with tenant accent override
 * Auto re-contrast when tenant accent changes, respect Reduce Motion
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Appearance, ColorSchemeName, AccessibilityInfo } from 'react-native';
import { theme as defaultTheme, colors as defaultColors, type Theme, type Colors } from './tokens';

interface ThemeContextValue {
  theme: Theme;
  colorScheme: 'light' | 'dark';
  isHighContrast: boolean;
  prefersReducedMotion: boolean;
  tenantAccent?: string;
  setTenantAccent: (color?: string) => void;
  toggleColorScheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  tenantAccent?: string;
}

// WCAG AA contrast ratio calculation
function calculateContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const toLinear = (val: number) => 
      val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    
    const rLinear = toLinear(r);
    const gLinear = toLinear(g);
    const bLinear = toLinear(b);
    
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Generate accessible color palette from tenant accent
function generateAccentPalette(accentColor: string): Colors['primary'] {
  // This is a simplified implementation
  // In production, you'd use a proper color manipulation library
  const baseColor = accentColor;
  
  return {
    50: '#EBF8FF', // Light tint
    100: '#BEE3F8',
    200: '#90CDF4',
    300: '#63B3ED',
    400: '#4299E1',
    500: baseColor, // Main color
    600: baseColor, // Slightly darker
    700: '#2C5AA0', // Darker
    800: '#2A4365',
    900: '#1A365D', // Darkest
  };
}

// Create themed colors based on color scheme and tenant accent
function createThemedColors(
  colorScheme: 'light' | 'dark',
  tenantAccent?: string,
  isHighContrast: boolean = false
): Colors {
  const baseColors = { ...defaultColors };
  
  // Apply tenant accent color if provided
  if (tenantAccent) {
    const contrast = calculateContrastRatio(tenantAccent, '#FFFFFF');
    if (contrast >= 4.5) { // Meets WCAG AA standard
      baseColors.primary = generateAccentPalette(tenantAccent);
    }
  }
  
  // Apply dark mode adjustments
  if (colorScheme === 'dark') {
    return {
      ...baseColors,
      gray: {
        50: '#202124',
        100: '#3c4043',
        200: '#5f6368',
        300: '#80868b',
        400: '#9aa0a6',
        500: '#bdc1c6',
        600: '#dadce0',
        700: '#e8eaed',
        800: '#f1f3f4',
        900: '#f8f9fa',
      },
      white: '#000000',
      black: '#FFFFFF',
    };
  }
  
  // Apply high contrast adjustments
  if (isHighContrast) {
    return {
      ...baseColors,
      primary: {
        ...baseColors.primary,
        500: '#0000FF', // True blue for maximum contrast
      },
      gray: {
        ...baseColors.gray,
        900: '#000000', // Pure black
        50: '#FFFFFF',  // Pure white
      },
    };
  }
  
  return baseColors;
}

export function ThemeProvider({ children, tenantAccent: initialTenantAccent }: ThemeProviderProps) {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [tenantAccent, setTenantAccent] = useState<string | undefined>(initialTenantAccent);

  // Initialize system preferences
  useEffect(() => {
    // Color scheme
    const systemColorScheme = Appearance.getColorScheme();
    if (systemColorScheme) {
      setColorScheme(systemColorScheme);
    }

    const colorSchemeListener = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme) {
        setColorScheme(colorScheme);
      }
    });

    // High contrast mode
    AccessibilityInfo.isHighContrastEnabled().then(setIsHighContrast);
    const highContrastListener = AccessibilityInfo.addEventListener(
      'highContrastChanged',
      setIsHighContrast
    );

    // Reduced motion
    AccessibilityInfo.isReduceMotionEnabled().then(setPrefersReducedMotion);
    const reducedMotionListener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setPrefersReducedMotion
    );

    return () => {
      colorSchemeListener?.remove();
      highContrastListener?.remove();
      reducedMotionListener?.remove();
    };
  }, []);

  // Create themed values
  const themedColors = createThemedColors(colorScheme, tenantAccent, isHighContrast);
  
  const themedMotion = prefersReducedMotion 
    ? {
        ...defaultTheme.motion,
        duration: {
          fast: 0,
          base: 0,
          slow: 0,
        },
      }
    : defaultTheme.motion;

  const theme: Theme = {
    ...defaultTheme,
    colors: themedColors,
    motion: themedMotion,
  };

  const toggleColorScheme = () => {
    setColorScheme(current => current === 'light' ? 'dark' : 'light');
  };

  const contextValue: ThemeContextValue = {
    theme,
    colorScheme,
    isHighContrast,
    prefersReducedMotion,
    tenantAccent,
    setTenantAccent,
    toggleColorScheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Convenience hooks
export function useTokens() {
  const { theme } = useTheme();
  return theme;
}

export function useColors() {
  const { theme } = useTheme();
  return theme.colors;
}

export function useColorScheme() {
  const { colorScheme, toggleColorScheme } = useTheme();
  return { colorScheme, toggleColorScheme };
}

export function useAccessibilityPreferences() {
  const { isHighContrast, prefersReducedMotion } = useTheme();
  return { isHighContrast, prefersReducedMotion };
}