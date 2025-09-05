/**
 * Announcements Screen - List with deep-link detail, mark as read
 */

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { announcementsRepo } from '../../data/repos/announcements';
import { type DbAnnouncement } from '../../data/db';
import { backgroundSync } from '../../sync/background';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingCard } from '../../components/ui/LoadingCard';

export default function AnnouncementsScreen() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<DbAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const allAnnouncements = await announcementsRepo.getAll();
      
      // Filter out expired announcements
      const now = new Date();
      const validAnnouncements = allAnnouncements.filter(announcement => {
        if (!announcement.expiresAt) return true;
        return new Date(announcement.expiresAt) > now;
      });
      
      setAnnouncements(validAnnouncements);
    } catch (error) {
      console.error('Failed to load announcements:', error);
      Alert.alert('Error', 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Trigger sync
    const syncResult = await backgroundSync.performImmediateSync();
    if (!syncResult.success) {
      console.warn('Sync failed:', syncResult.error);
    }
    
    // Reload local data
    await loadAnnouncements();
    setRefreshing(false);
  };

  const handleAnnouncementPress = async (announcement: DbAnnouncement) => {
    // Mark as read locally
    if (!announcement.readAt) {
      try {
        await announcementsRepo.markAsRead(announcement.id);
        // Update local state
        setAnnouncements(prev => 
          prev.map(a => 
            a.id === announcement.id 
              ? { ...a, readAt: new Date().toISOString() }
              : a
          )
        );
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }

    // Navigate to detail view
    router.push(`/(modals)/announcement/${announcement.id}`);
  };

  const getPriorityIcon = (priority: string): string => {
    switch (priority) {
      case 'urgent': return '🚨';
      case 'high': return '⚠️';
      case 'normal': return '📢';
      case 'low': return '💬';
      default: return '📢';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'normal': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-blue-600';
    }
  };

  const formatAnnouncementDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    if (diffHours < 48) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const renderAnnouncement = ({ item: announcement }: { item: DbAnnouncement }) => (
    <Pressable
      onPress={() => handleAnnouncementPress(announcement)}
      className={`mx-4 mb-4 p-4 bg-white rounded-lg shadow-sm active:bg-gray-50 ${
        !announcement.readAt ? 'border-l-4 border-blue-500' : ''
      }`}
    >
      {/* Announcement Header */}
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-row items-center flex-1 mr-3">
          <Text className="text-lg mr-2">
            {getPriorityIcon(announcement.priority)}
          </Text>
          <Text 
            className={`text-lg font-semibold ${
              !announcement.readAt ? 'text-gray-900' : 'text-gray-700'
            }`} 
            numberOfLines={2}
          >
            {announcement.title}
          </Text>
        </View>
        
        <View className="items-end">
          <Text className={`text-sm font-medium ${getPriorityColor(announcement.priority)}`}>
            {announcement.priority.toUpperCase()}
          </Text>
          {announcement.publishedAt && (
            <Text className="text-gray-500 text-xs mt-1">
              {formatAnnouncementDate(announcement.publishedAt)}
            </Text>
          )}
        </View>
      </View>

      {/* Announcement Content Preview */}
      <Text 
        className={`${
          !announcement.readAt ? 'text-gray-800' : 'text-gray-600'
        } leading-5`} 
        numberOfLines={3}
      >
        {announcement.content}
      </Text>

      {/* Read Status & Action */}
      <View className="flex-row justify-between items-center mt-3">
        <View className="flex-row items-center">
          {!announcement.readAt ? (
            <View className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
          ) : (
            <Text className="text-gray-400 text-xs">✓ Read</Text>
          )}
        </View>
        
        <Text className="text-blue-600 text-sm font-medium">
          Tap to read more →
        </Text>
      </View>

      {/* Expiration Warning */}
      {announcement.expiresAt && (
        <View className="mt-2 pt-2 border-t border-gray-100">
          <Text className="text-orange-600 text-xs">
            ⏰ Expires {formatAnnouncementDate(announcement.expiresAt)}
          </Text>
        </View>
      )}
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="p-4">
          <LoadingCard height={140} className="mb-4" />
          <LoadingCard height={140} className="mb-4" />
          <LoadingCard height={140} className="mb-4" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 py-6 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">
          Announcements
        </Text>
        <Text className="text-gray-600 mt-1">
          Stay connected with church updates
        </Text>
        
        {/* Unread Count */}
        {announcements.some(a => !a.readAt) && (
          <View className="mt-3">
            <Text className="text-blue-600 text-sm font-medium">
              {announcements.filter(a => !a.readAt).length} unread messages
            </Text>
          </View>
        )}
      </View>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <EmptyState
          icon="📢"
          title="No Announcements"
          message="No announcements at the moment. Check back later for church updates and news."
          actionText="Refresh"
          onAction={handleRefresh}
        />
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          renderItem={renderAnnouncement}
          className="flex-1"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      {/* Announcements Count */}
      {announcements.length > 0 && (
        <View className="px-4 py-2 bg-gray-100 border-t border-gray-200">
          <Text className="text-gray-600 text-center text-sm">
            {announcements.length} announcement{announcements.length !== 1 ? 's' : ''} available
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}