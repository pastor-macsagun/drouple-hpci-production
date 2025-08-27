/**
 * Drouple Design System - TypeScript Token Exports
 * 
 * Extracted from landing page audit and existing globals.css
 * Sacred Blue (#1e7ce8) + Soft Gold (#e5c453) brand palette
 * 
 * Use for programmatic access to design tokens in JavaScript/TypeScript
 */

export const tokens = {
  /* ===== BRAND PALETTE ===== */
  color: {
    sacredBlue: "30 124 232",        // #1e7ce8 - Primary brand color
    softGold: "132 107 20",          // #846b14 - WCAG AA compliant secondary brand color
    accent: "30 124 232",            // Sacred Blue as primary accent
    accentSecondary: "132 107 20",   // WCAG AA compliant Soft Gold as secondary accent
    accentInk: "255 255 255",        // Text on accent backgrounds

    /* ===== BASE SURFACES ===== */
    bg: "255 255 255",               // Primary background - pure white
    surface: "248 250 252",          // Elevated surface - slate-50
    elevated: "241 245 249",         // Card/modal backgrounds - slate-100

    /* ===== TEXT COLORS ===== */
    ink: "17 24 39",                 // Primary text - slate-900
    inkMuted: "71 85 105",           // Secondary text - slate-600

    /* ===== BORDERS & OUTLINES ===== */
    border: "226 232 240",           // Default borders - slate-200
    ring: "30 124 232",              // Focus ring - Sacred Blue

    /* ===== SEMANTIC COLORS ===== */
    success: "22 163 74",            // Success states - green-600
    successForeground: "255 255 255", // Text on success backgrounds
    info: "30 124 232",              // Info states - Sacred Blue
    infoForeground: "255 255 255",   // Text on info backgrounds
    warning: "234 179 8",            // Warning states - yellow-500
    warningForeground: "17 24 39",   // Text on warning backgrounds
    danger: "220 38 38",             // Error states - red-600
    dangerForeground: "255 255 255", // Text on danger backgrounds
  },

  /* ===== DARK MODE OVERRIDES ===== */
  colorDark: {
    sacredBlue: "92 140 255",        // Brighter Sacred Blue for dark
    softGold: "200 170 70",          // WCAG AA compliant Soft Gold for dark mode
    accent: "92 140 255",            // Brighter Sacred Blue
    accentSecondary: "200 170 70",   // WCAG AA compliant Soft Gold for dark mode
    accentInk: "17 24 39",           // Dark text on bright accents

    bg: "9 9 11",                    // Primary background - zinc-950
    surface: "24 24 27",             // FIXED: Better contrast surface - zinc-800
    elevated: "39 39 42",            // FIXED: Better contrast elevated - zinc-700

    ink: "250 250 250",              // Primary text - zinc-50
    inkMuted: "161 161 170",         // Secondary text - zinc-400

    border: "39 39 42",              // Default borders - zinc-700
    ring: "92 140 255",              // Focus ring - Bright Sacred Blue

    success: "34 197 94",            // Success states - green-500
    successForeground: "17 24 39",   // Dark text on success
    info: "92 140 255",              // Info states - Bright Sacred Blue
    infoForeground: "17 24 39",      // Dark text on info
    warning: "245 158 11",           // Warning states - amber-500
    warningForeground: "17 24 39",   // Dark text on warning
    danger: "239 68 68",             // Error states - red-500
    dangerForeground: "255 255 255", // White text on danger
  },

  /* ===== TYPOGRAPHY ===== */
  font: {
    sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },

  text: {
    xs: "0.75rem",      // 12px
    sm: "0.875rem",     // 14px
    base: "1rem",       // 16px
    lg: "1.125rem",     // 18px
    xl: "1.25rem",      // 20px
    "2xl": "1.5rem",    // 24px
    "3xl": "1.875rem",  // 30px
    "4xl": "2.25rem",   // 36px
    "5xl": "3rem",      // 48px
    "6xl": "3.75rem",   // 60px
    "7xl": "4.5rem",    // 72px
  },

  lineHeight: {
    tight: "1.25",
    snug: "1.375",
    normal: "1.5",
    relaxed: "1.625",
    loose: "2",
  },

  tracking: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0em",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },

  /* ===== SPACING SCALE ===== */
  space: {
    1: "0.25rem",     // 4px
    2: "0.5rem",      // 8px
    3: "0.75rem",     // 12px
    4: "1rem",        // 16px
    5: "1.25rem",     // 20px
    6: "1.5rem",      // 24px
    8: "2rem",        // 32px
    10: "2.5rem",     // 40px
    12: "3rem",       // 48px
    16: "4rem",       // 64px
    20: "5rem",       // 80px
    24: "6rem",       // 96px
    32: "8rem",       // 128px
  },

  /* ===== BORDER RADIUS ===== */
  radius: {
    sm: "0.5rem",      // 8px
    base: "0.75rem",   // 12px - default
    md: "0.75rem",     // 12px
    lg: "1rem",        // 16px
    xl: "1.25rem",     // 20px
    "2xl": "1.5rem",   // 24px
    full: "9999px",    // Full radius
  },

  /* ===== SHADOWS ===== */
  shadow: {
    sm: "0 1px 2px rgb(0 0 0 / 0.05)",
    base: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    md: "0 4px 12px rgb(0 0 0 / 0.07)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  },

  shadowDark: {
    sm: "0 1px 2px rgb(0 0 0 / 0.35)",
    base: "0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)",
    md: "0 4px 12px rgb(0 0 0 / 0.45)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)",
  },

  /* ===== MOTION ===== */
  ease: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    accelerate: "cubic-bezier(0.4, 0, 1, 1)",
    decelerate: "cubic-bezier(0, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },

  duration: {
    instant: "75ms",
    fast: "150ms",
    base: "200ms",
    slow: "300ms",
    slower: "500ms",
  },
} as const;

/* ===== COMPONENT STATE TOKENS ===== */
export const componentTokens = {
  button: {
    primary: {
      bg: "var(--color-accent)",
      fg: "var(--color-accent-ink)",
      hoverBg: "rgb(var(--color-accent) / 0.9)",
      focusRing: "rgb(var(--color-accent) / 0.5)",
      disabledOpacity: "0.5",
    },
    secondary: {
      bg: "var(--color-accent-secondary)",
      fg: "var(--color-ink)",
      hoverBg: "rgb(var(--color-accent-secondary) / 0.8)",
      focusRing: "rgb(var(--color-accent-secondary) / 0.5)",
      disabledOpacity: "0.5",
    },
    ghost: {
      bg: "transparent",
      fg: "var(--color-ink)",
      hoverBg: "rgb(var(--color-surface))",
      focusRing: "rgb(var(--color-ring) / 0.3)",
    },
    destructive: {
      bg: "var(--color-danger)",
      fg: "var(--color-danger-foreground)",
      hoverBg: "rgb(var(--color-danger) / 0.9)",
      focusRing: "rgb(var(--color-danger) / 0.5)",
    },
  },

  input: {
    bg: "var(--color-bg)",
    fg: "var(--color-ink)",
    border: "var(--color-border)",
    borderFocus: "var(--color-accent)",
    placeholder: "var(--color-ink-muted)",
    focusRing: "rgb(var(--color-accent) / 0.3)",
  },

  card: {
    bg: "var(--color-bg)",
    fg: "var(--color-ink)",
    border: "var(--color-border)",
    shadow: "var(--shadow-md)",
    hoverShadow: "var(--shadow-lg)",
  },

  badge: {
    success: {
      bg: "rgb(var(--color-success) / 0.1)",
      fg: "var(--color-success)",
      border: "rgb(var(--color-success) / 0.2)",
    },
    info: {
      bg: "rgb(var(--color-info) / 0.1)",
      fg: "var(--color-info)",
      border: "rgb(var(--color-info) / 0.2)",
    },
    warning: {
      bg: "rgb(var(--color-warning) / 0.1)",
      fg: "var(--color-warning)",
      border: "rgb(var(--color-warning) / 0.2)",
    },
    danger: {
      bg: "rgb(var(--color-danger) / 0.1)",
      fg: "var(--color-danger)",
      border: "rgb(var(--color-danger) / 0.2)",
    },
  },
} as const;

/* ===== TYPE EXPORTS ===== */
export type ColorToken = keyof typeof tokens.color;
export type SpaceToken = keyof typeof tokens.space;
export type RadiusToken = keyof typeof tokens.radius;
export type ShadowToken = keyof typeof tokens.shadow;
export type TextSizeToken = keyof typeof tokens.text;
export type EaseToken = keyof typeof tokens.ease;
export type DurationToken = keyof typeof tokens.duration;