/**
 * Main Dashboard Screen with Analytics Instrumentation
 * Role-aware dashboard with contextual cards and quick actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Text,
  Card,
  Button,
  Surface,
  IconButton,
  Chip,
  Divider,
} from 'react-native-paper';

import { useAuthStore } from '@/lib/store/authStore';
import { useOnlineSync } from '@/hooks/useOnlineSync';
import { analyticsService } from '@/lib/analytics/analyticsService';
import { colors } from '@/theme/colors';
import type { UserRole } from '@/types/auth';

interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
  roles: UserRole[];
  color?: string;
  count?: number;
}

// Role-based dashboard cards (placeholders for now)
const DASHBOARD_CARDS: DashboardCard[] = [
  {
    id: 'quick-checkin',
    title: 'Quick Check-In',
    description: 'Scan QR or search members',
    icon: 'qrcode-scan',
    action: 'Check-In',
    roles: ['MEMBER', 'LEADER', 'VIP', 'ADMIN', 'PASTOR', 'SUPER_ADMIN'],
    color: colors.primary.main,
  },
  {
    id: 'upcoming-events',
    title: 'Upcoming Events',
    description: 'View and RSVP to events',
    icon: 'calendar-heart',
    action: 'View Events',
    roles: ['MEMBER', 'LEADER', 'VIP', 'ADMIN', 'PASTOR', 'SUPER_ADMIN'],
    color: colors.secondary.main,
    count: 3,
  },
  {
    id: 'first-timers',
    title: 'First-Timer Care',
    description: 'New believers and visitors',
    icon: 'account-heart',
    action: 'View List',
    roles: ['VIP', 'ADMIN', 'PASTOR', 'SUPER_ADMIN'],
    color: colors.success.main,
    count: 2,
  },
  {
    id: 'my-pathways',
    title: 'My Pathways',
    description: 'Continue discipleship journey',
    icon: 'map-marker-path',
    action: 'Continue',
    roles: ['MEMBER', 'LEADER', 'VIP', 'ADMIN', 'PASTOR', 'SUPER_ADMIN'],
    color: colors.info.main,
  },
  {
    id: 'life-groups',
    title: 'LifeGroups',
    description: 'Join or manage groups',
    icon: 'account-group',
    action: 'Browse',
    roles: ['MEMBER', 'LEADER', 'VIP', 'ADMIN', 'PASTOR', 'SUPER_ADMIN'],
    color: colors.pathways.inProgress,
  },
  {
    id: 'admin-reports',
    title: 'Reports & Analytics',
    description: 'Church metrics and trends',
    icon: 'chart-line',
    action: 'View Reports',
    roles: ['ADMIN', 'PASTOR', 'SUPER_ADMIN'],
    color: colors.roles.churchAdmin,
    count: 5,
  },
  {
    id: 'member-directory',
    title: 'Member Directory',
    description: 'Search and connect with members',
    icon: 'account-search',
    action: 'Search',
    roles: ['MEMBER', 'LEADER', 'VIP', 'ADMIN', 'PASTOR', 'SUPER_ADMIN'],
    color: colors.outline.main,
  },
];

export const DashboardScreen: React.FC = () => {
  const { user, hasRole } = useAuthStore();
  const { status: syncStatus, syncNow, isInitialized } = useOnlineSync();
  const [refreshing, setRefreshing] = useState(false);
  const [screenStartTime] = useState(() => Date.now());

  // Filter cards based on user roles
  const visibleCards = DASHBOARD_CARDS.filter(card =>
    card.roles.some(role => hasRole(role))
  );

  // Track screen view when component mounts and on focus
  useFocusEffect(
    useCallback(() => {
      const startTime = Date.now();

      // Track screen view
      analyticsService.trackScreen('dashboard', {
        user_role: user?.roles?.[0] || 'MEMBER',
        visible_cards_count: visibleCards.length,
        sync_status: syncStatus.isOnline ? 'online' : 'offline',
        pending_sync_items: syncStatus.queueCount,
      });

      // Track session start if needed
      if (user?.id) {
        analyticsService.track('session_start', {
          session_id: generateSessionId(),
          user_role: user.roles?.[0] || 'MEMBER',
          church_tenant_id: user.tenantId || '',
          app_version: '1.0.0', // Get from app config
          device_platform: Platform.OS as 'ios' | 'android',
          network_type: syncStatus.isOnline ? 'wifi' : 'offline', // Could be enhanced
          time_since_last_session_mins: calculateTimeSinceLastSession(),
        });
      }

      return () => {
        // Track screen view duration when leaving
        const duration = Math.round((Date.now() - startTime) / 1000);
        analyticsService.track('screen_view', {
          screen_name: 'dashboard',
          session_id: getCurrentSessionId(),
          view_duration_seconds: duration,
          navigation_method: 'back' as const,
          screen_load_time_ms: Date.now() - screenStartTime,
        });
      };
    }, [user, visibleCards.length, syncStatus.isOnline, syncStatus.queueCount])
  );

  // Track feature adoption on mount
  useEffect(() => {
    if (user?.id) {
      analyticsService.track('feature_adoption', {
        feature_name: 'dashboard',
        action: 'viewed',
        days_since_install: calculateDaysSinceInstall(),
        usage_frequency: 'daily', // Could be calculated based on usage patterns
        feature_depth_score: calculateFeatureDepthScore(),
      });
    }
  }, [user?.id]);

  const handleRefresh = async () => {
    const startTime = Date.now();
    setRefreshing(true);

    try {
      if (isInitialized) {
        await syncNow();

        // Track successful refresh
        analyticsService.track('performance_metric', {
          metric_type: 'offline_sync',
          duration_ms: Date.now() - startTime,
          sync_operation: 'manual_refresh',
          network_type: syncStatus.isOnline ? 'wifi' : 'offline',
        });
      }
    } catch (error) {
      console.error('Refresh failed:', error);

      // Track refresh failure
      analyticsService.track('error_occurred', {
        error_type: 'sync_failure',
        error_message:
          error instanceof Error ? error.message : 'Unknown refresh error',
        screen_name: 'dashboard',
        user_action: 'manual_refresh',
        recoverable: true,
        recovery_action: 'retry_available',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSyncNow = async () => {
    if (isInitialized && !syncStatus.isSync) {
      const startTime = Date.now();

      try {
        await syncNow();

        // Track sync performance
        analyticsService.track('offline_operation', {
          action: 'sync_completed',
          sync_success_count: syncStatus.queueCount,
          sync_failure_count: 0,
          data_conflicts_count: 0, // Would need to be tracked from sync service
        });
      } catch (error) {
        // Track sync failure
        analyticsService.track('offline_operation', {
          action: 'sync_failed',
          sync_success_count: 0,
          sync_failure_count: 1,
          data_conflicts_count: 0,
        });
      }
    }
  };

  const handleCardPress = (cardId: string) => {
    const card = DASHBOARD_CARDS.find(c => c.id === cardId);

    // Track card interaction
    analyticsService.track('feature_adoption', {
      feature_name: mapCardIdToFeature(cardId),
      action: 'first_use',
      days_since_install: calculateDaysSinceInstall(),
      usage_frequency: 'daily',
      feature_depth_score: 1, // Initial interaction
    });

    // Track specific dashboard interaction
    analyticsService.track('dashboard_interaction', {
      card_id: cardId,
      card_title: card?.title || '',
      user_role: user?.roles?.[0] || 'MEMBER',
      session_id: getCurrentSessionId(),
    });

    console.log(`Navigating to ${cardId}`);
    // TODO: Navigate to appropriate screens
  };

  // Helper functions for analytics
  const generateSessionId = (): string => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  };

  const getCurrentSessionId = (): string => {
    // This would typically be stored in a session store
    return `session_${Date.now()}`;
  };

  const calculateTimeSinceLastSession = (): number | undefined => {
    // This would calculate based on stored last session time
    return undefined;
  };

  const calculateDaysSinceInstall = (): number => {
    // This would calculate based on stored install date
    return 1; // Placeholder
  };

  const calculateFeatureDepthScore = (): number => {
    // Calculate based on how many dashboard features user has used
    return visibleCards.length > 4 ? 8 : 5;
  };

  const mapCardIdToFeature = (cardId: string): string => {
    const mapping: Record<string, string> = {
      'quick-checkin': 'check_in',
      'upcoming-events': 'events',
      'first-timers': 'first_timers',
      'my-pathways': 'pathways',
      'life-groups': 'groups',
      'admin-reports': 'reports',
      'member-directory': 'directory',
    };
    return mapping[cardId] || cardId;
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

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Surface style={styles.headerSurface} elevation={1}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text variant='headlineSmall' style={styles.greeting}>
                {getGreeting()}, {user?.firstName || 'there'}!
              </Text>

              {user?.roles && user.roles.length > 0 && (
                <View style={styles.rolesContainer}>
                  {user.roles.slice(0, 2).map((role, index) => (
                    <Chip
                      key={role}
                      mode='outlined'
                      compact
                      style={[
                        styles.roleChip,
                        { borderColor: colors.roles.churchAdmin },
                      ]}
                    >
                      {getRoleDisplayName(role)}
                    </Chip>
                  ))}
                  {user.roles.length > 2 && (
                    <Text variant='bodySmall' style={styles.moreRoles}>
                      +{user.roles.length - 2} more
                    </Text>
                  )}
                </View>
              )}
            </View>

            <IconButton
              icon='sync'
              size={24}
              onPress={handleRefresh}
              accessibilityLabel='Sync data'
            />
          </View>
        </Surface>

        {/* Sync Status Section */}
        <View style={styles.syncSection}>
          <Chip
            icon={syncStatus.isOnline ? 'cloud-check' : 'cloud-off'}
            mode='flat'
            textStyle={styles.syncText}
            style={[
              styles.syncChip,
              {
                backgroundColor: syncStatus.isOnline
                  ? colors.success.light + '20'
                  : colors.error.light + '20',
              },
            ]}
          >
            {syncStatus.isOnline
              ? syncStatus.lastSync
                ? `Last synced: ${syncStatus.lastSync.toLocaleTimeString()}`
                : 'Online'
              : 'Offline'}
            {syncStatus.queueCount > 0 && ` • ${syncStatus.queueCount} pending`}
          </Chip>

          <Button
            mode='text'
            compact
            onPress={handleSyncNow}
            textColor={colors.primary.main}
            loading={syncStatus.isSync}
            disabled={!syncStatus.isOnline || syncStatus.isSync}
          >
            Sync Now
          </Button>
        </View>

        {/* Quick Actions Grid */}
        <Text variant='titleMedium' style={styles.sectionTitle}>
          Quick Actions
        </Text>

        <View style={styles.cardsGrid}>
          {visibleCards.map(card => (
            <Card
              key={card.id}
              style={styles.actionCard}
              onPress={() => handleCardPress(card.id)}
              accessibilityLabel={`${card.title} - ${card.description}`}
              accessibilityRole='button'
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <IconButton
                    icon={card.icon}
                    size={28}
                    iconColor={card.color || colors.primary.main}
                    style={styles.cardIcon}
                  />
                  {card.count !== undefined && (
                    <Chip
                      mode='flat'
                      compact
                      style={[
                        styles.countChip,
                        { backgroundColor: card.color },
                      ]}
                      textStyle={styles.countText}
                    >
                      {card.count}
                    </Chip>
                  )}
                </View>

                <Text variant='titleSmall' style={styles.cardTitle}>
                  {card.title}
                </Text>

                <Text variant='bodySmall' style={styles.cardDescription}>
                  {card.description}
                </Text>

                <Button
                  mode='outlined'
                  compact
                  style={styles.cardAction}
                  buttonColor='transparent'
                  textColor={card.color || colors.primary.main}
                >
                  {card.action}
                </Button>
              </Card.Content>
            </Card>
          ))}
        </View>

        <Divider style={styles.divider} />

        {/* Recent Activity Placeholder */}
        <Text variant='titleMedium' style={styles.sectionTitle}>
          Recent Activity
        </Text>

        <Surface style={styles.activitySurface} elevation={1}>
          <View style={styles.activityPlaceholder}>
            <IconButton
              icon='history'
              size={48}
              iconColor={colors.outline.main}
            />
            <Text variant='bodyMedium' style={styles.placeholderText}>
              Your recent church activities will appear here
            </Text>
          </View>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
};

// Custom analytics event for dashboard interactions
declare module '@/lib/analytics/analyticsContract' {
  interface DashboardInteractionEvent {
    event_name: 'dashboard_interaction';
    properties: {
      card_id: string;
      card_title: string;
      user_role: string;
      session_id: string;
    };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerSurface: {
    borderRadius: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    color: colors.text.primary,
    marginBottom: 8,
  },
  rolesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  roleChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  moreRoles: {
    color: colors.text.secondary,
    marginLeft: 4,
  },
  syncSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  syncChip: {
    backgroundColor: colors.success.light + '20',
  },
  syncText: {
    fontSize: 12,
    color: colors.success.dark,
  },
  sectionTitle: {
    marginBottom: 12,
    color: colors.text.primary,
    fontWeight: '600',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    width: '48%',
    marginBottom: 12,
    backgroundColor: colors.surface.main,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardIcon: {
    margin: 0,
  },
  countChip: {
    height: 20,
    paddingHorizontal: 8,
  },
  countText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
  },
  cardTitle: {
    marginBottom: 4,
    color: colors.text.primary,
    fontWeight: '500',
  },
  cardDescription: {
    color: colors.text.secondary,
    marginBottom: 12,
    lineHeight: 16,
  },
  cardAction: {
    alignSelf: 'flex-start',
  },
  divider: {
    marginVertical: 24,
  },
  activitySurface: {
    borderRadius: 12,
    padding: 24,
  },
  activityPlaceholder: {
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
});

// Need to import Platform for analytics
import { Platform } from 'react-native';

export default DashboardScreen;
