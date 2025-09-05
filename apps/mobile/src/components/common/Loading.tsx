import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface LoadingProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  style?: ViewStyle;
  messageStyle?: TextStyle;
  testID?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'large',
  color = '#1e7ce8',
  message = 'Loading...',
  style,
  messageStyle,
  testID = 'loading-indicator',
}) => {
  return (
    <View
      style={[styles.container, style]}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={message}
    >
      <ActivityIndicator
        size={size}
        color={color}
        testID={`${testID}-spinner`}
      />
      {message && (
        <Text
          style={[styles.message, messageStyle]}
          testID={`${testID}-message`}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

// Full screen loading overlay
export const LoadingOverlay: React.FC<LoadingProps> = (props) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.overlayContent}>
        <Loading {...props} style={undefined} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 100,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
});