/**
 * Notification Settings Screen
 * Allows users to manage notification preferences and permissions
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  Switch,
  List,
  Button,
  Chip,
  Divider,
  IconButton,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

import { colors } from '@/theme/colors';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationPreferences {
  eventReminders: boolean;
  serviceReminders: boolean;
  rsvpConfirmations: boolean;
  announcements: boolean;
  reminderTime: number; // minutes before event
}

export const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    isInitialized,
    permissionStatus,
    pushToken,
    initialize,
    requestPermissions,
    getScheduledNotifications,
    cancelAllNotifications,
  } = useNotifications();

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    eventReminders: true,
    serviceReminders: true,
    rsvpConfirmations: true,
    announcements: true,
    reminderTime: 60, // 1 hour
  });

  const [scheduledCount, setScheduledCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      loadScheduledNotifications();
    }
  }, [isInitialized]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);

      // Initialize notifications if not already done
      if (!isInitialized) {
        await initialize();
      }

      // Load preferences from storage (in real app)
      // For now, use default preferences
      setPreferences({
        eventReminders: true,
        serviceReminders: true,
        rsvpConfirmations: true,
        announcements: true,
        reminderTime: 60,
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadScheduledNotifications = async () => {
    try {
      const scheduled = await getScheduledNotifications();
      setScheduledCount(scheduled.length);
    } catch (error) {
      console.error('Failed to load scheduled notifications:', error);
    }
  };

  const handlePermissionRequest = async () => {
    try {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permissions Required',
          'To receive notifications, please enable permissions in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to request permissions:', error);
      Alert.alert('Error', 'Failed to request notification permissions');
    }
  };

  const handlePreferenceChange = (
    key: keyof NotificationPreferences,
    value: boolean | number
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    // Save preferences (in real app, save to storage/server)
    console.log('Saving preferences:', newPreferences);
  };

  const handleClearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to cancel all scheduled notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAllNotifications();
              setScheduledCount(0);
            } catch (error) {
              console.error('Failed to clear notifications:', error);
              Alert.alert('Error', 'Failed to clear notifications');
            }
          },
        },
      ]
    );
  };

  const getReminderTimeText = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = minutes / 60;
    return hours === 1 ? '1 hour' : `${hours} hours`;
  };

  const getPermissionStatusColor = (status: string) => {
    switch (status) {
      case 'granted':
        return colors.success;
      case 'denied':
        return colors.error;
      default:
        return colors.warning;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <IconButton
            icon='arrow-left'
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text variant='headlineSmall' style={styles.headerTitle}>
            Notification Settings
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={colors.primary.main} />
          <Text variant='bodyMedium' style={styles.loadingText}>
            Loading settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon='arrow-left'
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant='headlineSmall' style={styles.headerTitle}>
          Notification Settings
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Permission Status */}
        <Card style={styles.statusCard}>
          <Card.Content>
            <View style={styles.statusHeader}>
              <Text variant='titleMedium' style={styles.sectionTitle}>
                Permission Status
              </Text>
              <Chip
                mode='flat'
                textStyle={{
                  color: getPermissionStatusColor(permissionStatus.status),
                  fontWeight: '600',
                }}
                style={{
                  backgroundColor:
                    getPermissionStatusColor(permissionStatus.status) + '20',
                }}
              >
                {permissionStatus.status}
              </Chip>
            </View>

            {permissionStatus.status !== 'granted' && (
              <View style={styles.permissionActions}>
                <Text variant='bodyMedium' style={styles.permissionText}>
                  {permissionStatus.status === 'denied'
                    ? 'Notifications are disabled. Enable them in Settings to receive important updates.'
                    : 'Allow notifications to stay updated with church events and reminders.'}
                </Text>
                <Button
                  mode='contained'
                  onPress={handlePermissionRequest}
                  style={styles.permissionButton}
                >
                  {permissionStatus.status === 'denied'
                    ? 'Open Settings'
                    : 'Enable Notifications'}
                </Button>
              </View>
            )}

            {pushToken && (
              <View style={styles.tokenInfo}>
                <Text variant='bodySmall' style={styles.tokenLabel}>
                  Push Token (for debugging):
                </Text>
                <Text
                  variant='bodySmall'
                  style={styles.tokenText}
                  numberOfLines={1}
                >
                  {pushToken.slice(0, 32)}...
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Notification Types */}
        <Card style={styles.preferencesCard}>
          <Card.Content>
            <Text variant='titleMedium' style={styles.sectionTitle}>
              Notification Types
            </Text>

            <List.Item
              title='Event Reminders'
              description='Get notified before church events start'
              left={() => <List.Icon icon='calendar-alert' />}
              right={() => (
                <Switch
                  value={preferences.eventReminders}
                  onValueChange={value =>
                    handlePreferenceChange('eventReminders', value)
                  }
                  disabled={permissionStatus.status !== 'granted'}
                />
              )}
            />

            <Divider style={styles.divider} />

            <List.Item
              title='Service Reminders'
              description='Get notified before worship services'
              left={() => <List.Icon icon='church' />}
              right={() => (
                <Switch
                  value={preferences.serviceReminders}
                  onValueChange={value =>
                    handlePreferenceChange('serviceReminders', value)
                  }
                  disabled={permissionStatus.status !== 'granted'}
                />
              )}
            />

            <Divider style={styles.divider} />

            <List.Item
              title='RSVP Confirmations'
              description='Get notified when your RSVP is confirmed'
              left={() => <List.Icon icon='check-circle' />}
              right={() => (
                <Switch
                  value={preferences.rsvpConfirmations}
                  onValueChange={value =>
                    handlePreferenceChange('rsvpConfirmations', value)
                  }
                  disabled={permissionStatus.status !== 'granted'}
                />
              )}
            />

            <Divider style={styles.divider} />

            <List.Item
              title='Announcements'
              description='Get notified about church announcements'
              left={() => <List.Icon icon='bullhorn' />}
              right={() => (
                <Switch
                  value={preferences.announcements}
                  onValueChange={value =>
                    handlePreferenceChange('announcements', value)
                  }
                  disabled={permissionStatus.status !== 'granted'}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Reminder Timing */}
        <Card style={styles.timingCard}>
          <Card.Content>
            <Text variant='titleMedium' style={styles.sectionTitle}>
              Reminder Timing
            </Text>
            <Text variant='bodyMedium' style={styles.timingDescription}>
              How far in advance should we remind you about events?
            </Text>

            <View style={styles.reminderOptions}>
              {[15, 30, 60, 120].map(minutes => (
                <Chip
                  key={minutes}
                  mode={
                    preferences.reminderTime === minutes ? 'flat' : 'outlined'
                  }
                  selected={preferences.reminderTime === minutes}
                  onPress={() =>
                    handlePreferenceChange('reminderTime', minutes)
                  }
                  style={[
                    styles.reminderChip,
                    preferences.reminderTime === minutes && styles.selectedChip,
                  ]}
                >
                  {getReminderTimeText(minutes)}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Scheduled Notifications */}
        {isInitialized && (
          <Card style={styles.scheduledCard}>
            <Card.Content>
              <View style={styles.scheduledHeader}>
                <Text variant='titleMedium' style={styles.sectionTitle}>
                  Scheduled Notifications
                </Text>
                <Chip mode='outlined'>{scheduledCount} scheduled</Chip>
              </View>

              <Text variant='bodyMedium' style={styles.scheduledDescription}>
                You have {scheduledCount} notifications scheduled. These will
                remind you about upcoming events and services.
              </Text>

              {scheduledCount > 0 && (
                <Button
                  mode='outlined'
                  icon='trash-can'
                  onPress={handleClearAllNotifications}
                  style={styles.clearButton}
                  textColor={colors.error}
                  buttonColor={colors.error + '10'}
                >
                  Clear All Notifications
                </Button>
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  headerTitle: {
    flex: 1,
    color: colors.primary.main,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: colors.text.secondary,
  },
  statusCard: {
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  permissionActions: {
    gap: 12,
  },
  permissionText: {
    color: colors.text.secondary,
    lineHeight: 20,
  },
  permissionButton: {
    alignSelf: 'flex-start',
  },
  tokenInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.surface.variant,
    borderRadius: 8,
  },
  tokenLabel: {
    color: colors.text.secondary,
    marginBottom: 4,
  },
  tokenText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: colors.text.primary,
  },
  preferencesCard: {
    marginBottom: 16,
  },
  divider: {
    backgroundColor: colors.surface.variant,
  },
  timingCard: {
    marginBottom: 16,
  },
  timingDescription: {
    color: colors.text.secondary,
    marginBottom: 16,
  },
  reminderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reminderChip: {
    marginBottom: 8,
  },
  selectedChip: {
    backgroundColor: colors.primary.main + '20',
  },
  scheduledCard: {
    marginBottom: 16,
  },
  scheduledHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduledDescription: {
    color: colors.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  clearButton: {
    alignSelf: 'flex-start',
  },
});

export default NotificationSettingsScreen;
