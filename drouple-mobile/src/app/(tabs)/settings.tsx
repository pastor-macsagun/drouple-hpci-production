/**
 * Settings Screen - Profile, notifications, privacy options
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { clearAllSecureItems } from '../../lib/auth/secure';
import { db } from '../../data/db';
import { backgroundSync } from '../../sync/background';
import { outboxManager } from '../../sync/outbox';

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'button' | 'navigation';
  value?: boolean;
  icon?: string;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [stats, setStats] = useState({ members: 0, events: 0, pendingSync: 0 });
  const [syncStatus, setSyncStatus] = useState(backgroundSync.getStatus());

  useEffect(() => {
    loadStats();
    const unsubscribe = backgroundSync.onStatusChange(setSyncStatus);
    return unsubscribe;
  }, []);

  const loadStats = async () => {
    try {
      const dbStats = await db.getStats();
      setStats(dbStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Any unsynced data will remain on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllSecureItems();
              // Navigate to auth screen (would be handled by auth state)
              router.replace('/(auth)/signin');
            } catch (error) {
              console.error('Sign out failed:', error);
              Alert.alert('Error', 'Failed to sign out properly');
            }
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will remove all offline data from this device. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.clearAllData();
              await outboxManager.clearAll();
              await loadStats();
              Alert.alert('Success', 'All local data has been cleared');
            } catch (error) {
              console.error('Failed to clear data:', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const handleForceSync = async () => {
    const result = await backgroundSync.performImmediateSync();
    if (result.success) {
      Alert.alert('Success', 'Data synchronized successfully');
      await loadStats();
    } else {
      Alert.alert('Sync Failed', result.error || 'Unknown error occurred');
    }
  };

  const settingsSections: SettingsSection[] = [
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Profile',
          subtitle: 'View and edit your profile',
          type: 'navigation',
          icon: '👤',
          onPress: () => router.push('/(modals)/profile'),
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'push_notifications',
          title: 'Push Notifications',
          subtitle: 'Receive announcements and updates',
          type: 'toggle',
          icon: '📱',
          value: pushEnabled,
          onToggle: setPushEnabled,
        },
        {
          id: 'notification_settings',
          title: 'Notification Preferences',
          subtitle: 'Customize which notifications you receive',
          type: 'navigation',
          icon: '⚙️',
          onPress: () => router.push('/(modals)/notification-settings'),
        },
      ],
    },
    {
      title: 'Sync & Data',
      items: [
        {
          id: 'background_sync',
          title: 'Background Sync',
          subtitle: syncStatus.lastSync 
            ? `Last synced: ${new Date(syncStatus.lastSync).toLocaleString()}`
            : 'Keep data up to date automatically',
          type: 'toggle',
          icon: '🔄',
          value: syncEnabled,
          onToggle: async (value) => {
            setSyncEnabled(value);
            if (value) {
              await backgroundSync.enable();
            } else {
              await backgroundSync.disable();
            }
          },
        },
        {
          id: 'force_sync',
          title: 'Sync Now',
          subtitle: syncStatus.status === 'syncing' ? 'Syncing...' : 'Force immediate sync',
          type: 'button',
          icon: '📡',
          onPress: handleForceSync,
        },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        {
          id: 'privacy_policy',
          title: 'Privacy Policy',
          subtitle: 'How we protect your information',
          type: 'navigation',
          icon: '🔒',
          onPress: () => router.push('/(modals)/privacy-policy'),
        },
        {
          id: 'data_usage',
          title: 'Data Usage',
          subtitle: 'See what data is stored locally',
          type: 'navigation',
          icon: '📊',
          onPress: () => router.push('/(modals)/data-usage'),
        },
      ],
    },
    {
      title: 'Advanced',
      items: [
        {
          id: 'clear_data',
          title: 'Clear Offline Data',
          subtitle: 'Remove all local data from this device',
          type: 'button',
          icon: '🗑️',
          onPress: handleClearData,
        },
        {
          id: 'app_info',
          title: 'App Information',
          subtitle: 'Version, build info, and diagnostics',
          type: 'navigation',
          icon: 'ℹ️',
          onPress: () => router.push('/(modals)/app-info'),
        },
      ],
    },
  ];

  const renderSettingsItem = (item: SettingsItem) => {
    const isDestructive = item.id === 'clear_data' || item.id === 'sign_out';
    
    return (
      <Pressable
        key={item.id}
        onPress={item.type === 'button' ? item.onPress : item.type === 'navigation' ? item.onPress : undefined}
        className={`flex-row items-center justify-between py-3 px-4 ${
          item.type !== 'toggle' ? 'active:bg-gray-100' : ''
        }`}
      >
        <View className="flex-row items-center flex-1">
          {item.icon && (
            <Text className="text-xl mr-3">{item.icon}</Text>
          )}
          <View className="flex-1">
            <Text className={`text-base font-medium ${
              isDestructive ? 'text-red-600' : 'text-gray-900'
            }`}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text className="text-sm text-gray-600 mt-1">
                {item.subtitle}
              </Text>
            )}
          </View>
        </View>

        {item.type === 'toggle' && (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
            thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
          />
        )}

        {item.type === 'navigation' && (
          <Text className="text-gray-400 text-lg">›</Text>
        )}
      </Pressable>
    );
  };

  const renderSettingsSection = (section: SettingsSection) => (
    <View key={section.title} className="mb-6">
      <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-4 mb-2">
        {section.title}
      </Text>
      <View className="bg-white rounded-lg mx-4 shadow-sm">
        {section.items.map((item, index) => (
          <View key={item.id}>
            {renderSettingsItem(item)}
            {index < section.items.length - 1 && (
              <View className="h-px bg-gray-100 ml-12" />
            )}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 py-6 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">
          Settings
        </Text>
        <Text className="text-gray-600 mt-1">
          Customize your church app experience
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Data Summary */}
        <View className="mx-4 mt-6 p-4 bg-blue-50 rounded-lg">
          <Text className="font-semibold text-blue-900 mb-2">
            Offline Data Summary
          </Text>
          <View className="space-y-1">
            <Text className="text-blue-800 text-sm">
              📱 {stats.members} members cached locally
            </Text>
            <Text className="text-blue-800 text-sm">
              📅 {stats.events} events cached locally  
            </Text>
            {stats.pendingSync > 0 && (
              <Text className="text-amber-700 text-sm">
                ⏳ {stats.pendingSync} items pending sync
              </Text>
            )}
          </View>
        </View>

        {/* Settings Sections */}
        <View className="mt-6">
          {settingsSections.map(renderSettingsSection)}
        </View>

        {/* Sign Out Button */}
        <View className="mx-4 mb-8">
          <Pressable
            onPress={handleSignOut}
            className="py-4 bg-white rounded-lg shadow-sm border border-red-200 active:bg-red-50"
          >
            <Text className="text-red-600 font-semibold text-center">
              Sign Out
            </Text>
          </Pressable>
        </View>

        {/* App Version */}
        <View className="px-4 pb-6">
          <Text className="text-gray-500 text-xs text-center">
            Drouple Mobile v1.0.0 • Build 1
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}