import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useGlobalSearchParams } from 'expo-router';
import { formatDistanceToNow, parseISO } from 'date-fns';

import { useTokens } from '@/theme';
import { Card, Button, Badge } from '@/components/ui';
import { Skeleton, EmptyState, ErrorState } from '@/components/patterns';
import { SyncStatusBadge } from '@/components/sync/SyncStatusBadge';
import { announcementsRepository, Announcement, AnnouncementPriority } from '@/data/repos/announcements';
import { useAuth } from '@/hooks/useAuth';

interface AnnouncementCardProps {
  item: Announcement;
  onPress: (announcement: Announcement) => void;
  onMarkAsRead: (announcement: Announcement) => void;
}

const AnnouncementCard = React.memo(({ item, onPress, onMarkAsRead }: AnnouncementCardProps) => {
  const tokens = useTokens();

  const getPriorityBadgeProps = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'HIGH':
        return { color: 'error' as const, label: 'High' };
      case 'MEDIUM':
        return { color: 'warning' as const, label: 'Medium' };
      case 'LOW':
        return { color: 'neutral' as const, label: 'Low' };
    }
  };

  const getCategoryIcon = (category: string): keyof typeof MaterialIcons.glyphMap => {
    switch (category?.toLowerCase()) {
      case 'bulletin': return 'article';
      case 'ministry': return 'groups';
      case 'facility': return 'business';
      case 'event': return 'event';
      case 'prayer': return 'favorite';
      default: return 'campaign';
    }
  };

  const createdAt = parseISO(item.createdAt);
  const priorityProps = getPriorityBadgeProps(item.priority);

  const handleLongPress = () => {
    if (!item.isRead) {
      Alert.alert(
        'Mark as Read',
        'Would you like to mark this announcement as read?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Mark as Read', onPress: () => onMarkAsRead(item) },
        ]
      );
    }
  };

  return (
    <Card 
      style={[
        styles.announcementCard, 
        { 
          marginBottom: tokens.spacing.sm,
          borderLeftWidth: !item.isRead ? 4 : 0,
          borderLeftColor: !item.isRead ? tokens.colors.brand.primary : 'transparent',
        }
      ]}
      pressable
      onPress={() => onPress(item)}
      onLongPress={handleLongPress}
    >
      <View style={styles.cardHeader}>
        <View style={styles.categoryContainer}>
          <MaterialIcons
            name={getCategoryIcon(item.category)}
            size={20}
            color={tokens.colors.brand.primary}
          />
          <Badge 
            {...priorityProps} 
            size="xs"
            style={{ marginLeft: tokens.spacing.xs }}
          />
        </View>
        
        <View style={styles.headerRight}>
          <Text style={[styles.timeAgo, { color: tokens.colors.text.tertiary }]}>
            {formatDistanceToNow(createdAt, { addSuffix: true })}
          </Text>
          {!item.isRead && (
            <View style={[
              styles.unreadIndicator, 
              { backgroundColor: tokens.colors.brand.primary }
            ]} />
          )}
        </View>
      </View>

      <Text 
        style={[
          styles.announcementTitle, 
          { 
            color: !item.isRead 
              ? tokens.colors.brand.primary 
              : tokens.colors.text.primary 
          }
        ]} 
        numberOfLines={2}
      >
        {item.title}
      </Text>

      {item.excerpt && (
        <Text style={[styles.excerpt, { color: tokens.colors.text.secondary }]} numberOfLines={3}>
          {item.excerpt}
        </Text>
      )}

      <View style={styles.cardFooter}>
        <Text style={[styles.author, { color: tokens.colors.text.tertiary }]}>
          By {item.authorName || 'Church Admin'}
        </Text>
        
        <View style={styles.footerActions}>
          {item.category && (
            <Badge 
              label={item.category} 
              color="neutral" 
              size="xs"
            />
          )}
        </View>
      </View>
    </Card>
  );
});

interface AnnouncementDetailSheetProps {
  announcement: Announcement | null;
  isVisible: boolean;
  onClose: () => void;
  onMarkAsRead: (announcement: Announcement) => void;
}

const AnnouncementDetailSheet: React.FC<AnnouncementDetailSheetProps> = ({ 
  announcement, 
  isVisible, 
  onClose,
  onMarkAsRead 
}) => {
  const tokens = useTokens();

  useEffect(() => {
    if (isVisible && announcement && !announcement.isRead) {
      // Auto-mark as read when viewing details
      onMarkAsRead(announcement);
    }
  }, [isVisible, announcement, onMarkAsRead]);

  if (!isVisible || !announcement) return null;

  const createdAt = parseISO(announcement.createdAt);
  
  const handleShare = async () => {
    try {
      // Create deep link for sharing
      const deepLink = `drouplechms://announcements/${announcement.id}`;
      const shareMessage = `${announcement.title}\n\n${announcement.excerpt}\n\nRead more: ${deepLink}`;
      
      if (await Linking.canOpenURL('mailto:')) {
        Linking.openURL(`mailto:?subject=${encodeURIComponent(announcement.title)}&body=${encodeURIComponent(shareMessage)}`);
      } else {
        Alert.alert('Share', shareMessage);
      }
    } catch (error) {
      console.error('Error sharing announcement:', error);
      Alert.alert('Error', 'Failed to share announcement.');
    }
  };

  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
      <Pressable style={styles.overlayBackground} onPress={onClose} />
      
      <View style={[styles.announcementSheet, { backgroundColor: tokens.colors.bg.primary }]}>
        <View style={[styles.sheetHeader, { borderBottomColor: tokens.colors.border.primary }]}>
          <Text style={[styles.sheetTitle, { color: tokens.colors.text.primary }]}>
            Announcement
          </Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={handleShare}
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel="Share announcement"
            >
              <MaterialIcons name="share" size={24} color={tokens.colors.text.secondary} />
            </Pressable>
            <Pressable
              onPress={onClose}
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel="Close announcement"
            >
              <MaterialIcons name="close" size={24} color={tokens.colors.text.secondary} />
            </Pressable>
          </View>
        </View>

        <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
          {/* Announcement Header */}
          <View style={styles.detailHeader}>
            <Text style={[styles.detailTitle, { color: tokens.colors.text.primary }]}>
              {announcement.title}
            </Text>
            
            <View style={styles.detailMeta}>
              <Text style={[styles.detailAuthor, { color: tokens.colors.text.secondary }]}>
                By {announcement.authorName || 'Church Admin'}
              </Text>
              <Text style={[styles.detailDate, { color: tokens.colors.text.tertiary }]}>
                {formatDistanceToNow(createdAt, { addSuffix: true })}
              </Text>
            </View>
            
            <View style={styles.badgeRow}>
              <Badge 
                label={announcement.priority} 
                color={announcement.priority === 'HIGH' ? 'error' : announcement.priority === 'MEDIUM' ? 'warning' : 'neutral'}
                size="sm"
              />
              {announcement.category && (
                <Badge 
                  label={announcement.category} 
                  color="neutral" 
                  size="sm"
                  style={{ marginLeft: tokens.spacing.xs }}
                />
              )}
            </View>
          </View>

          {/* Content */}
          <Card style={{ margin: tokens.spacing.md }}>
            <Text style={[styles.detailContent, { color: tokens.colors.text.secondary }]}>
              {announcement.content || announcement.excerpt || 'No additional content available.'}
            </Text>
          </Card>

          <View style={{ height: tokens.spacing['4xl'] }} />
        </ScrollView>
      </View>
    </View>
  );
};

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const tokens = useTokens();
  const queryClient = useQueryClient();
  const searchParams = useGlobalSearchParams();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showAnnouncementDetail, setShowAnnouncementDetail] = useState(false);

  // Deep-link support: auto-open announcement if ID provided in URL
  useEffect(() => {
    const announcementId = searchParams.id as string;
    if (announcementId && announcements) {
      const announcement = announcements.find(a => a.id === announcementId);
      if (announcement) {
        setSelectedAnnouncement(announcement);
        setShowAnnouncementDetail(true);
      }
    }
  }, [searchParams.id, announcements]);

  // Fetch announcements
  const { data: announcements, isLoading, error, refetch } = useQuery({
    queryKey: ['announcements'],
    queryFn: async (): Promise<Announcement[]> => {
      return await announcementsRepository.getAll();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (announcement: Announcement) => {
      return await announcementsRepository.markAsRead(announcement.id, user?.id || '');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (error) => {
      console.error('Error marking announcement as read:', error);
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleAnnouncementPress = useCallback((announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setShowAnnouncementDetail(true);
  }, []);

  const handleCloseAnnouncementDetail = useCallback(() => {
    setShowAnnouncementDetail(false);
    setSelectedAnnouncement(null);
  }, []);

  const handleMarkAsRead = useCallback((announcement: Announcement) => {
    if (!announcement.isRead) {
      markAsReadMutation.mutate(announcement);
    }
  }, [markAsReadMutation]);

  const renderItem = useCallback(({ item }: { item: Announcement }) => (
    <AnnouncementCard 
      item={item} 
      onPress={handleAnnouncementPress} 
      onMarkAsRead={handleMarkAsRead}
    />
  ), [handleAnnouncementPress, handleMarkAsRead]);

  const keyExtractor = useCallback((item: Announcement) => item.id, []);

  // Sort announcements: unread first, then by date (newest first)
  const sortedAnnouncements = React.useMemo(() => {
    if (!announcements) return [];
    
    return [...announcements].sort((a, b) => {
      // Unread first
      if (!a.isRead && b.isRead) return -1;
      if (a.isRead && !b.isRead) return 1;
      
      // Then by priority (HIGH > MEDIUM > LOW)
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Finally by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [announcements]);

  const unreadCount = announcements?.filter(a => !a.isRead).length || 0;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.bg.surface }]}>
        <View style={[styles.header, { backgroundColor: tokens.colors.bg.primary }]}>
          <Skeleton width={150} height={24} />
          <SyncStatusBadge size="sm" showText={false} />
        </View>
        <View style={{ paddingHorizontal: tokens.spacing.md, paddingTop: tokens.spacing.md }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton 
              key={index}
              height={140}
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
          title="Couldn't load announcements"
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
            Announcements
          </Text>
          <View style={styles.headerRight}>
            {unreadCount > 0 && (
              <Badge 
                label={`${unreadCount} new`} 
                color="error" 
                size="sm"
                style={{ marginRight: tokens.spacing.sm }}
              />
            )}
            <SyncStatusBadge size="sm" showText={false} />
          </View>
        </View>
      </View>

      {/* Announcements List */}
      {!sortedAnnouncements?.length ? (
        <EmptyState
          icon="campaign"
          title="No announcements yet"
          message="Important church updates and news will appear here."
        />
      ) : (
        <FlashList
          data={sortedAnnouncements}
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
          estimatedItemSize={140}
        />
      )}

      {/* Announcement Detail Sheet */}
      <AnnouncementDetailSheet
        announcement={selectedAnnouncement}
        isVisible={showAnnouncementDetail}
        onClose={handleCloseAnnouncementDetail}
        onMarkAsRead={handleMarkAsRead}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  listContainer: {
    paddingVertical: 16,
  },
  announcementCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeAgo: {
    fontSize: 12,
    marginRight: 8,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 8,
  },
  excerpt: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  author: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Announcement Detail Sheet Styles
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
  announcementSheet: {
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  sheetContent: {
    flex: 1,
  },
  detailHeader: {
    padding: 24,
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 36,
  },
  detailMeta: {
    marginBottom: 16,
  },
  detailAuthor: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailDate: {
    fontSize: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailContent: {
    fontSize: 16,
    lineHeight: 24,
  },
});