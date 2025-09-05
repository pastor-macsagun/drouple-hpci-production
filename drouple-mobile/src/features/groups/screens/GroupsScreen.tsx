/**
 * Life Groups Screen
 * Discovery and management of life groups with join functionality
 */

import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  Searchbar,
  Chip,
  Button,
  List,
  IconButton,
  Badge,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

import { colors } from '@/theme/colors';
import { useAuthStore } from '@/lib/store/authStore';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  getLifeGroupsByChurch,
  getOpenLifeGroups,
  getUserJoinedGroups,
  getLifeGroupsByCategory,
  searchLifeGroups,
  isUserGroupMember,
  hasUserRequestedToJoin,
  getCategoryIcon,
  getCategoryColor,
  formatMeetingTime,
  getGroupAvailableSpots,
  type MockLifeGroup,
} from '@/data/mockGroups';
import {
  initializeLifeGroupsService,
  lifeGroupsService,
} from '@/services/lifeGroupsService';
import { queryClient } from '@/lib/api/react-query';

type FilterType = 'all' | 'my_groups' | 'available' | 'category';
type CategoryType =
  | 'men'
  | 'women'
  | 'mixed'
  | 'youth'
  | 'seniors'
  | 'families';

export const GroupsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [allGroups, setAllGroups] = useState<MockLifeGroup[]>([]);

  // Initialize life groups service
  React.useEffect(() => {
    initializeLifeGroupsService(queryClient);
  }, []);

  // Load life groups data
  React.useEffect(() => {
    const loadLifeGroups = async () => {
      try {
        setIsLoading(true);
        const groupsData = await lifeGroupsService.getLifeGroups(user?.churchId);
        setAllGroups(groupsData);
      } catch (error) {
        console.error('Failed to load life groups:', error);
        // Fallback to mock data
        setAllGroups(user?.churchId ? getLifeGroupsByChurch(user.churchId) : []);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.churchId) {
      loadLifeGroups();
    }
  }, [user?.churchId]);

  const filteredGroups = useMemo(() => {
    let groups = allGroups;

    // Apply category filter
    switch (activeFilter) {
      case 'my_groups':
        groups = getUserJoinedGroups(user?.id || '');
        break;
      case 'available':
        groups = getOpenLifeGroups(user?.churchId).filter(
          group =>
            !isUserGroupMember(group.id, user?.id || '') &&
            !hasUserRequestedToJoin(group.id, user?.id || '')
        );
        break;
      case 'category':
        if (selectedCategory) {
          groups = getLifeGroupsByCategory(selectedCategory, user?.churchId);
        }
        break;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      groups = groups.filter(
        group =>
          group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          group.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          group.tags.some(tag =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Sort by user membership first, then alphabetically
    return groups.sort((a, b) => {
      const userInA = isUserGroupMember(a.id, user?.id || '');
      const userInB = isUserGroupMember(b.id, user?.id || '');

      if (userInA !== userInB) {
        return userInA ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });
  }, [
    allGroups,
    activeFilter,
    selectedCategory,
    searchQuery,
    user?.churchId,
    user?.id,
  ]);

  const handleGroupPress = (group: MockLifeGroup) => {
    console.log('Navigate to group detail:', group.id);
    // In a real app, navigate to group detail screen
  };

  const handleJoinRequest = async (group: MockLifeGroup) => {
    if (!user?.id) return;

    const success = await lifeGroupsService.requestToJoinGroup(
      group.id,
      user.id,
      `Hi! I'd like to join ${group.name}. Looking forward to fellowship and growth together!`
    );
    
    if (success) {
      // Reload groups data to show updated join request status
      const updatedGroups = await lifeGroupsService.getLifeGroups(user.churchId);
      setAllGroups(updatedGroups);
    }
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    if (filter !== 'category') {
      setSelectedCategory(null);
    }
  };

  const renderGroupCard = ({ item: group }: { item: MockLifeGroup }) => {
    const userIsMember = isUserGroupMember(group.id, user?.id || '');
    const hasRequested = hasUserRequestedToJoin(group.id, user?.id || '');
    const availableSpots = getGroupAvailableSpots(group);

    return (
      <Card style={styles.groupCard} onPress={() => handleGroupPress(group)}>
        <Card.Content>
          <View style={styles.groupHeader}>
            <View style={styles.groupInfo}>
              <View style={styles.groupTitleRow}>
                <IconButton
                  icon={getCategoryIcon(group.category)}
                  size={20}
                  iconColor={getCategoryColor(group.category)}
                  style={styles.categoryIcon}
                />
                <Text variant='titleMedium' style={styles.groupTitle}>
                  {group.name}
                </Text>
                {userIsMember && <Badge style={styles.memberBadge} size={8} />}
              </View>

              <View style={styles.groupMeta}>
                <Chip
                  mode='flat'
                  compact
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: getCategoryColor(group.category) + '20',
                    },
                  ]}
                  textStyle={[
                    styles.categoryText,
                    { color: getCategoryColor(group.category) },
                  ]}
                >
                  {group.category.replace('_', ' ')}
                </Chip>

                {group.ageRange && (
                  <Chip mode='outlined' compact style={styles.ageChip}>
                    {group.ageRange}
                  </Chip>
                )}
              </View>
            </View>

            <View style={styles.memberCount}>
              <Text variant='bodyLarge' style={styles.memberCountNumber}>
                {group.currentMembers}
              </Text>
              <Text variant='bodySmall' style={styles.memberCountLabel}>
                /{group.capacity}
              </Text>
            </View>
          </View>

          <Text
            variant='bodyMedium'
            numberOfLines={2}
            style={styles.groupDescription}
          >
            {group.description}
          </Text>

          <View style={styles.groupDetails}>
            <List.Item
              title={formatMeetingTime(group.meetingDay, group.meetingTime)}
              description={group.location}
              left={() => <List.Icon icon='calendar-clock' size={20} />}
              style={styles.detailItem}
              titleStyle={styles.detailTitle}
              descriptionStyle={styles.detailDescription}
            />
          </View>

          {group.tags.length > 0 && (
            <View style={styles.groupTags}>
              {group.tags.slice(0, 3).map(tag => (
                <Chip
                  key={tag}
                  mode='outlined'
                  compact
                  style={styles.tagChip}
                  textStyle={styles.tagText}
                >
                  {tag}
                </Chip>
              ))}
              {group.tags.length > 3 && (
                <Text variant='bodySmall' style={styles.moreTags}>
                  +{group.tags.length - 3}
                </Text>
              )}
            </View>
          )}

          <View style={styles.groupActions}>
            {userIsMember ? (
              <Button
                mode='contained'
                onPress={() => handleGroupPress(group)}
                style={styles.actionButton}
              >
                View Group
              </Button>
            ) : hasRequested ? (
              <Button mode='outlined' disabled style={styles.actionButton}>
                Request Pending
              </Button>
            ) : group.isOpen && availableSpots > 0 ? (
              <Button
                mode='outlined'
                onPress={() => handleJoinRequest(group)}
                style={styles.actionButton}
              >
                Request to Join
              </Button>
            ) : (
              <Button mode='contained' disabled style={styles.actionButton}>
                {!group.isOpen ? 'Group Closed' : 'Group Full'}
              </Button>
            )}

            <Text variant='bodySmall' style={styles.spotsText}>
              {availableSpots > 0
                ? `${availableSpots} spot${availableSpots === 1 ? '' : 's'} available`
                : 'No spots available'}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderFilterChip = (
    filter: FilterType,
    label: string,
    count?: number
  ) => (
    <Chip
      key={filter}
      mode={activeFilter === filter ? 'flat' : 'outlined'}
      selected={activeFilter === filter}
      onPress={() => handleFilterChange(filter)}
      style={[
        styles.filterChip,
        activeFilter === filter && styles.activeFilterChip,
      ]}
    >
      {label} {count !== undefined && `(${count})`}
    </Chip>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={colors.primary.main} />
          <Text variant='bodyMedium' style={styles.loadingText}>
            Loading life groups...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant='headlineMedium' style={styles.headerTitle}>
          Life Groups
        </Text>
        <Text variant='bodyMedium' style={styles.headerSubtitle}>
          Connect and grow in community
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder='Search groups...'
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor={colors.primary.main}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {renderFilterChip('all', 'All Groups', allGroups.length)}
        {renderFilterChip(
          'my_groups',
          'My Groups',
          getUserJoinedGroups(user?.id || '').length
        )}
        {renderFilterChip(
          'available',
          'Available',
          getOpenLifeGroups(user?.churchId).length
        )}
        {renderFilterChip('category', 'By Category')}
      </ScrollView>

      {activeFilter === 'category' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categorySelector}
          contentContainerStyle={styles.categoryContent}
        >
          <Chip
            mode={selectedCategory === null ? 'flat' : 'outlined'}
            selected={selectedCategory === null}
            onPress={() => setSelectedCategory(null)}
            style={styles.categoryFilterChip}
          >
            All Categories
          </Chip>

          {(
            [
              'mixed',
              'men',
              'women',
              'youth',
              'families',
              'seniors',
            ] as CategoryType[]
          ).map(category => (
            <Chip
              key={category}
              mode={selectedCategory === category ? 'flat' : 'outlined'}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
              style={styles.categoryFilterChip}
              icon={getCategoryIcon(category)}
            >
              {category.charAt(0).toUpperCase() +
                category.slice(1).replace('_', ' ')}
            </Chip>
          ))}
        </ScrollView>
      )}

      <View style={styles.content}>
        {filteredGroups.length === 0 ? (
          <EmptyState
            icon='account-group'
            title='No groups found'
            message={
              searchQuery
                ? `No groups match "${searchQuery}"`
                : activeFilter === 'my_groups'
                  ? "You haven't joined any groups yet"
                  : activeFilter === 'available'
                    ? 'No groups available to join'
                    : 'No groups in this category'
            }
            action={
              activeFilter === 'my_groups' ? (
                <Button
                  mode='contained'
                  onPress={() => setActiveFilter('available')}
                >
                  Browse Available Groups
                </Button>
              ) : undefined
            }
          />
        ) : (
          <FlatList
            data={filteredGroups}
            renderItem={renderGroupCard}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
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
    gap: 16,
  },
  loadingText: {
    color: colors.text.secondary,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    color: colors.primary.main,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: colors.text.secondary,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: colors.surface.variant,
  },
  filtersContainer: {
    paddingBottom: 12,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: colors.primary.main + '20',
  },
  categorySelector: {
    paddingBottom: 12,
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryFilterChip: {
    marginRight: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  separator: {
    height: 12,
  },
  groupCard: {
    marginBottom: 0,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groupInfo: {
    flex: 1,
    marginRight: 12,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    margin: 0,
    marginRight: 4,
  },
  groupTitle: {
    flex: 1,
    fontWeight: '600',
  },
  memberBadge: {
    backgroundColor: colors.success,
    marginLeft: 8,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryChip: {
    height: 24,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  ageChip: {
    height: 24,
  },
  memberCount: {
    alignItems: 'center',
  },
  memberCountNumber: {
    color: colors.primary.main,
    fontWeight: 'bold',
  },
  memberCountLabel: {
    color: colors.text.secondary,
  },
  groupDescription: {
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  groupDetails: {
    marginBottom: 12,
  },
  detailItem: {
    paddingLeft: 0,
    paddingVertical: 4,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailDescription: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  groupTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  tagChip: {
    height: 20,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
  },
  moreTags: {
    color: colors.text.secondary,
    fontSize: 10,
    fontStyle: 'italic',
  },
  groupActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    minWidth: 120,
  },
  spotsText: {
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
});

export default GroupsScreen;
