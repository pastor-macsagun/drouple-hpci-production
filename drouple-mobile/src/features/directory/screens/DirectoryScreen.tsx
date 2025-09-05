/**
 * Directory Screen
 * Church member directory with search and filtering
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  FlatList,
  Linking,
  Alert,
  TouchableOpacity,
} from 'react-native';
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
  ActivityIndicator,
  Modal,
  Portal,
  Divider,
} from 'react-native-paper';

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
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedMinistry, setSelectedMinistry] = useState<string | null>(null);
  const [isLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MockMember | null>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

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
    setSelectedMember(member);
    setProfileModalVisible(true);
  };

  const handleCall = async (phoneNumber: string) => {
    try {
      const supported = await Linking.canOpenURL(`tel:${phoneNumber}`);
      if (supported) {
        await Linking.openURL(`tel:${phoneNumber}`);
      } else {
        Alert.alert(
          'Call Not Available',
          'Your device does not support making phone calls.'
        );
      }
    } catch (error) {
      console.error('Error making call:', error);
      Alert.alert(
        'Call Failed',
        'Unable to make the call. Please try again or dial manually.'
      );
    }
  };

  const handleSMS = async (phoneNumber: string) => {
    try {
      const supported = await Linking.canOpenURL(`sms:${phoneNumber}`);
      if (supported) {
        await Linking.openURL(`sms:${phoneNumber}`);
      } else {
        Alert.alert(
          'SMS Not Available',
          'Your device does not support sending text messages.'
        );
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      Alert.alert(
        'SMS Failed',
        'Unable to send text message. Please try again or text manually.'
      );
    }
  };

  const closeProfileModal = () => {
    setProfileModalVisible(false);
    setSelectedMember(null);
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
            <View style={styles.roleContainer}>
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
            </View>
            <View style={styles.contactActions}>
              {member.phone && (
                <>
                  <TouchableOpacity
                    onPress={e => {
                      e.stopPropagation();
                      handleCall(member.phone!);
                    }}
                    style={styles.contactButton}
                  >
                    <IconButton
                      icon='phone'
                      size={18}
                      iconColor={colors.primary.main}
                      style={styles.contactIconButton}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={e => {
                      e.stopPropagation();
                      handleSMS(member.phone!);
                    }}
                    style={styles.contactButton}
                  >
                    <IconButton
                      icon='message-text'
                      size={18}
                      iconColor={colors.primary.main}
                      style={styles.contactIconButton}
                    />
                  </TouchableOpacity>
                </>
              )}
              <IconButton icon='chevron-right' size={16} />
            </View>
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

      {/* Member Profile Modal */}
      <Portal>
        <Modal
          visible={profileModalVisible}
          onDismiss={closeProfileModal}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedMember && (
            <View style={styles.profileModal}>
              {/* Header */}
              <View style={styles.profileHeader}>
                <View style={styles.profileHeaderContent}>
                  <View style={styles.profileAvatarContainer}>
                    {selectedMember.avatar ? (
                      <Avatar.Image
                        size={60}
                        source={{ uri: selectedMember.avatar }}
                      />
                    ) : (
                      <Avatar.Text
                        size={60}
                        label={getMemberInitials(selectedMember)}
                        style={[
                          styles.profileAvatar,
                          {
                            backgroundColor: getRoleBadgeColor(
                              selectedMember.role
                            ),
                          },
                        ]}
                      />
                    )}
                    {selectedMember.isOnline && (
                      <Badge style={styles.profileOnlineBadge} />
                    )}
                  </View>
                  <View style={styles.profileInfo}>
                    <Text variant='headlineSmall' style={styles.profileName}>
                      {getMemberFullName(selectedMember)}
                    </Text>
                    <Chip
                      mode='flat'
                      compact
                      textStyle={[
                        styles.profileRoleText,
                        { color: getRoleBadgeColor(selectedMember.role) },
                      ]}
                      style={[
                        styles.profileRoleChip,
                        {
                          backgroundColor:
                            getRoleBadgeColor(selectedMember.role) + '20',
                        },
                      ]}
                    >
                      {selectedMember.role.replace('_', ' ')}
                    </Chip>
                    <Text variant='bodySmall' style={styles.profileStatus}>
                      {selectedMember.isOnline
                        ? 'Online now'
                        : `Last seen ${formatLastSeen(selectedMember.lastSeen)}`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={closeProfileModal}
                  style={styles.closeButton}
                >
                  <IconButton icon='close' size={20} />
                </TouchableOpacity>
              </View>

              <Divider style={styles.profileDivider} />

              {/* Contact Information */}
              <View style={styles.profileSection}>
                <Text variant='titleMedium' style={styles.sectionTitle}>
                  Contact Information
                </Text>
                <View style={styles.contactInfo}>
                  <List.Item
                    title='Email'
                    description={selectedMember.email}
                    left={() => <List.Icon icon='email' />}
                  />
                  {selectedMember.phone && (
                    <List.Item
                      title='Phone'
                      description={selectedMember.phone}
                      left={() => <List.Icon icon='phone' />}
                      right={() => (
                        <View style={styles.phoneActions}>
                          <IconButton
                            icon='phone'
                            size={20}
                            iconColor={colors.primary.main}
                            onPress={() => handleCall(selectedMember.phone!)}
                          />
                          <IconButton
                            icon='message-text'
                            size={20}
                            iconColor={colors.primary.main}
                            onPress={() => handleSMS(selectedMember.phone!)}
                          />
                        </View>
                      )}
                    />
                  )}
                  {selectedMember.birthDate && (
                    <List.Item
                      title='Birthday'
                      description={new Date(
                        selectedMember.birthDate
                      ).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      left={() => <List.Icon icon='cake' />}
                    />
                  )}
                  <List.Item
                    title='Member Since'
                    description={new Date(
                      selectedMember.joinDate
                    ).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    left={() => <List.Icon icon='calendar-plus' />}
                  />
                </View>
              </View>

              {/* Ministries */}
              {selectedMember.ministries.length > 0 && (
                <>
                  <Divider style={styles.profileDivider} />
                  <View style={styles.profileSection}>
                    <Text variant='titleMedium' style={styles.sectionTitle}>
                      Ministries
                    </Text>
                    <View style={styles.tagContainer}>
                      {selectedMember.ministries.map(ministry => (
                        <Chip
                          key={ministry}
                          mode='outlined'
                          compact
                          style={styles.profileChip}
                        >
                          {ministry}
                        </Chip>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {/* Interests */}
              {selectedMember.interests.length > 0 && (
                <>
                  <Divider style={styles.profileDivider} />
                  <View style={styles.profileSection}>
                    <Text variant='titleMedium' style={styles.sectionTitle}>
                      Interests
                    </Text>
                    <View style={styles.tagContainer}>
                      {selectedMember.interests.map(interest => (
                        <Chip
                          key={interest}
                          mode='outlined'
                          compact
                          style={styles.profileChip}
                        >
                          {interest}
                        </Chip>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {/* Address */}
              {selectedMember.address && (
                <>
                  <Divider style={styles.profileDivider} />
                  <View style={styles.profileSection}>
                    <Text variant='titleMedium' style={styles.sectionTitle}>
                      Address
                    </Text>
                    <List.Item
                      title={selectedMember.address}
                      left={() => <List.Icon icon='map-marker' />}
                    />
                  </View>
                </>
              )}
            </View>
          )}
        </Modal>
      </Portal>
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
    gap: 8,
  },
  roleContainer: {
    alignItems: 'flex-end',
  },
  roleChip: {
    height: 20,
    paddingHorizontal: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: -8,
  },
  contactButton: {
    borderRadius: 20,
  },
  contactIconButton: {
    margin: 0,
    width: 32,
    height: 32,
  },
  // Modal styles
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    maxHeight: '90%',
  },
  profileModal: {
    flex: 1,
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  profileHeaderContent: {
    flexDirection: 'row',
    flex: 1,
    gap: 16,
  },
  profileAvatarContainer: {
    position: 'relative',
  },
  profileAvatar: {
    margin: 0,
  },
  profileOnlineBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: colors.success,
    width: 14,
    height: 14,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    color: colors.primary.main,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileRoleChip: {
    height: 24,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
  },
  profileRoleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  profileStatus: {
    color: colors.text.secondary,
    marginTop: 4,
  },
  closeButton: {
    borderRadius: 20,
    backgroundColor: colors.surface.variant,
  },
  profileDivider: {
    marginVertical: 16,
  },
  profileSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.primary.main,
    fontWeight: '600',
    marginBottom: 8,
  },
  contactInfo: {
    gap: -8,
  },
  phoneActions: {
    flexDirection: 'row',
    gap: -8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  profileChip: {
    marginRight: 0,
    marginBottom: 0,
  },
});

export default DirectoryScreen;
