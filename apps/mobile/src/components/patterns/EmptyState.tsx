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

interface EmptyStateProps {
  icon?: keyof typeof MaterialIcons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: React.ReactNode;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  messageStyle?: TextStyle;
  // Accessibility
  testID?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'info',
  title,
  message,
  actionLabel,
  onAction,
  illustration,
  style,
  titleStyle,
  messageStyle,
  testID,
}) => {
  const tokens = useTokens();

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
      accessibilityRole="text"
      accessibilityLabel={`Empty state: ${title}. ${message}`}
    >
      {/* Icon or Custom Illustration */}
      {illustration || (
        <View
          style={{
            marginBottom: tokens.spacing['3xl'],
            opacity: 0.6,
          }}
        >
          <MaterialIcons
            name={icon}
            size={64}
            color={tokens.colors.text.tertiary}
          />
        </View>
      )}

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
        {title}
      </Text>

      {/* Message */}
      <Text
        style={[
          {
            fontSize: tokens.typography.body.lg.fontSize,
            lineHeight: tokens.typography.body.lg.lineHeight,
            color: tokens.colors.text.secondary,
            textAlign: 'center',
            marginBottom: actionLabel ? tokens.spacing['4xl'] : 0,
            maxWidth: 300, // Optimal reading width
            fontFamily: tokens.typography.body.lg.fontFamily,
          },
          messageStyle,
        ]}
        allowFontScaling={true}
        maxFontSizeMultiplier={tokens.fontSize}
      >
        {message}
      </Text>

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button
          variant="tonal"
          onPress={onAction}
          testID={`${testID}-action-button`}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
};

// Predefined empty states for common scenarios
export const EmptyCheckins: React.FC<{ onRefresh?: () => void }> = ({ onRefresh }) => (
  <EmptyState
    icon="people"
    title="No Check-ins Yet"
    message="Nothing here yet. You'll see check-ins for this service as people arrive."
    actionLabel={onRefresh ? "Refresh" : undefined}
    onAction={onRefresh}
    testID="empty-checkins"
  />
);

export const EmptyEvents: React.FC<{ onCreateEvent?: () => void }> = ({ onCreateEvent }) => (
  <EmptyState
    icon="event"
    title="No Events Scheduled"
    message="There are no upcoming events at this time. Check back later or contact your church administrator."
    actionLabel={onCreateEvent ? "Create Event" : undefined}
    onAction={onCreateEvent}
    testID="empty-events"
  />
);

export const EmptyAnnouncements: React.FC<{ onRefresh?: () => void }> = ({ onRefresh }) => (
  <EmptyState
    icon="campaign"
    title="No Announcements"
    message="You're all caught up! There are no new announcements to display."
    actionLabel={onRefresh ? "Check Again" : undefined}
    onAction={onRefresh}
    testID="empty-announcements"
  />
);

export const EmptyDirectory: React.FC<{ onRefresh?: () => void }> = ({ onRefresh }) => (
  <EmptyState
    icon="people"
    title="No Members Found"
    message="No members match your search criteria. Try adjusting your search or check back later."
    actionLabel={onRefresh ? "Refresh" : undefined}
    onAction={onRefresh}
    testID="empty-directory"
  />
);

export const EmptyPathways: React.FC<{ onBrowse?: () => void }> = ({ onBrowse }) => (
  <EmptyState
    icon="school"
    title="No Pathways Started"
    message="Begin your spiritual growth journey by exploring available discipleship pathways."
    actionLabel={onBrowse ? "Browse Pathways" : undefined}
    onAction={onBrowse}
    testID="empty-pathways"
  />
);