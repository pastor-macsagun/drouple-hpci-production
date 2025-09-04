/**
 * Main Dashboard Screen
 * Role-aware dashboard with contextual cards and quick actions
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  // Filter cards based on user roles
  const visibleCards = DASHBOARD_CARDS.filter(card =>
    card.roles.some(role => hasRole(role))
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (isInitialized) {
        await syncNow();
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSyncNow = async () => {
    if (isInitialized && !syncStatus.isSync) {
      await syncNow();
    }
  };

  const handleCardPress = (cardId: string) => {
    console.log(`Navigating to ${cardId}`);
    // TODO: Navigate to appropriate screens
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

export default DashboardScreen;
