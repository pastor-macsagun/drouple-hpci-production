/**
 * Events Screen - List and manage church events
 */

import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  Button,
  Chip,
  Icon,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { EmptyState } from '@/components/ui/EmptyState';
import {
  eventsService,
  initializeEventsService,
} from '@/services/eventsService';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { queryClient } from '@/lib/api';
import { colors } from '@/theme/colors';
import type { MockEvent } from '@/data/mockEvents';
import type { EventsStackParamList } from '../navigation/EventsStack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Initialize events service
initializeEventsService(queryClient);

type NavigationProp = NativeStackNavigationProp<
  EventsStackParamList,
  'EventsList'
>;

export const EventsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { status: syncStatus } = useOfflineSync();
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Query for events data
  const {
    data: events = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsService.fetchEvents(),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: failureCount => {
      if (!syncStatus.isOnline) return false;
      return failureCount < 2;
    },
  });

  const handleRefresh = async () => {
    if (!syncStatus.isOnline) {
      setSnackbarMessage('Cannot refresh while offline');
      setSnackbarVisible(true);
      return;
    }

    setRefreshing(true);
    try {
      await eventsService.clearCache();
      await refetch();
    } catch (error) {
      console.error('Failed to refresh events:', error);
      setSnackbarMessage('Failed to refresh events');
      setSnackbarVisible(true);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEventPress = (eventId: string) => {
    navigation.navigate('EventDetail', { eventId });
  };

  const getEventStatusChip = (event: MockEvent) => {
    if (event.userRSVPStatus === 'confirmed') {
      return (
        <Chip mode='flat' textStyle={{ color: colors.success }}>
          RSVP'd
        </Chip>
      );
    }
    if (event.userRSVPStatus === 'waitlisted') {
      return (
        <Chip mode='flat' textStyle={{ color: colors.warning }}>
          Waitlisted
        </Chip>
      );
    }
    if (event.spotsLeft === 0) {
      return (
        <Chip mode='flat' textStyle={{ color: colors.error }}>
          Full
        </Chip>
      );
    }
    return <Chip mode='outlined'>{event.spotsLeft} spots left</Chip>;
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={colors.primary.main} />
          <Text variant='bodyMedium' style={styles.loadingText}>
            Loading events...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon source='alert-circle-outline' size={48} />
          <Text variant='headlineSmall' style={styles.errorTitle}>
            Unable to load events
          </Text>
          <Text variant='bodyMedium' style={styles.errorMessage}>
            {syncStatus.isOnline
              ? 'Please try again'
              : 'Connect to internet and try again'}
          </Text>
          <Button
            mode='contained'
            onPress={() => refetch()}
            style={styles.retryButton}
            disabled={!syncStatus.isOnline}
          >
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (events.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon='calendar-outline'
          title='No events available'
          message='There are no upcoming events at this time.'
          action={
            syncStatus.isOnline ? (
              <Button mode='contained' onPress={handleRefresh}>
                Refresh
              </Button>
            ) : undefined
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            enabled={syncStatus.isOnline}
            colors={[colors.primary.main]}
          />
        }
      >
        {/* Offline indicator */}
        {!syncStatus.isOnline && (
          <Card style={styles.offlineCard}>
            <Card.Content style={styles.offlineCardContent}>
              <View style={styles.offlineIndicator}>
                <Icon source='wifi-off' size={20} color='white' />
                <Text variant='bodyMedium' style={styles.offlineText}>
                  You're offline. Some features may be limited.
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {events.map(event => (
          <Card
            key={event.id}
            style={styles.eventCard}
            onPress={() => handleEventPress(event.id)}
          >
            <Card.Content>
              <View style={styles.eventHeader}>
                <View style={styles.eventInfo}>
                  <Text variant='headlineSmall' style={styles.eventTitle}>
                    {event.title}
                  </Text>
                  <View style={styles.eventLocation}>
                    <Icon source='map-marker' size={16} />
                    <Text variant='bodyMedium' style={styles.eventLocationText}>
                      {event.location}
                    </Text>
                  </View>
                  <View style={styles.eventTime}>
                    <Icon source='clock-outline' size={16} />
                    <Text variant='bodyMedium' style={styles.eventTimeText}>
                      {formatEventDate(event.startsAt)} at{' '}
                      {new Date(event.startsAt).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
                {getEventStatusChip(event)}
              </View>

              <Text
                variant='bodyMedium'
                numberOfLines={2}
                style={styles.eventDescription}
              >
                {event.description}
              </Text>

              {/* Event stats */}
              <View style={styles.eventStats}>
                <View style={styles.attendeeStats}>
                  <Icon source='account-group' size={16} />
                  <Text variant='bodySmall' style={styles.attendeeStatsText}>
                    {event.currentAttendees}/{event.capacity}
                  </Text>
                  {event.waitlistCount > 0 && (
                    <Text variant='bodySmall' style={styles.waitlistText}>
                      +{event.waitlistCount} waitlisted
                    </Text>
                  )}
                </View>

                {/* Event tags */}
                <View style={styles.eventTags}>
                  {event.tags.slice(0, 2).map(tag => (
                    <Chip
                      key={tag}
                      mode='outlined'
                      compact
                      style={styles.eventTag}
                      textStyle={styles.eventTagText}
                    >
                      {tag}
                    </Chip>
                  ))}
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  errorMessage: {
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  offlineCard: {
    marginBottom: 16,
    backgroundColor: colors.warning,
  },
  offlineCardContent: {
    paddingVertical: 12,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineText: {
    marginLeft: 8,
    color: 'white',
  },
  eventCard: {
    marginBottom: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventInfo: {
    flex: 1,
    marginRight: 12,
  },
  eventTitle: {
    marginBottom: 4,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventLocationText: {
    marginLeft: 4,
  },
  eventTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTimeText: {
    marginLeft: 4,
  },
  eventDescription: {
    marginBottom: 12,
    opacity: 0.7,
  },
  eventStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendeeStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeeStatsText: {
    marginLeft: 4,
  },
  waitlistText: {
    marginLeft: 8,
    opacity: 0.7,
  },
  eventTags: {
    flexDirection: 'row',
  },
  eventTag: {
    marginLeft: 4,
    height: 24,
  },
  eventTagText: {
    fontSize: 10,
  },
});

export default EventsScreen;
