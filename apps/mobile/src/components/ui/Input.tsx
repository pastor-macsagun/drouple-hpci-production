import React, { forwardRef, useState, useRef } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  ViewStyle,
  TextStyle,
  Platform,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

import { useTokens } from '@/theme';

type InputVariant = 'outlined' | 'filled';
type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<TextInputProps, 'style'> {
  variant?: InputVariant;
  size?: InputSize;
  label?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: keyof typeof MaterialIcons.glyphMap;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  onRightIconPress?: () => void;
  disabled?: boolean;
  required?: boolean;
  containerStyle?: ViewStyle;
  style?: TextStyle;
  labelStyle?: TextStyle;
  helperTextStyle?: TextStyle;
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const Input = forwardRef<TextInput, InputProps>(({
  variant = 'outlined',
  size = 'md',
  label,
  helperText,
  errorText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  disabled = false,
  required = false,
  value,
  placeholder,
  containerStyle,
  style,
  labelStyle,
  helperTextStyle,
  accessibilityLabel,
  accessibilityHint,
  testID,
  onFocus,
  onBlur,
  ...rest
}, ref) => {
  const tokens = useTokens();
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(value));
  
  const focusAnimation = useSharedValue(0);
  const labelAnimation = useSharedValue(hasValue ? 1 : 0);

  const hasError = Boolean(errorText);
  const hasFloatingLabel = Boolean(label);
  const showHelperText = Boolean(helperText || errorText);

  // Update animations when focus or value changes
  React.useEffect(() => {
    if (!tokens.reduceMotion) {
      focusAnimation.value = withTiming(isFocused ? 1 : 0, {
        duration: tokens.durations.small,
      });
      
      if (hasFloatingLabel) {
        labelAnimation.value = withTiming(
          isFocused || hasValue ? 1 : 0,
          { duration: tokens.durations.small }
        );
      }
    }
  }, [isFocused, hasValue, tokens.durations.small, tokens.reduceMotion, hasFloatingLabel]);

  // Animated styles
  const borderStyle = useAnimatedStyle(() => {
    if (tokens.reduceMotion) {
      return {
        borderColor: hasError 
          ? tokens.colors.state.error
          : isFocused 
          ? tokens.colors.accent.primary
          : tokens.colors.border.muted,
      };
    }

    return {
      borderColor: interpolate(
        focusAnimation.value,
        [0, 1],
        [
          hasError ? tokens.colors.state.error : tokens.colors.border.muted,
          hasError ? tokens.colors.state.error : tokens.colors.accent.primary,
        ]
      ) as any,
    };
  });

  const labelStyle_ = useAnimatedStyle(() => {
    if (!hasFloatingLabel || tokens.reduceMotion) {
      return {};
    }

    const scale = interpolate(labelAnimation.value, [0, 1], [1, 0.85]);
    const translateY = interpolate(labelAnimation.value, [0, 1], [0, -24]);

    return {
      transform: [{ scale }, { translateY }],
      position: labelAnimation.value > 0.5 ? 'absolute' : 'relative',
    };
  });

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleChangeText = (text: string) => {
    setHasValue(Boolean(text));
    rest.onChangeText?.(text);
  };

  // Get input styles based on variant, size, and state
  const inputStyles = getInputStyles(variant, size, hasError, isFocused, disabled, tokens);
  const iconSize = getIconSize(size);

  return (
    <View style={[containerStyle]}>
      {/* Static Label (when not floating) */}
      {label && !hasFloatingLabel && (
        <Text
          style={[
            inputStyles.staticLabel,
            labelStyle,
            hasError && { color: tokens.colors.state.error },
          ]}
        >
          {label}
          {required && (
            <Text style={{ color: tokens.colors.state.error }}> *</Text>
          )}
        </Text>
      )}

      {/* Input Container */}
      <View style={[inputStyles.container]}>
        <Animated.View
          style={[
            inputStyles.inputWrapper,
            borderStyle,
            disabled && { opacity: 0.6 },
          ]}
        >
          {/* Left Icon */}
          {leftIcon && (
            <MaterialIcons
              name={leftIcon}
              size={iconSize}
              color={
                hasError
                  ? tokens.colors.state.error
                  : isFocused
                  ? tokens.colors.accent.primary
                  : tokens.colors.text.tertiary
              }
              style={{ marginRight: tokens.spacing.sm }}
            />
          )}

          {/* Floating Label */}
          {hasFloatingLabel && (
            <Animated.Text
              style={[
                inputStyles.floatingLabel,
                labelStyle_,
                labelStyle,
                {
                  color: hasError
                    ? tokens.colors.state.error
                    : isFocused
                    ? tokens.colors.accent.primary
                    : tokens.colors.text.secondary,
                },
              ]}
              pointerEvents="none"
            >
              {label}
              {required && (
                <Text style={{ color: tokens.colors.state.error }}> *</Text>
              )}
            </Animated.Text>
          )}

          {/* Text Input */}
          <TextInput
            ref={ref}
            style={[
              inputStyles.input,
              style,
              hasFloatingLabel && { paddingTop: isFocused || hasValue ? 24 : 16 },
            ]}
            value={value}
            placeholder={hasFloatingLabel ? undefined : placeholder}
            placeholderTextColor={tokens.colors.text.tertiary}
            editable={!disabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChangeText={handleChangeText}
            accessible={true}
            accessibilityLabel={accessibilityLabel || label}
            accessibilityHint={accessibilityHint}
            accessibilityState={{
              disabled,
            }}
            testID={testID}
            allowFontScaling={true}
            maxFontSizeMultiplier={tokens.fontSize}
            {...rest}
          />

          {/* Right Icon */}
          {rightIcon && (
            <Pressable
              onPress={onRightIconPress}
              style={{ padding: tokens.spacing.xs }}
              disabled={disabled || !onRightIconPress}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Input action"
            >
              <MaterialIcons
                name={rightIcon}
                size={iconSize}
                color={
                  hasError
                    ? tokens.colors.state.error
                    : isFocused
                    ? tokens.colors.accent.primary
                    : tokens.colors.text.tertiary
                }
              />
            </Pressable>
          )}
        </Animated.View>
      </View>

      {/* Helper Text / Error Text */}
      {showHelperText && (
        <Text
          style={[
            inputStyles.helperText,
            helperTextStyle,
            hasError && { color: tokens.colors.state.error },
          ]}
        >
          {errorText || helperText}
        </Text>
      )}
    </View>
  );
});

Input.displayName = 'Input';

// Helper functions
function getInputStyles(
  variant: InputVariant,
  size: InputSize,
  hasError: boolean,
  isFocused: boolean,
  disabled: boolean,
  tokens: ReturnType<typeof useTokens>
) {
  // Size-specific styles
  const sizeStyles = {
    sm: {
      height: 40,
      fontSize: tokens.typography.body.md.fontSize,
      lineHeight: tokens.typography.body.md.lineHeight,
      paddingHorizontal: tokens.spacing.md, // 12px
    },
    md: {
      height: 56,
      fontSize: tokens.typography.body.lg.fontSize,
      lineHeight: tokens.typography.body.lg.lineHeight,
      paddingHorizontal: tokens.spacing.lg, // 16px
    },
    lg: {
      height: 64,
      fontSize: tokens.typography.body.lg.fontSize,
      lineHeight: tokens.typography.body.lg.lineHeight,
      paddingHorizontal: tokens.spacing.xl, // 20px
    },
  }[size];

  // Variant-specific styles
  const variantStyles = {
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1,
    },
    filled: {
      backgroundColor: tokens.isDark 
        ? tokens.colors.bg.elevated 
        : tokens.colors.bg.elevated,
      borderWidth: 0,
    },
  }[variant];

  return {
    container: {
      width: '100%',
    },
    inputWrapper: {
      ...variantStyles,
      ...sizeStyles,
      borderRadius: tokens.radii.md, // 14dp
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      minHeight: sizeStyles.height,
      borderColor: tokens.colors.border.muted,
    },
    input: {
      flex: 1,
      fontSize: sizeStyles.fontSize,
      lineHeight: sizeStyles.lineHeight,
      color: tokens.colors.text.primary,
      fontFamily: tokens.typography.body.lg.fontFamily,
      paddingVertical: 0, // Remove default padding for better control
      // Platform-specific text input styles
      ...(Platform.OS === 'ios' && {
        paddingVertical: 16,
      }),
    },
    staticLabel: {
      fontSize: tokens.typography.label.lg.fontSize,
      lineHeight: tokens.typography.label.lg.lineHeight,
      fontWeight: '600',
      color: tokens.colors.text.primary,
      marginBottom: tokens.spacing.xs,
      fontFamily: tokens.typography.label.lg.fontFamily,
    },
    floatingLabel: {
      position: 'absolute' as const,
      left: sizeStyles.paddingHorizontal,
      fontSize: tokens.typography.label.lg.fontSize,
      fontWeight: '500',
      fontFamily: tokens.typography.label.lg.fontFamily,
      backgroundColor: tokens.colors.bg.surface,
      paddingHorizontal: tokens.spacing.xs,
      zIndex: 1,
    },
    helperText: {
      fontSize: tokens.typography.label.md.fontSize,
      lineHeight: tokens.typography.label.md.lineHeight,
      color: tokens.colors.text.secondary,
      marginTop: tokens.spacing.xs,
      fontFamily: tokens.typography.label.md.fontFamily,
    },
  };
}

function getIconSize(size: InputSize): number {
  return {
    sm: 16,
    md: 20,
    lg: 24,
  }[size];
}