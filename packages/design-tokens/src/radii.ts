/**
 * Border radius tokens for Drouple Mobile Design System v1.0
 * Corner radius: xs:6, sm:10, md:14, lg:20, xl:28, pill:999
 */

// Border radius scale (in dp/pt)
export const radii = {
  none: 0,
  xs: 6,      // Small elements (chips, badges)
  sm: 10,     // Buttons, inputs
  md: 14,     // Cards, containers  
  lg: 20,     // Modals, sheets
  xl: 28,     // Large surfaces
  pill: 999,  // Fully rounded (badges, pills)
} as const;

// Component-specific radius mapping
export const componentRadii = {
  // Buttons
  button: {
    sm: radii.sm,  // 10dp
    md: radii.md,  // 14dp 
    lg: radii.md,  // 14dp (consistent with md)
  },
  
  // Input fields
  input: radii.md,     // 14dp
  
  // Cards and surfaces
  card: radii.lg,      // 20dp
  sheet: radii.lg,     // 20dp (bottom sheets)
  dialog: radii.lg,    // 20dp
  
  // Small components
  chip: radii.pill,    // Fully rounded
  badge: radii.pill,   // Fully rounded
  avatar: radii.pill,  // Fully rounded
  
  // Specific components
  searchBar: radii.pill,  // Fully rounded search
  fab: radii.lg,          // 20dp for FAB (if used)
  
  // Focus rings and borders
  focusRing: radii.md,    // 14dp to match container
} as const;

// iOS/Android platform-specific adjustments
export const platformRadii = {
  ios: {
    // iOS tends to use more rounded corners
    button: radii.sm,  // 10dp
    card: radii.lg,    // 20dp
    sheet: radii.xl,   // 28dp for sheets
  },
  android: {
    // Android Material Design preferences  
    button: radii.sm,  // 10dp
    card: radii.md,    // 14dp
    sheet: radii.lg,   // 20dp
  },
} as const;

// Utility types
export type RadiiScale = keyof typeof radii;
export type ComponentRadii = typeof componentRadii;