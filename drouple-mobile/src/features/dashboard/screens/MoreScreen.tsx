/**
 * More Screen - Additional Features and Settings
 * Access to profile, settings, and additional app features
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  Button,
  List,
  Divider,
  Switch,
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

import { useAuthStore } from '@/lib/store/authStore';
import { useNotifications } from '@/hooks/useNotifications';
import { colors } from '@/theme/colors';

export const MoreScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, signOut } = useAuthStore();
  const { permissionStatus, isInitialized } = useNotifications();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleNotificationSettings = () => {
    // In a real app, you would navigate to NotificationSettingsScreen
    // For now, just log
    console.log('Navigate to notification settings');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <View style={styles.profileInfo}>
              <IconButton
                icon='account-circle'
                size={48}
                iconColor={colors.primary.main}
              />
              <View style={styles.profileDetails}>
                <Text variant='titleMedium' style={styles.profileName}>
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text variant='bodySmall' style={styles.profileEmail}>
                  {user?.email}
                </Text>
              </View>
            </View>
            <Button mode='outlined' compact>
              Edit Profile
            </Button>
          </Card.Content>
        </Card>

        {/* Features Section */}
        <Text variant='titleMedium' style={styles.sectionTitle}>
          Features
        </Text>

        <Card style={styles.menuCard}>
          <List.Item
            title='Member Directory'
            description='Search and connect with members'
            left={props => <List.Icon {...props} icon='account-search' />}
            right={props => <List.Icon {...props} icon='chevron-right' />}
          />
          <Divider />
          <List.Item
            title='Discipleship Pathways'
            description='Track your spiritual growth'
            left={props => <List.Icon {...props} icon='map-marker-path' />}
            right={props => <List.Icon {...props} icon='chevron-right' />}
          />
          <Divider />
          <List.Item
            title='LifeGroups'
            description='Join and manage groups'
            left={props => <List.Icon {...props} icon='account-group' />}
            right={props => <List.Icon {...props} icon='chevron-right' />}
          />
          <Divider />
          <List.Item
            title='Reports'
            description='View church analytics'
            left={props => <List.Icon {...props} icon='chart-line' />}
            right={props => <List.Icon {...props} icon='chevron-right' />}
          />
        </Card>

        {/* Settings Section */}
        <Text variant='titleMedium' style={styles.sectionTitle}>
          Settings
        </Text>

        <Card style={styles.menuCard}>
          <List.Item
            title='Notifications'
            description={
              permissionStatus.status === 'granted'
                ? 'Push notification preferences'
                : 'Enable push notifications'
            }
            left={props => <List.Icon {...props} icon='bell' />}
            right={() => (
              <Switch
                value={permissionStatus.status === 'granted'}
                disabled={!isInitialized}
              />
            )}
            onPress={handleNotificationSettings}
          />
          <Divider />
          <List.Item
            title='Biometric Login'
            description='Use fingerprint or face unlock'
            left={props => <List.Icon {...props} icon='fingerprint' />}
            right={() => <Switch value={false} />}
          />
          <Divider />
          <List.Item
            title='Sync Settings'
            description='Data synchronization options'
            left={props => <List.Icon {...props} icon='sync' />}
            right={props => <List.Icon {...props} icon='chevron-right' />}
          />
        </Card>

        {/* Support Section */}
        <Text variant='titleMedium' style={styles.sectionTitle}>
          Support
        </Text>

        <Card style={styles.menuCard}>
          <List.Item
            title='Help & Support'
            description='Get help with the app'
            left={props => <List.Icon {...props} icon='help-circle' />}
            right={props => <List.Icon {...props} icon='chevron-right' />}
          />
          <Divider />
          <List.Item
            title='Privacy Policy'
            description='Review our privacy practices'
            left={props => <List.Icon {...props} icon='shield-account' />}
            right={props => <List.Icon {...props} icon='chevron-right' />}
          />
          <Divider />
          <List.Item
            title='About'
            description='App version and info'
            left={props => <List.Icon {...props} icon='information' />}
            right={props => <List.Icon {...props} icon='chevron-right' />}
          />
        </Card>

        {/* Sign Out Button */}
        <Button
          mode='outlined'
          onPress={handleSignOut}
          style={styles.signOutButton}
          textColor={colors.error.main}
          buttonColor='transparent'
          icon='logout'
        >
          Sign Out
        </Button>

        <View style={styles.footer}>
          <Text variant='bodySmall' style={styles.footerText}>
            Drouple Mobile v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    marginBottom: 24,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  profileName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  profileEmail: {
    color: colors.text.secondary,
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 8,
    color: colors.text.primary,
    fontWeight: '600',
  },
  menuCard: {
    marginBottom: 24,
  },
  signOutButton: {
    marginVertical: 24,
    borderColor: colors.error.main,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    color: colors.text.secondary,
  },
});

export default MoreScreen;
