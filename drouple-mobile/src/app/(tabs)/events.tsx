/**
 * Events Screen - List with pull-to-refresh, detail sheets, RSVP
 */

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { eventsRepo } from '../../data/repos/events';
import { type DbEvent } from '../../data/db';
import { backgroundSync } from '../../sync/background';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingCard } from '../../components/ui/LoadingCard';

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const allEvents = await eventsRepo.getAll();
      
      // Filter and sort events
      const now = new Date();
      const upcomingEvents = allEvents
        .filter(event => new Date(event.startDate) >= now)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      
      setEvents(upcomingEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
      Alert.alert('Error', 'Failed to load events');
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
    await loadEvents();
    setRefreshing(false);
  };

  const handleEventPress = (event: DbEvent) => {
    router.push(`/(modals)/event/${event.id}`);
  };

  const formatEventDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatEventTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const renderEvent = ({ item: event }: { item: DbEvent }) => (
    <Pressable
      onPress={() => handleEventPress(event)}
      className="mx-4 mb-4 p-4 bg-white rounded-lg shadow-sm active:bg-gray-50"
    >
      {/* Event Header */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 mr-3">
          <Text className="text-lg font-semibold text-gray-900" numberOfLines={2}>
            {event.title}
          </Text>
          {event.location && (
            <Text className="text-gray-600 mt-1">
              📍 {event.location}
            </Text>
          )}
        </View>
        
        <View className="items-end">
          <Text className="text-blue-600 font-semibold">
            {formatEventDate(event.startDate)}
          </Text>
          <Text className="text-gray-600 text-sm">
            {formatEventTime(event.startDate)}
          </Text>
        </View>
      </View>

      {/* Event Description */}
      {event.description && (
        <Text className="text-gray-700 mb-3" numberOfLines={2}>
          {event.description}
        </Text>
      )}

      {/* Event Details */}
      <View className="flex-row justify-between items-center">
        <View className="flex-row space-x-4">
          {event.capacity && (
            <Text className="text-gray-500 text-sm">
              👥 {event.capacity} spots
            </Text>
          )}
          
          {event.fee && event.fee > 0 && (
            <Text className="text-gray-500 text-sm">
              💰 ${event.fee}
            </Text>
          )}
        </View>
        
        <View className="px-3 py-1 bg-blue-100 rounded-full">
          <Text className="text-blue-800 text-sm font-medium">
            Tap to RSVP
          </Text>
        </View>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="p-4">
          <LoadingCard height={120} className="mb-4" />
          <LoadingCard height={120} className="mb-4" />
          <LoadingCard height={120} className="mb-4" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 py-6 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">
          Upcoming Events
        </Text>
        <Text className="text-gray-600 mt-1">
          Join us in fellowship and ministry
        </Text>
      </View>

      {/* Events List */}
      {events.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No Upcoming Events"
          message="No events are currently scheduled. Check back later or contact your church administrator."
          actionText="Refresh"
          onAction={handleRefresh}
        />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          className="flex-1"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      {/* Events Count */}
      {events.length > 0 && (
        <View className="px-4 py-2 bg-gray-100 border-t border-gray-200">
          <Text className="text-gray-600 text-center text-sm">
            {events.length} upcoming event{events.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}