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

interface EmptyStateProps {
  title?: string;
  message?: string;
  buttonText?: string;
  onAction?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  messageStyle?: TextStyle;
  testID?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Nothing here yet',
  message = 'It looks like there\'s no content to show.',
  buttonText,
  onAction,
  style,
  titleStyle,
  messageStyle,
  testID = 'empty-state',
  icon = 'inbox',
}) => {
  return (
    <View
      style={[styles.container, style]}
      testID={testID}
      accessibilityRole="image"
      accessibilityLabel={`Empty state: ${title}`}
    >
      <MaterialIcons
        name={icon}
        size={64}
        color="#ccc"
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
      
      {buttonText && onAction && (
        <TouchableOpacity
          style={styles.button}
          onPress={onAction}
          testID={`${testID}-action-button`}
          accessibilityRole="button"
          accessibilityLabel={buttonText}
        >
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Specific empty state variants
export const EmptyCheckins: React.FC<Omit<EmptyStateProps, 'title' | 'message' | 'icon'>> = (
  props
) => {
  return (
    <EmptyState
      title="No Check-ins Today"
      message="Start checking in members for today's services."
      icon="qr-code-scanner"
      buttonText="Start Check-in"
      {...props}
    />
  );
};

export const EmptyEvents: React.FC<Omit<EmptyStateProps, 'title' | 'message' | 'icon'>> = (
  props
) => {
  return (
    <EmptyState
      title="No Upcoming Events"
      message="Check back later for new events and activities."
      icon="event"
      {...props}
    />
  );
};

export const EmptyDirectory: React.FC<Omit<EmptyStateProps, 'title' | 'message' | 'icon'>> = (
  props
) => {
  return (
    <EmptyState
      title="No Members Found"
      message="Try adjusting your search or check back later."
      icon="people"
      {...props}
    />
  );
};

export const EmptyAnnouncements: React.FC<Omit<EmptyStateProps, 'title' | 'message' | 'icon'>> = (
  props
) => {
  return (
    <EmptyState
      title="No Announcements"
      message="Stay tuned for important updates and news."
      icon="campaign"
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
    opacity: 0.6,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 280,
  },
  button: {
    backgroundColor: '#1e7ce8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44,
    minWidth: 44,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});