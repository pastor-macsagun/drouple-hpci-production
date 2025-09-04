/**
 * Privacy Notice Component
 * GDPR/CCPA compliant privacy notice and consent management
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  Checkbox,
  Divider,
  Surface,
  List,
  IconButton,
  Portal,
  Dialog,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors } from '@/theme/colors';

interface PrivacyNoticeProps {
  onAccept: () => void;
  onDecline: () => void;
  visible: boolean;
}

interface ConsentPreferences {
  essential: boolean; // Always true, cannot be disabled
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  lastUpdated: string;
}

const PRIVACY_CONSENT_KEY = '@privacy_consent';
const PRIVACY_POLICY_VERSION = '1.0.0';

export const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({
  onAccept,
  onDecline,
  visible,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    personalization: false,
    lastUpdated: new Date().toISOString(),
  });

  const handleAcceptAll = async () => {
    const updatedPreferences: ConsentPreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      personalization: true,
      lastUpdated: new Date().toISOString(),
    };

    try {
      await AsyncStorage.setItem(
        PRIVACY_CONSENT_KEY,
        JSON.stringify({
          ...updatedPreferences,
          version: PRIVACY_POLICY_VERSION,
          timestamp: Date.now(),
        })
      );
      onAccept();
    } catch (error) {
      console.error('Failed to save privacy preferences:', error);
      Alert.alert(
        'Error',
        'Failed to save privacy preferences. Please try again.'
      );
    }
  };

  const handleAcceptSelected = async () => {
    try {
      await AsyncStorage.setItem(
        PRIVACY_CONSENT_KEY,
        JSON.stringify({
          ...preferences,
          version: PRIVACY_POLICY_VERSION,
          timestamp: Date.now(),
        })
      );
      onAccept();
    } catch (error) {
      console.error('Failed to save privacy preferences:', error);
      Alert.alert(
        'Error',
        'Failed to save privacy preferences. Please try again.'
      );
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Privacy Policy',
      'To use Drouple, you must accept our privacy policy and essential cookies. Would you like to review the policy again?',
      [
        { text: 'Review Policy', style: 'default' },
        {
          text: 'Exit App',
          style: 'destructive',
          onPress: onDecline,
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://drouple.com/privacy-policy').catch(() => {
      Alert.alert(
        'Error',
        'Could not open privacy policy. Please visit drouple.com/privacy-policy'
      );
    });
  };

  const openTermsOfService = () => {
    Linking.openURL('https://drouple.com/terms-of-service').catch(() => {
      Alert.alert(
        'Error',
        'Could not open terms of service. Please visit drouple.com/terms-of-service'
      );
    });
  };

  const updatePreference = (key: keyof ConsentPreferences, value: boolean) => {
    if (key === 'essential') return; // Essential cookies cannot be disabled

    setPreferences(prev => ({
      ...prev,
      [key]: value,
      lastUpdated: new Date().toISOString(),
    }));
  };

  return (
    <Portal>
      <Dialog visible={visible} dismissable={false} style={styles.dialog}>
        <Dialog.Title style={styles.dialogTitle}>
          Privacy & Data Protection
        </Dialog.Title>

        <Dialog.ScrollArea>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Card style={styles.summaryCard}>
              <Card.Content>
                <Text variant='bodyMedium' style={styles.summaryText}>
                  We care about your privacy. This app collects and processes
                  personal data to provide church management services. By
                  continuing, you agree to our privacy practices.
                </Text>
              </Card.Content>
            </Card>

            <View style={styles.dataSection}>
              <Text variant='titleMedium' style={styles.sectionTitle}>
                Data We Collect
              </Text>

              <List.Item
                title='Account Information'
                description='Name, email, phone number, church affiliation'
                left={() => (
                  <List.Icon icon='account' color={colors.primary.main} />
                )}
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDescription}
              />

              <List.Item
                title='Activity Data'
                description='Check-ins, event attendance, group participation'
                left={() => (
                  <List.Icon icon='chart-line' color={colors.primary.main} />
                )}
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDescription}
              />

              <List.Item
                title='Device Information'
                description='Device type, operating system, app version'
                left={() => (
                  <List.Icon icon='cellphone' color={colors.primary.main} />
                )}
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDescription}
              />
            </View>

            <Divider style={styles.divider} />

            <View style={styles.consentSection}>
              <Text variant='titleMedium' style={styles.sectionTitle}>
                Your Privacy Choices
              </Text>

              <Surface style={styles.consentItem} elevation={0}>
                <View style={styles.consentHeader}>
                  <Checkbox
                    status='checked'
                    disabled={true}
                    uncheckedColor={colors.outline}
                    color={colors.primary.main}
                  />
                  <View style={styles.consentInfo}>
                    <Text variant='bodyMedium' style={styles.consentTitle}>
                      Essential Cookies (Required)
                    </Text>
                    <Text variant='bodySmall' style={styles.consentDescription}>
                      Necessary for app functionality, authentication, and
                      security.
                    </Text>
                  </View>
                </View>
              </Surface>

              <Surface style={styles.consentItem} elevation={0}>
                <View style={styles.consentHeader}>
                  <Checkbox
                    status={preferences.analytics ? 'checked' : 'unchecked'}
                    onPress={() =>
                      updatePreference('analytics', !preferences.analytics)
                    }
                    uncheckedColor={colors.outline}
                    color={colors.primary.main}
                  />
                  <View style={styles.consentInfo}>
                    <Text variant='bodyMedium' style={styles.consentTitle}>
                      Analytics & Performance
                    </Text>
                    <Text variant='bodySmall' style={styles.consentDescription}>
                      Help us improve the app by sharing usage statistics and
                      performance data.
                    </Text>
                  </View>
                </View>
              </Surface>

              <Surface style={styles.consentItem} elevation={0}>
                <View style={styles.consentHeader}>
                  <Checkbox
                    status={preferences.marketing ? 'checked' : 'unchecked'}
                    onPress={() =>
                      updatePreference('marketing', !preferences.marketing)
                    }
                    uncheckedColor={colors.outline}
                    color={colors.primary.main}
                  />
                  <View style={styles.consentInfo}>
                    <Text variant='bodyMedium' style={styles.consentTitle}>
                      Marketing Communications
                    </Text>
                    <Text variant='bodySmall' style={styles.consentDescription}>
                      Receive updates about new features, events, and church
                      communications.
                    </Text>
                  </View>
                </View>
              </Surface>

              <Surface style={styles.consentItem} elevation={0}>
                <View style={styles.consentHeader}>
                  <Checkbox
                    status={
                      preferences.personalization ? 'checked' : 'unchecked'
                    }
                    onPress={() =>
                      updatePreference(
                        'personalization',
                        !preferences.personalization
                      )
                    }
                    uncheckedColor={colors.outline}
                    color={colors.primary.main}
                  />
                  <View style={styles.consentInfo}>
                    <Text variant='bodyMedium' style={styles.consentTitle}>
                      Personalization
                    </Text>
                    <Text variant='bodySmall' style={styles.consentDescription}>
                      Customize your experience based on your preferences and
                      activity.
                    </Text>
                  </View>
                </View>
              </Surface>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.rightsSection}>
              <Text variant='titleMedium' style={styles.sectionTitle}>
                Your Rights
              </Text>

              <Text variant='bodyMedium' style={styles.rightsText}>
                You have the right to access, update, delete, or export your
                personal data. You can also withdraw consent at any time through
                the app settings.
              </Text>
            </View>

            <View style={styles.linksSection}>
              <Button
                mode='text'
                onPress={openPrivacyPolicy}
                style={styles.linkButton}
                labelStyle={styles.linkText}
              >
                Read Full Privacy Policy
              </Button>

              <Button
                mode='text'
                onPress={openTermsOfService}
                style={styles.linkButton}
                labelStyle={styles.linkText}
              >
                Terms of Service
              </Button>
            </View>
          </ScrollView>
        </Dialog.ScrollArea>

        <Dialog.Actions style={styles.dialogActions}>
          <Button
            mode='outlined'
            onPress={handleDecline}
            style={styles.declineButton}
          >
            Decline
          </Button>

          <Button
            mode='contained'
            onPress={handleAcceptSelected}
            style={styles.acceptButton}
          >
            Accept Selected
          </Button>

          <Button
            mode='contained'
            onPress={handleAcceptAll}
            style={[styles.acceptButton, styles.acceptAllButton]}
          >
            Accept All
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

// Hook to check privacy consent status
export const usePrivacyConsent = () => {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [preferences, setPreferences] = useState<ConsentPreferences | null>(
    null
  );

  useEffect(() => {
    checkConsentStatus();
  }, []);

  const checkConsentStatus = async () => {
    try {
      const consentData = await AsyncStorage.getItem(PRIVACY_CONSENT_KEY);

      if (consentData) {
        const parsed = JSON.parse(consentData);

        // Check if consent is still valid (same version)
        if (parsed.version === PRIVACY_POLICY_VERSION) {
          setHasConsent(true);
          setPreferences(parsed);
        } else {
          // Privacy policy updated, need new consent
          setHasConsent(false);
          setPreferences(null);
        }
      } else {
        setHasConsent(false);
        setPreferences(null);
      }
    } catch (error) {
      console.error('Failed to check privacy consent:', error);
      setHasConsent(false);
      setPreferences(null);
    }
  };

  const updateConsent = async (newPreferences: ConsentPreferences) => {
    try {
      await AsyncStorage.setItem(
        PRIVACY_CONSENT_KEY,
        JSON.stringify({
          ...newPreferences,
          version: PRIVACY_POLICY_VERSION,
          timestamp: Date.now(),
        })
      );
      setPreferences(newPreferences);
      setHasConsent(true);
    } catch (error) {
      console.error('Failed to update privacy consent:', error);
      throw error;
    }
  };

  const revokeConsent = async () => {
    try {
      await AsyncStorage.removeItem(PRIVACY_CONSENT_KEY);
      setHasConsent(false);
      setPreferences(null);
    } catch (error) {
      console.error('Failed to revoke privacy consent:', error);
      throw error;
    }
  };

  return {
    hasConsent,
    preferences,
    checkConsentStatus,
    updateConsent,
    revokeConsent,
  };
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '90%',
  },
  dialogTitle: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  summaryCard: {
    marginBottom: 16,
    backgroundColor: colors.primary.main + '10',
  },
  summaryText: {
    lineHeight: 20,
    color: colors.text.secondary,
  },
  dataSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
    color: colors.primary.main,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  listDescription: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  divider: {
    marginVertical: 16,
  },
  consentSection: {
    marginBottom: 16,
  },
  consentItem: {
    padding: 8,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: colors.surface.variant,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  consentInfo: {
    flex: 1,
    marginLeft: 8,
  },
  consentTitle: {
    fontWeight: '500',
    marginBottom: 2,
  },
  consentDescription: {
    color: colors.text.secondary,
    lineHeight: 16,
  },
  rightsSection: {
    marginBottom: 16,
  },
  rightsText: {
    color: colors.text.secondary,
    lineHeight: 20,
  },
  linksSection: {
    marginBottom: 16,
    gap: 4,
  },
  linkButton: {
    alignSelf: 'flex-start',
  },
  linkText: {
    color: colors.primary.main,
    fontSize: 14,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  declineButton: {
    minWidth: 80,
  },
  acceptButton: {
    minWidth: 100,
  },
  acceptAllButton: {
    backgroundColor: colors.success,
  },
});

export default PrivacyNotice;
