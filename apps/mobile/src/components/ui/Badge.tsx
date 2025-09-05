import React, { forwardRef } from 'react';
import {
  View,
  Text,
  ViewProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useTokens } from '@/theme';

type BadgeVariant = 'filled' | 'outlined' | 'dot';
type BadgeColor = 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends ViewProps {
  variant?: BadgeVariant;
  color?: BadgeColor;
  size?: BadgeSize;
  label?: string | number;
  icon?: keyof typeof MaterialIcons.glyphMap;
  max?: number; // Maximum number to display before showing "99+"
  showZero?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  // Accessibility
  accessibilityLabel?: string;
  testID?: string;
}

export const Badge = forwardRef<View, BadgeProps>(({
  variant = 'filled',
  color = 'primary',
  size = 'md',
  label,
  icon,
  max = 99,
  showZero = false,
  style,
  textStyle,
  accessibilityLabel,
  testID,
  ...rest
}, ref) => {
  const tokens = useTokens();

  // Handle numeric labels
  const displayLabel = React.useMemo(() => {
    if (typeof label === 'number') {
      if (label === 0 && !showZero) return null;
      return label > max ? `${max}+` : label.toString();
    }
    return label;
  }, [label, max, showZero]);

  // Don't render if no label and not a dot variant
  if (!displayLabel && variant !== 'dot' && !icon) {
    return null;
  }

  const badgeStyles = getBadgeStyles(variant, color, size, tokens);
  const iconSize = getIconSize(size);
  const isDotVariant = variant === 'dot';
  
  return (
    <View
      ref={ref}
      style={[badgeStyles.container, style]}
      accessible={true}
      accessibilityLabel={
        accessibilityLabel || 
        (displayLabel ? `${displayLabel} notifications` : 'Badge')
      }
      accessibilityRole="text"
      testID={testID}
      {...rest}
    >
      {!isDotVariant && (
        <>
          {/* Icon */}
          {icon && (
            <MaterialIcons
              name={icon}
              size={iconSize}
              color={badgeStyles.text.color}
              style={{
                marginRight: displayLabel ? 2 : 0,
              }}
            />
          )}

          {/* Label */}
          {displayLabel && (
            <Text
              style={[badgeStyles.text, textStyle]}
              numberOfLines={1}
              allowFontScaling={false} // Badges should maintain consistent size
            >
              {displayLabel}
            </Text>
          )}
        </>
      )}
    </View>
  );
});

Badge.displayName = 'Badge';

// Helper function to get badge styles
function getBadgeStyles(
  variant: BadgeVariant,
  color: BadgeColor,
  size: BadgeSize,
  tokens: ReturnType<typeof useTokens>
) {
  // Size-specific styles
  const sizeStyles = {
    sm: {
      minHeight: 16,
      minWidth: variant === 'dot' ? 8 : 16,
      paddingHorizontal: variant === 'dot' ? 0 : 6,
      fontSize: tokens.typography.label.md.fontSize - 2, // Extra small
      lineHeight: 12,
    },
    md: {
      minHeight: 20,
      minWidth: variant === 'dot' ? 10 : 20,
      paddingHorizontal: variant === 'dot' ? 0 : 8,
      fontSize: tokens.typography.label.md.fontSize,
      lineHeight: tokens.typography.label.md.lineHeight,
    },
    lg: {
      minHeight: 24,
      minWidth: variant === 'dot' ? 12 : 24,
      paddingHorizontal: variant === 'dot' ? 0 : 10,
      fontSize: tokens.typography.label.lg.fontSize,
      lineHeight: tokens.typography.label.lg.lineHeight,
    },
  }[size];

  // Color mappings
  const colorMap = {
    primary: {
      background: tokens.colors.brand.primary,
      border: tokens.colors.brand.primary,
      text: tokens.colors.brand.contrast,
    },
    accent: {
      background: tokens.colors.accent.primary,
      border: tokens.colors.accent.primary,
      text: tokens.colors.accent.contrast,
    },
    success: {
      background: tokens.colors.state.success,
      border: tokens.colors.state.success,
      text: tokens.colors.brand.contrast,
    },
    warning: {
      background: tokens.colors.state.warn,
      border: tokens.colors.state.warn,
      text: tokens.colors.brand.contrast,
    },
    error: {
      background: tokens.colors.state.error,
      border: tokens.colors.state.error,
      text: tokens.colors.brand.contrast,
    },
    info: {
      background: tokens.colors.state.info,
      border: tokens.colors.state.info,
      text: tokens.colors.brand.contrast,
    },
    neutral: {
      background: tokens.colors.text.tertiary,
      border: tokens.colors.text.tertiary,
      text: tokens.colors.bg.surface,
    },
  }[color];

  // Variant-specific styles
  const variantStyles = {
    filled: {
      container: {
        backgroundColor: colorMap.background,
        borderWidth: 0,
      },
      text: {
        color: colorMap.text,
      },
    },
    outlined: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colorMap.border,
      },
      text: {
        color: colorMap.background,
      },
    },
    dot: {
      container: {
        backgroundColor: colorMap.background,
        borderWidth: 0,
        borderRadius: tokens.radii.pill,
        width: sizeStyles.minWidth,
        height: sizeStyles.minHeight,
      },
      text: {
        color: colorMap.text,
      },
    },
  }[variant];

  return {
    container: {
      ...sizeStyles,
      ...variantStyles.container,
      borderRadius: variant === 'dot' ? tokens.radii.pill : tokens.radii.pill,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
    },
    text: {
      ...variantStyles.text,
      fontSize: sizeStyles.fontSize,
      lineHeight: sizeStyles.lineHeight,
      fontWeight: '600' as const,
      fontFamily: tokens.typography.label.lg.fontFamily,
      textAlign: 'center' as const,
    },
  };
}

function getIconSize(size: BadgeSize): number {
  return {
    sm: 10,
    md: 12,
    lg: 14,
  }[size];
}