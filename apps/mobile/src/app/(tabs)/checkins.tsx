import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';

import { useTokens } from '@/theme';
import { Card, Button, Badge } from '@/components/ui';
import { Skeleton, EmptyState, ErrorState } from '@/components/patterns';
import { SyncStatusBadge, OfflineBadge, PendingSyncBadge } from '@/components/sync/SyncStatusBadge';
import { attendanceRepository, AttendanceStats, AttendanceRecord } from '@/data/repos/attendance';
import { backgroundSyncManager } from '@/sync/background';
import { useAuth } from '@/hooks/useAuth';

interface CheckInSummary {
  todayTotal: number;
  weekTotal: number;
  recentCheckins: Array<AttendanceRecord & { memberName?: string }>;
  serviceInfo: {
    name: string;
    time: string;
    capacity?: number;
  };
}

const CheckInCard: React.FC<{ 
  item: AttendanceRecord & { memberName?: string };
  isPending?: boolean;
}> = ({ item, isPending = false }) => {
  const tokens = useTokens();
  
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Card style={[styles.checkinCard, { marginBottom: tokens.spacing.sm }]}>
      <View style={styles.checkinHeader}>
        <View style={styles.avatarContainer}>
          <MaterialIcons 
            name="person" 
            size={24} 
            color={tokens.colors.text.tertiary} 
          />
        </View>
        
        <View style={styles.checkinInfo}>
          <Text style={[styles.memberName, { color: tokens.colors.text.primary }]}>
            {item.memberName || `Member ${item.memberId.slice(-4)}`}
          </Text>
          <Text style={[styles.checkinTime, { color: tokens.colors.text.secondary }]}>
            {formatTime(item.checkedInAt)}
          </Text>
          {item.notes && (
            <Text style={[styles.checkinNotes, { color: tokens.colors.text.tertiary }]}>
              {item.notes}
            </Text>
          )}
        </View>
        
        <View style={styles.statusContainer}>
          {isPending ? (
            <Badge label="Pending" color="warning" />
          ) : (
            <MaterialIcons 
              name="check-circle" 
              size={20} 
              color={tokens.colors.state.success} 
            />
          )}
        </View>
      </View>
    </Card>
  );
};

const TodayStatsCard: React.FC<{ stats: CheckInSummary }> = ({ stats }) => {
  const tokens = useTokens();
  
  return (
    <Card style={[styles.statsCard, { marginBottom: tokens.spacing.md }]}>
      <View style={styles.statsHeader}>
        <View>
          <Text style={[styles.statsTitle, { color: tokens.colors.text.primary }]}>
            Today's Service
          </Text>
          <Text style={[styles.statsSubtitle, { color: tokens.colors.text.secondary }]}>
            {stats.serviceInfo.name} • {stats.serviceInfo.time}
          </Text>
        </View>
        <MaterialIcons name="church" size={32} color={tokens.colors.brand.primary} />
      </View>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: tokens.colors.brand.primary }]}>
            {stats.todayTotal}
          </Text>
          <Text style={[styles.statLabel, { color: tokens.colors.text.tertiary }]}>
            Today
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: tokens.colors.brand.primary }]}>
            {stats.weekTotal}
          </Text>
          <Text style={[styles.statLabel, { color: tokens.colors.text.tertiary }]}>
            This Week
          </Text>
        </View>
        
        {stats.serviceInfo.capacity && (
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: tokens.colors.brand.primary }]}>
              {Math.round((stats.todayTotal / stats.serviceInfo.capacity) * 100)}%
            </Text>
            <Text style={[styles.statLabel, { color: tokens.colors.text.tertiary }]}>
              Capacity
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
};

const QuickActionsCard: React.FC<{ 
  onScanQR: () => void;
  onManualEntry: () => void;
  isOffline: boolean;
}> = ({ onScanQR, onManualEntry, isOffline }) => {
  const tokens = useTokens();
  
  return (
    <Card style={[styles.quickActionsCard, { marginBottom: tokens.spacing.md }]}>
      <Text style={[styles.cardTitle, { color: tokens.colors.text.primary }]}>
        Quick Check-in
      </Text>
      
      <View style={styles.quickActions}>
        <Button
          variant="filled"
          size="lg"
          leftIcon="qr-code-scanner"
          onPress={onScanQR}
          style={styles.primaryAction}
        >
          Scan QR Code
        </Button>
        
        <Button
          variant="outlined"
          size="lg"
          leftIcon="person-add"
          onPress={onManualEntry}
          style={styles.secondaryAction}
        >
          Manual Entry
        </Button>
      </View>
      
      {isOffline && (
        <View style={styles.offlineNotice}>
          <MaterialIcons name="wifi-off" size={16} color={tokens.colors.state.warning} />
          <Text style={[styles.offlineText, { color: tokens.colors.state.warning }]}>
            Offline mode - Check-ins will sync when connected
          </Text>
        </View>
      )}
    </Card>
  );
};

export default function CheckinsPage() {
  const { user } = useAuth();
  const tokens = useTokens();
  const [refreshing, setRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    pending: 0,
    isOnline: true,
    lastSync: undefined as Date | undefined,
  });

  // Fetch check-in data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['checkins-summary'],
    queryFn: async (): Promise<CheckInSummary> => {
      const [stats] = await Promise.all([
        attendanceRepository.getTodayStats(),
      ]);

      return {
        todayTotal: stats.totalToday,
        weekTotal: stats.totalThisWeek,
        recentCheckins: stats.recentCheckIns,
        serviceInfo: {
          name: 'Sunday Worship',
          time: '10:00 AM',
          capacity: 200,
        },
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Monitor sync status
  useEffect(() => {
    const updateSyncStatus = async () => {
      try {
        const [bgStatus, attendanceStatus] = await Promise.all([
          backgroundSyncManager.getSyncStatus(),
          attendanceRepository.getSyncStatus(),
        ]);
        
        setSyncStatus({
          pending: bgStatus.pendingItems,
          isOnline: bgStatus.isOnline,
          lastSync: bgStatus.lastSync,
        });
      } catch (error) {
        console.warn('Failed to get sync status:', error);
      }
    };

    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await backgroundSyncManager.forcSync();
      await refetch();
      
      const status = await backgroundSyncManager.getSyncStatus();
      setSyncStatus({
        pending: status.pendingItems,
        isOnline: status.isOnline,
        lastSync: status.lastSync,
      });
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleScanQR = () => {
    router.push('/(modals)/checkin-qr');
  };

  const handleManualEntry = () => {
    Alert.alert(
      'Manual Check-in',
      'Enter member details manually for check-in',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => router.push('/checkin-manual') },
      ]
    );
  };

  const handleSyncPress = async () => {
    try {
      await backgroundSyncManager.forcSync();
      const status = await backgroundSyncManager.getSyncStatus();
      setSyncStatus({
        pending: status.pendingItems,
        isOnline: status.isOnline,
        lastSync: status.lastSync,
      });
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.bg.surface }]}>
        <View style={[styles.header, { backgroundColor: tokens.colors.bg.primary }]}>
          <Skeleton width={120} height={24} />
          <Skeleton width={80} height={32} />
        </View>
        <ScrollView style={styles.content}>
          <Skeleton height={120} style={{ margin: tokens.spacing.md }} />
          <Skeleton height={80} style={{ margin: tokens.spacing.md }} />
          <Skeleton height={200} style={{ margin: tokens.spacing.md }} />
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
          title="Couldn't load check-ins"
          message="We're having trouble connecting. Please check your connection and try again."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.bg.surface }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: tokens.colors.bg.primary }]}>
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: tokens.colors.text.primary }]}>
            Check-ins
          </Text>
          <View style={styles.statusBadges}>
            <OfflineBadge visible={!syncStatus.isOnline} />
            <PendingSyncBadge 
              count={syncStatus.pending} 
              onPress={handleSyncPress}
            />
            {syncStatus.isOnline && syncStatus.pending === 0 && (
              <SyncStatusBadge size="sm" onPress={handleSyncPress} />
            )}
          </View>
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
        {/* Today's Stats */}
        <View style={{ margin: tokens.spacing.md }}>
          <TodayStatsCard stats={data!} />
          
          {/* Quick Actions */}
          <QuickActionsCard
            onScanQR={handleScanQR}
            onManualEntry={handleManualEntry}
            isOffline={!syncStatus.isOnline}
          />

          {/* Recent Check-ins */}
          {data!.recentCheckins.length > 0 ? (
            <Card style={styles.recentSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: tokens.colors.text.primary }]}>
                  Recent Check-ins
                </Text>
                <Text style={[styles.sectionSubtitle, { color: tokens.colors.text.secondary }]}>
                  {syncStatus.isOnline 
                    ? `Last updated: ${syncStatus.lastSync?.toLocaleTimeString() || 'Never'}`
                    : 'Offline - showing cached data'
                  }
                </Text>
              </View>
              
              <View style={{ marginTop: tokens.spacing.md }}>
                {data!.recentCheckins.map((checkin, index) => (
                  <CheckInCard
                    key={checkin.id}
                    item={checkin}
                    isPending={!syncStatus.isOnline && index < 3} // Mock pending status
                  />
                ))}
              </View>
            </Card>
          ) : (
            <EmptyState
              icon="qr-code-scanner"
              title="No Check-ins Today"
              message="Be the first to check in for today's service."
              actionLabel="Start Scanning"
              onAction={handleScanQR}
            />
          )}
        </View>

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
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  statusBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  content: {
    flex: 1,
  },
  statsCard: {
    padding: 20,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickActionsCard: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActions: {
    gap: 12,
  },
  primaryAction: {
    minHeight: 56,
  },
  secondaryAction: {
    minHeight: 56,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: 8,
  },
  offlineText: {
    fontSize: 14,
    flex: 1,
  },
  recentSection: {
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
  },
  checkinCard: {
    padding: 16,
  },
  checkinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  checkinInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  checkinTime: {
    fontSize: 14,
    marginBottom: 2,
  },
  checkinNotes: {
    fontSize: 12,
  },
  statusContainer: {
    alignItems: 'center',
  },
});