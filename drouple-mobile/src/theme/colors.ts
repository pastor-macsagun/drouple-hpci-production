/**
 * Drouple Mobile Color System
 * Material Design 3 colors with brand colors
 * Primary: Sacred Blue (#1e7ce8), Secondary: Soft Gold (#e5c453)
 */

export const colors = {
  // Primary brand colors
  primary: {
    main: '#1e7ce8', // Sacred Blue
    light: '#4da3ff',
    dark: '#0056b3',
    contrastText: '#ffffff',
    background: '#e3f2fd', // Light blue background
  },

  secondary: {
    main: '#e5c453', // Soft Gold
    light: '#fff176',
    dark: '#b8960a',
    contrastText: '#000000',
  },

  // Material Design 3 semantic colors
  error: {
    main: '#ba1a1a',
    light: '#ffb4ab',
    dark: '#93000a',
    contrastText: '#ffffff',
  },

  warning: {
    main: '#ff8f00',
    light: '#ffc947',
    dark: '#c56000',
    contrastText: '#000000',
  },

  success: {
    main: '#006e1c',
    light: '#4caf50',
    dark: '#004d40',
    contrastText: '#ffffff',
  },

  info: {
    main: '#0061a4',
    light: '#5dade2',
    dark: '#004881',
    contrastText: '#ffffff',
  },

  // Neutral colors
  surface: {
    main: '#fffbfe',
    variant: '#f7f2fa',
    tint: '#1e7ce8',
    onMain: '#1c1b1f',
    onVariant: '#49454f',
  },

  background: {
    main: '#fffbfe',
    surface: '#f7f2fa',
    elevated: '#f3f0f7',
  },

  outline: {
    main: '#79747e',
    variant: '#cac4d0',
  },

  // Border colors
  border: {
    main: '#cac4d0',
    light: '#e7e0ec',
    dark: '#79747e',
  },

  // Text colors
  text: {
    primary: '#1c1b1f',
    secondary: '#49454f',
    disabled: '#79747e',
    onPrimary: '#ffffff',
    onSecondary: '#000000',
    onSurface: '#1c1b1f',
    onBackground: '#1c1b1f',
  },

  // Role-based colors
  roles: {
    superAdmin: '#6750a4', // Purple
    churchAdmin: '#1e7ce8', // Primary blue
    vip: '#e5c453', // Secondary gold
    leader: '#006e1c', // Success green
    member: '#49454f', // Neutral
  },

  // Status colors
  status: {
    active: '#006e1c',
    inactive: '#79747e',
    pending: '#ff8f00',
    completed: '#0061a4',
    error: '#ba1a1a',
  },

  // Feature-specific colors
  checkin: {
    success: '#006e1c',
    waiting: '#ff8f00',
    closed: '#79747e',
  },

  events: {
    confirmed: '#006e1c',
    waitlisted: '#ff8f00',
    cancelled: '#ba1a1a',
  },

  pathways: {
    inProgress: '#0061a4',
    completed: '#006e1c',
    notStarted: '#79747e',
  },

  // Dark theme colors (for future implementation)
  dark: {
    primary: {
      main: '#4da3ff',
      light: '#87ceeb',
      dark: '#0056b3',
      contrastText: '#000000',
    },

    secondary: {
      main: '#fff176',
      light: '#ffff8f',
      dark: '#c9bc1f',
      contrastText: '#000000',
    },

    surface: {
      main: '#1c1b1f',
      variant: '#49454f',
      tint: '#4da3ff',
      onMain: '#e6e1e5',
      onVariant: '#cac4d0',
    },

    background: {
      main: '#1c1b1f',
      surface: '#2b2930',
    },

    text: {
      primary: '#e6e1e5',
      secondary: '#cac4d0',
      disabled: '#79747e',
      onPrimary: '#000000',
      onSecondary: '#000000',
      onSurface: '#e6e1e5',
      onBackground: '#e6e1e5',
    },
  },
} as const;

export default colors;
