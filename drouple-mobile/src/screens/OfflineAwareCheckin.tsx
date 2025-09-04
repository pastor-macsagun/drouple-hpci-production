/**
 * Offline-Aware Check-in Screen
 * Demonstrates offline-first functionality with sync management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStatus } from '../hooks/api/useAuth';
import { 
  useServices, 
  useQuickCheckin, 
  useCanCheckinToday, 
  useCheckinHistory,
  useCheckinStats 
} from '../hooks/api/useCheckin';
import { useSyncManager } from '../lib/sync/manager';
import { useRealtime, useServiceAttendance } from '../hooks/useRealtime';
import { format } from 'date-fns';

interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    date: string;
    time: string;
    location?: string;
    attendanceCount: number;
  };
  onCheckIn: (serviceId: string) => void;
  isCheckingIn: boolean;
  canCheckIn: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ 
  service, 
  onCheckIn, 
  isCheckingIn, 
  canCheckIn 
}) => {
  const { attendanceCount, recentCheckins } = useServiceAttendance(service.id);

  return (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceName}>{service.name}</Text>
        <Text style={styles.serviceDate}>
          {format(new Date(service.date), 'MMM dd')} at {service.time}
        </Text>
      </View>
      
      {service.location && (
        <Text style={styles.serviceLocation}>{service.location}</Text>
      )}
      
      <View style={styles.serviceStats}>
        <Text style={styles.attendanceCount}>
          {attendanceCount || service.attendanceCount} attendees
        </Text>
        {recentCheckins.length > 0 && (
          <Text style={styles.recentActivity}>
            {recentCheckins.length} recent check-ins
          </Text>
        )}
      </View>
      
      <TouchableOpacity
        style={[
          styles.checkinButton,
          !canCheckIn && styles.checkinButtonDisabled,
          isCheckingIn && styles.checkinButtonLoading,
        ]}
        onPress={() => onCheckIn(service.id)}
        disabled={!canCheckIn || isCheckingIn}
      >
        <Text style={[
          styles.checkinButtonText,
          !canCheckIn && styles.checkinButtonTextDisabled,
        ]}>
          {isCheckingIn ? 'Checking In...' : canCheckIn ? 'Check In' : 'Already Checked In'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

interface ConnectionStatusBannerProps {
  isOnline: boolean;
  queueStatus: {
    pending: number;
    failed: number;
  };
}

const ConnectionStatusBanner: React.FC<ConnectionStatusBannerProps> = ({ 
  isOnline, 
  queueStatus 
}) => {
  const getStatusColor = () => {
    if (!isOnline && queueStatus.failed > 0) return '#ef4444';
    if (!isOnline) return '#f59e0b';
    if (queueStatus.pending > 0) return '#3b82f6';
    return '#10b981';
  };

  const getStatusMessage = () => {
    if (!isOnline && queueStatus.failed > 0) {
      return `Offline - ${queueStatus.failed} failed, ${queueStatus.pending} queued`;
    }
    if (!isOnline) {
      return `Offline - ${queueStatus.pending} operations queued`;
    }
    if (queueStatus.pending > 0) {
      return `Online - Syncing ${queueStatus.pending} operations`;
    }
    return 'Online - All synced';
  };

  return (
    <View style={[styles.statusBanner, { backgroundColor: getStatusColor() }]}>
      <Text style={styles.statusText}>{getStatusMessage()}</Text>
    </View>
  );
};

export const OfflineAwareCheckinScreen: React.FC = () => {
  const [selectedNewBeliever, setSelectedNewBeliever] = useState(false);

  const { user, isAuthenticated } = useAuthStatus();
  const { data: services, isLoading: servicesLoading, refetch: refetchServices } = useServices();
  const { canCheckin, isLoading: canCheckinLoading } = useCanCheckinToday();
  const { data: checkinHistory } = useCheckinHistory();
  const { stats } = useCheckinStats();
  const quickCheckinMutation = useQuickCheckin();
  
  const { status: syncStatus, forceSync } = useSyncManager();
  const { status: realtimeStatus } = useRealtime({ 
    autoConnect: true,
    eventTypes: ['service:checkin', 'checkin:new']
  });

  const handleQuickCheckIn = async () => {
    if (!isAuthenticated) {
      Alert.alert('Authentication Required', 'Please log in to check in.');
      return;
    }

    try {
      const result = await quickCheckinMutation.mutateAsync({
        newBeliever: selectedNewBeliever,
      });

      // Show success message with offline awareness
      const message = syncStatus.isOnline 
        ? 'Check-in completed successfully!'
        : 'Check-in queued for sync when online.';
        
      Alert.alert('Check-in Success', message);
      
      // Refresh services to update attendance
      if (syncStatus.isOnline) {
        refetchServices();
      }
    } catch (error) {
      console.error('Check-in failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Check-in failed';
      Alert.alert('Check-in Failed', errorMessage);
    }
  };

  const handleServiceCheckIn = async (serviceId: string) => {
    // This would be similar to quick check-in but for specific service
    // For demo purposes, we'll use quick check-in
    handleQuickCheckIn();
  };

  const handleForceSync = async () => {
    try {
      await forceSync();
      Alert.alert('Sync Complete', 'All operations have been synchronized.');
      refetchServices();
    } catch (error) {
      console.error('Sync failed:', error);
      Alert.alert('Sync Failed', 'Failed to synchronize data.');
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authRequired}>
          <Text style={styles.authRequiredText}>Authentication Required</Text>
          <Text style={styles.authRequiredSubtext}>
            Please log in to access check-in functionality.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <ConnectionStatusBanner 
        isOnline={syncStatus.isOnline} 
        queueStatus={syncStatus.queueStatus} 
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Service Check-In</Text>
          <Text style={styles.subtitle}>
            Welcome back, {user?.firstName}!
          </Text>
        </View>

        {/* User Stats */}
        {stats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Your Check-in Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalCheckins}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.thisMonth}</Text>
                <Text style={styles.statLabel}>This Month</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.streak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Check-in */}
        <View style={styles.quickCheckinCard}>
          <Text style={styles.cardTitle}>Quick Check-in</Text>
          <Text style={styles.cardSubtitle}>
            Check in to today's service instantly
          </Text>
          
          <View style={styles.newBelieverToggle}>
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={() => setSelectedNewBeliever(!selectedNewBeliever)}
            >
              <View style={[
                styles.toggleCheckbox,
                selectedNewBeliever && styles.toggleCheckboxChecked
              ]}>
                {selectedNewBeliever && <Text style={styles.toggleCheckmark}>✓</Text>}
              </View>
              <Text style={styles.toggleLabel}>I'm a new believer / first-time visitor</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={[
              styles.quickCheckinButton,
              (!canCheckin || quickCheckinMutation.isLoading) && styles.quickCheckinButtonDisabled,
            ]}
            onPress={handleQuickCheckIn}
            disabled={!canCheckin || quickCheckinMutation.isLoading || canCheckinLoading}
          >
            <Text style={[
              styles.quickCheckinButtonText,
              (!canCheckin || quickCheckinMutation.isLoading) && styles.quickCheckinButtonTextDisabled,
            ]}>
              {quickCheckinMutation.isLoading ? 'Checking In...' : 
               canCheckinLoading ? 'Loading...' :
               canCheckin ? 'Quick Check-In' : 'Already Checked In Today'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Available Services */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Services</Text>
            <TouchableOpacity onPress={() => refetchServices()}>
              <Text style={styles.refreshButton}>Refresh</Text>
            </TouchableOpacity>
          </View>
          
          {servicesLoading ? (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Loading services...</Text>
            </View>
          ) : services && services.length > 0 ? (
            services.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                onCheckIn={handleServiceCheckIn}
                isCheckingIn={quickCheckinMutation.isLoading}
                canCheckIn={canCheckin}
              />
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No services available</Text>
              <Text style={styles.emptySubtext}>
                Check back later or contact your church administrator.
              </Text>
            </View>
          )}
        </View>

        {/* Recent Check-ins */}
        {checkinHistory && checkinHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Check-ins</Text>
            {checkinHistory.slice(0, 3).map((checkin, index) => (
              <View key={checkin.id} style={styles.historyCard}>
                <Text style={styles.historyService}>{checkin.serviceName}</Text>
                <Text style={styles.historyDate}>
                  {format(new Date(checkin.checkedInAt), 'MMM dd, yyyy \'at\' h:mm a')}
                </Text>
                {checkin.isNewBeliever && (
                  <Text style={styles.newBelieverBadge}>New Believer</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Sync Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync Status</Text>
          <View style={styles.syncCard}>
            <View style={styles.syncStatus}>
              <Text style={styles.syncLabel}>Connection:</Text>
              <Text style={[styles.syncValue, { color: syncStatus.isOnline ? '#10b981' : '#f59e0b' }]}>
                {syncStatus.isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            <View style={styles.syncStatus}>
              <Text style={styles.syncLabel}>Queue:</Text>
              <Text style={styles.syncValue}>
                {syncStatus.queueStatus.pending} pending, {syncStatus.queueStatus.failed} failed
              </Text>
            </View>
            <View style={styles.syncStatus}>
              <Text style={styles.syncLabel}>Realtime:</Text>
              <Text style={[styles.syncValue, { color: realtimeStatus.isConnected ? '#10b981' : '#94a3b8' }]}>
                {realtimeStatus.status} ({realtimeStatus.transport})
              </Text>
            </View>
            
            {(syncStatus.queueStatus.pending > 0 || syncStatus.queueStatus.failed > 0) && (
              <TouchableOpacity style={styles.syncButton} onPress={handleForceSync}>
                <Text style={styles.syncButtonText}>Force Sync</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  statusBanner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  authRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authRequiredText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  authRequiredSubtext: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e7ce8',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  quickCheckinCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  newBelieverToggle: {
    marginBottom: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleCheckboxChecked: {
    backgroundColor: '#1e7ce8',
    borderColor: '#1e7ce8',
  },
  toggleCheckmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  toggleLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  quickCheckinButton: {
    backgroundColor: '#1e7ce8',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickCheckinButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  quickCheckinButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickCheckinButtonTextDisabled: {
    color: '#9ca3af',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
  },
  refreshButton: {
    color: '#1e7ce8',
    fontSize: 14,
    fontWeight: '500',
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceHeader: {
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  serviceDate: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  serviceLocation: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  serviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  attendanceCount: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  recentActivity: {
    fontSize: 14,
    color: '#3b82f6',
  },
  checkinButton: {
    backgroundColor: '#1e7ce8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkinButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  checkinButtonLoading: {
    backgroundColor: '#3b82f6',
  },
  checkinButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  checkinButtonTextDisabled: {
    color: '#9ca3af',
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 16,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#e5c453',
  },
  historyService: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  historyDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  newBelieverBadge: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
    marginTop: 4,
  },
  syncCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  syncStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  syncLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  syncValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  syncButton: {
    backgroundColor: '#f59e0b',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OfflineAwareCheckinScreen;