/**
 * Settings Screen
 * Main settings screen with theme toggle and app preferences
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  List,
  Switch,
  Button,
  Divider,
  IconButton,
  Surface,
} from 'react-native-paper';

import { useTheme } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/lib/store/authStore';
import { colors } from '@/theme/colors';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  navigation,
}) => {
  const { theme, isDark, toggleTheme, resetToSystemTheme } = useTheme();
  const { user, signOut } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const handleResetToSystem = () => {
    Alert.alert(
      'Reset to System Theme',
      'This will use your device\'s system theme preference.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          onPress: () => resetToSystemTheme(),
          style: 'default'
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Drouple?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          onPress: async () => {
            setIsLoading(true);
            try {
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
            } finally {
              setIsLoading(false);
            }
          },
          style: 'destructive'
        },
      ]
    );
  };

  const navigateToSecurity = () => {
    navigation.navigate('SecurityScreen');
  };

  const navigateToNotifications = () => {
    navigation.navigate('NotificationSettings');
  };

  const navigateToPrivacy = () => {
    // TODO: Implement privacy settings screen
    Alert.alert('Coming Soon', 'Privacy settings will be available in a future update.');
  };

  const navigateToAbout = () => {
    // TODO: Implement about screen
    Alert.alert('About Drouple', 'Version 1.0.0\n\nBuilt with love for church communities worldwide.');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text variant='headlineSmall' style={[styles.title, { color: theme.colors.primary }]}>
            Settings
          </Text>
          <Text variant='bodyMedium' style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Customize your Drouple experience
          </Text>
        </View>

        {/* User Info Card */}
        {user && (
          <Card style={styles.userCard}>
            <Card.Content>
              <View style={styles.userInfo}>
                <IconButton icon='account-circle' size={48} />
                <View style={styles.userDetails}>
                  <Text variant='titleMedium'>{user.firstName} {user.lastName}</Text>
                  <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>
                    {user.email}
                  </Text>
                  <Text variant='bodySmall' style={{ color: theme.colors.primary }}>
                    {user.roles.join(', ')}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Appearance Settings */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant='titleSmall' style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Appearance
          </Text>
          
          <List.Item
            title='Dark Mode'
            description={isDark ? 'Using dark theme' : 'Using light theme'}
            left={(props) => <List.Icon {...props} icon='theme-light-dark' />}
            right={() => (
              <Switch
                value={isDark}
                onValueChange={handleThemeToggle}
                color={theme.colors.primary}
              />
            )}
          />

          <List.Item
            title='Reset to System Theme'
            description='Use device system theme preference'
            left={(props) => <List.Icon {...props} icon='cellphone-cog' />}
            onPress={handleResetToSystem}
            right={(props) => <List.Icon {...props} icon='chevron-right' />}
          />
        </Surface>

        {/* App Settings */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant='titleSmall' style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            App Settings
          </Text>

          <List.Item
            title='Notifications'
            description='Manage push notifications and alerts'
            left={(props) => <List.Icon {...props} icon='bell' />}
            onPress={navigateToNotifications}
            right={(props) => <List.Icon {...props} icon='chevron-right' />}
          />

          <List.Item
            title='Security & Privacy'
            description='Biometric auth, data privacy settings'
            left={(props) => <List.Icon {...props} icon='security' />}
            onPress={navigateToSecurity}
            right={(props) => <List.Icon {...props} icon='chevron-right' />}
          />

          <List.Item
            title='Privacy Settings'
            description='Data usage and privacy controls'
            left={(props) => <List.Icon {...props} icon='shield-account' />}
            onPress={navigateToPrivacy}
            right={(props) => <List.Icon {...props} icon='chevron-right' />}
          />
        </Surface>

        {/* Support & Info */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant='titleSmall' style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Support & Info
          </Text>

          <List.Item
            title='About Drouple'
            description='Version info and app details'
            left={(props) => <List.Icon {...props} icon='information' />}
            onPress={navigateToAbout}
            right={(props) => <List.Icon {...props} icon='chevron-right' />}
          />

          <List.Item
            title='Help & Support'
            description='Get help with app features'
            left={(props) => <List.Icon {...props} icon='help-circle' />}
            onPress={() => Alert.alert('Help & Support', 'Contact your church administrator for support.')}
            right={(props) => <List.Icon {...props} icon='chevron-right' />}
          />

          <List.Item
            title='Send Feedback'
            description='Help us improve Drouple'
            left={(props) => <List.Icon {...props} icon='message-text' />}
            onPress={() => Alert.alert('Send Feedback', 'Thank you for helping us improve Drouple!')}
            right={(props) => <List.Icon {...props} icon='chevron-right' />}
          />
        </Surface>

        {/* Sign Out */}
        <View style={styles.signOutContainer}>
          <Button
            mode='outlined'
            onPress={handleSignOut}
            loading={isLoading}
            disabled={isLoading}
            buttonColor={theme.colors.errorContainer}
            textColor={theme.colors.error}
            style={styles.signOutButton}
          >
            {isLoading ? 'Signing Out...' : 'Sign Out'}
          </Button>
        </View>

        {/* Version Info */}
        <Text variant='bodySmall' style={[styles.versionText, { color: theme.colors.onSurfaceVariant }]}>
          Drouple Mobile v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerContainer: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    lineHeight: 20,
  },
  userCard: {
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  section: {
    marginBottom: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontWeight: '600',
  },
  signOutContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  signOutButton: {
    marginHorizontal: 8,
  },
  versionText: {
    textAlign: 'center',
    marginBottom: 24,
  },
});

export default SettingsScreen;