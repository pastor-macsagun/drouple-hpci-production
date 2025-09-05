/**
 * Spacing tokens for Drouple Mobile Design System v1.0
 * Base unit: 4dp with scale: 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64
 */

// Base spacing unit
export const BASE_UNIT = 4;

// Spacing scale (in dp/pt)
export const spacing = {
  xs: 4,    // 1 unit
  sm: 8,    // 2 units  
  md: 12,   // 3 units
  lg: 16,   // 4 units
  xl: 20,   // 5 units
  '2xl': 24,  // 6 units
  '3xl': 28,  // 7 units
  '4xl': 32,  // 8 units
  '5xl': 40,  // 10 units
  '6xl': 48,  // 12 units
  '7xl': 56,  // 14 units
  '8xl': 64,  // 16 units
} as const;

// Component-specific spacing
export const componentSpacing = {
  // Button padding
  button: {
    sm: { horizontal: 12, vertical: 8 },   // 40dp height
    md: { horizontal: 16, vertical: 12 },  // 48dp height  
    lg: { horizontal: 20, vertical: 16 },  // 56dp height
  },
  
  // Input field padding
  input: {
    horizontal: 16,
    vertical: 16, // For 56dp height fields
  },
  
  // Card padding
  card: {
    default: 16,
    compact: 12,
    comfortable: 20,
  },
  
  // List item padding
  listItem: {
    horizontal: 16,
    vertical: 12,
    gap: 12, // Between icon and text
  },
  
  // Screen margins
  screen: {
    horizontal: 16,
    vertical: 20,
  },
  
  // Safe area insets (minimum distances)
  safeArea: {
    bottom: 16, // Above home indicator
    top: 8,     // Below notch/status bar
  },
} as const;

// Layout constants
export const layout = {
  // Minimum touch target (44x44 pt per Apple HIG / Material)
  minTouchTarget: 44,
  
  // Comfortable touch target
  touchTarget: 48,
  
  // Container max width for readability
  maxContentWidth: 768,
  
  // Bottom tab bar height
  tabBarHeight: 84, // Including safe area
  
  // Navigation header height
  headerHeight: {
    ios: 44,
    android: 56,
  },
} as const;

// Grid system (if needed)
export const grid = {
  columns: 12,
  gutter: spacing.lg, // 16dp
  margin: spacing.lg,  // 16dp
} as const;

// Utility types
export type SpacingScale = keyof typeof spacing;
export type ComponentSpacing = typeof componentSpacing;
export type LayoutConstants = typeof layout;