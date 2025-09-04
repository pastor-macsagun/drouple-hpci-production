/**
 * RSVPStatusChip Component
 * Displays RSVP status with appropriate styling
 */

import React from 'react';
import { Chip } from 'react-native-paper';

import { colors } from '@/theme/colors';
import { MockRSVP, getWaitlistPosition } from '@/data/mockData';

interface RSVPStatusChipProps {
  rsvp: MockRSVP;
  eventId?: string;
  memberId?: string;
  compact?: boolean;
  showIcon?: boolean;
}

export const RSVPStatusChip: React.FC<RSVPStatusChipProps> = ({
  rsvp,
  eventId,
  memberId,
  compact = false,
  showIcon = true,
}) => {
  const getStatusConfig = () => {
    switch (rsvp.status) {
      case 'CONFIRMED':
        return {
          icon: 'check-circle',
          text: 'Confirmed',
          backgroundColor: colors.success.main + '20',
          textColor: colors.success.main,
        };

      case 'WAITLIST':
        const waitlistPosition =
          eventId && memberId ? getWaitlistPosition(eventId, memberId) : null;

        return {
          icon: 'clock',
          text: `Waitlist${waitlistPosition ? ` #${waitlistPosition}` : ''}`,
          backgroundColor: colors.warning.main + '20',
          textColor: colors.warning.main,
        };

      case 'CANCELLED':
        return {
          icon: 'close-circle',
          text: 'Cancelled',
          backgroundColor: colors.error.main + '20',
          textColor: colors.error.main,
        };

      default:
        return {
          icon: 'help-circle',
          text: 'Unknown',
          backgroundColor: colors.surface.variant,
          textColor: colors.text.secondary,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Chip
      icon={showIcon ? config.icon : undefined}
      style={[
        {
          backgroundColor: config.backgroundColor,
          borderWidth: 0,
        },
      ]}
      textStyle={[
        {
          color: config.textColor,
          fontWeight: '600',
        },
      ]}
      compact={compact}
    >
      {config.text}
    </Chip>
  );
};

export default RSVPStatusChip;
