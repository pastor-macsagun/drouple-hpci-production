import React, { forwardRef, useRef } from 'react';
import {
  Pressable,
  Text,
  View,
  PressableProps,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  AccessibilityRole,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTokens } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'filled' | 'tonal' | 'outline' | 'text' | 'icon';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
  leftIcon?: keyof typeof MaterialIcons.glyphMap;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  testID?: string;
}

export const Button = forwardRef<View, ButtonProps>(({
  variant = 'filled',
  size = 'md',
  children,
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  testID,
  onPress,
  onPressIn,
  onPressOut,
  ...rest
}, ref) => {
  const tokens = useTokens();
  const scale = useSharedValue(1);
  const focusOpacity = useSharedValue(0);
  const longPressRef = useRef<NodeJS.Timeout>();

  // Animation styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const focusRingStyle = useAnimatedStyle(() => ({
    opacity: focusOpacity.value,
  }));

  // Handle press animations and haptics
  const handlePressIn = (event: any) => {
    if (!tokens.reduceMotion) {
      scale.value = withTiming(0.96, { duration: tokens.durations.micro });
    }
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    if (!tokens.reduceMotion) {
      scale.value = withTiming(1, { duration: tokens.durations.micro });
    }
    
    onPressOut?.(event);
  };

  const handlePress = (event: any) => {
    if (loading || disabled) return;
    
    // Success haptic for completed action
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    onPress?.(event);
  };

  // Focus ring for keyboard navigation
  const handleFocusIn = () => {
    if (!tokens.reduceMotion) {
      focusOpacity.value = withTiming(1, { duration: tokens.durations.micro });
    }
  };

  const handleFocusOut = () => {
    if (!tokens.reduceMotion) {
      focusOpacity.value = withTiming(0, { duration: tokens.durations.micro });
    }
  };

  // Get button styles based on variant, size, and state
  const buttonStyles = getButtonStyles(variant, size, disabled, loading, tokens);
  const iconSize = getIconSize(size);
  const showSpinner = loading;
  const isIconOnly = variant === 'icon' && !children;

  return (
    <View style={[fullWidth && { width: '100%' }]}>
      {/* Focus Ring */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            inset: -2,
            borderRadius: buttonStyles.container.borderRadius! + 2,
            borderWidth: 2,
            borderColor: tokens.colors.accent.primary,
          },
          focusRingStyle,
        ]}
        pointerEvents="none"
      />
      
      {/* Button Container */}
      <AnimatedPressable
        ref={ref}
        style={[
          buttonStyles.container,
          fullWidth && { width: '100%' },
          style,
          animatedStyle,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onFocus={handleFocusIn}
        onBlur={handleFocusOut}
        disabled={disabled || loading}
        accessible={true}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
        accessibilityHint={accessibilityHint}
        accessibilityState={{
          disabled: disabled || loading,
          busy: loading,
        }}
        testID={testID}
        {...rest}
      >
        <View style={[
          buttonStyles.content,
          isIconOnly && { justifyContent: 'center' },
        ]}>
          {/* Left Icon */}
          {leftIcon && !showSpinner && (
            <MaterialIcons
              name={leftIcon}
              size={iconSize}
              color={buttonStyles.text.color}
              style={{ marginRight: children ? tokens.spacing.sm : 0 }}
            />
          )}

          {/* Loading Spinner */}
          {showSpinner && (
            <ActivityIndicator
              size="small"
              color={buttonStyles.text.color}
              style={{ marginRight: children ? tokens.spacing.sm : 0 }}
            />
          )}

          {/* Button Text */}
          {children && typeof children === 'string' ? (
            <Text
              style={[buttonStyles.text, textStyle]}
              numberOfLines={1}
              allowFontScaling={true}
              maxFontSizeMultiplier={tokens.fontSize}
            >
              {children}
            </Text>
          ) : (
            children
          )}

          {/* Right Icon */}
          {rightIcon && !showSpinner && (
            <MaterialIcons
              name={rightIcon}
              size={iconSize}
              color={buttonStyles.text.color}
              style={{ marginLeft: children ? tokens.spacing.sm : 0 }}
            />
          )}
        </View>
      </AnimatedPressable>
    </View>
  );
});

Button.displayName = 'Button';

// Helper functions
function getButtonStyles(
  variant: ButtonVariant,
  size: ButtonSize,
  disabled: boolean,
  loading: boolean,
  tokens: ReturnType<typeof useTokens>
) {
  const isDisabled = disabled || loading;
  
  // Size-specific styles
  const sizeStyles = {
    sm: {
      height: 40,
      paddingHorizontal: tokens.spacing.md, // 12px
      paddingVertical: tokens.spacing.sm,   // 8px
      borderRadius: tokens.radii.sm,        // 10px
      fontSize: tokens.typography.label.md.fontSize,
      lineHeight: tokens.typography.label.md.lineHeight,
    },
    md: {
      height: 48,
      paddingHorizontal: tokens.spacing.lg,  // 16px
      paddingVertical: tokens.spacing.md,    // 12px
      borderRadius: tokens.radii.md,         // 14px
      fontSize: tokens.typography.label.lg.fontSize,
      lineHeight: tokens.typography.label.lg.lineHeight,
    },
    lg: {
      height: 56,
      paddingHorizontal: tokens.spacing.xl,  // 20px
      paddingVertical: tokens.spacing.lg,    // 16px
      borderRadius: tokens.radii.md,         // 14px (consistent with md)
      fontSize: tokens.typography.body.md.fontSize,
      lineHeight: tokens.typography.body.md.lineHeight,
    },
  }[size];

  // Variant-specific styles
  const variantStyles = {
    filled: {
      container: {
        backgroundColor: isDisabled 
          ? tokens.colors.border.muted 
          : tokens.colors.brand.primary,
        borderWidth: 0,
      },
      text: {
        color: isDisabled 
          ? tokens.colors.text.tertiary 
          : tokens.colors.brand.contrast,
        fontWeight: '600' as const,
      },
    },
    tonal: {
      container: {
        backgroundColor: isDisabled 
          ? tokens.colors.border.subtle 
          : tokens.colors.accent.muted,
        borderWidth: 0,
      },
      text: {
        color: isDisabled 
          ? tokens.colors.text.tertiary 
          : tokens.colors.accent.contrast,
        fontWeight: '600' as const,
      },
    },
    outline: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: isDisabled 
          ? tokens.colors.border.muted 
          : tokens.colors.brand.primary,
      },
      text: {
        color: isDisabled 
          ? tokens.colors.text.tertiary 
          : tokens.colors.brand.primary,
        fontWeight: '600' as const,
      },
    },
    text: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
      text: {
        color: isDisabled 
          ? tokens.colors.text.tertiary 
          : tokens.colors.brand.primary,
        fontWeight: '600' as const,
      },
    },
    icon: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        width: sizeStyles.height, // Square aspect ratio
        paddingHorizontal: 0,
      },
      text: {
        color: isDisabled 
          ? tokens.colors.text.tertiary 
          : tokens.colors.text.primary,
        fontWeight: '500' as const,
      },
    },
  }[variant];

  return {
    container: {
      ...sizeStyles,
      ...variantStyles.container,
      minHeight: sizeStyles.height,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      opacity: isDisabled ? 0.6 : 1,
      ...tokens.shadows[variant === 'filled' ? 1 : 0],
    },
    content: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    text: {
      ...variantStyles.text,
      fontSize: sizeStyles.fontSize,
      lineHeight: sizeStyles.lineHeight,
      fontFamily: tokens.typography.label.lg.fontFamily,
    },
  };
}

function getIconSize(size: ButtonSize): number {
  return {
    sm: 16,
    md: 20,
    lg: 24,
  }[size];
}