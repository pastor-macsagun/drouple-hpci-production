/**
 * EventStatusChip Component
 * Displays event status with appropriate styling
 */

import React from 'react';
import { Chip } from 'react-native-paper';

import { colors } from '@/theme/colors';
import { MockEvent, getEventStatus } from '@/data/mockData';

interface EventStatusChipProps {
  event: MockEvent;
  compact?: boolean;
  showIcon?: boolean;
}

export const EventStatusChip: React.FC<EventStatusChipProps> = ({
  event,
  compact = false,
  showIcon = true,
}) => {
  const eventStatus = getEventStatus(event);

  return (
    <Chip
      icon={showIcon ? eventStatus.icon : undefined}
      style={[
        {
          backgroundColor: eventStatus.color + '20',
          borderWidth: 0,
        },
      ]}
      textStyle={[
        {
          color: eventStatus.color,
          fontWeight: '600',
        },
      ]}
      compact={compact}
    >
      {eventStatus.text}
    </Chip>
  );
};

export default EventStatusChip;
