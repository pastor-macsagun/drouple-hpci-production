/**
 * Home Screen - Role-aware dashboard with quick actions
 * Calm motion, AA contrast, pastoral tone
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { attendanceRepo } from '../../data/repos/attendance';
import { eventsRepo } from '../../data/repos/events';
import { announcementsRepo } from '../../data/repos/announcements';
import { backgroundSync } from '../../sync/background';
import { LoadingCard } from '../../components/ui/LoadingCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

interface DashboardStats {
  todaysCheckIns: {
    total: number;
    pending: number;
    synced: number;
    newBelievers: number;
  };
  upcomingEvents: number;
  unreadAnnouncements: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState(backgroundSync.getStatus());

  useEffect(() => {
    loadDashboardData();
    
    // Listen to sync status changes
    const unsubscribe = backgroundSync.onStatusChange(setSyncStatus);
    return unsubscribe;
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      
      const [todaysCheckIns, events, announcements] = await Promise.all([
        attendanceRepo.getTodaysCheckIns(),
        eventsRepo.getAll(),
        announcementsRepo.getAll(),
      ]);

      // Filter upcoming events (next 7 days)
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcomingEvents = events.filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate >= now && eventDate <= nextWeek;
      });

      // Count unread announcements
      const unreadAnnouncements = announcements.filter(a => !a.readAt);

      setStats({
        todaysCheckIns,
        upcomingEvents: upcomingEvents.length,
        unreadAnnouncements: unreadAnnouncements.length,
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Unable to load dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Trigger immediate sync
    const syncResult = await backgroundSync.performImmediateSync();
    if (!syncResult.success) {
      Alert.alert('Sync Failed', syncResult.error || 'Unable to sync data');
    }
    
    // Reload local data
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'scan':
        router.push('/checkin');
        break;
      case 'events':
        router.push('/(tabs)/events');
        break;
      case 'directory':
        router.push('/(tabs)/directory');
        break;
      case 'announcements':
        router.push('/(tabs)/announcements');
        break;
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="p-4 space-y-4">
          <LoadingCard height={120} />
          <LoadingCard height={80} />
          <LoadingCard height={200} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !stats) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <ErrorState
          message={error}
          onRetry={loadDashboardData}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View className="px-4 py-6 bg-white border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">
            Welcome Home
          </Text>
          <Text className="text-gray-600 mt-1">
            Your church community at a glance
          </Text>
          
          {/* Sync Status Indicator */}
          {syncStatus.status === 'syncing' && (
            <View className="mt-3 px-3 py-2 bg-blue-50 rounded-md">
              <Text className="text-blue-700 text-sm">
                📡 Syncing latest data...
              </Text>
            </View>
          )}
          
          {syncStatus.status === 'error' && (
            <View className="mt-3 px-3 py-2 bg-red-50 rounded-md">
              <Text className="text-red-700 text-sm">
                ⚠️ Sync issue - some data may be outdated
              </Text>
            </View>
          )}
        </View>

        {/* Today's Activity Card */}
        <View className="mx-4 mt-4 p-4 bg-white rounded-lg shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Today's Service
          </Text>
          
          {stats?.todaysCheckIns && (
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Total Check-ins</Text>
                <Text className="font-semibold text-gray-900">
                  {stats.todaysCheckIns.total}
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Synced</Text>
                <Text className="font-semibold text-green-600">
                  {stats.todaysCheckIns.synced}
                </Text>
              </View>
              
              {stats.todaysCheckIns.pending > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Pending Sync</Text>
                  <Text className="font-semibold text-amber-600">
                    {stats.todaysCheckIns.pending}
                  </Text>
                </View>
              )}
              
              {stats.todaysCheckIns.newBelievers > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">New Believers</Text>
                  <Text className="font-semibold text-purple-600">
                    🎉 {stats.todaysCheckIns.newBelievers}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="mx-4 mt-4 p-4 bg-white rounded-lg shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Quick Actions
          </Text>
          
          <View className="flex-row flex-wrap gap-3">
            <Pressable
              onPress={() => handleQuickAction('scan')}
              className="flex-1 min-w-[140px] p-4 bg-blue-50 rounded-md active:bg-blue-100"
            >
              <Text className="text-2xl mb-1">📱</Text>
              <Text className="font-semibold text-blue-900">Scan Check-in</Text>
              <Text className="text-blue-700 text-sm">Mark attendance</Text>
            </Pressable>
            
            <Pressable
              onPress={() => handleQuickAction('events')}
              className="flex-1 min-w-[140px] p-4 bg-green-50 rounded-md active:bg-green-100"
            >
              <Text className="text-2xl mb-1">📅</Text>
              <Text className="font-semibold text-green-900">View Events</Text>
              <Text className="text-green-700 text-sm">{stats?.upcomingEvents || 0} upcoming</Text>
            </Pressable>
          </View>
          
          <View className="flex-row flex-wrap gap-3 mt-3">
            <Pressable
              onPress={() => handleQuickAction('directory')}
              className="flex-1 min-w-[140px] p-4 bg-purple-50 rounded-md active:bg-purple-100"
            >
              <Text className="text-2xl mb-1">👥</Text>
              <Text className="font-semibold text-purple-900">Directory</Text>
              <Text className="text-purple-700 text-sm">Find members</Text>
            </Pressable>
            
            <Pressable
              onPress={() => handleQuickAction('announcements')}
              className="flex-1 min-w-[140px] p-4 bg-orange-50 rounded-md active:bg-orange-100"
            >
              <Text className="text-2xl mb-1">📢</Text>
              <Text className="font-semibold text-orange-900">Announcements</Text>
              <Text className="text-orange-700 text-sm">
                {stats?.unreadAnnouncements || 0} unread
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Connection Status */}
        <View className="mx-4 my-4 p-3 bg-gray-100 rounded-md">
          <Text className="text-sm text-gray-600 text-center">
            {syncStatus.lastSync 
              ? `Last synced: ${new Date(syncStatus.lastSync).toLocaleTimeString()}`
              : 'Tap to refresh for latest updates'
            }
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}