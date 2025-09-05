import React, { forwardRef, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ViewStyle,
  TextStyle,
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useTokens } from '@/theme';

type ToastVariant = 'info' | 'success' | 'warning' | 'error';
type ToastPosition = 'top' | 'bottom';

interface ToastProps {
  variant?: ToastVariant;
  position?: ToastPosition;
  title?: string;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  duration?: number; // in milliseconds, 0 for persistent
  visible: boolean;
  onDismiss: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  messageStyle?: TextStyle;
  // Accessibility
  accessibilityLabel?: string;
  testID?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_WIDTH = SCREEN_WIDTH - 32; // 16px margin on each side

export const Toast = forwardRef<View, ToastProps>(({
  variant = 'info',
  position = 'bottom',
  title,
  message,
  action,
  duration = 4000,
  visible,
  onDismiss,
  style,
  titleStyle,
  messageStyle,
  accessibilityLabel,
  testID,
}, ref) => {
  const tokens = useTokens();
  const insets = useSafeAreaInsets();
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const translateY = useSharedValue(position === 'top' ? -200 : 200);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  // Auto-dismiss timer
  useEffect(() => {
    if (visible && duration > 0) {
      timeoutRef.current = setTimeout(() => {
        onDismiss();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration, onDismiss]);

  // Show/hide animations
  useEffect(() => {
    if (visible) {
      // Entry animation
      if (!tokens.reduceMotion) {
        translateY.value = withTiming(0, {
          duration: tokens.durations.medium,
        });
        opacity.value = withTiming(1, {
          duration: tokens.durations.small,
        });
        scale.value = withTiming(1, {
          duration: tokens.durations.medium,
        });
      } else {
        // Instant show for reduced motion
        translateY.value = 0;
        opacity.value = 1;
        scale.value = 1;
      }

      // Haptic feedback
      if (Platform.OS === 'ios') {
        const hapticType = {
          success: Haptics.NotificationFeedbackType.Success,
          warning: Haptics.NotificationFeedbackType.Warning,
          error: Haptics.NotificationFeedbackType.Error,
          info: Haptics.ImpactFeedbackStyle.Light,
        }[variant];

        if (hapticType === Haptics.ImpactFeedbackStyle.Light) {
          Haptics.impactAsync(hapticType);
        } else {
          Haptics.notificationAsync(hapticType as any);
        }
      }
    } else {
      // Exit animation
      if (!tokens.reduceMotion) {
        translateY.value = withTiming(position === 'top' ? -200 : 200, {
          duration: tokens.durations.small,
        });
        opacity.value = withTiming(0, {
          duration: tokens.durations.micro,
        });
        scale.value = withTiming(0.8, {
          duration: tokens.durations.small,
        });
      } else {
        // Instant hide for reduced motion
        translateY.value = position === 'top' ? -200 : 200;
        opacity.value = 0;
        scale.value = 0.8;
      }
    }
  }, [visible, position, tokens.durations, tokens.reduceMotion, variant]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const toastStyles = getToastStyles(variant, position, insets, tokens);
  const iconName = getVariantIcon(variant);

  if (!visible && opacity.value === 0) {
    return null;
  }

  const handleSwipeToDismiss = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onDismiss();
  };

  return (
    <Animated.View
      ref={ref}
      style={[
        toastStyles.container,
        style,
        animatedStyle,
      ]}
      accessible={true}
      accessibilityLabel={
        accessibilityLabel || 
        `${variant} notification: ${title ? `${title}. ` : ''}${message}`
      }
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      testID={testID}
    >
      <Pressable
        style={toastStyles.content}
        onPress={handleSwipeToDismiss}
        accessible={false} // Parent handles accessibility
      >
        {/* Icon */}
        <View style={toastStyles.iconContainer}>
          <MaterialIcons
            name={iconName}
            size={24}
            color={toastStyles.icon.color}
          />
        </View>

        {/* Content */}
        <View style={toastStyles.textContainer}>
          {title && (
            <Text
              style={[toastStyles.title, titleStyle]}
              numberOfLines={1}
              allowFontScaling={true}
              maxFontSizeMultiplier={tokens.fontSize}
            >
              {title}
            </Text>
          )}
          
          <Text
            style={[toastStyles.message, messageStyle]}
            numberOfLines={title ? 2 : 3}
            allowFontScaling={true}
            maxFontSizeMultiplier={tokens.fontSize}
          >
            {message}
          </Text>
        </View>

        {/* Action or Dismiss Button */}
        <View style={toastStyles.actionsContainer}>
          {action ? (
            <Pressable
              style={toastStyles.actionButton}
              onPress={action.onPress}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={toastStyles.actionText}>
                {action.label}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={toastStyles.dismissButton}
              onPress={handleSwipeToDismiss}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Dismiss notification"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons
                name="close"
                size={20}
                color={toastStyles.dismissIcon.color}
              />
            </Pressable>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
});

Toast.displayName = 'Toast';

// Helper functions
function getToastStyles(
  variant: ToastVariant,
  position: ToastPosition,
  insets: ReturnType<typeof useSafeAreaInsets>,
  tokens: ReturnType<typeof useTokens>
) {
  const colorMap = {
    info: {
      background: tokens.colors.state.info,
      text: tokens.colors.brand.contrast,
      border: tokens.colors.state.info,
    },
    success: {
      background: tokens.colors.state.success,
      text: tokens.colors.brand.contrast,
      border: tokens.colors.state.success,
    },
    warning: {
      background: tokens.colors.state.warn,
      text: tokens.colors.brand.contrast,
      border: tokens.colors.state.warn,
    },
    error: {
      background: tokens.colors.state.error,
      text: tokens.colors.brand.contrast,
      border: tokens.colors.state.error,
    },
  }[variant];

  const positionStyles = {
    top: {
      top: insets.top + tokens.spacing.lg,
      bottom: undefined,
    },
    bottom: {
      top: undefined,
      bottom: insets.bottom + tokens.spacing.lg,
    },
  }[position];

  return {
    container: {
      position: 'absolute' as const,
      left: tokens.spacing.lg,
      right: tokens.spacing.lg,
      ...positionStyles,
      zIndex: 1000,
    },
    content: {
      backgroundColor: colorMap.background,
      borderRadius: tokens.radii.md,
      borderWidth: 1,
      borderColor: colorMap.border,
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      padding: tokens.spacing.lg,
      minHeight: 64,
      ...tokens.shadows[2],
    },
    iconContainer: {
      marginRight: tokens.spacing.md,
      paddingTop: 2, // Align with text
    },
    icon: {
      color: colorMap.text,
    },
    textContainer: {
      flex: 1,
      marginRight: tokens.spacing.sm,
    },
    title: {
      fontSize: tokens.typography.label.lg.fontSize,
      lineHeight: tokens.typography.label.lg.lineHeight,
      fontWeight: '600',
      color: colorMap.text,
      marginBottom: 2,
      fontFamily: tokens.typography.label.lg.fontFamily,
    },
    message: {
      fontSize: tokens.typography.body.md.fontSize,
      lineHeight: tokens.typography.body.md.lineHeight,
      color: colorMap.text,
      fontFamily: tokens.typography.body.md.fontFamily,
    },
    actionsContainer: {
      justifyContent: 'center' as const,
    },
    actionButton: {
      paddingHorizontal: tokens.spacing.sm,
      paddingVertical: tokens.spacing.xs,
      borderRadius: tokens.radii.xs,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    actionText: {
      fontSize: tokens.typography.label.lg.fontSize,
      fontWeight: '600',
      color: colorMap.text,
      fontFamily: tokens.typography.label.lg.fontFamily,
    },
    dismissButton: {
      padding: tokens.spacing.xs,
      borderRadius: tokens.radii.xs,
    },
    dismissIcon: {
      color: colorMap.text,
    },
  };
}

function getVariantIcon(variant: ToastVariant): keyof typeof MaterialIcons.glyphMap {
  return {
    info: 'info',
    success: 'check-circle',
    warning: 'warning',
    error: 'error',
  }[variant];
}