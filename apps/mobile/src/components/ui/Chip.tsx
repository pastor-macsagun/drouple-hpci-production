import React, { forwardRef } from 'react';
import {
  View,
  Text,
  Pressable,
  PressableProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTokens } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ChipVariant = 'filled' | 'outlined' | 'tonal';
type ChipSize = 'sm' | 'md';

interface ChipProps extends Omit<PressableProps, 'style'> {
  variant?: ChipVariant;
  size?: ChipSize;
  label: string;
  leftIcon?: keyof typeof MaterialIcons.glyphMap;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  onRightIconPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const Chip = forwardRef<View, ChipProps>(({
  variant = 'filled',
  size = 'md',
  label,
  leftIcon,
  rightIcon,
  onRightIconPress,
  selected = false,
  disabled = false,
  style,
  labelStyle,
  accessibilityLabel,
  accessibilityHint,
  testID,
  onPress,
  onPressIn,
  onPressOut,
  ...rest
}, ref) => {
  const tokens = useTokens();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const isPressable = Boolean(onPress);
  const hasRightAction = Boolean(onRightIconPress);

  // Animation styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = (event: any) => {
    if (!disabled && !tokens.reduceMotion) {
      scale.value = withTiming(0.95, { duration: tokens.durations.micro });
      opacity.value = withTiming(0.8, { duration: tokens.durations.micro });
    }
    
    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    if (!disabled && !tokens.reduceMotion) {
      scale.value = withTiming(1, { duration: tokens.durations.small });
      opacity.value = withTiming(1, { duration: tokens.durations.small });
    }
    
    onPressOut?.(event);
  };

  // Get chip styles based on variant, size, and state
  const chipStyles = getChipStyles(variant, size, selected, disabled, tokens);
  const iconSize = size === 'sm' ? 14 : 16;

  const content = (
    <View style={[chipStyles.container, style]}>
      {/* Left Icon */}
      {leftIcon && (
        <MaterialIcons
          name={leftIcon}
          size={iconSize}
          color={chipStyles.text.color}
          style={{ marginRight: tokens.spacing.xs }}
        />
      )}

      {/* Label */}
      <Text
        style={[chipStyles.text, labelStyle]}
        numberOfLines={1}
        allowFontScaling={true}
        maxFontSizeMultiplier={tokens.fontSize}
      >
        {label}
      </Text>

      {/* Right Icon */}
      {rightIcon && (
        <Pressable
          onPress={onRightIconPress}
          style={{
            marginLeft: tokens.spacing.xs,
            padding: 2,
            borderRadius: tokens.radii.pill,
          }}
          disabled={disabled || !onRightIconPress}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={hasRightAction ? "Remove" : undefined}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons
            name={rightIcon}
            size={iconSize}
            color={chipStyles.text.color}
          />
        </Pressable>
      )}
    </View>
  );

  if (isPressable) {
    return (
      <AnimatedPressable
        ref={ref}
        style={[animatedStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{
          disabled,
          selected,
        }}
        testID={testID}
        {...rest}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <View
      ref={ref}
      style={[chipStyles.container, style]}
      accessible={true}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityRole="text"
      testID={testID}
    >
      {content}
    </View>
  );
});

Chip.displayName = 'Chip';

// Helper function to get chip styles
function getChipStyles(
  variant: ChipVariant,
  size: ChipSize,
  selected: boolean,
  disabled: boolean,
  tokens: ReturnType<typeof useTokens>
) {
  // Size-specific styles
  const sizeStyles = {
    sm: {
      height: 24,
      paddingHorizontal: tokens.spacing.sm, // 8px
      fontSize: tokens.typography.label.md.fontSize,
      lineHeight: tokens.typography.label.md.lineHeight,
    },
    md: {
      height: 32,
      paddingHorizontal: tokens.spacing.md, // 12px
      fontSize: tokens.typography.label.lg.fontSize,
      lineHeight: tokens.typography.label.lg.lineHeight,
    },
  }[size];

  // Base styles
  const baseContainer = {
    ...sizeStyles,
    borderRadius: tokens.radii.pill, // Fully rounded
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: sizeStyles.height,
  };

  const baseText = {
    fontSize: sizeStyles.fontSize,
    lineHeight: sizeStyles.lineHeight,
    fontWeight: '500' as const,
    fontFamily: tokens.typography.label.lg.fontFamily,
  };

  // Variant-specific styles
  if (disabled) {
    return {
      container: {
        ...baseContainer,
        backgroundColor: tokens.colors.border.muted,
        borderWidth: 0,
        opacity: 0.6,
      },
      text: {
        ...baseText,
        color: tokens.colors.text.tertiary,
      },
    };
  }

  const variantStyles = {
    filled: {
      container: {
        ...baseContainer,
        backgroundColor: selected 
          ? tokens.colors.accent.primary 
          : tokens.colors.bg.elevated,
        borderWidth: 0,
      },
      text: {
        ...baseText,
        color: selected 
          ? tokens.colors.accent.contrast 
          : tokens.colors.text.primary,
      },
    },
    outlined: {
      container: {
        ...baseContainer,
        backgroundColor: selected 
          ? tokens.colors.accent.muted 
          : 'transparent',
        borderWidth: 1,
        borderColor: selected 
          ? tokens.colors.accent.primary 
          : tokens.colors.border.strong,
      },
      text: {
        ...baseText,
        color: selected 
          ? tokens.colors.accent.primary 
          : tokens.colors.text.primary,
      },
    },
    tonal: {
      container: {
        ...baseContainer,
        backgroundColor: selected 
          ? tokens.colors.accent.primary 
          : tokens.colors.accent.muted,
        borderWidth: 0,
      },
      text: {
        ...baseText,
        color: selected 
          ? tokens.colors.accent.contrast 
          : tokens.colors.accent.primary,
      },
    },
  }[variant];

  return variantStyles;
}