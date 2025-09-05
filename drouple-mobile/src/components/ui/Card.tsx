/**
 * Card Component - Modern design with shadows and hover effects
 */

import React from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import { useTokens } from '../../theme/provider';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'sm' | 'base' | 'lg' | 'none';
  pressable?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export function Card({
  children,
  variant = 'elevated',
  padding = 'base',
  pressable = false,
  onPress,
  style,
  testID,
}: CardProps) {
  const tokens = useTokens();

  const cardStyle: ViewStyle = {
    borderRadius: tokens.radii.lg,
    backgroundColor: tokens.colors.white,
    overflow: 'hidden',
  };

  // Apply padding
  if (padding !== 'none') {
    cardStyle.padding = tokens.components.card.padding[padding];
  }

  // Apply variant styles
  switch (variant) {
    case 'elevated':
      Object.assign(cardStyle, tokens.shadows.base);
      break;
      
    case 'outlined':
      cardStyle.borderWidth = 1;
      cardStyle.borderColor = tokens.colors.gray[200];
      break;
      
    case 'filled':
      cardStyle.backgroundColor = tokens.colors.gray[50];
      break;
  }

  // Merge custom styles
  const finalStyle = { ...cardStyle, ...style };

  if (pressable && onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          ...finalStyle,
          opacity: pressed ? 0.95 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
        testID={testID}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={finalStyle} testID={testID}>
      {children}
    </View>
  );
}