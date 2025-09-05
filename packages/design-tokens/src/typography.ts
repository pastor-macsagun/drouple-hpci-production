/**
 * Typography tokens for Drouple Mobile Design System v1.0
 * Based on Material 3 roles with brand fonts
 */

// Font Families
export const fontFamilies = {
  heading: 'Montserrat', // Brand font for headings
  body: 'Open Sans',     // Brand font for body text
  // Platform fallbacks
  ios: 'SF Pro Text',
  android: 'Roboto',
  mono: 'SF Mono',
} as const;

// Font Weights
export const fontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600', 
  bold: '700',
  extrabold: '800',
} as const;

// Typography Scale (aligned to Material 3)
export const typography = {
  // Display styles (largest)
  display: {
    lg: {
      fontFamily: fontFamilies.heading,
      fontSize: 34,
      lineHeight: 40,
      fontWeight: fontWeights.bold,
      letterSpacing: -0.25,
    },
    md: {
      fontFamily: fontFamilies.heading,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: fontWeights.bold,
      letterSpacing: 0,
    },
  },
  // Headlines
  headline: {
    lg: {
      fontFamily: fontFamilies.heading,
      fontSize: 24,
      lineHeight: 30,
      fontWeight: fontWeights.semibold,
      letterSpacing: 0,
    },
    md: {
      fontFamily: fontFamilies.heading,
      fontSize: 22,
      lineHeight: 28,
      fontWeight: fontWeights.semibold,
      letterSpacing: 0,
    },
  },
  // Titles
  title: {
    lg: {
      fontFamily: fontFamilies.heading,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: fontWeights.semibold,
      letterSpacing: 0,
    },
    md: {
      fontFamily: fontFamilies.heading,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: fontWeights.semibold,
      letterSpacing: 0.15,
    },
  },
  // Body text
  body: {
    lg: {
      fontFamily: fontFamilies.body,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: fontWeights.regular,
      letterSpacing: 0.15,
    },
    md: {
      fontFamily: fontFamilies.body,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: fontWeights.regular,
      letterSpacing: 0.25,
    },
  },
  // Labels
  label: {
    lg: {
      fontFamily: fontFamilies.body,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: fontWeights.semibold,
      letterSpacing: 0.1,
    },
    md: {
      fontFamily: fontFamilies.body,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: fontWeights.semibold,
      letterSpacing: 0.5,
    },
  },
} as const;

// Dynamic Type Support (iOS/Android font scaling)
export const dynamicTypeScales = {
  xSmall: 0.82,   // -3
  small: 0.88,    // -2  
  medium: 0.94,   // -1
  large: 1.0,     // 0 (base)
  xLarge: 1.06,   // +1
  xxLarge: 1.12,  // +2 (max supported: 120%)
  xxxLarge: 1.2,  // +3 (accessibility)
} as const;

// Typography Guidelines
export const typographyGuidelines = {
  maxCharsPerLine: 70,
  optimalCharsPerLine: 45,
  lineHeightRange: [1.35, 1.5],
  maxDynamicScale: 1.2, // 120% as per spec
} as const;

// Utility types
export type TypographyScale = typeof typography;
export type TypographyVariant = keyof typeof typography;
export type FontFamily = keyof typeof fontFamilies;
export type FontWeight = keyof typeof fontWeights;