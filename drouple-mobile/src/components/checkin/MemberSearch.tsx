/**
 * Member Search Component
 * Manual fallback for check-in when QR code is not available
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, ListRenderItem } from 'react-native';
import {
  Text,
  TextInput,
  Surface,
  TouchableRipple,
  Avatar,
  Chip,
  Divider,
  Button,
  Switch,
  ActivityIndicator,
} from 'react-native-paper';

import { colors } from '@/theme/colors';
import {
  searchMembers,
  getAllServices,
  MockMember,
  MockService,
  getRoleColor,
  getServiceStatus,
} from '@/data/mockData';

interface MemberSearchProps {
  onMemberSelect: (
    member: MockMember,
    service: MockService,
    isNewBeliever: boolean
  ) => void;
  onClose?: () => void;
  loading?: boolean;
}

interface SearchState {
  query: string;
  selectedMember: MockMember | null;
  selectedService: MockService | null;
  isNewBeliever: boolean;
  isSearching: boolean;
}

export const MemberSearch: React.FC<MemberSearchProps> = ({
  onMemberSelect,
  onClose,
  loading = false,
}) => {
  const [state, setState] = useState<SearchState>({
    query: '',
    selectedMember: null,
    selectedService: null,
    isNewBeliever: false,
    isSearching: false,
  });

  // Debounced search results
  const searchResults = useMemo(() => {
    if (!state.query.trim()) return [];
    return searchMembers(state.query);
  }, [state.query]);

  // Available services
  const availableServices = useMemo(() => {
    return getAllServices().sort((a, b) => {
      // Active services first
      if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
      if (b.status === 'ACTIVE' && a.status !== 'ACTIVE') return 1;
      return a.name.localeCompare(b.name);
    });
  }, []);

  // Auto-select first active service
  useEffect(() => {
    if (!state.selectedService && availableServices.length > 0) {
      const activeService = availableServices.find(s => s.status === 'ACTIVE');
      if (activeService) {
        setState(prev => ({ ...prev, selectedService: activeService }));
      }
    }
  }, [availableServices, state.selectedService]);

  const handleQueryChange = (query: string) => {
    setState(prev => ({
      ...prev,
      query,
      selectedMember: null, // Clear selection when searching
      isSearching: true,
    }));

    // Stop searching indicator after a brief delay
    setTimeout(() => {
      setState(prev => ({ ...prev, isSearching: false }));
    }, 300);
  };

  const handleMemberSelect = (member: MockMember) => {
    setState(prev => ({ ...prev, selectedMember: member }));
  };

  const handleServiceSelect = (service: MockService) => {
    setState(prev => ({ ...prev, selectedService: service }));
  };

  const handleNewBelieverToggle = () => {
    setState(prev => ({ ...prev, isNewBeliever: !prev.isNewBeliever }));
  };

  const handleSubmit = () => {
    if (state.selectedMember && state.selectedService) {
      onMemberSelect(
        state.selectedMember,
        state.selectedService,
        state.isNewBeliever
      );
    }
  };

  const canSubmit = state.selectedMember && state.selectedService && !loading;

  const renderMemberItem: ListRenderItem<MockMember> = ({ item: member }) => {
    const isSelected = state.selectedMember?.id === member.id;
    const roleColor = getRoleColor(member.role);

    return (
      <TouchableRipple
        onPress={() => handleMemberSelect(member)}
        style={[
          styles.memberItem,
          isSelected && { backgroundColor: colors.primary.background },
        ]}
      >
        <View style={styles.memberContent}>
          <Avatar.Text
            size={40}
            label={member.name.charAt(0).toUpperCase()}
            style={{ backgroundColor: roleColor }}
          />
          <View style={styles.memberInfo}>
            <Text variant='titleMedium' style={styles.memberName}>
              {member.name}
            </Text>
            <Text variant='bodySmall' style={styles.memberEmail}>
              {member.email}
            </Text>
            <View style={styles.memberMeta}>
              <Chip
                mode='outlined'
                compact
                style={[styles.roleChip, { borderColor: roleColor }]}
                textStyle={{ color: roleColor, fontSize: 11 }}
              >
                {member.role}
              </Chip>
              <Text variant='bodySmall' style={styles.churchText}>
                {member.church}
              </Text>
            </View>
          </View>
          {isSelected && (
            <Avatar.Icon
              size={24}
              icon='check'
              style={{ backgroundColor: colors.success.main }}
            />
          )}
        </View>
      </TouchableRipple>
    );
  };

  const renderServiceItem = (service: MockService) => {
    const isSelected = state.selectedService?.id === service.id;
    const statusInfo = getServiceStatus(service);

    return (
      <TouchableRipple
        key={service.id}
        onPress={() => handleServiceSelect(service)}
        style={[
          styles.serviceItem,
          isSelected && { backgroundColor: colors.primary.background },
        ]}
      >
        <View style={styles.serviceContent}>
          <View style={styles.serviceInfo}>
            <Text variant='titleMedium' style={styles.serviceName}>
              {service.name}
            </Text>
            <Text variant='bodySmall' style={styles.serviceDetails}>
              {service.date} at {service.time} • {service.church}
            </Text>
            <View style={styles.serviceStatus}>
              <Chip
                mode='flat'
                compact
                icon={statusInfo.icon}
                style={[
                  styles.statusChip,
                  { backgroundColor: `${statusInfo.color}20` },
                ]}
                textStyle={{ color: statusInfo.color, fontSize: 11 }}
              >
                {statusInfo.text}
              </Chip>
              <Text variant='bodySmall' style={styles.attendeeCount}>
                {service.attendeeCount}/{service.capacity} attendees
              </Text>
            </View>
          </View>
          {isSelected && (
            <Avatar.Icon
              size={24}
              icon='check'
              style={{ backgroundColor: colors.success.main }}
            />
          )}
        </View>
      </TouchableRipple>
    );
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={1}>
        <Text variant='headlineSmall' style={styles.title}>
          Manual Check-In
        </Text>
        {onClose && (
          <Button mode='text' onPress={onClose}>
            Cancel
          </Button>
        )}
      </Surface>

      <View style={styles.content}>
        {/* Member Search */}
        <Surface style={styles.section} elevation={1}>
          <Text variant='titleMedium' style={styles.sectionTitle}>
            1. Search Member
          </Text>
          <View style={styles.searchContainer}>
            <TextInput
              label='Member name or email'
              value={state.query}
              onChangeText={handleQueryChange}
              mode='outlined'
              style={styles.searchInput}
              left={<TextInput.Icon icon='magnify' />}
              right={
                state.isSearching ? (
                  <TextInput.Icon
                    icon={() => (
                      <ActivityIndicator
                        size={16}
                        color={colors.primary.main}
                      />
                    )}
                  />
                ) : undefined
              }
            />
          </View>

          {state.query && (
            <View style={styles.searchResults}>
              {searchResults.length > 0 ? (
                <FlatList
                  data={searchResults.slice(0, 5)} // Limit to 5 results
                  renderItem={renderMemberItem}
                  keyExtractor={item => item.id}
                  style={styles.memberList}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.noResults}>
                  <Text variant='bodyMedium' style={styles.noResultsText}>
                    No members found for "{state.query}"
                  </Text>
                </View>
              )}
            </View>
          )}
        </Surface>

        {/* Service Selection */}
        <Surface style={styles.section} elevation={1}>
          <Text variant='titleMedium' style={styles.sectionTitle}>
            2. Select Service
          </Text>
          <View style={styles.serviceList}>
            {availableServices.map(renderServiceItem)}
          </View>
        </Surface>

        {/* Options */}
        {state.selectedMember && (
          <Surface style={styles.section} elevation={1}>
            <Text variant='titleMedium' style={styles.sectionTitle}>
              3. Check-In Options
            </Text>
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Text variant='titleSmall'>New Believer</Text>
                <Text variant='bodySmall' style={styles.optionDescription}>
                  This person just accepted Jesus as their Savior
                </Text>
              </View>
              <Switch
                value={state.isNewBeliever}
                onValueChange={handleNewBelieverToggle}
              />
            </View>
          </Surface>
        )}
      </View>

      {/* Submit Button */}
      <Surface style={styles.footer} elevation={2}>
        <Button
          mode='contained'
          onPress={handleSubmit}
          disabled={!canSubmit}
          loading={loading}
          style={styles.submitButton}
        >
          {loading ? 'Processing...' : 'Check In'}
        </Button>
        {state.selectedMember && state.selectedService && (
          <Text variant='bodySmall' style={styles.summary}>
            Check in {state.selectedMember.name} to {state.selectedService.name}
            {state.isNewBeliever && ' (New Believer)'}
          </Text>
        )}
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface.main,
  },
  title: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface.main,
  },
  sectionTitle: {
    marginBottom: 12,
    color: colors.text.primary,
    fontWeight: '600',
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: colors.background,
  },
  searchResults: {
    maxHeight: 240,
  },
  memberList: {
    marginTop: 8,
  },
  memberItem: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  memberContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    color: colors.text.primary,
  },
  memberEmail: {
    color: colors.text.secondary,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  roleChip: {
    height: 24,
  },
  churchText: {
    color: colors.text.secondary,
    fontSize: 11,
  },
  noResults: {
    padding: 24,
    alignItems: 'center',
  },
  noResultsText: {
    color: colors.text.secondary,
  },
  serviceList: {
    gap: 8,
  },
  serviceItem: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  serviceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceInfo: {
    flex: 1,
    gap: 4,
  },
  serviceName: {
    color: colors.text.primary,
  },
  serviceDetails: {
    color: colors.text.secondary,
  },
  serviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  statusChip: {
    height: 24,
  },
  attendeeCount: {
    color: colors.text.secondary,
    fontSize: 11,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionInfo: {
    flex: 1,
  },
  optionDescription: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.surface.main,
  },
  submitButton: {
    marginBottom: 8,
  },
  summary: {
    textAlign: 'center',
    color: colors.text.secondary,
  },
});

export default MemberSearch;
