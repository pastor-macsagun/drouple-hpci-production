/**
 * Members Directory Screen
 * Read-only member directory with search functionality
 */

import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  Searchbar,
  Chip,
  ActivityIndicator,
  Surface,
  Avatar,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';

import { EmptyState } from '@/components/ui/EmptyState';
import { database } from '@/data/db';
import { colors } from '@/theme/colors';
import { useAuthStore } from '@/lib/store/authStore';
import type { DbMember } from '@/data/db';

interface MembersScreenProps {}

export const MembersScreen: React.FC<MembersScreenProps> = () => {
  const { user, hasRole } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Query for members data
  const {
    data: members = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['members'],
    queryFn: () => database.getMembers(200),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;

    const query = searchQuery.toLowerCase().trim();
    return members.filter(
      member =>
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Failed to refresh members:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleMemberPress = (member: DbMember) => {
    // In MVP, this is read-only, but could navigate to detail screen
    console.log('Member pressed:', member.name);
  };

  const getRoleColor = (role: string) => {
    const roleColors = {
      SUPER_ADMIN: colors.roles.superAdmin,
      PASTOR: colors.roles.pastor,
      ADMIN: colors.roles.churchAdmin,
      VIP: colors.roles.vip,
      LEADER: colors.roles.leader,
      MEMBER: colors.roles.member,
    };
    return roleColors[role as keyof typeof roleColors] || colors.outline.main;
  };

  const getRoleDisplayName = (role: string): string => {
    const roleMap = {
      SUPER_ADMIN: 'Super Admin',
      PASTOR: 'Pastor',
      ADMIN: 'Admin',
      LEADER: 'Leader',
      VIP: 'VIP Team',
      MEMBER: 'Member',
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const renderMember = ({ item: member }: { item: DbMember }) => (
    <Card
      style={styles.memberCard}
      onPress={() => handleMemberPress(member)}
      accessibilityLabel={`${member.name} - ${getRoleDisplayName(member.role)}`}
      accessibilityRole='button'
    >
      <Card.Content style={styles.memberContent}>
        <View style={styles.memberHeader}>
          <Avatar.Text
            size={48}
            label={getInitials(member.name)}
            style={[
              styles.avatar,
              { backgroundColor: getRoleColor(member.role) },
            ]}
            labelStyle={styles.avatarText}
          />

          <View style={styles.memberInfo}>
            <Text variant='titleMedium' style={styles.memberName}>
              {member.name}
            </Text>
            <Text variant='bodyMedium' style={styles.memberEmail}>
              {member.email}
            </Text>
            {member.phone && (
              <Text variant='bodySmall' style={styles.memberPhone}>
                {member.phone}
              </Text>
            )}
          </View>

          <View style={styles.memberActions}>
            <Chip
              mode='flat'
              compact
              style={[
                styles.roleChip,
                { backgroundColor: getRoleColor(member.role) + '20' },
              ]}
              textStyle={[
                styles.roleChipText,
                { color: getRoleColor(member.role) },
              ]}
            >
              {getRoleDisplayName(member.role)}
            </Chip>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmpty = () => (
    <EmptyState
      icon='account-search-outline'
      title={searchQuery ? 'No members found' : 'No members available'}
      message={
        searchQuery
          ? `No members match "${searchQuery}"`
          : 'Member directory is empty.'
      }
      action={
        searchQuery ? (
          <Text
            variant='bodyMedium'
            style={styles.clearSearchText}
            onPress={() => setSearchQuery('')}
          >
            Clear search
          </Text>
        ) : undefined
      }
    />
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={colors.primary.main} />
          <Text variant='bodyMedium' style={styles.loadingText}>
            Loading members...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon='alert-circle-outline'
          title='Unable to load members'
          message='Please try refreshing the directory'
          action={
            <Text
              variant='bodyMedium'
              style={styles.retryText}
              onPress={() => refetch()}
            >
              Retry
            </Text>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={1}>
        <Text variant='headlineMedium' style={styles.title}>
          Member Directory
        </Text>
        <Text variant='bodyMedium' style={styles.subtitle}>
          {members.length} members
        </Text>
      </Surface>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder='Search members by name, email, or role'
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={colors.primary.main}
          traileringIconColor={colors.primary.main}
        />
      </View>

      {/* Members List */}
      <View style={styles.listContainer}>
        {filteredMembers.length === 0 ? (
          renderEmpty()
        ) : (
          <FlashList
            data={filteredMembers}
            renderItem={renderMember}
            estimatedItemSize={88}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary.main]}
                tintColor={colors.primary.main}
              />
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Search Results Summary */}
      {searchQuery && filteredMembers.length > 0 && (
        <Surface style={styles.resultsBar} elevation={0}>
          <Text variant='bodySmall' style={styles.resultsText}>
            {filteredMembers.length} result
            {filteredMembers.length !== 1 ? 's' : ''} for "{searchQuery}"
          </Text>
          <Text
            variant='bodySmall'
            style={styles.clearSearchText}
            onPress={() => setSearchQuery('')}
          >
            Clear
          </Text>
        </Surface>
      )}
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
  },
  loadingText: {
    marginTop: 16,
    color: colors.text.secondary,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.surface.main,
  },
  title: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.text.secondary,
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    backgroundColor: colors.surface.variant,
    elevation: 0,
  },
  searchInput: {
    color: colors.text.primary,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  memberCard: {
    marginBottom: 8,
    backgroundColor: colors.surface.main,
  },
  memberContent: {
    paddingVertical: 12,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
  },
  avatarText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: colors.text.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  memberEmail: {
    color: colors.text.secondary,
    marginBottom: 2,
  },
  memberPhone: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  memberActions: {
    alignItems: 'flex-end',
  },
  roleChip: {
    height: 24,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface.variant,
  },
  resultsText: {
    color: colors.text.secondary,
  },
  clearSearchText: {
    color: colors.primary.main,
    fontWeight: '500',
  },
  retryText: {
    color: colors.primary.main,
    fontWeight: '500',
    marginTop: 8,
  },
});

export default MembersScreen;
