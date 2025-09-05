import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTokens } from '@/theme';
import { Card, Button, Badge } from '@/components/ui';
import { SyncStatusBadge } from '@/components/sync/SyncStatusBadge';
import { useAuth } from '@/hooks/useAuth';

interface SettingsItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  action: () => void;
  color?: 'primary' | 'error' | 'success' | 'warning';
  showArrow?: boolean;
  type?: 'navigation' | 'toggle' | 'action';
  value?: boolean;
  onToggle?: (value: boolean) => void;
}

interface ProfileCardProps {
  user: any;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user }) => {
  const tokens = useTokens();

  const handleEditProfile = () => {
    // Navigate to profile edit screen
    Alert.alert('Profile', 'Profile editing will be available in the next update.');
  };

  return (
    <Card style={[styles.profileCard, { marginHorizontal: tokens.spacing.md }]}>
      <View style={styles.profileContent}>
        <View style={[styles.avatar, { backgroundColor: tokens.colors.bg.secondary }]}>
          <MaterialIcons 
            name="person" 
            size={40} 
            color={tokens.colors.text.tertiary} 
          />
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={[styles.userName, { color: tokens.colors.text.primary }]}>
            {user?.name || 'User'}
          </Text>
          <Text style={[styles.userEmail, { color: tokens.colors.text.secondary }]}>
            {user?.email || 'user@example.com'}
          </Text>
          <Badge 
            label={user?.role || 'Member'} 
            color="primary" 
            size="sm"
            style={{ alignSelf: 'flex-start', marginTop: tokens.spacing.xs }}
          />
        </View>
        
        <Pressable
          onPress={handleEditProfile}
          style={[
            styles.editButton,
            { backgroundColor: tokens.colors.bg.secondary }
          ]}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
        >
          <MaterialIcons 
            name="edit" 
            size={20} 
            color={tokens.colors.text.secondary} 
          />
        </Pressable>
      </View>
    </Card>
  );
};

interface SettingsRowProps {
  item: SettingsItem;
  isLast?: boolean;
}

const SettingsRow = React.memo(({ item, isLast = false }: SettingsRowProps) => {
  const tokens = useTokens();

  const getIconColor = (color?: string) => {
    switch (color) {
      case 'primary': return tokens.colors.brand.primary;
      case 'error': return tokens.colors.state.error;
      case 'success': return tokens.colors.state.success;
      case 'warning': return tokens.colors.state.warning;
      default: return tokens.colors.text.secondary;
    }
  };

  const renderRightContent = () => {
    if (item.type === 'toggle' && item.onToggle) {
      return (
        <Switch
          value={item.value || false}
          onValueChange={item.onToggle}
          thumbColor={tokens.colors.brand.primary}
          trackColor={{
            false: tokens.colors.bg.tertiary,
            true: tokens.colors.brand.secondary,
          }}
        />
      );
    }
    
    if (item.showArrow !== false) {
      return (
        <MaterialIcons 
          name="chevron-right" 
          size={20} 
          color={tokens.colors.text.tertiary} 
        />
      );
    }
    
    return null;
  };

  return (
    <Pressable
      style={[
        styles.settingsRow,
        isLast && styles.lastRow,
        { borderBottomColor: tokens.colors.border.primary }
      ]}
      onPress={item.type === 'toggle' ? undefined : item.action}
      accessibilityRole={item.type === 'toggle' ? undefined : 'button'}
      accessibilityLabel={item.title}
    >
      <View style={styles.rowLeft}>
        <MaterialIcons
          name={item.icon}
          size={24}
          color={getIconColor(item.color)}
          style={styles.rowIcon}
        />
        <View style={styles.rowContent}>
          <Text 
            style={[
              styles.rowTitle, 
              { 
                color: item.color === 'error' 
                  ? tokens.colors.state.error 
                  : tokens.colors.text.primary 
              }
            ]}
          >
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={[styles.rowSubtitle, { color: tokens.colors.text.secondary }]}>
              {item.subtitle}
            </Text>
          )}
        </View>
      </View>
      {renderRightContent()}
    </Pressable>
  );
});

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => {
  const tokens = useTokens();
  
  return (
    <View style={[styles.settingsSection, { marginHorizontal: tokens.spacing.md }]}>
      <Text style={[styles.sectionTitle, { color: tokens.colors.text.secondary }]}>
        {title}
      </Text>
      <Card style={styles.sectionCard}>
        {children}
      </Card>
    </View>
  );
};

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const tokens = useTokens();
  
  // State for notification preferences
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    eventReminders: true,
    announcementAlerts: false,
    checkinReminders: true,
  });

  // State for privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    shareProfile: false,
    allowDirectMessages: true,
    showOnlineStatus: false,
  });

  // Load settings from storage
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const notifications = await AsyncStorage.getItem('notificationSettings');
        const privacy = await AsyncStorage.getItem('privacySettings');
        
        if (notifications) {
          setNotificationSettings(JSON.parse(notifications));
        }
        if (privacy) {
          setPrivacySettings(JSON.parse(privacy));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  // Save settings to storage
  const saveNotificationSettings = async (newSettings: typeof notificationSettings) => {
    try {
      setNotificationSettings(newSettings);
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const savePrivacySettings = async (newSettings: typeof privacySettings) => {
    try {
      setPrivacySettings(newSettings);
      await AsyncStorage.setItem('privacySettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You will need to sign in again to access the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/signin');
          },
        },
      ]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Help & Support',
      'Choose how you\'d like to get help:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email Support',
          onPress: () => Linking.openURL('mailto:support@hpci.org?subject=Mobile App Support'),
        },
        {
          text: 'Call Church',
          onPress: () => Linking.openURL('tel:+63123456789'),
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About HPCI ChMS',
      'House of Peace Christian International\nChurch Management System\n\nVersion 1.0.0\n\nBuilt with ❤️ for our church family.',
      [{ text: 'OK' }]
    );
  };

  // Notification settings
  const notificationItems: SettingsItem[] = [
    {
      id: 'push',
      title: 'Push Notifications',
      subtitle: 'Receive app notifications',
      icon: 'notifications',
      type: 'toggle',
      value: notificationSettings.pushNotifications,
      onToggle: (value) => saveNotificationSettings({...notificationSettings, pushNotifications: value}),
      action: () => {},
    },
    {
      id: 'events',
      title: 'Event Reminders',
      subtitle: 'Get notified about upcoming events',
      icon: 'event',
      type: 'toggle',
      value: notificationSettings.eventReminders,
      onToggle: (value) => saveNotificationSettings({...notificationSettings, eventReminders: value}),
      action: () => {},
    },
    {
      id: 'announcements',
      title: 'Announcement Alerts',
      subtitle: 'Get notified of new announcements',
      icon: 'campaign',
      type: 'toggle',
      value: notificationSettings.announcementAlerts,
      onToggle: (value) => saveNotificationSettings({...notificationSettings, announcementAlerts: value}),
      action: () => {},
    },
  ];

  // Privacy settings
  const privacyItems: SettingsItem[] = [
    {
      id: 'profile',
      title: 'Share Profile',
      subtitle: 'Allow others to see your profile in directory',
      icon: 'person',
      type: 'toggle',
      value: privacySettings.shareProfile,
      onToggle: (value) => savePrivacySettings({...privacySettings, shareProfile: value}),
      action: () => {},
    },
    {
      id: 'messages',
      title: 'Direct Messages',
      subtitle: 'Allow other members to message you',
      icon: 'message',
      type: 'toggle',
      value: privacySettings.allowDirectMessages,
      onToggle: (value) => savePrivacySettings({...privacySettings, allowDirectMessages: value}),
      action: () => {},
    },
  ];

  // General settings
  const generalItems: SettingsItem[] = [
    {
      id: 'about',
      title: 'About',
      subtitle: 'App version and information',
      icon: 'info',
      action: handleAbout,
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help or contact support',
      icon: 'help',
      action: handleHelp,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.bg.surface }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: tokens.colors.bg.primary }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: tokens.colors.text.primary }]}>
            Settings
          </Text>
          <SyncStatusBadge size="sm" showText={false} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={{ paddingTop: tokens.spacing.md }}>
          <ProfileCard user={user} />
        </View>

        {/* Notification Settings */}
        <SettingsSection title="Notifications">
          {notificationItems.map((item, index) => (
            <SettingsRow
              key={item.id}
              item={item}
              isLast={index === notificationItems.length - 1}
            />
          ))}
        </SettingsSection>

        {/* Privacy Settings */}
        <SettingsSection title="Privacy & Security">
          {privacyItems.map((item, index) => (
            <SettingsRow
              key={item.id}
              item={item}
              isLast={index === privacyItems.length - 1}
            />
          ))}
        </SettingsSection>

        {/* General Settings */}
        <SettingsSection title="General">
          {generalItems.map((item, index) => (
            <SettingsRow
              key={item.id}
              item={item}
              isLast={index === generalItems.length - 1}
            />
          ))}
        </SettingsSection>

        {/* Sign Out */}
        <View style={[styles.signOutSection, { marginHorizontal: tokens.spacing.md }]}>
          <Button
            variant="outlined"
            leftIcon="logout"
            onPress={handleSignOut}
            style={[styles.signOutButton, { borderColor: tokens.colors.state.error }]}
          >
            <Text style={{ color: tokens.colors.state.error }}>Sign Out</Text>
          </Button>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: tokens.colors.text.primary }]}>
            HPCI ChMS Mobile
          </Text>
          <Text style={[styles.appVersion, { color: tokens.colors.text.secondary }]}>
            Version 1.0.0
          </Text>
          <Text style={[styles.copyright, { color: tokens.colors.text.tertiary }]}>
            © 2024 HPCI. All rights reserved.
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: tokens.spacing['4xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  // Profile Card Styles
  profileCard: {
    padding: 20,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  editButton: {
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Settings Section Styles
  settingsSection: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    minHeight: 64,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: {
    marginRight: 16,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  // Sign Out Section
  signOutSection: {
    marginTop: 32,
    marginBottom: 16,
  },
  signOutButton: {
    backgroundColor: 'transparent',
  },
  // App Info
  appInfo: {
    alignItems: 'center',
    padding: 24,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    marginBottom: 16,
  },
  copyright: {
    fontSize: 12,
    textAlign: 'center',
  },
});