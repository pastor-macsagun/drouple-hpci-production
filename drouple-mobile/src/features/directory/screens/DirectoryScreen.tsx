/**
 * Directory Screen
 * Church member directory with search and filtering
 */

import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  Searchbar,
  Chip,
  List,
  Avatar,
  Badge,
  IconButton,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

import { colors } from '@/theme/colors';
import { useAuthStore } from '@/lib/store/authStore';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  searchMembers,
  getMembersByChurch,
  getMemberFullName,
  getMemberInitials,
  formatLastSeen,
  getRoleBadgeColor,
  getOnlineMembers,
  type MockMember,
} from '@/data/mockMembers';

type FilterType = 'all' | 'online' | 'leaders' | 'ministry';

export const DirectoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedMinistry, setSelectedMinistry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get members for user's church
  const allMembers = useMemo(() => {
    if (!user?.churchId) return [];
    return getMembersByChurch(user.churchId);
  }, [user?.churchId]);

  // Filter members based on search query and active filter
  const filteredMembers = useMemo(() => {
    let members = allMembers;

    // Apply search filter
    if (searchQuery.trim()) {
      members = searchMembers(searchQuery, user?.churchId);
    }

    // Apply category filter
    switch (activeFilter) {
      case 'online':
        members = members.filter(member => member.isOnline);
        break;
      case 'leaders':
        members = members.filter(member =>
          ['PASTOR', 'ADMIN', 'LEADER', 'VIP'].includes(member.role)
        );
        break;
      case 'ministry':
        if (selectedMinistry) {
          members = members.filter(member =>
            member.ministries.some(ministry =>
              ministry.toLowerCase().includes(selectedMinistry.toLowerCase())
            )
          );
        }
        break;
    }

    // Sort by online status first, then by name
    return members.sort((a, b) => {
      if (a.isOnline !== b.isOnline) {
        return a.isOnline ? -1 : 1;
      }
      return getMemberFullName(a).localeCompare(getMemberFullName(b));
    });
  }, [allMembers, searchQuery, activeFilter, selectedMinistry, user?.churchId]);

  // Get unique ministries for filter options
  const ministries = useMemo(() => {
    const allMinistries = allMembers.flatMap(member => member.ministries);
    return [...new Set(allMinistries)].sort();
  }, [allMembers]);

  const handleMemberPress = (member: MockMember) => {
    console.log('Navigate to member profile:', member.id);
    // In a real app, navigate to member detail screen
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    if (filter !== 'ministry') {
      setSelectedMinistry(null);
    }
  };

  const renderMemberItem = ({ item: member }: { item: MockMember }) => (
    <Card style={styles.memberCard} onPress={() => handleMemberPress(member)}>
      <List.Item
        title={getMemberFullName(member)}
        description={
          <View style={styles.memberDescription}>
            <Text variant='bodySmall' style={styles.memberEmail}>
              {member.email}
            </Text>
            {member.ministries.length > 0 && (
              <View style={styles.memberTags}>
                {member.ministries.slice(0, 2).map(ministry => (
                  <Chip
                    key={ministry}
                    mode='outlined'
                    compact
                    style={styles.ministryChip}
                    textStyle={styles.ministryChipText}
                  >
                    {ministry}
                  </Chip>
                ))}
                {member.ministries.length > 2 && (
                  <Text variant='bodySmall' style={styles.moreMinistries}>
                    +{member.ministries.length - 2} more
                  </Text>
                )}
              </View>
            )}
            <Text variant='bodySmall' style={styles.lastSeen}>
              {member.isOnline
                ? 'Online now'
                : `Last seen ${formatLastSeen(member.lastSeen)}`}
            </Text>
          </View>
        }
        left={() => (
          <View style={styles.avatarContainer}>
            {member.avatar ? (
              <Avatar.Image size={48} source={{ uri: member.avatar }} />
            ) : (
              <Avatar.Text
                size={48}
                label={getMemberInitials(member)}
                style={[
                  styles.avatarText,
                  { backgroundColor: getRoleBadgeColor(member.role) },
                ]}
              />
            )}
            {member.isOnline && <Badge style={styles.onlineBadge} />}
          </View>
        )}
        right={() => (
          <View style={styles.memberMeta}>
            <Chip
              mode='flat'
              compact
              textStyle={[
                styles.roleText,
                { color: getRoleBadgeColor(member.role) },
              ]}
              style={[
                styles.roleChip,
                { backgroundColor: getRoleBadgeColor(member.role) + '20' },
              ]}
            >
              {member.role.replace('_', ' ')}
            </Chip>
            <IconButton icon='chevron-right' size={16} />
          </View>
        )}
      />
    </Card>
  );

  const renderFilterChip = (
    filter: FilterType,
    label: string,
    icon?: string,
    count?: number
  ) => (
    <Chip
      key={filter}
      mode={activeFilter === filter ? 'flat' : 'outlined'}
      selected={activeFilter === filter}
      icon={icon}
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
            Loading directory...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant='headlineMedium' style={styles.headerTitle}>
          Member Directory
        </Text>
        <Text variant='bodyMedium' style={styles.headerSubtitle}>
          {allMembers.length} members •{' '}
          {getOnlineMembers(user?.churchId).length} online
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder='Search members...'
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
        {renderFilterChip(
          'all',
          'All Members',
          'account-group',
          allMembers.length
        )}
        {renderFilterChip(
          'online',
          'Online',
          'circle',
          getOnlineMembers(user?.churchId).length
        )}
        {renderFilterChip(
          'leaders',
          'Leaders',
          'account-star',
          allMembers.filter(m =>
            ['PASTOR', 'ADMIN', 'LEADER', 'VIP'].includes(m.role)
          ).length
        )}
        {renderFilterChip('ministry', 'By Ministry', 'church')}
      </ScrollView>

      {/* Ministry selector */}
      {activeFilter === 'ministry' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.ministrySelector}
          contentContainerStyle={styles.ministryContent}
        >
          <Chip
            mode={selectedMinistry === null ? 'flat' : 'outlined'}
            selected={selectedMinistry === null}
            onPress={() => setSelectedMinistry(null)}
            style={styles.ministryChip}
          >
            All Ministries
          </Chip>
          {ministries.map(ministry => (
            <Chip
              key={ministry}
              mode={selectedMinistry === ministry ? 'flat' : 'outlined'}
              selected={selectedMinistry === ministry}
              onPress={() => setSelectedMinistry(ministry)}
              style={styles.ministryChip}
            >
              {ministry}
            </Chip>
          ))}
        </ScrollView>
      )}

      <View style={styles.content}>
        {filteredMembers.length === 0 ? (
          <EmptyState
            icon='account-search'
            title='No members found'
            message={
              searchQuery
                ? `No members match "${searchQuery}"`
                : activeFilter === 'online'
                  ? 'No members are currently online'
                  : 'No members in this category'
            }
          />
        ) : (
          <FlatList
            data={filteredMembers}
            renderItem={renderMemberItem}
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
  ministrySelector: {
    paddingBottom: 12,
  },
  ministryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  ministryChip: {
    marginRight: 8,
    height: 32,
  },
  ministryChipText: {
    fontSize: 11,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  separator: {
    height: 8,
  },
  memberCard: {
    marginBottom: 0,
  },
  memberDescription: {
    marginTop: 4,
    gap: 4,
  },
  memberEmail: {
    color: colors.text.secondary,
  },
  memberTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  moreMinistries: {
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  lastSeen: {
    color: colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarText: {
    margin: 0,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.success,
    width: 12,
    height: 12,
  },
  memberMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  roleChip: {
    height: 20,
    paddingHorizontal: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default DirectoryScreen;
