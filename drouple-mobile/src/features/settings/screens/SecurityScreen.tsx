/**
 * Security Settings Screen
 * Manages biometric authentication, privacy settings, and security options
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Linking } from 'react-native';
import {
  Text,
  List,
  Switch,
  Card,
  Button,
  Divider,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import {
  biometricService,
  type BiometricConfig,
} from '@/lib/security/biometrics';
import { secureStore } from '@/lib/security/storage';
import { useAuthStore } from '@/lib/store/authStore';
import { EmptyState } from '@/components/ui/EmptyState';

interface SecurityScreenProps {
  navigation: any;
}

interface SecuritySettings {
  biometricEnabled: boolean;
  rememberCredentials: boolean;
  autoLockEnabled: boolean;
  autoLockTimeout: number; // minutes
  secureStorageEnabled: boolean;
  analyticsEnabled: boolean;
  crashReportingEnabled: boolean;
}

export const SecurityScreen: React.FC<SecurityScreenProps> = ({
  navigation,
}) => {
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [biometricConfig, setBiometricConfig] =
    useState<BiometricConfig | null>(null);
  const [settings, setSettings] = useState<SecuritySettings>({
    biometricEnabled: false,
    rememberCredentials: false,
    autoLockEnabled: true,
    autoLockTimeout: 5,
    secureStorageEnabled: true,
    analyticsEnabled: false,
    crashReportingEnabled: true,
  });

  useEffect(() => {
    initializeSettings();
  }, []);

  const initializeSettings = async () => {
    try {
      setLoading(true);

      // Initialize biometric service
      const biometricConfig = await biometricService.initialize();
      setBiometricConfig(biometricConfig);

      // Load existing settings
      const savedSettings = await loadSecuritySettings();
      setSettings(savedSettings);
    } catch (error) {
      console.error('Failed to initialize security settings:', error);
      Alert.alert('Error', 'Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  const loadSecuritySettings = async (): Promise<SecuritySettings> => {
    try {
      const preferences = await secureStore.getUserPreferences();

      return {
        biometricEnabled: preferences?.biometricEnabled || false,
        rememberCredentials: preferences?.rememberCredentials || false,
        autoLockEnabled: preferences?.autoLockEnabled !== false, // default true
        autoLockTimeout: preferences?.autoLockTimeout || 5,
        secureStorageEnabled: preferences?.secureStorageEnabled !== false, // default true
        analyticsEnabled: preferences?.analyticsEnabled || false,
        crashReportingEnabled: preferences?.crashReportingEnabled !== false, // default true
      };
    } catch (error) {
      console.error('Failed to load security settings:', error);
      return settings; // return current settings as fallback
    }
  };

  const saveSecuritySettings = async (newSettings: SecuritySettings) => {
    try {
      await secureStore.storeUserPreferences({
        ...newSettings,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save security settings:', error);
      throw new Error('Failed to save settings');
    }
  };

  const handleBiometricToggle = async () => {
    if (!biometricConfig?.isAvailable) {
      Alert.alert(
        'Biometric Unavailable',
        'Biometric authentication is not available on this device.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!biometricConfig?.isEnrolled) {
      Alert.alert(
        'No Biometrics Enrolled',
        'Please set up biometric authentication in your device settings first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    try {
      const newValue = !settings.biometricEnabled;

      if (newValue) {
        // Verify biometric before enabling
        const authenticated = await biometricService.authenticate(
          'Verify your identity to enable biometric authentication'
        );

        if (!authenticated) {
          return;
        }
      }

      await biometricService.setBiometricEnabled(newValue);
      const updatedSettings = { ...settings, biometricEnabled: newValue };
      setSettings(updatedSettings);
      await saveSecuritySettings(updatedSettings);
    } catch (error) {
      console.error('Failed to toggle biometric:', error);
      Alert.alert('Error', 'Failed to update biometric settings');
    }
  };

  const handleRememberCredentialsToggle = async () => {
    const newValue = !settings.rememberCredentials;

    if (!newValue) {
      // Clear stored credentials when disabling
      await secureStore.clearCredentials();
    }

    const updatedSettings = { ...settings, rememberCredentials: newValue };
    setSettings(updatedSettings);
    await saveSecuritySettings(updatedSettings);
  };

  const handleAutoLockToggle = async () => {
    const newValue = !settings.autoLockEnabled;
    const updatedSettings = { ...settings, autoLockEnabled: newValue };
    setSettings(updatedSettings);
    await saveSecuritySettings(updatedSettings);
  };

  const handleAnalyticsToggle = async () => {
    const newValue = !settings.analyticsEnabled;
    const updatedSettings = { ...settings, analyticsEnabled: newValue };
    setSettings(updatedSettings);
    await saveSecuritySettings(updatedSettings);
  };

  const handleCrashReportingToggle = async () => {
    const newValue = !settings.crashReportingEnabled;
    const updatedSettings = { ...settings, crashReportingEnabled: newValue };
    setSettings(updatedSettings);
    await saveSecuritySettings(updatedSettings);
  };

  const handleClearSecureData = () => {
    Alert.alert(
      'Clear Secure Data',
      'This will remove all stored credentials and preferences. You will need to log in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await secureStore.clearCredentials();
              await secureStore.clearAuthToken();
              await secureStore.clearRefreshToken();
              await biometricService.reset();

              Alert.alert('Data Cleared', 'All secure data has been removed.', [
                { text: 'OK', onPress: () => logout() },
              ]);
            } catch (error) {
              console.error('Failed to clear secure data:', error);
              Alert.alert('Error', 'Failed to clear secure data');
            }
          },
        },
      ]
    );
  };

  const handleViewPrivacyPolicy = () => {
    // This would typically open a privacy policy screen or web view
    navigation.navigate('PrivacyPolicy');
  };

  const handleViewTermsOfService = () => {
    // This would typically open a terms of service screen or web view
    navigation.navigate('TermsOfService');
  };

  const renderBiometricSection = () => {
    if (!biometricConfig) return null;

    return (
      <Card style={styles.section}>
        <Card.Content>
          <Text variant='titleMedium' style={styles.sectionTitle}>
            Biometric Authentication
          </Text>

          <View style={styles.biometricInfo}>
            <Text variant='bodyMedium' style={styles.description}>
              Use{' '}
              {biometricConfig.supportedTypes.length > 0
                ? biometricService.getSupportedBiometricTypes().join(', ')
                : 'biometric'}{' '}
              authentication for quick and secure access.
            </Text>

            <View style={styles.biometricChips}>
              {biometricService
                .getSupportedBiometricTypes()
                .map((type, index) => (
                  <Chip key={index} style={styles.biometricChip} compact>
                    {type}
                  </Chip>
                ))}
            </View>
          </View>

          <List.Item
            title='Enable Biometric Login'
            description={
              !biometricConfig.isAvailable
                ? 'Not available on this device'
                : !biometricConfig.isEnrolled
                  ? 'No biometrics enrolled in device settings'
                  : 'Use biometric authentication to log in'
            }
            left={props => (
              <List.Icon
                {...props}
                icon={biometricService.getPrimaryBiometricIcon()}
              />
            )}
            right={() => (
              <Switch
                value={settings.biometricEnabled}
                onValueChange={handleBiometricToggle}
                disabled={
                  !biometricConfig.isAvailable || !biometricConfig.isEnrolled
                }
              />
            )}
          />
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={colors.primary.main} />
          <Text variant='bodyMedium' style={styles.loadingText}>
            Loading security settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Biometric Authentication */}
        {renderBiometricSection()}

        {/* Login & Authentication */}
        <Card style={styles.section}>
          <Card.Content>
            <Text variant='titleMedium' style={styles.sectionTitle}>
              Login & Authentication
            </Text>

            <List.Item
              title='Remember Login Credentials'
              description='Securely store login credentials for quick access'
              left={props => <List.Icon {...props} icon='account-key' />}
              right={() => (
                <Switch
                  value={settings.rememberCredentials}
                  onValueChange={handleRememberCredentialsToggle}
                />
              )}
            />

            <Divider />

            <List.Item
              title='Auto-Lock App'
              description='Automatically lock the app after inactivity'
              left={props => <List.Icon {...props} icon='lock-clock' />}
              right={() => (
                <Switch
                  value={settings.autoLockEnabled}
                  onValueChange={handleAutoLockToggle}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Privacy & Data */}
        <Card style={styles.section}>
          <Card.Content>
            <Text variant='titleMedium' style={styles.sectionTitle}>
              Privacy & Data
            </Text>

            <List.Item
              title='Analytics'
              description='Help improve the app by sharing anonymous usage data'
              left={props => <List.Icon {...props} icon='chart-line' />}
              right={() => (
                <Switch
                  value={settings.analyticsEnabled}
                  onValueChange={handleAnalyticsToggle}
                />
              )}
            />

            <Divider />

            <List.Item
              title='Crash Reporting'
              description='Automatically send crash reports to help fix bugs'
              left={props => <List.Icon {...props} icon='bug' />}
              right={() => (
                <Switch
                  value={settings.crashReportingEnabled}
                  onValueChange={handleCrashReportingToggle}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Legal & Policies */}
        <Card style={styles.section}>
          <Card.Content>
            <Text variant='titleMedium' style={styles.sectionTitle}>
              Legal & Policies
            </Text>

            <List.Item
              title='Privacy Policy'
              description='Review our privacy practices'
              left={props => <List.Icon {...props} icon='shield-account' />}
              right={props => <List.Icon {...props} icon='chevron-right' />}
              onPress={handleViewPrivacyPolicy}
            />

            <Divider />

            <List.Item
              title='Terms of Service'
              description='Review terms and conditions'
              left={props => <List.Icon {...props} icon='file-document' />}
              right={props => <List.Icon {...props} icon='chevron-right' />}
              onPress={handleViewTermsOfService}
            />
          </Card.Content>
        </Card>

        {/* Security Actions */}
        <Card style={styles.section}>
          <Card.Content>
            <Text variant='titleMedium' style={styles.sectionTitle}>
              Security Actions
            </Text>

            <View style={styles.actionsContainer}>
              <Button
                mode='outlined'
                onPress={handleClearSecureData}
                style={styles.actionButton}
                textColor={colors.error}
              >
                Clear All Secure Data
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.primary.main,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  biometricInfo: {
    marginBottom: 16,
  },
  biometricChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  biometricChip: {
    height: 24,
  },
  actionsContainer: {
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    borderColor: colors.error,
  },
});

export default SecurityScreen;
