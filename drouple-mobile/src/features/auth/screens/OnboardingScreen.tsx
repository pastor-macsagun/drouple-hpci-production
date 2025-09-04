/**
 * Onboarding Screen
 * Role-aware welcome screen, dismissable once
 * Shows role-specific features and app overview
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  Button,
  Surface,
  Divider,
  IconButton,
} from 'react-native-paper';

import { useAuthStore } from '@/lib/store/authStore';
import { colors } from '@/theme/colors';
import type { UserRole } from '@/types/auth';

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface FeatureCard {
  icon: string;
  title: string;
  description: string;
  roles: UserRole[];
}

// Role-specific feature cards
const FEATURES: FeatureCard[] = [
  {
    icon: 'qrcode-scan',
    title: 'Quick Check-In',
    description:
      'Scan QR codes or search members for fast Sunday service check-ins',
    roles: ['MEMBER', 'LEADER', 'VIP', 'ADMIN', 'PASTOR', 'SUPER_ADMIN'],
  },
  {
    icon: 'calendar-heart',
    title: 'Events & RSVP',
    description:
      'Browse upcoming events and RSVP with automatic waitlist management',
    roles: ['MEMBER', 'LEADER', 'VIP', 'ADMIN', 'PASTOR', 'SUPER_ADMIN'],
  },
  {
    icon: 'account-group',
    title: 'Member Directory',
    description: 'Connect with church members and access contact information',
    roles: ['MEMBER', 'LEADER', 'VIP', 'ADMIN', 'PASTOR', 'SUPER_ADMIN'],
  },
  {
    icon: 'account-heart',
    title: 'First-Timer Care',
    description:
      'Track and follow up with new believers and first-time visitors',
    roles: ['VIP', 'ADMIN', 'PASTOR', 'SUPER_ADMIN'],
  },
  {
    icon: 'map-marker-path',
    title: 'Discipleship Pathways',
    description:
      'Track your spiritual growth journey through structured pathways',
    roles: ['MEMBER', 'LEADER', 'VIP', 'ADMIN', 'PASTOR', 'SUPER_ADMIN'],
  },
  {
    icon: 'account-multiple',
    title: 'LifeGroups',
    description: 'Join life groups, track attendance, and build community',
    roles: ['MEMBER', 'LEADER', 'VIP', 'ADMIN', 'PASTOR', 'SUPER_ADMIN'],
  },
  {
    icon: 'chart-line',
    title: 'Admin Reports',
    description:
      'View attendance trends, engagement metrics, and church insights',
    roles: ['ADMIN', 'PASTOR', 'SUPER_ADMIN'],
  },
  {
    icon: 'bell-ring',
    title: 'Push Notifications',
    description: 'Stay updated with church announcements and important updates',
    roles: ['MEMBER', 'LEADER', 'VIP', 'ADMIN', 'PASTOR', 'SUPER_ADMIN'],
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
}) => {
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);

  // Get user roles for filtering features
  const userRoles = user?.roles || ['MEMBER'];
  const highestRole = userRoles[0] || 'MEMBER'; // Assuming roles are in hierarchy order

  // Filter features based on user role
  const relevantFeatures = FEATURES.filter(feature =>
    feature.roles.some(role => userRoles.includes(role))
  ).slice(0, 4); // Show max 4 most relevant features

  const totalSteps = Math.max(3, Math.ceil(relevantFeatures.length / 2)); // Minimum 3 steps

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    // Mark onboarding as completed in auth store
    await useAuthStore.getState().completeOnboarding();
    onComplete();
  };

  const getRoleDisplayName = (role: UserRole): string => {
    const roleMap = {
      SUPER_ADMIN: 'Super Administrator',
      PASTOR: 'Pastor',
      ADMIN: 'Church Administrator',
      LEADER: 'Ministry Leader',
      VIP: 'First-Timer Team',
      MEMBER: 'Member',
    };
    return roleMap[role] || role;
  };

  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerContainer}>
        <Text variant='headlineMedium' style={styles.welcomeTitle}>
          Welcome to Drouple!
        </Text>
        <Text variant='bodyLarge' style={styles.welcomeSubtitle}>
          Hi {user?.firstName || 'there'}, you're signed in as a{' '}
          {getRoleDisplayName(highestRole)}
        </Text>
      </View>

      <Surface style={styles.roleCard} elevation={2}>
        <Text variant='titleMedium' style={styles.roleTitle}>
          Your Access Level
        </Text>
        <View style={styles.roleInfo}>
          <IconButton icon='account-circle' size={40} />
          <View style={styles.roleDetails}>
            <Text variant='titleSmall'>{getRoleDisplayName(highestRole)}</Text>
            <Text variant='bodySmall' style={styles.roleDescription}>
              {userRoles.length > 1
                ? `Also: ${userRoles.slice(1).map(getRoleDisplayName).join(', ')}`
                : 'Access to member features and services'}
            </Text>
          </View>
        </View>
      </Surface>

      <Text variant='bodyMedium' style={styles.description}>
        Let's take a quick tour of what you can do with the Drouple mobile app
        based on your role.
      </Text>
    </View>
  );

  const renderFeaturesStep = (stepIndex: number) => {
    const startIdx = (stepIndex - 1) * 2;
    const featuresForStep = relevantFeatures.slice(startIdx, startIdx + 2);

    return (
      <View style={styles.stepContainer}>
        <Text variant='headlineSmall' style={styles.stepTitle}>
          Key Features for You
        </Text>

        {featuresForStep.map((feature, idx) => (
          <Card key={`${startIdx + idx}`} style={styles.featureCard}>
            <Card.Content>
              <View style={styles.featureHeader}>
                <IconButton icon={feature.icon} size={32} />
                <Text variant='titleMedium' style={styles.featureTitle}>
                  {feature.title}
                </Text>
              </View>
              <Text variant='bodyMedium' style={styles.featureDescription}>
                {feature.description}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  };

  const renderFinalStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.finalContainer}>
        <IconButton
          icon='check-circle'
          size={80}
          iconColor={colors.primary.main}
        />
        <Text variant='headlineSmall' style={styles.finalTitle}>
          You're All Set!
        </Text>
        <Text variant='bodyLarge' style={styles.finalDescription}>
          Start exploring Drouple and stay connected with your church community.
        </Text>
      </View>

      <Surface style={styles.tipCard} elevation={1}>
        <Text variant='titleSmall' style={styles.tipTitle}>
          💡 Pro Tip
        </Text>
        <Text variant='bodyMedium' style={styles.tipText}>
          Enable biometric login in settings for faster access to the app.
        </Text>
      </Surface>
    </View>
  );

  const renderStep = () => {
    if (currentStep === 0) {
      return renderWelcomeStep();
    } else if (currentStep === totalSteps - 1) {
      return renderFinalStep();
    } else {
      return renderFeaturesStep(currentStep);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress indicators */}
        <View style={styles.progressContainer}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i === currentStep && styles.progressDotActive,
                i < currentStep && styles.progressDotComplete,
              ]}
            />
          ))}
        </View>

        {/* Step content */}
        {renderStep()}

        <Divider style={styles.divider} />

        {/* Navigation buttons */}
        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <Button
              mode='outlined'
              onPress={handlePrevious}
              style={styles.previousButton}
            >
              Previous
            </Button>
          )}

          <Button
            mode='contained'
            onPress={handleNext}
            style={[
              styles.nextButton,
              currentStep === 0 && styles.nextButtonFull,
            ]}
          >
            {currentStep === totalSteps - 1 ? 'Get Started' : 'Next'}
          </Button>
        </View>

        {/* Skip option on first step */}
        {currentStep === 0 && (
          <Button
            mode='text'
            onPress={handleComplete}
            style={styles.skipButton}
            textColor={colors.text.secondary}
          >
            Skip tour
          </Button>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: colors.primary.main,
    width: 24,
  },
  progressDotComplete: {
    backgroundColor: colors.primary.light,
  },
  stepContainer: {
    marginBottom: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    color: colors.primary.main,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    textAlign: 'center',
    color: colors.text.secondary,
  },
  stepTitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: colors.primary.main,
  },
  roleCard: {
    padding: 16,
    marginBottom: 24,
    backgroundColor: colors.primary.background,
  },
  roleTitle: {
    marginBottom: 12,
    color: colors.primary.main,
  },
  roleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleDetails: {
    flex: 1,
    marginLeft: 8,
  },
  roleDescription: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    color: colors.text.secondary,
  },
  featureCard: {
    marginBottom: 16,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    flex: 1,
    marginLeft: 8,
  },
  featureDescription: {
    lineHeight: 20,
    color: colors.text.secondary,
  },
  finalContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  finalTitle: {
    color: colors.primary.main,
    textAlign: 'center',
    marginVertical: 16,
  },
  finalDescription: {
    textAlign: 'center',
    lineHeight: 24,
    color: colors.text.secondary,
  },
  tipCard: {
    padding: 16,
    backgroundColor: colors.background.elevated,
  },
  tipTitle: {
    marginBottom: 8,
    color: colors.primary.main,
  },
  tipText: {
    color: colors.text.secondary,
    lineHeight: 20,
  },
  divider: {
    marginVertical: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previousButton: {
    flex: 0.4,
  },
  nextButton: {
    flex: 0.55,
  },
  nextButtonFull: {
    flex: 1,
  },
  skipButton: {
    marginTop: 16,
    alignSelf: 'center',
  },
});

export default OnboardingScreen;
