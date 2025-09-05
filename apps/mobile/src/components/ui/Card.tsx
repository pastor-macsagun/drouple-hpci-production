import React, { forwardRef } from 'react';
import {
  View,
  ViewProps,
  ViewStyle,
  Pressable,
  PressableProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTokens } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CardVariant = 'elevated' | 'outlined' | 'filled';
type CardPadding = 'none' | 'compact' | 'default' | 'comfortable';

interface BaseCardProps {
  variant?: CardVariant;
  padding?: CardPadding;
  children?: React.ReactNode;
  style?: ViewStyle;
  // Accessibility
  testID?: string;
}

interface StaticCardProps extends BaseCardProps, ViewProps {
  pressable?: false;
}

interface PressableCardProps extends BaseCardProps, Omit<PressableProps, 'style'> {
  pressable: true;
  onPress: PressableProps['onPress'];
  // Accessibility for pressable cards
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: PressableProps['accessibilityRole'];
}

type CardProps = StaticCardProps | PressableCardProps;

export const Card = forwardRef<View, CardProps>((props, ref) => {
  const tokens = useTokens();
  
  if (props.pressable) {
    return <PressableCard {...props} ref={ref} tokens={tokens} />;
  }
  
  return <StaticCard {...props} ref={ref} tokens={tokens} />;
});

// Static Card Component
const StaticCard = forwardRef<View, StaticCardProps & { tokens: ReturnType<typeof useTokens> }>(({
  variant = 'elevated',
  padding = 'default',
  children,
  style,
  testID,
  tokens,
  ...rest
}, ref) => {
  const cardStyles = getCardStyles(variant, padding, false, tokens);

  return (
    <View
      ref={ref}
      style={[cardStyles.container, style]}
      testID={testID}
      {...rest}
    >
      {children}
    </View>
  );
});

// Pressable Card Component
const PressableCard = forwardRef<View, PressableCardProps & { tokens: ReturnType<typeof useTokens> }>(({
  variant = 'elevated',
  padding = 'default',
  children,
  style,
  testID,
  onPress,
  onPressIn,
  onPressOut,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  tokens,
  ...rest
}, ref) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = (event: any) => {
    if (!tokens.reduceMotion) {
      scale.value = withTiming(0.98, { duration: tokens.durations.micro });
      opacity.value = withTiming(0.8, { duration: tokens.durations.micro });
    }
    
    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    if (!tokens.reduceMotion) {
      scale.value = withTiming(1, { duration: tokens.durations.small });
      opacity.value = withTiming(1, { duration: tokens.durations.small });
    }
    
    onPressOut?.(event);
  };

  const cardStyles = getCardStyles(variant, padding, true, tokens);

  return (
    <AnimatedPressable
      ref={ref}
      style={[cardStyles.container, style, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessible={true}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      testID={testID}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
});

// Card subcomponents for structured layouts
export const CardHeader = forwardRef<View, ViewProps>(({
  children,
  style,
  ...rest
}, ref) => {
  const tokens = useTokens();
  
  return (
    <View
      ref={ref}
      style={[
        {
          paddingBottom: tokens.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: tokens.colors.border.subtle,
          marginBottom: tokens.spacing.lg,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
});

export const CardBody = forwardRef<View, ViewProps>(({
  children,
  style,
  ...rest
}, ref) => {
  return (
    <View
      ref={ref}
      style={[{ flex: 1 }, style]}
      {...rest}
    >
      {children}
    </View>
  );
});

export const CardFooter = forwardRef<View, ViewProps>(({
  children,
  style,
  ...rest
}, ref) => {
  const tokens = useTokens();
  
  return (
    <View
      ref={ref}
      style={[
        {
          paddingTop: tokens.spacing.lg,
          marginTop: tokens.spacing.lg,
          borderTopWidth: 1,
          borderTopColor: tokens.colors.border.subtle,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
});

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardBody.displayName = 'CardBody';
CardFooter.displayName = 'CardFooter';

// Helper function to get card styles
function getCardStyles(
  variant: CardVariant,
  padding: CardPadding,
  isPressable: boolean,
  tokens: ReturnType<typeof useTokens>
) {
  // Padding values
  const paddingValue = {
    none: 0,
    compact: tokens.spacing.md,    // 12px
    default: tokens.spacing.lg,    // 16px
    comfortable: tokens.spacing.xl, // 20px
  }[padding];

  // Variant-specific styles
  const variantStyles = {
    elevated: {
      backgroundColor: tokens.colors.bg.surface,
      ...tokens.shadows[2], // Medium elevation
      borderWidth: 0,
    },
    outlined: {
      backgroundColor: tokens.colors.bg.surface,
      borderWidth: 1,
      borderColor: tokens.colors.border.muted,
      ...tokens.shadows[0], // No shadow
    },
    filled: {
      backgroundColor: tokens.colors.bg.elevated,
      borderWidth: 0,
      ...tokens.shadows[0], // No shadow
    },
  }[variant];

  return {
    container: {
      ...variantStyles,
      borderRadius: tokens.radii.lg, // 20dp per spec
      padding: paddingValue,
      // Add subtle interaction states for pressable cards
      ...(isPressable && {
        // Slightly more elevation for pressable cards
        ...tokens.shadows[variant === 'elevated' ? 2 : 1],
      }),
    },
  };
}

// Export card compound component
export default Object.assign(Card, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});