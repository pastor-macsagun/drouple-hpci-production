/**
 * Optimized List Components with Memoization
 * Implements FlashList with performance optimizations for large datasets
 */

import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { FlashList, ListRenderItem } from '@shopify/flash-list';

// Generic list item interface
export interface ListItem {
  id: string;
  [key: string]: any;
}

// List performance configuration
const LIST_PERFORMANCE_CONFIG = {
  estimatedItemSize: 72, // Estimated height for better performance
  keyExtractor: (item: ListItem) => item.id,
  removeClippedSubviews: true, // Remove off-screen items from native hierarchy
  maxToRenderPerBatch: 5, // Reduce batch size for smoother scrolling
  updateCellsBatchingPeriod: 50, // Batch updates for better performance
  windowSize: 10, // Number of screens to render
  getItemType: () => 'default', // All items same type for better recycling
};

// Optimized list item wrapper with memo
const OptimizedListItem = memo<{
  item: ListItem;
  renderItem: ListRenderItem<ListItem>;
  extraData?: any;
}>(({ item, renderItem, extraData }) => {
  // Only re-render if item or extraData changes
  return useMemo(() => {
    return renderItem({ item, index: 0, extraData });
  }, [item, extraData, renderItem]);
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.extraData === nextProps.extraData
  );
});

OptimizedListItem.displayName = 'OptimizedListItem';

// Main optimized list component
interface OptimizedListProps<T extends ListItem> {
  data: T[];
  renderItem: ListRenderItem<T>;
  emptyComponent?: React.ComponentType;
  loadingComponent?: React.ComponentType;
  errorComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
  isLoading?: boolean;
  error?: Error;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  extraData?: any;
  estimatedItemSize?: number;
  keyExtractor?: (item: T) => string;
  contentContainerStyle?: ViewStyle;
  testID?: string;
}

export function OptimizedList<T extends ListItem>({
  data,
  renderItem,
  emptyComponent: EmptyComponent = DefaultEmptyComponent,
  loadingComponent: LoadingComponent = DefaultLoadingComponent,
  errorComponent: ErrorComponent = DefaultErrorComponent,
  isLoading = false,
  error,
  onRefresh,
  onEndReached,
  onEndReachedThreshold = 0.5,
  extraData,
  estimatedItemSize = LIST_PERFORMANCE_CONFIG.estimatedItemSize,
  keyExtractor = LIST_PERFORMANCE_CONFIG.keyExtractor as (item: T) => string,
  contentContainerStyle,
  testID,
}: OptimizedListProps<T>) {
  
  // Memoize the render function to prevent unnecessary re-renders
  const memoizedRenderItem = useCallback<ListRenderItem<T>>((info) => {
    return renderItem(info);
  }, [renderItem]);

  // Memoize empty component check
  const isEmpty = useMemo(() => !isLoading && !error && data.length === 0, [isLoading, error, data.length]);

  // Memoize data processing if needed
  const processedData = useMemo(() => data, [data]);

  // Handle refresh with proper callback
  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  // Handle end reached with proper callback
  const handleEndReached = useCallback(() => {
    if (onEndReached && !isLoading) {
      onEndReached();
    }
  }, [onEndReached, isLoading]);

  // Show loading state
  if (isLoading && data.length === 0) {
    return <LoadingComponent />;
  }

  // Show error state
  if (error) {
    return <ErrorComponent error={error} retry={handleRefresh} />;
  }

  // Show empty state
  if (isEmpty) {
    return <EmptyComponent />;
  }

  return (
    <FlashList
      testID={testID}
      data={processedData}
      renderItem={memoizedRenderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={estimatedItemSize}
      onRefresh={onRefresh ? handleRefresh : undefined}
      refreshing={isLoading}
      onEndReached={handleEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      extraData={extraData}
      contentContainerStyle={contentContainerStyle}
      removeClippedSubviews={LIST_PERFORMANCE_CONFIG.removeClippedSubviews}
      maxToRenderPerBatch={LIST_PERFORMANCE_CONFIG.maxToRenderPerBatch}
      updateCellsBatchingPeriod={LIST_PERFORMANCE_CONFIG.updateCellsBatchingPeriod}
      windowSize={LIST_PERFORMANCE_CONFIG.windowSize}
      getItemType={LIST_PERFORMANCE_CONFIG.getItemType}
    />
  );
}

// Specialized components for different data types

// Events list component
export const EventsList = memo<{
  events: any[];
  onEventPress: (event: any) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}>(({ events, onEventPress, isLoading, onRefresh }) => {
  const renderEvent = useCallback<ListRenderItem<any>>(({ item: event }) => (
    <EventListItem event={event} onPress={() => onEventPress(event)} />
  ), [onEventPress]);

  return (
    <OptimizedList
      testID="events-list"
      data={events}
      renderItem={renderEvent}
      isLoading={isLoading}
      onRefresh={onRefresh}
      estimatedItemSize={100} // Events are taller
    />
  );
});

// Members/Directory list component  
export const MembersList = memo<{
  members: any[];
  onMemberPress: (member: any) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}>(({ members, onMemberPress, isLoading, onRefresh }) => {
  const renderMember = useCallback<ListRenderItem<any>>(({ item: member }) => (
    <MemberListItem member={member} onPress={() => onMemberPress(member)} />
  ), [onMemberPress]);

  return (
    <OptimizedList
      testID="member-list"
      data={members}
      renderItem={renderMember}
      isLoading={isLoading}
      onRefresh={onRefresh}
      estimatedItemSize={80} // Members with avatars
    />
  );
});

// Memoized list item components
const EventListItem = memo<{
  event: any;
  onPress: () => void;
}>(({ event, onPress }) => (
  <View style={styles.eventItem}>
    <Text style={styles.eventTitle}>{event.title}</Text>
    <Text style={styles.eventDate}>{event.startDate}</Text>
  </View>
));

const MemberListItem = memo<{
  member: any;
  onPress: () => void;
}>(({ member, onPress }) => (
  <View style={styles.memberItem}>
    <Text style={styles.memberName}>{member.name}</Text>
    <Text style={styles.memberRole}>{member.role}</Text>
  </View>
));

// Default components
const DefaultEmptyComponent = () => (
  <View style={styles.centerContainer}>
    <Text style={styles.emptyText}>No items found</Text>
  </View>
);

const DefaultLoadingComponent = () => (
  <View style={styles.centerContainer}>
    <Text>Loading...</Text>
  </View>
);

const DefaultErrorComponent = ({ error, retry }: { error: Error; retry: () => void }) => (
  <View style={styles.centerContainer}>
    <Text style={styles.errorText}>Something went wrong</Text>
    <Text style={styles.errorSubtext}>{error.message}</Text>
  </View>
);

// List performance hook
export function useListPerformance() {
  const trackListPerformance = useCallback((listName: string, itemCount: number) => {
    console.log(`📊 ${listName}: ${itemCount} items rendered`);
    
    // Track performance metrics
    if (itemCount > 1000) {
      console.warn(`⚠️  Large list detected: ${listName} has ${itemCount} items`);
    }
  }, []);

  const optimizeListData = useCallback((data: any[]) => {
    // Remove any falsy items
    return data.filter(Boolean);
  }, []);

  return {
    trackListPerformance,
    optimizeListData,
  };
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  eventItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
  },
  memberItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  memberRole: {
    fontSize: 14,
    color: '#666',
  },
});