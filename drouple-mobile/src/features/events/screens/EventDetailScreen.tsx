/**
 * Event Detail Screen
 * Shows detailed event information with RSVP functionality
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  Button,
  Chip,
  Icon,
  ActivityIndicator,
  Snackbar,
  Divider,
  Surface,
} from 'react-native-paper';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  eventsService,
  initializeEventsService,
} from '@/services/eventsService';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { queryClient } from '@/lib/api';
import { colors } from '@/theme/colors';
import { canRSVP, canCancelRSVP } from '@/data/mockEvents';
import type { MockEvent } from '@/data/mockEvents';
import type { EventsStackParamList } from '../navigation/EventsStack';

// Initialize events service
initializeEventsService(queryClient);

type EventDetailRouteProp = RouteProp<EventsStackParamList, 'EventDetail'>;

export const EventDetailScreen: React.FC = () => {
  const route = useRoute<EventDetailRouteProp>();
  const { eventId } = route.params;
  const { status: syncStatus } = useOfflineSync();
  const queryClientInstance = useQueryClient();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [calendarAvailable, setCalendarAvailable] = useState(false);

  // Query for event details
  const {
    data: event,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['events', 'detail', eventId],
    queryFn: () => eventsService.getEvent(eventId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: failureCount => {
      if (!syncStatus.isOnline) return false;
      return failureCount < 2;
    },
  });

  // Check calendar availability on mount
  useEffect(() => {
    const checkCalendarAvailability = async () => {
      const available = await eventsService.isCalendarIntegrationAvailable();
      setCalendarAvailable(available);
    };
    
    checkCalendarAvailability();
  }, []);

  // Add to calendar mutation
  const addToCalendarMutation = useMutation({
    mutationFn: async () => {
      return eventsService.addEventToCalendar(eventId);
    },
    onSuccess: (success) => {
      if (success) {
        setSnackbarMessage('Event added to your calendar');
      } else {
        setSnackbarMessage('Unable to add event to calendar');
      }
      setSnackbarVisible(true);
    },
    onError: (error) => {
      console.error('Add to calendar error:', error);
      setSnackbarMessage('Failed to add event to calendar');
      setSnackbarVisible(true);
    },
  });

  // RSVP mutation
  const rsvpMutation = useMutation({
    mutationFn: async ({ action }: { action: 'RSVP' | 'CANCEL' }) => {
      return eventsService.rsvpToEvent(eventId, action);
    },
    onSuccess: (wasQueued, { action }) => {
      const message = wasQueued
        ? `${action === 'RSVP' ? 'RSVP' : 'Cancellation'} queued - will sync when online`
        : `${action === 'RSVP' ? 'RSVP confirmed!' : 'RSVP cancelled'}`;

      setSnackbarMessage(message);
      setSnackbarVisible(true);

      // Invalidate queries to refetch updated data
      queryClientInstance.invalidateQueries({ queryKey: ['events'] });
      refetch();
    },
    onError: (error, { action }) => {
      console.error('RSVP error:', error);
      setSnackbarMessage(
        `Failed to ${action === 'RSVP' ? 'RSVP' : 'cancel'}. Please try again.`
      );
      setSnackbarVisible(true);
    },
  });

  const handleRSVP = (action: 'RSVP' | 'CANCEL') => {
    if (!event) return;

    // Show confirmation for cancellation
    if (action === 'CANCEL') {
      Alert.alert(
        'Cancel RSVP',
        'Are you sure you want to cancel your RSVP for this event?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: () => rsvpMutation.mutate({ action }),
          },
        ]
      );
      return;
    }

    // Show waitlist confirmation if event is full
    if (action === 'RSVP' && event.spotsLeft === 0) {
      Alert.alert(
        'Join Waitlist',
        "This event is currently full. Would you like to join the waitlist? You'll be notified if a spot becomes available.",
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Join Waitlist',
            onPress: () => rsvpMutation.mutate({ action }),
          },
        ]
      );
      return;
    }

    // Direct RSVP
    rsvpMutation.mutate({ action });
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getEventStatus = () => {
    if (!event) return null;

    if (event.userRSVPStatus === 'confirmed') {
      return (
        <Chip icon='check' mode='flat' textStyle={{ color: colors.success }}>
          You're attending
        </Chip>
      );
    }
    if (event.userRSVPStatus === 'waitlisted') {
      return (
        <Chip icon='clock' mode='flat' textStyle={{ color: colors.warning }}>
          You're waitlisted
        </Chip>
      );
    }
    if (event.spotsLeft === 0) {
      return (
        <Chip icon='close' mode='flat' textStyle={{ color: colors.error }}>
          Event Full
        </Chip>
      );
    }
    return (
      <Chip icon='calendar' mode='outlined'>
        {event.spotsLeft} spots available
      </Chip>
    );
  };

  const canUserRSVP = () => {
    if (!event) return false;
    return canRSVP(event);
  };

  const canUserCancelRSVP = () => {
    if (!event) return false;
    return canCancelRSVP(event);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={colors.primary.main} />
          <Text variant='bodyMedium' style={styles.loadingText}>
            Loading event details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon source='alert-circle-outline' size={48} />
          <Text variant='headlineSmall' style={styles.errorTitle}>
            Event not found
          </Text>
          <Text variant='bodyMedium' style={styles.errorMessage}>
            The event you're looking for could not be loaded.
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Offline indicator */}
        {!syncStatus.isOnline && (
          <Card style={styles.offlineCard}>
            <Card.Content style={styles.offlineCardContent}>
              <View style={styles.offlineIndicator}>
                <Icon source='wifi-off' size={20} color='white' />
                <Text variant='bodyMedium' style={styles.offlineText}>
                  You're offline. RSVP actions will be queued.
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Event Header */}
        <Card style={styles.eventCard}>
          <Card.Content>
            <View style={styles.eventHeader}>
              <Text variant='headlineMedium' style={styles.eventTitle}>
                {event.title}
              </Text>
              {getEventStatus()}
            </View>

            <View style={styles.eventMeta}>
              <View style={styles.eventMetaRow}>
                <Icon source='calendar' size={20} />
                <Text variant='bodyLarge' style={styles.eventMetaText}>
                  {formatEventDate(event.startsAt)}
                </Text>
              </View>

              <View style={styles.eventMetaRow}>
                <Icon source='clock-outline' size={20} />
                <Text variant='bodyLarge' style={styles.eventMetaText}>
                  {formatEventTime(event.startsAt)}
                </Text>
              </View>

              <View style={styles.eventMetaRow}>
                <Icon source='map-marker' size={20} />
                <Text variant='bodyLarge' style={styles.eventMetaText}>
                  {event.location}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Event Description */}
        <Card style={styles.descriptionCard}>
          <Card.Content>
            <Text variant='titleMedium' style={styles.sectionTitle}>
              About this event
            </Text>
            <Text variant='bodyMedium' style={styles.eventDescription}>
              {event.description}
            </Text>
          </Card.Content>
        </Card>

        {/* Event Stats */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant='titleMedium' style={styles.sectionTitle}>
              Attendance
            </Text>
            <View style={styles.statsGrid}>
              <Surface style={styles.statItem} elevation={1}>
                <Text variant='headlineSmall' style={styles.statValue}>
                  {event.currentAttendees}
                </Text>
                <Text variant='bodySmall' style={styles.statLabel}>
                  Attending
                </Text>
              </Surface>

              <Surface style={styles.statItem} elevation={1}>
                <Text variant='headlineSmall' style={styles.statValue}>
                  {event.spotsLeft}
                </Text>
                <Text variant='bodySmall' style={styles.statLabel}>
                  Spots Left
                </Text>
              </Surface>

              <Surface style={styles.statItem} elevation={1}>
                <Text variant='headlineSmall' style={styles.statValue}>
                  {event.capacity}
                </Text>
                <Text variant='bodySmall' style={styles.statLabel}>
                  Capacity
                </Text>
              </Surface>

              {event.waitlistCount > 0 && (
                <Surface style={styles.statItem} elevation={1}>
                  <Text variant='headlineSmall' style={styles.statValue}>
                    {event.waitlistCount}
                  </Text>
                  <Text variant='bodySmall' style={styles.statLabel}>
                    Waitlisted
                  </Text>
                </Surface>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Event Tags */}
        {event.tags.length > 0 && (
          <Card style={styles.tagsCard}>
            <Card.Content>
              <Text variant='titleMedium' style={styles.sectionTitle}>
                Tags
              </Text>
              <View style={styles.tagsContainer}>
                {event.tags.map(tag => (
                  <Chip key={tag} mode='outlined' style={styles.tag}>
                    {tag}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* RSVP Deadline */}
        {event.rsvpDeadline && (
          <Card style={styles.deadlineCard}>
            <Card.Content>
              <View style={styles.deadlineInfo}>
                <Icon source='clock-alert' size={20} />
                <Text variant='bodyMedium' style={styles.deadlineText}>
                  RSVP by {formatEventDate(event.rsvpDeadline)} at{' '}
                  {formatEventTime(event.rsvpDeadline)}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* RSVP Actions */}
      <View style={styles.actionContainer}>
        <Divider style={styles.actionDivider} />
        <View style={styles.actionButtons}>
          {/* Primary RSVP Action */}
          {canUserCancelRSVP() ? (
            <Button
              mode='outlined'
              onPress={() => handleRSVP('CANCEL')}
              style={styles.cancelButton}
              loading={rsvpMutation.isPending}
              disabled={rsvpMutation.isPending}
            >
              Cancel RSVP
            </Button>
          ) : canUserRSVP() ? (
            <Button
              mode='contained'
              onPress={() => handleRSVP('RSVP')}
              style={styles.rsvpButton}
              loading={rsvpMutation.isPending}
              disabled={rsvpMutation.isPending}
            >
              {event.spotsLeft === 0 ? 'Join Waitlist' : 'RSVP Now'}
            </Button>
          ) : (
            <Button mode='contained' disabled style={styles.disabledButton}>
              {event.userRSVPStatus !== 'none'
                ? `Already ${event.userRSVPStatus}`
                : 'RSVP Closed'}
            </Button>
          )}

          {/* Add to Calendar Button */}
          {calendarAvailable && (
            <Button
              mode='outlined'
              icon='calendar-plus'
              onPress={() => addToCalendarMutation.mutate()}
              style={styles.calendarButton}
              loading={addToCalendarMutation.isPending}
              disabled={addToCalendarMutation.isPending}
            >
              Add to Calendar
            </Button>
          )}
        </View>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
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
    paddingBottom: 100, // Space for action buttons
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
    marginBottom: 16,
  },
  eventTitle: {
    flex: 1,
    marginRight: 12,
  },
  eventMeta: {
    gap: 8,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventMetaText: {
    marginLeft: 8,
  },
  descriptionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    color: colors.primary.main,
  },
  eventDescription: {
    lineHeight: 22,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: 80,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    color: colors.primary.main,
    fontWeight: 'bold',
  },
  statLabel: {
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.7,
  },
  tagsCard: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    marginBottom: 4,
  },
  deadlineCard: {
    marginBottom: 16,
  },
  deadlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineText: {
    marginLeft: 8,
    color: colors.warning,
    fontWeight: '500',
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
  },
  actionDivider: {
    height: 1,
  },
  actionButtons: {
    padding: 16,
  },
  rsvpButton: {
    marginVertical: 4,
  },
  cancelButton: {
    marginVertical: 4,
    borderColor: colors.error,
  },
  disabledButton: {
    marginVertical: 4,
    opacity: 0.5,
  },
  calendarButton: {
    marginVertical: 4,
    borderColor: colors.secondary.main,
  },
});

export default EventDetailScreen;
