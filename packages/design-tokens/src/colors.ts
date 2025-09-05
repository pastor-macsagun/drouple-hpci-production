/**
 * Color tokens for Drouple Mobile Design System v1.0
 * Based on brand colors with semantic light/dark mode variants
 */

// Brand Foundation Colors
export const brandColors = {
  primary: '#0C2E4F', // Deep Blue
  accent: '#FFB703',  // Gold
  neutral: {
    0: '#FFFFFF',     // Pure White
    900: '#0A0A0A',   // Nearly Black
  },
} as const;

// Light Theme Semantic Colors
export const lightColors = {
  bg: {
    surface: '#FFFFFF',
    elevated: '#F8F9FA',
  },
  text: {
    primary: '#0C2E4F',
    secondary: '#435365',
    tertiary: '#6B7280',
    inverse: '#FFFFFF',
  },
  border: {
    muted: '#E6EAF0',
    subtle: '#F1F5F9',
    strong: '#D1D5DB',
  },
  brand: {
    primary: '#0C2E4F',
    contrast: '#FFFFFF',
  },
  accent: {
    primary: '#FFB703',
    muted: '#FFF3CD',
    contrast: '#0C2E4F',
  },
  state: {
    success: '#2E7D32',
    successMuted: '#E8F5E8',
    warn: '#B76E00', 
    warnMuted: '#FFF4E5',
    error: '#C62828',
    errorMuted: '#FFEBEE',
    info: '#1976D2',
    infoMuted: '#E3F2FD',
  },
  overlay: {
    scrim: 'rgba(0, 0, 0, 0.4)',
  },
} as const;

// Dark Theme Semantic Colors
export const darkColors = {
  bg: {
    surface: '#0F1720',
    elevated: '#1A202C',
  },
  text: {
    primary: '#E6EFFA',
    secondary: '#B3C0D0',
    tertiary: '#9CA3AF',
    inverse: '#0F1720',
  },
  border: {
    muted: '#243446',
    subtle: '#374151',
    strong: '#4B5563',
  },
  brand: {
    primary: '#8FB7E6', // Tonal variant for dark mode
    contrast: '#0F1720',
  },
  accent: {
    primary: '#FFD480',  // Desaturated gold for dark mode
    muted: '#2D1B00',
    contrast: '#0F1720',
  },
  state: {
    success: '#4ADE80',
    successMuted: '#1A2E1A',
    warn: '#FBBF24',
    warnMuted: '#2D1F00',
    error: '#F87171',
    errorMuted: '#2D1A1A',
    info: '#60A5FA',
    infoMuted: '#1A202D',
  },
  overlay: {
    scrim: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

// Elevation Shadows
export const shadows = {
  0: 'none', // flat
  1: {
    // Subtle shadow (y=1, blur=3, opacity 0.08)
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1, // Android
  },
  2: {
    // Medium shadow (y=2, blur=8, opacity 0.12)
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2, // Android
  },
} as const;

// Export color schemes
export const colorSchemes = {
  light: lightColors,
  dark: darkColors,
} as const;

// Utility types
export type ColorScheme = keyof typeof colorSchemes;
export type LightColors = typeof lightColors;
export type DarkColors = typeof darkColors;
export type BrandColors = typeof brandColors;