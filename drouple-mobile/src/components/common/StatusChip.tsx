/**
 * Universal Status Chip Component
 * Consistent status chip following Drouple design system
 */

import React from 'react';
import { Chip } from 'react-native-paper';
import { ViewStyle, TextStyle } from 'react-native';

import { colors } from '@/theme/colors';

export type StatusType = 
  | 'active' 
  | 'inactive' 
  | 'pending' 
  | 'completed' 
  | 'error'
  | 'success'
  | 'warning'
  | 'info'
  | 'primary'
  | 'secondary';

export type StatusVariant = 'filled' | 'outlined' | 'text';

interface StatusChipProps {
  status: StatusType;
  label: string;
  variant?: StatusVariant;
  size?: 'small' | 'medium';
  icon?: string;
  showIcon?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  onPress?: () => void;
}

const getStatusConfig = (status: StatusType, variant: StatusVariant = 'filled') => {
  const statusConfigs = {
    active: {
      color: colors.status.active,
      icon: 'check-circle',
      backgroundColor: colors.status.active + (variant === 'filled' ? '20' : '00'),
      borderColor: colors.status.active,
    },
    inactive: {
      color: colors.status.inactive,
      icon: 'minus-circle',
      backgroundColor: colors.status.inactive + (variant === 'filled' ? '20' : '00'),
      borderColor: colors.status.inactive,
    },
    pending: {
      color: colors.status.pending,
      icon: 'clock',
      backgroundColor: colors.status.pending + (variant === 'filled' ? '20' : '00'),
      borderColor: colors.status.pending,
    },
    completed: {
      color: colors.status.completed,
      icon: 'check-circle',
      backgroundColor: colors.status.completed + (variant === 'filled' ? '20' : '00'),
      borderColor: colors.status.completed,
    },
    error: {
      color: colors.status.error,
      icon: 'alert-circle',
      backgroundColor: colors.status.error + (variant === 'filled' ? '20' : '00'),
      borderColor: colors.status.error,
    },
    success: {
      color: colors.success.main,
      icon: 'check-circle',
      backgroundColor: colors.success.main + (variant === 'filled' ? '20' : '00'),
      borderColor: colors.success.main,
    },
    warning: {
      color: colors.warning.main,
      icon: 'alert',
      backgroundColor: colors.warning.main + (variant === 'filled' ? '20' : '00'),
      borderColor: colors.warning.main,
    },
    info: {
      color: colors.info.main,
      icon: 'information',
      backgroundColor: colors.info.main + (variant === 'filled' ? '20' : '00'),
      borderColor: colors.info.main,
    },
    primary: {
      color: colors.primary.main,
      icon: 'star',
      backgroundColor: colors.primary.main + (variant === 'filled' ? '20' : '00'),
      borderColor: colors.primary.main,
    },
    secondary: {
      color: colors.secondary.main,
      icon: 'star-outline',
      backgroundColor: colors.secondary.main + (variant === 'filled' ? '20' : '00'),
      borderColor: colors.secondary.main,
    },
  };

  return statusConfigs[status];
};

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  label,
  variant = 'filled',
  size = 'medium',
  icon,
  showIcon = true,
  style,
  textStyle,
  onPress,
}) => {
  const config = getStatusConfig(status, variant);
  const finalIcon = icon || (showIcon ? config.icon : undefined);

  const chipStyle: ViewStyle = {
    backgroundColor: variant === 'text' ? 'transparent' : config.backgroundColor,
    borderWidth: variant === 'outlined' ? 1 : 0,
    borderColor: variant === 'outlined' ? config.borderColor : 'transparent',
    ...style,
  };

  const chipTextStyle: TextStyle = {
    color: config.color,
    fontWeight: '600',
    fontSize: size === 'small' ? 12 : 14,
    ...textStyle,
  };

  return (
    <Chip
      icon={finalIcon}
      style={chipStyle}
      textStyle={chipTextStyle}
      compact={size === 'small'}
      onPress={onPress}
      mode={variant === 'outlined' ? 'outlined' : 'flat'}
    >
      {label}
    </Chip>
  );
};

// Role-specific status chips
export const RoleChip: React.FC<{
  role: string;
  variant?: StatusVariant;
  size?: 'small' | 'medium';
  style?: ViewStyle;
}> = ({ role, variant = 'filled', size = 'medium', style }) => {
  const getRoleConfig = (role: string) => {
    const roleMap = {
      SUPER_ADMIN: { color: colors.roles.superAdmin, label: 'Super Admin', icon: 'crown' },
      PASTOR: { color: colors.roles.superAdmin, label: 'Pastor', icon: 'book-cross' },
      ADMIN: { color: colors.roles.churchAdmin, label: 'Admin', icon: 'shield-account' },
      VIP: { color: colors.roles.vip, label: 'VIP Team', icon: 'account-heart' },
      LEADER: { color: colors.roles.leader, label: 'Leader', icon: 'account-group' },
      MEMBER: { color: colors.roles.member, label: 'Member', icon: 'account' },
    };

    return roleMap[role as keyof typeof roleMap] || {
      color: colors.roles.member,
      label: role,
      icon: 'account',
    };
  };

  const roleConfig = getRoleConfig(role);

  const chipStyle: ViewStyle = {
    backgroundColor: variant === 'text' ? 'transparent' : roleConfig.color + (variant === 'filled' ? '20' : '00'),
    borderWidth: variant === 'outlined' ? 1 : 0,
    borderColor: variant === 'outlined' ? roleConfig.color : 'transparent',
    ...style,
  };

  return (
    <Chip
      icon={roleConfig.icon}
      style={chipStyle}
      textStyle={{
        color: roleConfig.color,
        fontWeight: '600',
        fontSize: size === 'small' ? 12 : 14,
      }}
      compact={size === 'small'}
      mode={variant === 'outlined' ? 'outlined' : 'flat'}
    >
      {roleConfig.label}
    </Chip>
  );
};

// Feature-specific status chips
export const CheckInStatusChip: React.FC<{
  status: 'success' | 'waiting' | 'closed';
  size?: 'small' | 'medium';
  variant?: StatusVariant;
}> = ({ status, size = 'medium', variant = 'filled' }) => {
  const statusMap = {
    success: { label: 'Checked In', color: colors.checkin.success, icon: 'check-circle' },
    waiting: { label: 'Waiting', color: colors.checkin.waiting, icon: 'clock' },
    closed: { label: 'Closed', color: colors.checkin.closed, icon: 'close-circle' },
  };

  const config = statusMap[status];

  return (
    <StatusChip
      status={status === 'success' ? 'active' : status === 'waiting' ? 'pending' : 'inactive'}
      label={config.label}
      variant={variant}
      size={size}
      icon={config.icon}
    />
  );
};

export const EventStatusChip: React.FC<{
  status: 'confirmed' | 'waitlisted' | 'cancelled';
  size?: 'small' | 'medium';
  variant?: StatusVariant;
}> = ({ status, size = 'medium', variant = 'filled' }) => {
  const statusMap = {
    confirmed: { label: 'Confirmed', color: colors.events.confirmed, icon: 'check-circle' },
    waitlisted: { label: 'Waitlisted', color: colors.events.waitlisted, icon: 'clock' },
    cancelled: { label: 'Cancelled', color: colors.events.cancelled, icon: 'close-circle' },
  };

  const config = statusMap[status];

  return (
    <StatusChip
      status={status === 'confirmed' ? 'active' : status === 'waitlisted' ? 'pending' : 'error'}
      label={config.label}
      variant={variant}
      size={size}
      icon={config.icon}
    />
  );
};

export const PathwayStatusChip: React.FC<{
  status: 'inProgress' | 'completed' | 'notStarted';
  size?: 'small' | 'medium';
  variant?: StatusVariant;
}> = ({ status, size = 'medium', variant = 'filled' }) => {
  const statusMap = {
    inProgress: { label: 'In Progress', color: colors.pathways.inProgress, icon: 'progress-clock' },
    completed: { label: 'Completed', color: colors.pathways.completed, icon: 'check-circle' },
    notStarted: { label: 'Not Started', color: colors.pathways.notStarted, icon: 'circle-outline' },
  };

  const config = statusMap[status];

  return (
    <StatusChip
      status={status === 'completed' ? 'active' : status === 'inProgress' ? 'pending' : 'inactive'}
      label={config.label}
      variant={variant}
      size={size}
      icon={config.icon}
    />
  );
};

export default StatusChip;