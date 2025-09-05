import React, { useEffect } from 'react';
import {
  View,
  ViewStyle,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

import { useTokens } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  testID?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius,
  style,
  testID,
}) => {
  const tokens = useTokens();
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    if (!tokens.reduceMotion) {
      shimmerValue.value = withRepeat(
        withTiming(1, { duration: tokens.animations.skeleton.duration }),
        -1,
        false
      );
    }
  }, [tokens.reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerValue.value,
      [0, 1],
      [-SCREEN_WIDTH, SCREEN_WIDTH],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateX }],
      opacity: tokens.reduceMotion ? 0.2 : interpolate(
        shimmerValue.value,
        [0, 0.5, 1],
        [0.3, 0.8, 0.3],
        Extrapolate.CLAMP
      ),
    };
  });

  return (
    <View
      style={[
        {
          backgroundColor: tokens.colors.border.muted,
          borderRadius: borderRadius ?? tokens.radii.xs,
          width,
          height,
          overflow: 'hidden',
        },
        style,
      ]}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading content"
    >
      {!tokens.reduceMotion && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: tokens.colors.bg.surface,
            },
            animatedStyle,
          ]}
        />
      )}
    </View>
  );
};

// Pre-built skeleton components
export const SkeletonText: React.FC<{
  lines?: number;
  lineHeight?: number;
  gap?: number;
  style?: ViewStyle;
}> = ({ lines = 3, lineHeight = 16, gap = 8, style }) => {
  const screenWidth = SCREEN_WIDTH - 48; // Account for padding

  return (
    <View style={style}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 ? screenWidth * 0.7 : screenWidth}
          style={{ marginBottom: index < lines - 1 ? gap : 0 }}
        />
      ))}
    </View>
  );
};

export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const tokens = useTokens();
  
  return (
    <View style={[
      {
        backgroundColor: tokens.colors.bg.surface,
        borderRadius: tokens.radii.lg,
        padding: tokens.spacing.lg,
        ...tokens.shadows[1],
      },
      style,
    ]}>
      <View style={{ flexDirection: 'row', marginBottom: tokens.spacing.lg }}>
        <Skeleton width={60} height={60} borderRadius={30} />
        <View style={{ flex: 1, marginLeft: tokens.spacing.md }}>
          <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
          <Skeleton width="60%" height={14} />
        </View>
      </View>
      <SkeletonText lines={2} />
    </View>
  );
};

export const SkeletonList: React.FC<{
  itemCount?: number;
  itemHeight?: number;
  showAvatar?: boolean;
  style?: ViewStyle;
}> = ({ itemCount = 5, itemHeight = 72, showAvatar = true, style }) => {
  const tokens = useTokens();
  
  return (
    <View style={style}>
      {Array.from({ length: itemCount }, (_, index) => (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: tokens.spacing.lg,
            paddingVertical: tokens.spacing.md,
            height: itemHeight,
            borderBottomWidth: index < itemCount - 1 ? 1 : 0,
            borderBottomColor: tokens.colors.border.subtle,
          }}
        >
          {showAvatar && (
            <Skeleton
              width={40}
              height={40}
              borderRadius={20}
              style={{ marginRight: tokens.spacing.md }}
            />
          )}
          <View style={{ flex: 1 }}>
            <Skeleton
              width="70%"
              height={16}
              style={{ marginBottom: 6 }}
            />
            <Skeleton
              width="50%"
              height={14}
            />
          </View>
          <Skeleton width={20} height={20} />
        </View>
      ))}
    </View>
  );
};

export const SkeletonButton: React.FC<{
  width?: number;
  height?: number;
  style?: ViewStyle;
}> = ({ width = 120, height = 48, style }) => {
  const tokens = useTokens();
  
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={tokens.radii.md}
      style={style}
    />
  );
};

export const SkeletonImage: React.FC<{
  width?: number | string;
  height?: number;
  aspectRatio?: number;
  style?: ViewStyle;
}> = ({ width = '100%', height, aspectRatio, style }) => {
  const tokens = useTokens();
  const calculatedHeight = height || (aspectRatio ? undefined : 200);
  
  return (
    <Skeleton
      width={width}
      height={calculatedHeight}
      borderRadius={tokens.radii.md}
      style={[
        aspectRatio && { aspectRatio },
        style,
      ]}
    />
  );
};