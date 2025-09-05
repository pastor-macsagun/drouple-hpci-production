/**
 * Button Component - All variants with states and accessibility
 * Filled/Tonal/Outline/Text/Icon, states: default/hover/pressed/disabled/loading
 */

import React from 'react';
import { 
  Pressable, 
  Text, 
  ActivityIndicator, 
  PressableStateCallbackType, 
  ViewStyle, 
  TextStyle,
  AccessibilityRole 
} from 'react-native';
import { useTokens } from '../../theme/provider';

export type ButtonVariant = 'filled' | 'tonal' | 'outline' | 'text' | 'icon';
export type ButtonSize = 'sm' | 'base' | 'lg';
export type ButtonColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: ButtonColor;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  testID?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  children,
  variant = 'filled',
  size = 'base',
  color = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  testID,
  style,
  textStyle,
}: ButtonProps) {
  const tokens = useTokens();

  // Get color palette
  const colorPalette = tokens.colors[color as keyof typeof tokens.colors] as any;
  const textColor = color === 'primary' ? tokens.colors.white : tokens.colors.gray[900];

  // Style generators based on variant and state
  const getButtonStyle = ({ pressed }: PressableStateCallbackType): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: tokens.radii.base,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      minWidth: tokens.components.button.height[size],
      height: tokens.components.button.height[size],
      paddingHorizontal: tokens.components.button.padding[size].horizontal,
      paddingVertical: tokens.components.button.padding[size].vertical,
    };

    if (fullWidth) {
      baseStyle.alignSelf = 'stretch';
    }

    // Variant-specific styles
    switch (variant) {
      case 'filled':
        baseStyle.backgroundColor = disabled 
          ? tokens.colors.gray[300]
          : pressed 
            ? colorPalette[600] 
            : colorPalette[500];
        break;

      case 'tonal':
        baseStyle.backgroundColor = disabled
          ? tokens.colors.gray[100]
          : pressed
            ? colorPalette[200]
            : colorPalette[100];
        break;

      case 'outline':
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = disabled
          ? tokens.colors.gray[300]
          : pressed
            ? colorPalette[600]
            : colorPalette[500];
        baseStyle.backgroundColor = pressed ? colorPalette[50] : 'transparent';
        break;

      case 'text':
        baseStyle.backgroundColor = pressed 
          ? tokens.colors.gray[100] 
          : 'transparent';
        break;

      case 'icon':
        baseStyle.width = tokens.components.button.height[size];
        baseStyle.paddingHorizontal = 0;
        baseStyle.borderRadius = tokens.radii.full;
        baseStyle.backgroundColor = pressed
          ? tokens.colors.gray[100]
          : 'transparent';
        break;
    }

    // Apply custom style
    return { ...baseStyle, ...style };
  };

  const getTextStyle = ({ pressed }: PressableStateCallbackType): TextStyle => {
    const baseTextStyle: TextStyle = {
      ...tokens.typography[size === 'sm' ? 'small' : size === 'lg' ? 'body' : 'body'],
      fontWeight: variant === 'text' ? '500' : '600',
      textAlign: 'center',
    };

    // Text color based on variant
    switch (variant) {
      case 'filled':
        baseTextStyle.color = disabled 
          ? tokens.colors.gray[500]
          : textColor;
        break;

      case 'tonal':
      case 'outline':
      case 'text':
      case 'icon':
        baseTextStyle.color = disabled
          ? tokens.colors.gray[400]
          : pressed
            ? colorPalette[700]
            : colorPalette[600];
        break;
    }

    return { ...baseTextStyle, ...textStyle };
  };

  const isInteractive = !disabled && !loading;

  return (
    <Pressable
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      style={getButtonStyle}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled,
        busy: loading,
      }}
      testID={testID}
    >
      {({ pressed }) => (
        <>
          {loading && (
            <ActivityIndicator
              size="small"
              color={getTextStyle({ pressed }).color}
              style={{ marginRight: typeof children === 'string' ? 8 : 0 }}
            />
          )}
          
          {typeof children === 'string' ? (
            <Text style={getTextStyle({ pressed })}>
              {children}
            </Text>
          ) : (
            children
          )}
        </>
      )}
    </Pressable>
  );
}