/**
 * Notification Settings Screen
 * Allows users to manage MVP notification preferences and permissions
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
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

import { colors } from '@/theme/colors';
import { useAuthStore } from '@/lib/store/authStore';
import { PushNotificationService } from '@/lib/notifications/pushNotificationService';
import { NotificationPreferencesService } from '@/lib/notifications/notificationPreferences';
import { NotificationService } from '@/lib/notifications/notificationService';
import type { NotificationPreferences } from '@/lib/notifications/notificationPreferences';

export const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();

  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [permissionSettings, setPermissionSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);

      // Initialize notification service
      await NotificationService.initialize();

      // Load preferences
      const prefs = await NotificationPreferencesService.initialize();
      setPreferences(prefs);

      // Get permission settings
      const settings = await NotificationService.getNotificationSettings();
      setPermissionSettings(settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionRequest = async () => {
    try {
      const granted = await NotificationService.requestPermissions();
      if (granted) {
        const settings = await NotificationService.getNotificationSettings();
        setPermissionSettings(settings);
      } else {
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

  const handlePreferenceChange = async (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    if (!preferences) return;

    try {
      setIsSaving(true);
      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);

      // Save preferences
      await NotificationPreferencesService.updatePreferences({ [key]: value });
    } catch (error) {
      console.error('Failed to save preference:', error);
      // Revert the change
      setPreferences(preferences);
      Alert.alert('Error', 'Failed to save preference');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await NotificationService.clearAllNotifications();
              Alert.alert('Success', 'All notifications cleared');
            } catch (error) {
              console.error('Failed to clear notifications:', error);
              Alert.alert('Error', 'Failed to clear notifications');
            }
          },
        },
      ]
    );
  };

  const handleTestNotification = async () => {
    try {
      await NotificationService.sendTestNotification();
    } catch (error) {
      console.error('Failed to send test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const getPermissionStatusColor = (granted: boolean) => {
    return granted ? colors.success.main : colors.error.main;
  };

  const getPermissionStatusText = (granted: boolean) => {
    return granted ? 'granted' : 'denied';
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text variant='bodyMedium'>Please sign in to access notification settings</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading || !preferences || !permissionSettings) {
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

  const rolePreferences = NotificationPreferencesService.getPreferencesForRole(user);

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
                  color: getPermissionStatusColor(permissionSettings.granted),
                  fontWeight: '600',
                }}
                style={{
                  backgroundColor:
                    getPermissionStatusColor(permissionSettings.granted) + '20',
                }}
              >
                {getPermissionStatusText(permissionSettings.granted)}
              </Chip>
            </View>

            {!permissionSettings.granted && (
              <View style={styles.permissionActions}>
                <Text variant='bodyMedium' style={styles.permissionText}>
                  {permissionSettings.canAskAgain
                    ? 'Allow notifications to stay updated with church events and reminders.'
                    : 'Notifications are disabled. Enable them in Settings to receive important updates.'}
                </Text>
                <Button
                  mode='contained'
                  onPress={handlePermissionRequest}
                  style={styles.permissionButton}
                >
                  {permissionSettings.canAskAgain
                    ? 'Enable Notifications'
                    : 'Open Settings'}
                </Button>
              </View>
            )}

            {/* Test Notification Button */}
            {permissionSettings.granted && (
              <View style={styles.testSection}>
                <Button
                  mode='outlined'
                  icon='bell'
                  onPress={handleTestNotification}
                  style={styles.testButton}
                >
                  Send Test Notification
                </Button>
              </View>
            )}

            {permissionSettings.token && (
              <View style={styles.tokenInfo}>
                <Text variant='bodySmall' style={styles.tokenLabel}>
                  Push Token (for debugging):
                </Text>
                <Text
                  variant='bodySmall'
                  style={styles.tokenText}
                  numberOfLines={1}
                >
                  {permissionSettings.token.slice(0, 32)}...
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
            
            {rolePreferences.map((pref, index) => (
              <React.Fragment key={pref.key}>
                {index > 0 && <Divider style={styles.divider} />}
                <List.Item
                  title={pref.title}
                  description={pref.description}
                  left={() => <List.Icon icon={getIconForNotificationType(pref.key)} />}
                  right={() => (
                    <Switch
                      value={pref.enabled}
                      onValueChange={value => handlePreferenceChange(pref.key, value)}
                      disabled={!permissionSettings.granted || isSaving}
                    />
                  )}
                />
              </React.Fragment>
            ))}
          </Card.Content>
        </Card>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant='titleMedium' style={styles.sectionTitle}>
              About Notifications
            </Text>
            <Text variant='bodyMedium' style={styles.infoDescription}>
              • Event reminders are sent 24 hours and 2 hours before events
              • Pathway milestones celebrate your progress
              • Admin alerts help monitor system health
              • VIP assignments notify about new first-timers
              • Leader requests help with pathway verifications
            </Text>
          </Card.Content>
        </Card>

        {/* Actions */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Text variant='titleMedium' style={styles.sectionTitle}>
              Actions
            </Text>

            <Button
              mode='outlined'
              icon='trash-can'
              onPress={handleClearAllNotifications}
              style={styles.clearButton}
              textColor={colors.error.main}
            >
              Clear All Notifications
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
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
  testSection: {
    marginTop: 12,
  },
  testButton: {
    alignSelf: 'flex-start',
  },
  infoCard: {
    marginBottom: 16,
  },
  infoDescription: {
    color: colors.text.secondary,
    lineHeight: 20,
  },
  actionsCard: {
    marginBottom: 16,
  },
  clearButton: {
    alignSelf: 'flex-start',
  },
});

// Helper function to get icon for notification type
const getIconForNotificationType = (type: string) => {
  switch (type) {
    case 'announcements':
      return 'bullhorn';
    case 'eventReminders24h':
    case 'eventReminders2h':
      return 'calendar-alert';
    case 'pathwayMilestones':
      return 'trophy';
    case 'adminSyncErrors':
    case 'adminCheckInFails':
      return 'alert';
    case 'vipNewAssignments':
      return 'account-plus';
    case 'leaderGroupUpdates':
    case 'leaderVerificationRequests':
      return 'account-group';
    default:
      return 'bell';
  }
};

export default NotificationSettingsScreen;
