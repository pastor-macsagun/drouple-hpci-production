import React, { Suspense } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { useTokens } from '@/theme';
import { Card, Button, Badge } from '@/components/ui';
import { Skeleton, EmptyState, ErrorState } from '@/components/patterns';
import { SyncStatusBadge } from '@/components/sync/SyncStatusBadge';
import { useAuth } from '@/hooks/useAuth';

// Mock data for role-specific content
const mockRoleData = {
  MEMBER: {
    todayService: { name: 'Sunday Worship', time: '10:00 AM', location: 'Main Sanctuary' },
    myGroups: [{ name: 'Young Adults', meeting: 'Wednesday 7 PM' }],
    announcements: 2,
  },
  LEADER: {
    todayService: { name: 'Sunday Worship', time: '10:00 AM', location: 'Main Sanctuary', attendees: 45 },
    myGroups: [{ name: 'Young Adults', members: 12, meeting: 'Wednesday 7 PM' }],
    announcements: 3,
    pendingTasks: 2,
  },
  ADMIN: {
    todayStats: { checkins: 45, events: 2, groups: 8 },
    todayService: { name: 'Sunday Worship', capacity: 200, checkins: 45 },
    pendingApprovals: 3,
    announcements: 5,
  },
};

interface RoleCardProps {
  title: string;
  subtitle?: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  badge?: number;
  onPress?: () => void;
  children?: React.ReactNode;
}

const RoleCard: React.FC<RoleCardProps> = ({ title, subtitle, icon, badge, onPress, children }) => {
  const tokens = useTokens();

  return (
    <Card 
      style={[styles.roleCard, { marginBottom: tokens.spacing.md }]}
      pressable
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleSection}>
          <MaterialIcons name={icon} size={24} color={tokens.colors.brand.primary} />
          <View style={{ marginLeft: tokens.spacing.sm }}>
            <Text style={[styles.cardTitle, { color: tokens.colors.text.primary }]}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[styles.cardSubtitle, { color: tokens.colors.text.secondary }]}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        {badge && badge > 0 && (
          <Badge label={badge} color="primary" />
        )}
      </View>
      {children && (
        <View style={{ marginTop: tokens.spacing.sm }}>
          {children}
        </View>
      )}
    </Card>
  );
};

const QuickActionButton: React.FC<{
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}> = ({ icon, label, onPress, variant = 'primary' }) => {
  const tokens = useTokens();
  
  return (
    <Pressable
      style={[
        styles.quickAction,
        {
          backgroundColor: variant === 'primary' 
            ? tokens.colors.brand.primary 
            : tokens.colors.bg.secondary,
          borderRadius: tokens.radii.lg,
          padding: tokens.spacing.md,
        }
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <MaterialIcons 
        name={icon} 
        size={24} 
        color={variant === 'primary' ? tokens.colors.text.primaryOnBrand : tokens.colors.text.primary} 
      />
      <Text 
        style={[
          styles.quickActionLabel,
          {
            color: variant === 'primary' ? tokens.colors.text.primaryOnBrand : tokens.colors.text.primary,
            marginTop: tokens.spacing.xs,
          }
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const MemberHomeContent: React.FC<{ data: any }> = ({ data }) => {
  return (
    <>
      <RoleCard
        title="Today's Service"
        subtitle={`${data.todayService.time} • ${data.todayService.location}`}
        icon="church"
        onPress={() => router.push('/(tabs)/checkins')}
      >
        <Text style={styles.serviceInfo}>
          Tap to check in when you arrive
        </Text>
      </RoleCard>

      <RoleCard
        title="My Groups"
        subtitle={data.myGroups[0]?.meeting}
        icon="groups"
        onPress={() => router.push('/groups')}
      >
        <Text style={styles.groupInfo}>
          {data.myGroups[0]?.name}
        </Text>
      </RoleCard>

      <RoleCard
        title="Announcements"
        icon="campaign"
        badge={data.announcements}
        onPress={() => router.push('/(tabs)/announcements')}
      >
        <Text style={styles.announcementInfo}>
          New updates from church leadership
        </Text>
      </RoleCard>
    </>
  );
};

const LeaderHomeContent: React.FC<{ data: any }> = ({ data }) => {
  return (
    <>
      <RoleCard
        title="Today's Service"
        subtitle={`${data.todayService.attendees} checked in`}
        icon="church"
        onPress={() => router.push('/(tabs)/checkins')}
      >
        <Text style={styles.serviceInfo}>
          {data.todayService.time} • {data.todayService.location}
        </Text>
      </RoleCard>

      <RoleCard
        title="My Groups"
        subtitle={`${data.myGroups[0]?.members} members`}
        icon="groups"
        badge={data.pendingTasks}
        onPress={() => router.push('/groups')}
      >
        <Text style={styles.groupInfo}>
          {data.myGroups[0]?.name} • {data.myGroups[0]?.meeting}
        </Text>
      </RoleCard>

      <RoleCard
        title="Announcements"
        icon="campaign"
        badge={data.announcements}
        onPress={() => router.push('/(tabs)/announcements')}
      >
        <Text style={styles.announcementInfo}>
          Keep your group informed
        </Text>
      </RoleCard>
    </>
  );
};

const AdminHomeContent: React.FC<{ data: any }> = ({ data }) => {
  return (
    <>
      <RoleCard
        title="Today's Overview"
        subtitle={`${data.todayService.checkins}/${data.todayService.capacity} checked in`}
        icon="dashboard"
      >
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{data.todayStats.checkins}</Text>
            <Text style={styles.statLabel}>Check-ins</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{data.todayStats.events}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{data.todayStats.groups}</Text>
            <Text style={styles.statLabel}>Groups</Text>
          </View>
        </View>
      </RoleCard>

      <RoleCard
        title="Pending Approvals"
        icon="pending_actions"
        badge={data.pendingApprovals}
        onPress={() => router.push('/admin/approvals')}
      >
        <Text style={styles.announcementInfo}>
          Member requests need your attention
        </Text>
      </RoleCard>

      <RoleCard
        title="Announcements"
        icon="campaign"
        badge={data.announcements}
        onPress={() => router.push('/(tabs)/announcements')}
      >
        <Text style={styles.announcementInfo}>
          Reach your entire congregation
        </Text>
      </RoleCard>
    </>
  );
};

export default function HomePage() {
  const { user } = useAuth();
  const tokens = useTokens();
  const [refreshing, setRefreshing] = React.useState(false);

  const userRole = user?.role || 'MEMBER';
  const userData = mockRoleData[userRole as keyof typeof mockRoleData] || mockRoleData.MEMBER;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['home-dashboard', userRole],
    queryFn: () => Promise.resolve(userData),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.bg.surface }]}>
        <View style={[styles.header, { backgroundColor: tokens.colors.bg.primary }]}>
          <Skeleton width={200} height={28} style={{ marginBottom: tokens.spacing.xs }} />
          <Skeleton width={150} height={16} />
        </View>
        <ScrollView style={styles.content}>
          <Skeleton height={120} style={{ margin: tokens.spacing.md }} />
          <Skeleton height={120} style={{ margin: tokens.spacing.md }} />
          <Skeleton height={120} style={{ margin: tokens.spacing.md }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.bg.surface }]}>
        <ErrorState
          type="network"
          onRetry={refetch}
          title="Couldn't load your dashboard"
          message="We're having trouble connecting. Please check your connection and try again."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.bg.surface }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: tokens.colors.bg.primary }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={[styles.greeting, { color: tokens.colors.text.primary }]}>
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Friend'}!
            </Text>
            <Text style={[styles.subtitle, { color: tokens.colors.text.secondary }]}>
              Welcome to HPCI
            </Text>
          </View>
          <SyncStatusBadge size="sm" showText={false} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[tokens.colors.brand.primary]}
            tintColor={tokens.colors.brand.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={[styles.quickActions, { marginHorizontal: tokens.spacing.md, marginTop: tokens.spacing.md }]}>
          <QuickActionButton
            icon="qr-code-scanner"
            label="Check In"
            onPress={() => router.push('/(tabs)/checkins')}
          />
          <QuickActionButton
            icon="event"
            label="RSVP"
            onPress={() => router.push('/(tabs)/events')}
            variant="secondary"
          />
          <QuickActionButton
            icon="people"
            label="Directory"
            onPress={() => router.push('/(tabs)/directory')}
            variant="secondary"
          />
        </View>

        {/* Role-specific Content */}
        <View style={{ margin: tokens.spacing.md }}>
          <Suspense fallback={<Skeleton height={120} />}>
            {userRole === 'MEMBER' && <MemberHomeContent data={data} />}
            {userRole === 'LEADER' && <LeaderHomeContent data={data} />}
            {userRole === 'ADMIN' && <AdminHomeContent data={data} />}
          </Suspense>
        </View>

        {/* Bottom padding */}
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
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  roleCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  serviceInfo: {
    fontSize: 14,
    color: '#666',
  },
  groupInfo: {
    fontSize: 14,
    color: '#666',
  },
  announcementInfo: {
    fontSize: 14,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e7ce8',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});