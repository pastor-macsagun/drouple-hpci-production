/** @type {import('tailwindcss').Config} */

const { 
  brandColors,
  lightColors, 
  darkColors,
  typography,
  spacing,
  radii,
  durations,
} = require('@hpci-chms/design-tokens');

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Brand colors
      colors: {
        // Brand foundation
        brand: {
          primary: brandColors.primary,
          accent: brandColors.accent,
          white: brandColors.neutral[0],
          black: brandColors.neutral[900],
        },
        
        // Light theme colors
        light: {
          bg: {
            surface: lightColors.bg.surface,
            elevated: lightColors.bg.elevated,
          },
          text: {
            primary: lightColors.text.primary,
            secondary: lightColors.text.secondary,
            tertiary: lightColors.text.tertiary,
            inverse: lightColors.text.inverse,
          },
          border: {
            muted: lightColors.border.muted,
            subtle: lightColors.border.subtle,
            strong: lightColors.border.strong,
          },
          accent: {
            primary: lightColors.accent.primary,
            muted: lightColors.accent.muted,
            contrast: lightColors.accent.contrast,
          },
          state: {
            success: lightColors.state.success,
            'success-muted': lightColors.state.successMuted,
            warn: lightColors.state.warn,
            'warn-muted': lightColors.state.warnMuted,
            error: lightColors.state.error,
            'error-muted': lightColors.state.errorMuted,
            info: lightColors.state.info,
            'info-muted': lightColors.state.infoMuted,
          },
        },
        
        // Dark theme colors  
        dark: {
          bg: {
            surface: darkColors.bg.surface,
            elevated: darkColors.bg.elevated,
          },
          text: {
            primary: darkColors.text.primary,
            secondary: darkColors.text.secondary,
            tertiary: darkColors.text.tertiary,
            inverse: darkColors.text.inverse,
          },
          border: {
            muted: darkColors.border.muted,
            subtle: darkColors.border.subtle,
            strong: darkColors.border.strong,
          },
          accent: {
            primary: darkColors.accent.primary,
            muted: darkColors.accent.muted,
            contrast: darkColors.accent.contrast,
          },
          state: {
            success: darkColors.state.success,
            'success-muted': darkColors.state.successMuted,
            warn: darkColors.state.warn,
            'warn-muted': darkColors.state.warnMuted,
            error: darkColors.state.error,
            'error-muted': darkColors.state.errorMuted,
            info: darkColors.state.info,
            'info-muted': darkColors.state.infoMuted,
          },
        },
      },
      
      // Typography scale
      fontSize: {
        'display-lg': [typography.display.lg.fontSize, typography.display.lg.lineHeight],
        'display-md': [typography.display.md.fontSize, typography.display.md.lineHeight],
        'headline-lg': [typography.headline.lg.fontSize, typography.headline.lg.lineHeight],
        'headline-md': [typography.headline.md.fontSize, typography.headline.md.lineHeight],
        'title-lg': [typography.title.lg.fontSize, typography.title.lg.lineHeight],
        'title-md': [typography.title.md.fontSize, typography.title.md.lineHeight],
        'body-lg': [typography.body.lg.fontSize, typography.body.lg.lineHeight],
        'body-md': [typography.body.md.fontSize, typography.body.md.lineHeight],
        'label-lg': [typography.label.lg.fontSize, typography.label.lg.lineHeight],
        'label-md': [typography.label.md.fontSize, typography.label.md.lineHeight],
      },
      
      // Font families
      fontFamily: {
        heading: ['Montserrat'],
        body: ['Open Sans'],
        mono: ['SF Mono', 'Consolas', 'Monaco'],
      },
      
      // Spacing scale
      spacing: {
        xs: `${spacing.xs}px`,
        sm: `${spacing.sm}px`,
        md: `${spacing.md}px`,
        lg: `${spacing.lg}px`,
        xl: `${spacing.xl}px`,
        '2xl': `${spacing['2xl']}px`,
        '3xl': `${spacing['3xl']}px`,
        '4xl': `${spacing['4xl']}px`,
        '5xl': `${spacing['5xl']}px`,
        '6xl': `${spacing['6xl']}px`,
        '7xl': `${spacing['7xl']}px`,
        '8xl': `${spacing['8xl']}px`,
      },
      
      // Border radius
      borderRadius: {
        xs: `${radii.xs}px`,
        sm: `${radii.sm}px`,
        md: `${radii.md}px`,
        lg: `${radii.lg}px`,
        xl: `${radii.xl}px`,
        pill: `${radii.pill}px`,
      },
      
      // Animation durations
      transitionDuration: {
        micro: `${durations.micro}ms`,
        small: `${durations.small}ms`, 
        medium: `${durations.medium}ms`,
        large: `${durations.large}ms`,
        extended: `${durations.extended}ms`,
      },
      
      // Component-specific utilities
      minHeight: {
        'touch-target': '44px', // Minimum touch target
        'button-sm': '40px',
        'button-md': '48px', 
        'button-lg': '56px',
        'input': '56px',
      },
      
      minWidth: {
        'touch-target': '44px',
        'button-sm': '80px',
        'button-md': '100px',
        'button-lg': '120px',
      },
    },
  },
  plugins: [],
};