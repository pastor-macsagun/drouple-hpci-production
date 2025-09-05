import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ErrorStateProps {
  title?: string;
  message?: string;
  buttonText?: string;
  onRetry?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  messageStyle?: TextStyle;
  testID?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an error. Please try again.',
  buttonText = 'Try Again',
  onRetry,
  style,
  titleStyle,
  messageStyle,
  testID = 'error-state',
  icon = 'error-outline',
}) => {
  return (
    <View
      style={[styles.container, style]}
      testID={testID}
      accessibilityRole="alert"
    >
      <MaterialIcons
        name={icon}
        size={64}
        color="#dc3545"
        style={styles.icon}
        testID={`${testID}-icon`}
      />
      
      <Text
        style={[styles.title, titleStyle]}
        testID={`${testID}-title`}
        accessibilityRole="header"
      >
        {title}
      </Text>
      
      <Text
        style={[styles.message, messageStyle]}
        testID={`${testID}-message`}
      >
        {message}
      </Text>
      
      {onRetry && (
        <TouchableOpacity
          style={styles.button}
          onPress={onRetry}
          testID={`${testID}-retry-button`}
          accessibilityRole="button"
          accessibilityLabel={buttonText}
          accessibilityHint="Tap to retry the operation"
        >
          <MaterialIcons name="refresh" size={20} color="#fff" />
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Network error specific component
export const NetworkError: React.FC<Omit<ErrorStateProps, 'title' | 'message' | 'icon'>> = (
  props
) => {
  return (
    <ErrorState
      title="No Connection"
      message="Please check your internet connection and try again."
      icon="wifi-off"
      {...props}
    />
  );
};

// 404 error component
export const NotFoundError: React.FC<Omit<ErrorStateProps, 'title' | 'message' | 'icon'>> = (
  props
) => {
  return (
    <ErrorState
      title="Not Found"
      message="The content you're looking for doesn't exist or has been moved."
      icon="search-off"
      buttonText="Go Back"
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 200,
  },
  icon: {
    marginBottom: 16,
    opacity: 0.8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 300,
  },
  button: {
    backgroundColor: '#1e7ce8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    minWidth: 44,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});