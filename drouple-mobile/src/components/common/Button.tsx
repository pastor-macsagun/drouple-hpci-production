/**
 * Custom Button Component
 * Extends React Native Paper Button with app-specific styling
 */

import React from 'react';
import { Button as PaperButton, ButtonProps } from 'react-native-paper';
import type { StyleProp, ViewStyle } from 'react-native';

interface CustomButtonProps extends Omit<ButtonProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

export const Button: React.FC<CustomButtonProps> = ({
  style,
  fullWidth = false,
  ...props
}) => {
  return (
    <PaperButton style={[fullWidth && { width: '100%' }, style]} {...props} />
  );
};

export default Button;
