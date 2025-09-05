/**
 * Main Dashboard Screen
 * Role-aware dashboard with contextual cards and quick actions
 */

import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

import { useAuthStore } from '@/lib/store/authStore';
import { useOnlineSync } from '@/hooks/useOnlineSync';
import { colors } from '@/theme/colors';
import { DashboardService } from '@/services/dashboardService';
import { isFeatureEnabled } from '@/config/featureFlags';
import type { UserRole } from '@/types/auth';
import type { DashboardCard, DashboardStats } from '@/services/dashboardService';


export const DashboardScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { status: syncStatus, syncNow, isInitialized } = useOnlineSync();
  const navigation = useNavigation();
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardCards, setDashboardCards] = useState<DashboardCard[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  // Check if dashboard feature is enabled
  const isDashboardEnabled = isFeatureEnabled('realTimeDashboard');

  useEffect(() => {
    if (user && isDashboardEnabled) {
      loadDashboardData();
    }
  }, [user, isDashboardEnabled]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [cards, stats] = await Promise.all([
        DashboardService.getDashboardCards(user),
        DashboardService.getDashboardStats(user),
      ]);
      
      setDashboardCards(cards);
      setDashboardStats(stats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Fallback to empty state
      setDashboardCards([]);
      setDashboardStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (user) {
        // Refresh dashboard data
        await DashboardService.refreshDashboard(user);
        await loadDashboardData();
        
        // Also sync if available
        if (isInitialized) {
          await syncNow();
        }
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

  const handleCardPress = (card: DashboardCard) => {
    // Navigate based on card's navigateTo property or fallback logic
    if (card.navigateTo) {
      switch (card.navigateTo) {
        case 'CheckIn':
          navigation.navigate('CheckIn' as never);
          break;
        case 'Events':
          navigation.navigate('Events' as never);
          break;
        case 'Pathways':
          navigation.navigate('Pathways' as never);
          break;
        case 'Groups':
          navigation.navigate('Groups' as never);
          break;
        case 'VIP':
          navigation.navigate('VIP' as never);
          break;
        default:
          console.log(`Navigating to ${card.navigateTo}`);
      }
    } else {
      console.log(`Card action: ${card.action}`);
    }
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

  // Show loading state
  if (loading && isDashboardEnabled) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={colors.primary.main} />
          <Text variant='bodyMedium' style={styles.loadingText}>
            Loading dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show fallback if dashboard feature is disabled
  if (!isDashboardEnabled || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text variant='headlineSmall'>Welcome to Drouple</Text>
          <Text variant='bodyMedium' style={styles.loadingText}>
            Your personalized dashboard will appear here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
            icon={(dashboardStats?.isOnline ?? syncStatus.isOnline) ? 'cloud-check' : 'cloud-off'}
            mode='flat'
            textStyle={styles.syncText}
            style={[
              styles.syncChip,
              {
                backgroundColor: (dashboardStats?.isOnline ?? syncStatus.isOnline)
                  ? colors.success.light + '20'
                  : colors.error.light + '20',
              },
            ]}
          >
            {(dashboardStats?.isOnline ?? syncStatus.isOnline)
              ? dashboardStats?.lastSync || syncStatus.lastSync
                ? `Last synced: ${(dashboardStats?.lastSync || syncStatus.lastSync)?.toLocaleTimeString()}`
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
            disabled={!(dashboardStats?.isOnline ?? syncStatus.isOnline) || syncStatus.isSync}
          >
            Sync Now
          </Button>
        </View>

        {/* Dashboard Cards */}
        <Text variant='titleMedium' style={styles.sectionTitle}>
          {getRoleDashboardTitle(user?.role || 'MEMBER')}
        </Text>

        {dashboardCards.length > 0 ? (
          <View style={styles.cardsGrid}>
            {dashboardCards.map(card => (
              <Card
                key={card.id}
                style={styles.actionCard}
                onPress={() => handleCardPress(card)}
                accessibilityLabel={`${card.title}${card.subtitle ? ` - ${card.subtitle}` : ''}`}
                accessibilityRole='button'
              >
                <Card.Content style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <IconButton
                      icon={card.icon}
                      size={28}
                      iconColor={card.color}
                      style={styles.cardIcon}
                    />
                    {card.value !== undefined && (
                      <View style={styles.valueContainer}>
                        <Text variant='titleLarge' style={[styles.cardValue, { color: card.color }]}>
                          {card.value}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text variant='titleSmall' style={styles.cardTitle}>
                    {card.title}
                  </Text>

                  {card.subtitle && (
                    <Text variant='bodySmall' style={styles.cardSubtitle}>
                      {card.subtitle}
                    </Text>
                  )}

                  {card.action && (
                    <Button
                      mode='outlined'
                      compact
                      style={styles.cardAction}
                      buttonColor='transparent'
                      textColor={card.color}
                    >
                      {card.action}
                    </Button>
                  )}

                  {card.lastUpdated && (
                    <Text variant='bodySmall' style={styles.lastUpdated}>
                      Updated {card.lastUpdated.toLocaleTimeString()}
                    </Text>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        ) : (
          <Surface style={styles.emptyState} elevation={1}>
            <IconButton
              icon='view-dashboard'
              size={48}
              iconColor={colors.outline.main}
            />
            <Text variant='bodyMedium' style={styles.emptyStateText}>
              Your dashboard cards will appear here based on your role and activity
            </Text>
          </Surface>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    color: colors.text.secondary,
    textAlign: 'center',
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
  valueContainer: {
    alignItems: 'flex-end',
  },
  cardValue: {
    fontWeight: '700',
    fontSize: 20,
  },
  cardSubtitle: {
    color: colors.text.secondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  cardTitle: {
    marginBottom: 4,
    color: colors.text.primary,
    fontWeight: '500',
  },
  cardAction: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  lastUpdated: {
    color: colors.text.secondary,
    fontSize: 10,
    marginTop: 8,
  },
  emptyState: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateText: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
});

// Helper function to get role-specific dashboard title
const getRoleDashboardTitle = (role: UserRole): string => {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'PASTOR':
    case 'ADMIN':
      return 'Church Overview';
    case 'VIP':
      return 'First-Timer Care';
    case 'LEADER':
      return 'Ministry Dashboard';
    case 'MEMBER':
    default:
      return 'My Dashboard';
  }
};

export default DashboardScreen;
