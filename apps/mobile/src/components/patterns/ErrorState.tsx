import React from 'react';
import {
  View,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useTokens } from '@/theme';
import { Button } from '@/components/ui';

type ErrorType = 'network' | 'server' | 'permission' | 'validation' | 'generic';

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  actionLabel?: string;
  onRetry?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  messageStyle?: TextStyle;
  // Accessibility
  testID?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'generic',
  title,
  message,
  actionLabel = 'Try Again',
  onRetry,
  secondaryActionLabel,
  onSecondaryAction,
  style,
  titleStyle,
  messageStyle,
  testID,
}) => {
  const tokens = useTokens();
  
  // Get default content based on error type
  const defaultContent = getErrorContent(type);
  const finalTitle = title || defaultContent.title;
  const finalMessage = message || defaultContent.message;
  const icon = defaultContent.icon;

  return (
    <View
      style={[
        {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: tokens.spacing['4xl'],
          paddingVertical: tokens.spacing['6xl'],
        },
        style,
      ]}
      testID={testID}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`Error: ${finalTitle}. ${finalMessage}`}
    >
      {/* Error Icon */}
      <View
        style={{
          backgroundColor: tokens.colors.state.errorMuted,
          borderRadius: tokens.radii.pill,
          width: 80,
          height: 80,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: tokens.spacing['3xl'],
        }}
      >
        <MaterialIcons
          name={icon}
          size={40}
          color={tokens.colors.state.error}
        />
      </View>

      {/* Title */}
      <Text
        style={[
          {
            fontSize: tokens.typography.headline.md.fontSize,
            lineHeight: tokens.typography.headline.md.lineHeight,
            fontWeight: '600',
            color: tokens.colors.text.primary,
            textAlign: 'center',
            marginBottom: tokens.spacing.md,
            fontFamily: tokens.typography.headline.md.fontFamily,
          },
          titleStyle,
        ]}
        allowFontScaling={true}
        maxFontSizeMultiplier={tokens.fontSize}
      >
        {finalTitle}
      </Text>

      {/* Message */}
      <Text
        style={[
          {
            fontSize: tokens.typography.body.lg.fontSize,
            lineHeight: tokens.typography.body.lg.lineHeight,
            color: tokens.colors.text.secondary,
            textAlign: 'center',
            marginBottom: tokens.spacing['4xl'],
            maxWidth: 300, // Optimal reading width
            fontFamily: tokens.typography.body.lg.fontFamily,
          },
          messageStyle,
        ]}
        allowFontScaling={true}
        maxFontSizeMultiplier={tokens.fontSize}
      >
        {finalMessage}
      </Text>

      {/* Actions */}
      <View style={{ alignItems: 'center', gap: tokens.spacing.md }}>
        {/* Primary Action */}
        {onRetry && (
          <Button
            variant="filled"
            onPress={onRetry}
            testID={`${testID}-retry-button`}
            leftIcon="refresh"
          >
            {actionLabel}
          </Button>
        )}

        {/* Secondary Action */}
        {secondaryActionLabel && onSecondaryAction && (
          <Button
            variant="text"
            onPress={onSecondaryAction}
            testID={`${testID}-secondary-button`}
          >
            {secondaryActionLabel}
          </Button>
        )}
      </View>
    </View>
  );
};

// Helper function to get default content for error types
function getErrorContent(type: ErrorType) {
  const content = {
    network: {
      title: 'Connection Problem',
      message: 'We couldn\'t connect to our servers. Please check your internet connection and try again.',
      icon: 'wifi-off' as const,
    },
    server: {
      title: 'Server Error',
      message: 'We\'re having trouble on our end. Please try again in a few moments.',
      icon: 'error' as const,
    },
    permission: {
      title: 'Access Denied',
      message: 'You don\'t have permission to view this content. Contact your administrator if you believe this is an error.',
      icon: 'lock' as const,
    },
    validation: {
      title: 'Invalid Request',
      message: 'Something went wrong with your request. Please check your information and try again.',
      icon: 'warning' as const,
    },
    generic: {
      title: 'Something Went Wrong',
      message: 'We couldn\'t load that right now. Please try again.',
      icon: 'error-outline' as const,
    },
  }[type];

  return content;
}

// Specialized error components for common scenarios
export const NetworkError: React.FC<{
  onRetry?: () => void;
  onGoOffline?: () => void;
}> = ({ onRetry, onGoOffline }) => (
  <ErrorState
    type="network"
    onRetry={onRetry}
    secondaryActionLabel={onGoOffline ? "Use Offline Mode" : undefined}
    onSecondaryAction={onGoOffline}
    testID="network-error"
  />
);

export const ServerError: React.FC<{
  onRetry?: () => void;
  onContactSupport?: () => void;
}> = ({ onRetry, onContactSupport }) => (
  <ErrorState
    type="server"
    onRetry={onRetry}
    secondaryActionLabel={onContactSupport ? "Contact Support" : undefined}
    onSecondaryAction={onContactSupport}
    testID="server-error"
  />
);

export const PermissionError: React.FC<{
  onContactAdmin?: () => void;
  onGoBack?: () => void;
}> = ({ onContactAdmin, onGoBack }) => (
  <ErrorState
    type="permission"
    actionLabel={onGoBack ? "Go Back" : undefined}
    onRetry={onGoBack}
    secondaryActionLabel={onContactAdmin ? "Contact Admin" : undefined}
    onSecondaryAction={onContactAdmin}
    testID="permission-error"
  />
);

export const LoadingError: React.FC<{
  resource: string;
  onRetry?: () => void;
}> = ({ resource, onRetry }) => (
  <ErrorState
    title={`Couldn't Load ${resource}`}
    message={`We had trouble loading the ${resource.toLowerCase()}. Please try again.`}
    onRetry={onRetry}
    testID="loading-error"
  />
);