/**
 * Sync Status Badge Component
 * Shows offline/pending/synced status with visual indicators
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTokens } from '@/theme';
import { backgroundSyncManager, SyncStatus } from '@/sync/background';
import { outboxManager } from '@/sync/outbox';

export interface SyncStatusBadgeProps {
  onPress?: () => void;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: any;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  onPress,
  showText = true,
  size = 'md',
  style,
}) => {
  const tokens = useTokens();
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    updateSyncStatus();
    
    // Update every 30 seconds
    const interval = setInterval(updateSyncStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const updateSyncStatus = async () => {
    try {
      const status = await backgroundSyncManager.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.warn('Failed to get sync status:', error);
    }
  };

  const handlePress = async () => {
    if (onPress) {
      onPress();
      return;
    }

    // Default action: force sync
    setIsRefreshing(true);
    try {
      await backgroundSyncManager.forcSync();
      await updateSyncStatus();
    } catch (error) {
      console.error('Force sync failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!syncStatus) {
    return null;
  }

  const getBadgeStyle = () => {
    if (!syncStatus.isOnline) {
      return {
        backgroundColor: tokens.colors.state.warningMuted,
        borderColor: tokens.colors.state.warning,
        iconColor: tokens.colors.state.warning,
        textColor: tokens.colors.state.warning,
      };
    }

    if (syncStatus.pendingItems > 0) {
      return {
        backgroundColor: tokens.colors.accent.muted,
        borderColor: tokens.colors.accent.primary,
        iconColor: tokens.colors.accent.primary,
        textColor: tokens.colors.accent.primary,
      };
    }

    return {
      backgroundColor: tokens.colors.state.successMuted,
      borderColor: tokens.colors.state.success,
      iconColor: tokens.colors.state.success,
      textColor: tokens.colors.state.success,
    };
  };

  const getIconName = (): keyof typeof MaterialIcons.glyphMap => {
    if (isRefreshing) return 'refresh';
    if (!syncStatus.isOnline) return 'wifi-off';
    if (syncStatus.pendingItems > 0) return 'sync';
    return 'check-circle';
  };

  const getStatusText = () => {
    if (isRefreshing) return 'Syncing...';
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.pendingItems > 0) {
      return `${syncStatus.pendingItems} pending`;
    }
    return 'Synced';
  };

  const badgeStyle = getBadgeStyle();
  const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 20;
  const fontSize = size === 'sm' ? 11 : size === 'md' ? 12 : 14;

  return (
    <Pressable
      style={[
        styles.badge,
        {
          backgroundColor: badgeStyle.backgroundColor,
          borderColor: badgeStyle.borderColor,
          paddingHorizontal: tokens.spacing.sm,
          paddingVertical: tokens.spacing.xs,
          borderRadius: tokens.radii.pill,
        },
        style,
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Sync status: ${getStatusText()}`}
      accessibilityHint="Tap to force sync"
    >
      <View style={styles.content}>
        {isRefreshing ? (
          <ActivityIndicator
            size="small"
            color={badgeStyle.iconColor}
            style={{ marginRight: showText ? tokens.spacing.xs : 0 }}
          />
        ) : (
          <MaterialIcons
            name={getIconName()}
            size={iconSize}
            color={badgeStyle.iconColor}
            style={{ marginRight: showText ? tokens.spacing.xs : 0 }}
          />
        )}
        
        {showText && (
          <Text
            style={[
              styles.text,
              {
                color: badgeStyle.textColor,
                fontSize,
                fontFamily: tokens.typography.label.md.fontFamily,
                fontWeight: '600',
              },
            ]}
          >
            {getStatusText()}
          </Text>
        )}
        
        {syncStatus.pendingItems > 0 && (
          <View
            style={[
              styles.counter,
              {
                backgroundColor: badgeStyle.iconColor,
                minWidth: size === 'sm' ? 16 : 18,
                height: size === 'sm' ? 16 : 18,
                borderRadius: (size === 'sm' ? 16 : 18) / 2,
                marginLeft: tokens.spacing.xs,
              },
            ]}
          >
            <Text
              style={[
                styles.counterText,
                {
                  color: tokens.colors.text.primaryOnBrand,
                  fontSize: size === 'sm' ? 9 : 10,
                  fontFamily: tokens.typography.label.sm.fontFamily,
                  fontWeight: '700',
                },
              ]}
            >
              {syncStatus.pendingItems > 99 ? '99+' : syncStatus.pendingItems}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

// Specialized badges for specific contexts
export const OfflineBadge: React.FC<{ visible: boolean }> = ({ visible }) => {
  const tokens = useTokens();

  if (!visible) return null;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: tokens.colors.state.warningMuted,
          borderColor: tokens.colors.state.warning,
          paddingHorizontal: tokens.spacing.sm,
          paddingVertical: tokens.spacing.xs,
          borderRadius: tokens.radii.pill,
        },
      ]}
      accessibilityLabel="You are offline"
    >
      <View style={styles.content}>
        <MaterialIcons
          name="wifi-off"
          size={14}
          color={tokens.colors.state.warning}
          style={{ marginRight: tokens.spacing.xs }}
        />
        <Text
          style={[
            styles.text,
            {
              color: tokens.colors.state.warning,
              fontSize: 12,
              fontFamily: tokens.typography.label.md.fontFamily,
              fontWeight: '600',
            },
          ]}
        >
          Offline—queued
        </Text>
      </View>
    </View>
  );
};

export const PendingSyncBadge: React.FC<{ count: number; onPress?: () => void }> = ({ 
  count, 
  onPress 
}) => {
  const tokens = useTokens();

  if (count === 0) return null;

  return (
    <Pressable
      style={[
        styles.badge,
        {
          backgroundColor: tokens.colors.accent.muted,
          borderColor: tokens.colors.accent.primary,
          paddingHorizontal: tokens.spacing.sm,
          paddingVertical: tokens.spacing.xs,
          borderRadius: tokens.radii.pill,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${count} items pending sync`}
      accessibilityHint="Tap to sync now"
    >
      <View style={styles.content}>
        <MaterialIcons
          name="sync"
          size={14}
          color={tokens.colors.accent.primary}
          style={{ marginRight: tokens.spacing.xs }}
        />
        <Text
          style={[
            styles.text,
            {
              color: tokens.colors.accent.primary,
              fontSize: 12,
              fontFamily: tokens.typography.label.md.fontFamily,
              fontWeight: '600',
            },
          ]}
        >
          {count} pending
        </Text>
      </View>
    </Pressable>
  );
};

export const SyncedBadge: React.FC<{ visible: boolean; lastSync?: Date }> = ({ 
  visible, 
  lastSync 
}) => {
  const tokens = useTokens();

  if (!visible) return null;

  const getLastSyncText = () => {
    if (!lastSync) return 'Synced';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just synced';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: tokens.colors.state.successMuted,
          borderColor: tokens.colors.state.success,
          paddingHorizontal: tokens.spacing.sm,
          paddingVertical: tokens.spacing.xs,
          borderRadius: tokens.radii.pill,
        },
      ]}
      accessibilityLabel={`Synced ${getLastSyncText()}`}
    >
      <View style={styles.content}>
        <MaterialIcons
          name="check-circle"
          size={14}
          color={tokens.colors.state.success}
          style={{ marginRight: tokens.spacing.xs }}
        />
        <Text
          style={[
            styles.text,
            {
              color: tokens.colors.state.success,
              fontSize: 12,
              fontFamily: tokens.typography.label.md.fontFamily,
              fontWeight: '600',
            },
          ]}
        >
          {getLastSyncText()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    lineHeight: 16,
  },
  counter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    lineHeight: 12,
    textAlign: 'center',
  },
});