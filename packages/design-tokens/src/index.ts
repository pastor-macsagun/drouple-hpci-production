/**
 * Drouple Mobile Design System v1.0
 * Design Tokens Package
 * 
 * Centralized design tokens for consistent theming across
 * mobile and web applications
 */

// Export all token categories
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './radii';
export * from './motion';

// Re-export key types for convenience
export type {
  ColorScheme,
  LightColors,
  DarkColors,
  BrandColors,
} from './colors';

export type {
  TypographyScale,
  TypographyVariant,
  FontFamily,
  FontWeight,
} from './typography';

export type {
  SpacingScale,
  ComponentSpacing,
  LayoutConstants,
} from './spacing';

export type {
  RadiiScale,
  ComponentRadii,
} from './radii';

export type {
  Duration,
  Easing,
  AnimationPreset,
  HapticType,
} from './motion';

// Design system metadata
export const designSystem = {
  name: 'Drouple Mobile Design System',
  version: '1.0.0',
  lastUpdated: '2025-09-05',
  principles: [
    'Christ-centered clarity',
    'Mobile-first, offline-ready',
    'Accessible by default', 
    'Consistent but contextual',
    'Calm motion',
  ],
} as const;