import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { format, isAfter, isSameDay, parseISO } from 'date-fns';

import { useTokens } from '@/theme';
import { Card, Button, Badge } from '@/components/ui';
import { Skeleton, EmptyState, ErrorState } from '@/components/patterns';
import { SyncStatusBadge } from '@/components/sync/SyncStatusBadge';
import { eventsRepository, Event, RSVPStatus } from '@/data/repos/events';
import { useAuth } from '@/hooks/useAuth';

interface EventCardProps {
  item: Event;
  onPress: (event: Event) => void;
}

const EventCard = React.memo(({ item, onPress }: EventCardProps) => {
  const tokens = useTokens();
  const eventDateTime = parseISO(item.startTime);
  const isUpcoming = isAfter(eventDateTime, new Date());
  const isToday = isSameDay(eventDateTime, new Date());

  const getRSVPBadgeProps = (status: RSVPStatus | null) => {
    switch (status) {
      case 'GOING':
        return { color: 'success' as const, label: 'Going' };
      case 'INTERESTED':
        return { color: 'warning' as const, label: 'Interested' };
      case 'NOT_GOING':
        return { color: 'neutral' as const, label: 'Not Going' };
      default:
        return { color: 'neutral' as const, label: 'RSVP' };
    }
  };

  const badgeProps = getRSVPBadgeProps(item.myRsvpStatus);

  return (
    <Card 
      style={[styles.eventCard, { marginBottom: tokens.spacing.sm }]}
      pressable
      onPress={() => onPress(item)}
    >
      <View style={styles.eventContent}>
        {/* Date Badge */}
        <View style={[
          styles.dateContainer,
          { 
            backgroundColor: isToday 
              ? tokens.colors.state.success 
              : tokens.colors.brand.primary 
          }
        ]}>
          <Text style={[styles.dateDay, { color: tokens.colors.text.primaryOnBrand }]}>
            {format(eventDateTime, 'd')}
          </Text>
          <Text style={[styles.dateMonth, { color: tokens.colors.text.primaryOnBrand }]}>
            {format(eventDateTime, 'MMM')}
          </Text>
        </View>
        
        {/* Event Info */}
        <View style={styles.eventInfo}>
          <Text style={[styles.eventTitle, { color: tokens.colors.text.primary }]} numberOfLines={2}>
            {item.title}
          </Text>
          
          <View style={[styles.eventDetails, { marginBottom: tokens.spacing.xs }]}>
            <MaterialIcons name="access-time" size={16} color={tokens.colors.text.secondary} />
            <Text style={[styles.eventTime, { color: tokens.colors.text.secondary }]}>
              {format(eventDateTime, 'h:mm a')}
            </Text>
          </View>
          
          <View style={[styles.eventDetails, { marginBottom: tokens.spacing.xs }]}>
            <MaterialIcons name="location-on" size={16} color={tokens.colors.text.secondary} />
            <Text style={[styles.eventLocation, { color: tokens.colors.text.secondary }]} numberOfLines={1}>
              {item.location}
            </Text>
          </View>

          {/* Capacity and RSVP */}
          <View style={styles.eventFooter}>
            <Text style={[styles.attendeeCount, { color: tokens.colors.text.tertiary }]}>
              {item.attendeeCount}/{item.capacity} attending
            </Text>
            
            {isUpcoming && (
              <Badge 
                {...badgeProps} 
                size="sm"
              />
            )}
          </View>
        </View>
      </View>
      
      {/* Status indicators */}
      <View style={styles.statusRow}>
        {item.capacity && item.attendeeCount >= item.capacity && (
          <Badge label="Full" color="warning" size="xs" />
        )}
        {!isUpcoming && (
          <Badge label="Past Event" color="neutral" size="xs" />
        )}
      </View>
    </Card>
  );
});

interface EventDetailSheetProps {
  event: Event | null;
  isVisible: boolean;
  onClose: () => void;
}

const EventDetailSheet: React.FC<EventDetailSheetProps> = ({ event, isVisible, onClose }) => {
  const tokens = useTokens();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // RSVP Mutation
  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: RSVPStatus }) => {
      return await eventsRepository.updateRSVP(eventId, status, user?.id || '');
    },
    onSuccess: () => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onClose();
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to update RSVP. Please try again.');
      console.error('RSVP error:', error);
    },
  });

  if (!isVisible || !event) return null;

  const eventDateTime = parseISO(event.startTime);
  const isUpcoming = isAfter(eventDateTime, new Date());
  const canRSVP = isUpcoming && !rsvpMutation.isPending;

  const handleRSVP = (status: RSVPStatus) => {
    Alert.alert(
      'Confirm RSVP',
      `Are you sure you want to mark yourself as "${status.toLowerCase()}" for this event?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => rsvpMutation.mutate({ eventId: event.id, status }),
        },
      ]
    );
  };

  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
      <Pressable style={styles.overlayBackground} onPress={onClose} />
      
      <View style={[styles.eventSheet, { backgroundColor: tokens.colors.bg.primary }]}>
        <View style={[styles.sheetHeader, { borderBottomColor: tokens.colors.border.primary }]}>
          <Text style={[styles.sheetTitle, { color: tokens.colors.text.primary }]}>
            Event Details
          </Text>
          <Pressable
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close event details"
          >
            <MaterialIcons name="close" size={24} color={tokens.colors.text.secondary} />
          </Pressable>
        </View>

        <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
          {/* Event Header */}
          <View style={styles.eventHeader}>
            <Text style={[styles.detailTitle, { color: tokens.colors.text.primary }]}>
              {event.title}
            </Text>
            
            <View style={[styles.eventDetails, { marginTop: tokens.spacing.sm }]}>
              <MaterialIcons name="access-time" size={20} color={tokens.colors.text.secondary} />
              <Text style={[styles.detailText, { color: tokens.colors.text.secondary }]}>
                {format(eventDateTime, 'EEEE, MMMM d, yyyy • h:mm a')}
              </Text>
            </View>
            
            <View style={styles.eventDetails}>
              <MaterialIcons name="location-on" size={20} color={tokens.colors.text.secondary} />
              <Text style={[styles.detailText, { color: tokens.colors.text.secondary }]}>
                {event.location}
              </Text>
            </View>

            <View style={styles.eventDetails}>
              <MaterialIcons name="people" size={20} color={tokens.colors.text.secondary} />
              <Text style={[styles.detailText, { color: tokens.colors.text.secondary }]}>
                {event.attendeeCount} attending{event.capacity ? ` • ${event.capacity} capacity` : ''}
              </Text>
            </View>
          </View>

          {/* Description */}
          {event.description && (
            <Card style={{ margin: tokens.spacing.md }}>
              <Text style={[styles.sectionTitle, { color: tokens.colors.text.primary }]}>
                About
              </Text>
              <Text style={[styles.descriptionText, { color: tokens.colors.text.secondary }]}>
                {event.description}
              </Text>
            </Card>
          )}

          {/* RSVP Actions */}
          {isUpcoming && (
            <View style={styles.rsvpActions}>
              <Text style={[styles.sectionTitle, { color: tokens.colors.text.primary }]}>
                Will you attend?
              </Text>
              
              <View style={styles.rsvpButtons}>
                <Button
                  variant={event.myRsvpStatus === 'GOING' ? 'filled' : 'outlined'}
                  leftIcon="check"
                  onPress={() => handleRSVP('GOING')}
                  disabled={!canRSVP}
                  style={styles.rsvpButton}
                >
                  Going
                </Button>
                
                <Button
                  variant={event.myRsvpStatus === 'INTERESTED' ? 'filled' : 'outlined'}
                  leftIcon="star"
                  onPress={() => handleRSVP('INTERESTED')}
                  disabled={!canRSVP}
                  style={styles.rsvpButton}
                >
                  Interested
                </Button>
                
                <Button
                  variant={event.myRsvpStatus === 'NOT_GOING' ? 'filled' : 'outlined'}
                  leftIcon="close"
                  onPress={() => handleRSVP('NOT_GOING')}
                  disabled={!canRSVP}
                  style={styles.rsvpButton}
                >
                  Can't Go
                </Button>
              </View>
            </View>
          )}

          <View style={{ height: tokens.spacing['4xl'] }} />
        </ScrollView>
      </View>
    </View>
  );
};

export default function EventsPage() {
  const { user } = useAuth();
  const tokens = useTokens();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);

  // Fetch events
  const { data: events, isLoading, error, refetch } = useQuery({
    queryKey: ['events'],
    queryFn: async (): Promise<Event[]> => {
      return await eventsRepository.getAll();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleEventPress = useCallback((event: Event) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  }, []);

  const handleCloseEventDetail = useCallback(() => {
    setShowEventDetail(false);
    setSelectedEvent(null);
  }, []);

  const renderItem = useCallback(({ item }: { item: Event }) => (
    <EventCard item={item} onPress={handleEventPress} />
  ), [handleEventPress]);

  const keyExtractor = useCallback((item: Event) => item.id, []);

  // Sort events: upcoming first, then by date
  const sortedEvents = React.useMemo(() => {
    if (!events) return [];
    
    return [...events].sort((a, b) => {
      const dateA = parseISO(a.startTime);
      const dateB = parseISO(b.startTime);
      
      const now = new Date();
      const isUpcomingA = isAfter(dateA, now);
      const isUpcomingB = isAfter(dateB, now);
      
      // Upcoming events first
      if (isUpcomingA && !isUpcomingB) return -1;
      if (!isUpcomingA && isUpcomingB) return 1;
      
      // Within same category, sort by date
      return dateA.getTime() - dateB.getTime();
    });
  }, [events]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.bg.surface }]}>
        <View style={[styles.header, { backgroundColor: tokens.colors.bg.primary }]}>
          <Skeleton width={100} height={24} />
          <SyncStatusBadge size="sm" showText={false} />
        </View>
        <View style={{ paddingHorizontal: tokens.spacing.md, paddingTop: tokens.spacing.md }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton 
              key={index}
              height={120}
              style={{ 
                marginBottom: tokens.spacing.sm,
                borderRadius: tokens.radii.lg
              }}
            />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.bg.surface }]}>
        <ErrorState
          type="network"
          onRetry={refetch}
          title="Couldn't load events"
          message="Check your connection and try again."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.bg.surface }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: tokens.colors.bg.primary }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: tokens.colors.text.primary }]}>
            Events
          </Text>
          <SyncStatusBadge size="sm" showText={false} />
        </View>
      </View>

      {/* Events List */}
      {!sortedEvents?.length ? (
        <EmptyState
          icon="event"
          title="No events scheduled"
          message="Check back later for upcoming church events and activities."
        />
      ) : (
        <FlashList
          data={sortedEvents}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[tokens.colors.brand.primary]}
              tintColor={tokens.colors.brand.primary}
            />
          }
          contentContainerStyle={[
            styles.listContainer, 
            { paddingHorizontal: tokens.spacing.md }
          ]}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={120}
        />
      )}

      {/* Event Detail Sheet */}
      <EventDetailSheet
        event={selectedEvent}
        isVisible={showEventDetail}
        onClose={handleCloseEventDetail}
      />
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
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  listContainer: {
    paddingVertical: 16,
  },
  eventCard: {
    padding: 16,
  },
  eventContent: {
    flexDirection: 'row',
  },
  dateContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 16,
    minWidth: 50,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '700',
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  eventDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventTime: {
    fontSize: 14,
  },
  eventLocation: {
    fontSize: 14,
    flex: 1,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  attendeeCount: {
    fontSize: 14,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  // Event Detail Sheet Styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'flex-end',
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  eventSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '60%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  sheetContent: {
    flex: 1,
  },
  eventHeader: {
    padding: 24,
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 36,
  },
  detailText: {
    fontSize: 16,
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  rsvpActions: {
    padding: 20,
  },
  rsvpButtons: {
    gap: 12,
  },
  rsvpButton: {
    // Custom button styles handled by Button component
  },
});