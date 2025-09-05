import { useMemo } from 'react';
import {
  brandColors,
  colorSchemes,
  typography,
  spacing,
  radii,
  durations,
  easings,
  animations,
  shadows,
} from '@hpci-chms/design-tokens';
import { useTheme } from './ThemeProvider';

/**
 * Hook to access design tokens with theme-aware colors and tenant customization
 * Automatically re-contrasts colors when tenant accent changes for accessibility
 */
export function useTokens() {
  const { 
    colorScheme, 
    colors, 
    isDark, 
    tenantAccent, 
    reduceMotion, 
    fontSize,
    highContrast 
  } = useTheme();

  // Memoize tokens to prevent unnecessary re-renders
  const tokens = useMemo(() => {
    // Apply tenant accent override if provided
    const accentColors = tenantAccent 
      ? getAccentWithContrast(tenantAccent, isDark, highContrast)
      : {
          primary: colors.accent.primary,
          muted: colors.accent.muted,
          contrast: colors.accent.contrast,
        };

    // Apply font scaling for Dynamic Type support
    const scaledTypography = scaleTypography(typography, fontSize);

    // Apply motion preferences
    const motionSettings = reduceMotion 
      ? getReducedMotionAnimations(animations)
      : animations;

    return {
      // Color tokens
      colors: {
        ...colors,
        brand: {
          ...colors.brand,
        },
        accent: accentColors,
      },
      
      // Typography with Dynamic Type scaling
      typography: scaledTypography,
      
      // Layout tokens
      spacing,
      radii,
      shadows,
      
      // Motion tokens (respecting reduce motion)
      durations: reduceMotion ? { micro: 0, small: 0, medium: 0, large: 0, extended: 0 } : durations,
      easings,
      animations: motionSettings,
      
      // Theme state
      isDark,
      colorScheme,
      
      // Accessibility flags
      reduceMotion,
      highContrast,
      fontSize,
      
      // Brand constants
      brand: brandColors,
    };
  }, [colors, tenantAccent, isDark, reduceMotion, fontSize, highContrast, colorScheme]);

  return tokens;
}

/**
 * Generate accessible accent colors from tenant override
 * Automatically adjusts contrast ratios to meet WCAG AA (4.5:1)
 */
function getAccentWithContrast(
  accentHex: string, 
  isDark: boolean, 
  highContrast: boolean
) {
  // Parse hex color
  const accent = parseHexColor(accentHex);
  if (!accent) {
    // Fallback to default if invalid hex
    return isDark 
      ? colorSchemes.dark.accent 
      : colorSchemes.light.accent;
  }

  const targetContrast = highContrast ? 7.0 : 4.5; // AA vs AAA
  
  // Calculate appropriate contrast colors
  const contrastColor = isDark ? '#0F1720' : '#FFFFFF';
  const mutedColor = isDark 
    ? adjustColorBrightness(accentHex, -0.8) // Very dark for dark mode
    : adjustColorBrightness(accentHex, 0.9);  // Very light for light mode

  // Verify contrast ratios and adjust if needed
  const primaryColor = ensureContrast(accentHex, contrastColor, targetContrast);

  return {
    primary: primaryColor,
    muted: mutedColor,
    contrast: contrastColor,
  };
}

/**
 * Parse hex color to RGB values
 */
function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate luminance for contrast ratio calculations
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = parseHexColor(color1);
  const rgb2 = parseHexColor(color2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Adjust color brightness while maintaining hue
 */
function adjustColorBrightness(hex: string, factor: number): string {
  const rgb = parseHexColor(hex);
  if (!rgb) return hex;
  
  const adjust = (channel: number) => {
    return Math.max(0, Math.min(255, Math.round(channel * (1 + factor))));
  };
  
  const r = adjust(rgb.r).toString(16).padStart(2, '0');
  const g = adjust(rgb.g).toString(16).padStart(2, '0');
  const b = adjust(rgb.b).toString(16).padStart(2, '0');
  
  return `#${r}${g}${b}`;
}

/**
 * Ensure minimum contrast ratio by adjusting brightness
 */
function ensureContrast(foreground: string, background: string, minRatio: number): string {
  let adjustedColor = foreground;
  let currentRatio = getContrastRatio(adjustedColor, background);
  let iterations = 0;
  const maxIterations = 10;
  
  while (currentRatio < minRatio && iterations < maxIterations) {
    // Darken or lighten based on background
    const isLightBackground = getLuminance(...Object.values(parseHexColor(background) || { r: 0, g: 0, b: 0 })) > 0.5;
    const factor = isLightBackground ? -0.1 : 0.1; // Darken for light bg, lighten for dark bg
    
    adjustedColor = adjustColorBrightness(adjustedColor, factor);
    currentRatio = getContrastRatio(adjustedColor, background);
    iterations++;
  }
  
  return adjustedColor;
}

/**
 * Scale typography for Dynamic Type support
 */
function scaleTypography(baseTypography: typeof typography, scale: number) {
  const scaledTypography = {} as typeof typography;
  
  for (const [category, variants] of Object.entries(baseTypography)) {
    scaledTypography[category as keyof typeof typography] = {} as any;
    
    for (const [variant, styles] of Object.entries(variants)) {
      scaledTypography[category as keyof typeof typography][variant as keyof typeof variants] = {
        ...styles,
        fontSize: Math.round(styles.fontSize * scale),
        lineHeight: Math.round(styles.lineHeight * scale),
      };
    }
  }
  
  return scaledTypography;
}

/**
 * Get reduced motion animation alternatives
 */
function getReducedMotionAnimations(baseAnimations: typeof animations) {
  return {
    ...baseAnimations,
    pageTransition: {
      ...baseAnimations.pageTransition,
      duration: 0, // Instant
      type: 'fade',
    },
    bottomSheet: {
      open: { ...baseAnimations.bottomSheet.open, duration: 0 },
      close: { ...baseAnimations.bottomSheet.close, duration: 0 },
    },
    button: {
      ...baseAnimations.button,
      press: { ...baseAnimations.button.press, duration: 0 },
    },
    modal: {
      ...baseAnimations.modal,
      duration: 0,
      backdrop: { ...baseAnimations.modal.backdrop, duration: 0 },
    },
    toast: {
      enter: { ...baseAnimations.toast.enter, duration: 0 },
      exit: { ...baseAnimations.toast.exit, duration: 0 },
    },
    focus: {
      ...baseAnimations.focus,
      duration: 0,
    },
  };
}