/**
 * EventCard Component
 * Reusable card for displaying event information with RSVP status
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, Chip, Avatar, IconButton } from 'react-native-paper';

import { colors } from '@/theme/colors';
import {
  MockEvent,
  MockRSVP,
  getEventStatus,
  getCategoryIcon,
  getCategoryColor,
  getWaitlistPosition,
} from '@/data/mockData';

interface EventCardProps {
  event: MockEvent;
  userRSVP?: MockRSVP;
  onPress?: () => void;
  onRSVPPress?: () => void;
  memberId?: string;
  showRSVPButton?: boolean;
  compact?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  userRSVP,
  onPress,
  onRSVPPress,
  memberId,
  showRSVPButton = false,
  compact = false,
}) => {
  const eventStatus = getEventStatus(event);
  const categoryIcon = getCategoryIcon(event.category);
  const categoryColor = getCategoryColor(event.category);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const spotsRemaining = Math.max(0, event.capacity - event.currentAttendees);
  const isEventFull = spotsRemaining === 0;

  const waitlistPosition =
    userRSVP?.status === 'WAITLIST' && memberId
      ? getWaitlistPosition(event.id, memberId)
      : null;

  const canRSVP =
    event.requiresRSVP &&
    event.status === 'UPCOMING' &&
    !userRSVP?.status?.includes('CONFIRMED') &&
    !userRSVP?.status?.includes('WAITLIST');

  const renderRSVPStatus = () => {
    if (!event.requiresRSVP || !userRSVP) return null;

    switch (userRSVP.status) {
      case 'CONFIRMED':
        return (
          <Chip
            icon='check-circle'
            style={styles.confirmedChip}
            textStyle={styles.confirmedText}
            compact
          >
            Confirmed
          </Chip>
        );

      case 'WAITLIST':
        return (
          <Chip
            icon='clock'
            style={styles.waitlistChip}
            textStyle={styles.waitlistText}
            compact
          >
            Waitlist {waitlistPosition ? `#${waitlistPosition}` : ''}
          </Chip>
        );

      case 'CANCELLED':
        return (
          <Chip
            icon='close-circle'
            style={styles.cancelledChip}
            textStyle={styles.cancelledText}
            compact
          >
            Cancelled
          </Chip>
        );

      default:
        return null;
    }
  };

  const CardContent = (
    <Surface style={[styles.card, compact && styles.compactCard]} elevation={2}>
      <View style={styles.cardContent}>
        {/* Header with category and status */}
        <View style={styles.cardHeader}>
          <View style={styles.categoryInfo}>
            <Avatar.Icon
              size={compact ? 28 : 32}
              icon={categoryIcon}
              style={[styles.categoryIcon, { backgroundColor: categoryColor }]}
            />
            <Text
              variant={compact ? 'labelSmall' : 'labelMedium'}
              style={styles.categoryLabel}
            >
              {event.category}
            </Text>
          </View>

          <Chip
            icon={eventStatus.icon}
            style={[
              styles.statusChip,
              { backgroundColor: eventStatus.color + '20' },
            ]}
            textStyle={[styles.statusText, { color: eventStatus.color }]}
            compact={compact}
          >
            {eventStatus.text}
          </Chip>
        </View>

        {/* Event title and details */}
        <View style={styles.eventInfo}>
          <Text
            variant={compact ? 'titleMedium' : 'titleLarge'}
            style={styles.eventTitle}
            numberOfLines={2}
          >
            {event.title}
          </Text>

          <View style={styles.eventMeta}>
            <View style={styles.dateTimeInfo}>
              <Text variant='bodySmall' style={styles.dateText}>
                📅 {formatDate(event.date)} • {event.time}
              </Text>
              <Text variant='bodySmall' style={styles.locationText}>
                📍 {event.location} • {event.church}
              </Text>
            </View>
          </View>

          {/* Capacity and fee info */}
          <View style={styles.eventDetails}>
            <View style={styles.capacityInfo}>
              <Text variant='bodySmall' style={styles.capacityText}>
                👥 {event.currentAttendees}/{event.capacity}
                {spotsRemaining > 0 && !compact && (
                  <Text style={styles.spotsRemaining}>
                    {' '}
                    • {spotsRemaining} spots left
                  </Text>
                )}
                {isEventFull && !compact && (
                  <Text style={styles.eventFull}> • Full</Text>
                )}
              </Text>
            </View>

            {event.fee && (
              <Chip
                icon='currency-php'
                style={styles.feeChip}
                textStyle={styles.feeText}
                compact
              >
                ₱{event.fee.toLocaleString()}
              </Chip>
            )}
          </View>
        </View>

        {/* RSVP Status and Actions */}
        {event.requiresRSVP && (
          <View style={styles.rsvpSection}>
            {renderRSVPStatus()}

            {showRSVPButton && canRSVP && onRSVPPress && (
              <IconButton
                icon={isEventFull ? 'clock' : 'check'}
                size={20}
                iconColor={colors.primary.main}
                style={styles.rsvpButton}
                onPress={onRSVPPress}
              />
            )}
          </View>
        )}

        {/* Description preview */}
        {!compact && (
          <Text
            variant='bodySmall'
            style={styles.description}
            numberOfLines={2}
          >
            {event.description}
          </Text>
        )}
      </View>
    </Surface>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: colors.surface.main,
    marginBottom: 16,
  },
  compactCard: {
    marginBottom: 12,
  },
  cardContent: {
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    margin: 0,
  },
  categoryLabel: {
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  statusChip: {
    borderWidth: 0,
  },
  statusText: {
    fontWeight: '600',
  },
  eventInfo: {
    gap: 8,
  },
  eventTitle: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  eventMeta: {
    gap: 4,
  },
  dateTimeInfo: {
    gap: 2,
  },
  dateText: {
    color: colors.text.secondary,
  },
  locationText: {
    color: colors.text.secondary,
  },
  eventDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  capacityInfo: {
    flex: 1,
  },
  capacityText: {
    color: colors.text.secondary,
  },
  spotsRemaining: {
    color: colors.success.main,
    fontWeight: '500',
  },
  eventFull: {
    color: colors.warning.main,
    fontWeight: '500',
  },
  feeChip: {
    backgroundColor: colors.warning.main + '20',
    borderWidth: 0,
  },
  feeText: {
    color: colors.warning.main,
    fontWeight: '600',
  },
  rsvpSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmedChip: {
    backgroundColor: colors.success.main + '20',
    borderWidth: 0,
  },
  confirmedText: {
    color: colors.success.main,
    fontWeight: '600',
  },
  waitlistChip: {
    backgroundColor: colors.warning.main + '20',
    borderWidth: 0,
  },
  waitlistText: {
    color: colors.warning.main,
    fontWeight: '600',
  },
  cancelledChip: {
    backgroundColor: colors.error.main + '20',
    borderWidth: 0,
  },
  cancelledText: {
    color: colors.error.main,
    fontWeight: '600',
  },
  rsvpButton: {
    margin: 0,
    backgroundColor: colors.primary.main + '10',
  },
  description: {
    color: colors.text.secondary,
    lineHeight: 18,
  },
});

export default EventCard;
