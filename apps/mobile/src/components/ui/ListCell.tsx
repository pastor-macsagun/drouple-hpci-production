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

interface ListCellProps extends Omit<PressableProps, 'style'> {
  title: string;
  subtitle?: string;
  description?: string;
  leftIcon?: keyof typeof MaterialIcons.glyphMap;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  descriptionStyle?: TextStyle;
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const ListCell = forwardRef<View, ListCellProps>(({
  title,
  subtitle,
  description,
  leftIcon,
  rightIcon,
  leftElement,
  rightElement,
  showChevron = false,
  disabled = false,
  style,
  titleStyle,
  subtitleStyle,
  descriptionStyle,
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
  const backgroundColor = useSharedValue(0);

  const isPressable = Boolean(onPress);
  const hasLeftContent = Boolean(leftIcon || leftElement);
  const hasRightContent = Boolean(rightIcon || rightElement || showChevron);

  // Animation styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: tokens.colors.bg.surface, // Base color, overlay will animate
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0, 0, 0, ${backgroundColor.value * 0.05})`,
  }));

  const handlePressIn = (event: any) => {
    if (!disabled && !tokens.reduceMotion) {
      scale.value = withTiming(0.98, { duration: tokens.durations.micro });
      backgroundColor.value = withTiming(1, { duration: tokens.durations.micro });
    }
    
    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    if (!disabled && !tokens.reduceMotion) {
      scale.value = withTiming(1, { duration: tokens.durations.small });
      backgroundColor.value = withTiming(0, { duration: tokens.durations.small });
    }
    
    onPressOut?.(event);
  };

  const cellStyles = {
    container: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: tokens.spacing.lg, // 16px
      paddingVertical: tokens.spacing.md,   // 12px
      minHeight: tokens.layout.minTouchTarget, // 44px minimum
      backgroundColor: tokens.colors.bg.surface,
    },
    leftContent: {
      marginRight: tokens.spacing.md, // 12px gap
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    content: {
      flex: 1,
      justifyContent: 'center' as const,
    },
    rightContent: {
      marginLeft: tokens.spacing.md, // 12px gap
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    title: {
      fontSize: tokens.typography.body.lg.fontSize,
      lineHeight: tokens.typography.body.lg.lineHeight,
      fontWeight: '600',
      color: disabled ? tokens.colors.text.tertiary : tokens.colors.text.primary,
      fontFamily: tokens.typography.body.lg.fontFamily,
    },
    subtitle: {
      fontSize: tokens.typography.body.md.fontSize,
      lineHeight: tokens.typography.body.md.lineHeight,
      color: disabled ? tokens.colors.text.tertiary : tokens.colors.text.secondary,
      marginTop: 2,
      fontFamily: tokens.typography.body.md.fontFamily,
    },
    description: {
      fontSize: tokens.typography.label.lg.fontSize,
      lineHeight: tokens.typography.label.lg.lineHeight,
      color: disabled ? tokens.colors.text.tertiary : tokens.colors.text.tertiary,
      marginTop: 4,
      fontFamily: tokens.typography.label.lg.fontFamily,
    },
  };

  const content = (
    <View style={[cellStyles.container, style]}>
      {/* Animated overlay for press state */}
      {isPressable && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
            overlayStyle,
          ]}
          pointerEvents="none"
        />
      )}

      {/* Left Content */}
      {hasLeftContent && (
        <View style={cellStyles.leftContent}>
          {leftElement || (
            leftIcon && (
              <MaterialIcons
                name={leftIcon}
                size={24}
                color={disabled ? tokens.colors.text.tertiary : tokens.colors.text.primary}
              />
            )
          )}
        </View>
      )}

      {/* Main Content */}
      <View style={cellStyles.content}>
        <Text
          style={[cellStyles.title, titleStyle]}
          numberOfLines={1}
          allowFontScaling={true}
          maxFontSizeMultiplier={tokens.fontSize}
        >
          {title}
        </Text>
        
        {subtitle && (
          <Text
            style={[cellStyles.subtitle, subtitleStyle]}
            numberOfLines={1}
            allowFontScaling={true}
            maxFontSizeMultiplier={tokens.fontSize}
          >
            {subtitle}
          </Text>
        )}
        
        {description && (
          <Text
            style={[cellStyles.description, descriptionStyle]}
            numberOfLines={2}
            allowFontScaling={true}
            maxFontSizeMultiplier={tokens.fontSize}
          >
            {description}
          </Text>
        )}
      </View>

      {/* Right Content */}
      {hasRightContent && (
        <View style={cellStyles.rightContent}>
          {rightElement || (
            <>
              {rightIcon && (
                <MaterialIcons
                  name={rightIcon}
                  size={20}
                  color={disabled ? tokens.colors.text.tertiary : tokens.colors.text.secondary}
                />
              )}
              {showChevron && (
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={disabled ? tokens.colors.text.tertiary : tokens.colors.text.tertiary}
                />
              )}
            </>
          )}
        </View>
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
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
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
      style={[cellStyles.container, style]}
      accessible={true}
      accessibilityLabel={accessibilityLabel || title}
      testID={testID}
    >
      {content}
    </View>
  );
});

ListCell.displayName = 'ListCell';