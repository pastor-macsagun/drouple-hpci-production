/**
 * Motion tokens for Drouple Mobile Design System v1.0
 * Durations: micro 120ms, small 180ms, medium 220ms, large 300–320ms
 * Calm motion principles with purposeful animations
 */

// Animation durations (in milliseconds)
export const durations = {
  micro: 120,   // Button press, micro-interactions
  small: 180,   // Hover states, small reveals
  medium: 220,  // Page transitions, sheet open
  large: 300,   // Complex transitions, large reveals  
  extended: 320, // Maximum duration for mobile
} as const;

// Easing curves (CSS cubic-bezier format)
export const easings = {
  // Standard Material Design easings
  standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',     // Most common
  decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',   // Enter animations
  accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',     // Exit animations
  
  // Custom easings for specific interactions
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Playful bounce
  smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',   // Smooth ease
} as const;

// React Native Animated easing (for use with Animated API)
export const animatedEasings = {
  // These would be imported from react-native: Easing.bezier()
  standard: [0.4, 0.0, 0.2, 1],
  decelerate: [0.0, 0.0, 0.2, 1], 
  accelerate: [0.4, 0.0, 1, 1],
} as const;

// Animation presets for common interactions
export const animations = {
  // Page transitions
  pageTransition: {
    duration: durations.medium, // 220ms
    easing: easings.standard,
    type: 'slide', // slide, fade, scale
  },
  
  // Bottom sheet
  bottomSheet: {
    open: {
      duration: 240,
      easing: easings.decelerate,
    },
    close: {
      duration: 200, 
      easing: easings.accelerate,
    },
  },
  
  // Button interactions
  button: {
    press: {
      duration: durations.micro, // 120ms
      easing: easings.standard,
      scale: 0.96, // Slight scale down
    },
  },
  
  // Modal/Dialog
  modal: {
    duration: durations.medium, // 220ms
    easing: easings.decelerate,
    backdrop: {
      duration: durations.small, // 180ms
      easing: easings.standard,
    },
  },
  
  // Toast/Snackbar
  toast: {
    enter: {
      duration: durations.small, // 180ms
      easing: easings.decelerate,
    },
    exit: {
      duration: durations.micro, // 120ms  
      easing: easings.accelerate,
    },
  },
  
  // Loading states
  skeleton: {
    duration: 1500, // Longer for skeleton shimmer
    easing: 'linear',
    iterationCount: 'infinite',
  },
  
  // Focus ring
  focus: {
    duration: durations.micro, // 120ms
    easing: easings.standard,
  },
} as const;

// Haptic feedback mapping
export const haptics = {
  // iOS HapticFeedback types
  ios: {
    success: 'notificationSuccess',
    warning: 'notificationWarning', 
    error: 'notificationError',
    selectionChange: 'selectionChanged',
    lightImpact: 'impactLight',
    mediumImpact: 'impactMedium',
    heavyImpact: 'impactHeavy',
  },
  
  // Android vibration patterns (in ms)
  android: {
    success: [50],        // Light tick
    warning: [100],       // Medium tick  
    error: [200, 100, 200], // Error pattern
    selectionChange: [25], // Very light tick
    lightImpact: [50],
    mediumImpact: [100],
    heavyImpact: [150],
  },
} as const;

// Reduce Motion support
export const reducedMotion = {
  // Fallback durations when reduce motion is enabled
  duration: durations.micro, // Very fast (120ms)
  
  // Alternative non-animated affordances
  alternatives: {
    // Instead of slide transition, use instant with opacity change
    pageTransition: 'fade',
    // Instead of scale animation, use opacity  
    buttonPress: 'opacity',
    // Instead of slide up, use fade in
    bottomSheet: 'fade',
  },
} as const;

// Utility types
export type Duration = keyof typeof durations;
export type Easing = keyof typeof easings;
export type AnimationPreset = keyof typeof animations;
export type HapticType = keyof typeof haptics.ios;