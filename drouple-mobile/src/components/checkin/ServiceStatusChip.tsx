/**
 * Service Status Chip Component
 * Displays service status with appropriate colors and icons
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip, Text } from 'react-native-paper';

import { colors } from '@/theme/colors';
import { MockService, getServiceStatus } from '@/data/mockData';

interface ServiceStatusChipProps {
  service: MockService;
  compact?: boolean;
  showAttendeeCount?: boolean;
  style?: any;
}

export const ServiceStatusChip: React.FC<ServiceStatusChipProps> = ({
  service,
  compact = false,
  showAttendeeCount = false,
  style,
}) => {
  const statusInfo = getServiceStatus(service);

  // Calculate capacity percentage
  const capacityPercentage =
    service.capacity > 0 ? (service.attendeeCount / service.capacity) * 100 : 0;

  // Determine capacity status color
  const getCapacityColor = () => {
    if (capacityPercentage >= 95) return colors.error.main;
    if (capacityPercentage >= 80) return colors.warning.main;
    return colors.success.main;
  };

  if (compact) {
    return (
      <Chip
        mode='flat'
        compact
        icon={statusInfo.icon}
        style={[
          styles.compactChip,
          { backgroundColor: `${statusInfo.color}15` },
          style,
        ]}
        textStyle={[styles.compactText, { color: statusInfo.color }]}
      >
        {statusInfo.text}
      </Chip>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Chip
        mode='flat'
        icon={statusInfo.icon}
        style={[
          styles.statusChip,
          { backgroundColor: `${statusInfo.color}15` },
        ]}
        textStyle={[styles.statusText, { color: statusInfo.color }]}
      >
        {statusInfo.text}
      </Chip>

      {showAttendeeCount && (
        <View style={styles.attendeeInfo}>
          <Text variant='bodySmall' style={styles.attendeeText}>
            {service.attendeeCount}/{service.capacity} attendees
          </Text>
          <View style={styles.capacityBar}>
            <View
              style={[
                styles.capacityFill,
                {
                  width: `${Math.min(capacityPercentage, 100)}%`,
                  backgroundColor: getCapacityColor(),
                },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    gap: 8,
  },
  compactChip: {
    height: 28,
  },
  compactText: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusChip: {
    height: 32,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  attendeeInfo: {
    alignSelf: 'stretch',
    gap: 4,
  },
  attendeeText: {
    color: colors.text.secondary,
    fontSize: 11,
  },
  capacityBar: {
    height: 4,
    backgroundColor: colors.outline.variant,
    borderRadius: 2,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default ServiceStatusChip;
