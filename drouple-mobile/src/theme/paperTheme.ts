/**
 * React Native Paper Material Design 3 Theme
 * Configured with Drouple brand colors
 */

import {
  MD3LightTheme,
  MD3DarkTheme,
  configureFonts,
} from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

import { colors } from './colors';

// Custom font configuration (optional)
const fontConfig = {
  ...configureFonts({
    config: {
      fontFamily: 'System', // Uses system fonts (SF Pro on iOS, Roboto on Android)
    },
  }),
};

// Light theme configuration
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  fonts: fontConfig,
  colors: {
    ...MD3LightTheme.colors,

    // Primary colors
    primary: colors.primary.main,
    onPrimary: colors.primary.contrastText,
    primaryContainer: colors.primary.light,
    onPrimaryContainer: colors.primary.dark,

    // Secondary colors
    secondary: colors.secondary.main,
    onSecondary: colors.secondary.contrastText,
    secondaryContainer: colors.secondary.light,
    onSecondaryContainer: colors.secondary.dark,

    // Surface colors
    surface: colors.surface.main,
    onSurface: colors.surface.onMain,
    surfaceVariant: colors.surface.variant,
    onSurfaceVariant: colors.surface.onVariant,

    // Background colors
    background: colors.background.main,
    onBackground: colors.text.onBackground,

    // Error colors
    error: colors.error.main,
    onError: colors.error.contrastText,
    errorContainer: colors.error.light,
    onErrorContainer: colors.error.dark,

    // Outline colors
    outline: colors.outline.main,
    outlineVariant: colors.outline.variant,

    // Surface tint (comment out if not supported in this version)
    // surfaceTint: colors.surface.tint,

    // Inverse colors
    inverseSurface: colors.dark.surface.main,
    inverseOnSurface: colors.dark.surface.onMain,
    inversePrimary: colors.dark.primary.main,
  },
};

// Dark theme configuration (for future implementation)
export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  fonts: fontConfig,
  colors: {
    ...MD3DarkTheme.colors,

    // Primary colors
    primary: colors.dark.primary.main,
    onPrimary: colors.dark.primary.contrastText,
    primaryContainer: colors.dark.primary.dark,
    onPrimaryContainer: colors.dark.primary.light,

    // Secondary colors
    secondary: colors.dark.secondary.main,
    onSecondary: colors.dark.secondary.contrastText,
    secondaryContainer: colors.dark.secondary.dark,
    onSecondaryContainer: colors.dark.secondary.light,

    // Surface colors
    surface: colors.dark.surface.main,
    onSurface: colors.dark.surface.onMain,
    surfaceVariant: colors.dark.surface.variant,
    onSurfaceVariant: colors.dark.surface.onVariant,

    // Background colors
    background: colors.dark.background.main,
    onBackground: colors.dark.text.onBackground,

    // Surface tint (comment out if not supported in this version)
    // surfaceTint: colors.dark.surface.tint,
  },
};

// Theme context type
export interface ThemeContextType {
  theme: MD3Theme;
  isDark: boolean;
  toggleTheme: () => void;
  resetToSystemTheme: () => Promise<void>;
  isSystemTheme: boolean;
  systemColorScheme: 'light' | 'dark' | null;
}

// Default theme
export const defaultTheme = lightTheme;

export default {
  light: lightTheme,
  dark: darkTheme,
  default: defaultTheme,
};
