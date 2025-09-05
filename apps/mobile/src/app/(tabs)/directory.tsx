import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { useTokens } from '@/theme';
import { Card, Button, TextInput as AppTextInput, Badge } from '@/components/ui';
import { Skeleton, EmptyState, ErrorState } from '@/components/patterns';
import { SyncStatusBadge } from '@/components/sync/SyncStatusBadge';
import { membersRepository, Member } from '@/data/repos/members';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/hooks/useAuth';

interface MemberCardProps {
  item: Member;
  onPress: (member: Member) => void;
}

const MemberCard = React.memo(({ item, onPress }: MemberCardProps) => {
  const tokens = useTokens();

  const handleCall = useCallback(async () => {
    if (!item.phone) return;
    
    try {
      const canOpen = await Linking.canOpenURL(`tel:${item.phone}`);
      if (canOpen) {
        await Linking.openURL(`tel:${item.phone}`);
      } else {
        Alert.alert('Unable to Call', 'Phone app is not available on this device.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open phone app.');
    }
  }, [item.phone]);

  const handleText = useCallback(async () => {
    if (!item.phone) return;
    
    try {
      const canOpen = await Linking.canOpenURL(`sms:${item.phone}`);
      if (canOpen) {
        await Linking.openURL(`sms:${item.phone}`);
      } else {
        Alert.alert('Unable to Text', 'Messages app is not available on this device.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open messages app.');
    }
  }, [item.phone]);

  return (
    <Card 
      style={[styles.memberCard, { marginBottom: tokens.spacing.sm }]}
      pressable
      onPress={() => onPress(item)}
    >
      <View style={styles.memberContent}>
        <View style={[styles.avatar, { backgroundColor: tokens.colors.bg.secondary }]}>
          <MaterialIcons 
            name="person" 
            size={24} 
            color={tokens.colors.text.tertiary} 
          />
        </View>
        
        <View style={styles.memberInfo}>
          <Text style={[styles.memberName, { color: tokens.colors.text.primary }]}>
            {item.name}
          </Text>
          <View style={styles.memberDetails}>
            <Badge 
              label={item.role} 
              color="primary" 
              size="sm"
              style={{ marginRight: tokens.spacing.xs }}
            />
            {item.churchName && (
              <Text style={[styles.memberChurch, { color: tokens.colors.text.secondary }]}>
                {item.churchName}
              </Text>
            )}
          </View>
        </View>
        
        {item.phone && (
          <View style={styles.actionButtons}>
            <Pressable
              style={[
                styles.actionButton,
                { backgroundColor: tokens.colors.bg.secondary }
              ]}
              onPress={handleCall}
              accessibilityRole="button"
              accessibilityLabel={`Call ${item.name}`}
            >
              <MaterialIcons name="phone" size={20} color={tokens.colors.brand.primary} />
            </Pressable>
            
            <Pressable
              style={[
                styles.actionButton,
                { 
                  backgroundColor: tokens.colors.bg.secondary,
                  marginLeft: tokens.spacing.xs,
                }
              ]}
              onPress={handleText}
              accessibilityRole="button"
              accessibilityLabel={`Text ${item.name}`}
            >
              <MaterialIcons name="message" size={20} color={tokens.colors.brand.primary} />
            </Pressable>
          </View>
        )}
      </View>
    </Card>
  );
});

interface ProfileSheetProps {
  member: Member | null;
  isVisible: boolean;
  onClose: () => void;
}

const MemberProfileSheet: React.FC<ProfileSheetProps> = ({ member, isVisible, onClose }) => {
  const tokens = useTokens();

  if (!isVisible || !member) return null;

  const handleCall = useCallback(async () => {
    if (!member.phone) return;
    
    try {
      const canOpen = await Linking.canOpenURL(`tel:${member.phone}`);
      if (canOpen) {
        await Linking.openURL(`tel:${member.phone}`);
      } else {
        Alert.alert('Unable to Call', 'Phone app is not available on this device.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open phone app.');
    }
  }, [member.phone]);

  const handleText = useCallback(async () => {
    if (!member.phone) return;
    
    try {
      const canOpen = await Linking.canOpenURL(`sms:${member.phone}`);
      if (canOpen) {
        await Linking.openURL(`sms:${member.phone}`);
      } else {
        Alert.alert('Unable to Text', 'Messages app is not available on this device.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open messages app.');
    }
  }, [member.phone]);

  const handleEmail = useCallback(async () => {
    if (!member.email) return;
    
    try {
      const canOpen = await Linking.canOpenURL(`mailto:${member.email}`);
      if (canOpen) {
        await Linking.openURL(`mailto:${member.email}`);
      } else {
        Alert.alert('Unable to Email', 'Email app is not available on this device.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open email app.');
    }
  }, [member.email]);

  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
      <Pressable style={styles.overlayBackground} onPress={onClose} />
      
      <View style={[styles.profileSheet, { backgroundColor: tokens.colors.bg.primary }]}>
        <View style={[styles.sheetHeader, { borderBottomColor: tokens.colors.border.primary }]}>
          <Text style={[styles.sheetTitle, { color: tokens.colors.text.primary }]}>
            Member Profile
          </Text>
          <Pressable
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close profile"
          >
            <MaterialIcons name="close" size={24} color={tokens.colors.text.secondary} />
          </Pressable>
        </View>

        <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={[styles.profileAvatar, { backgroundColor: tokens.colors.bg.secondary }]}>
              <MaterialIcons 
                name="person" 
                size={48} 
                color={tokens.colors.text.tertiary} 
              />
            </View>
            <Text style={[styles.profileName, { color: tokens.colors.text.primary }]}>
              {member.name}
            </Text>
            <Badge label={member.role} color="primary" />
          </View>

          {/* Contact Actions */}
          <View style={styles.contactActions}>
            {member.phone && (
              <>
                <Button
                  variant="filled"
                  leftIcon="phone"
                  onPress={handleCall}
                  style={styles.contactButton}
                >
                  Call
                </Button>
                <Button
                  variant="outlined"
                  leftIcon="message"
                  onPress={handleText}
                  style={styles.contactButton}
                >
                  Text
                </Button>
              </>
            )}
            {member.email && (
              <Button
                variant="outlined"
                leftIcon="email"
                onPress={handleEmail}
                style={styles.contactButton}
              >
                Email
              </Button>
            )}
          </View>

          {/* Details */}
          <Card style={{ margin: tokens.spacing.md }}>
            <Text style={[styles.sectionTitle, { color: tokens.colors.text.primary }]}>
              Details
            </Text>
            
            {member.email && (
              <View style={styles.detailRow}>
                <MaterialIcons name="email" size={20} color={tokens.colors.text.secondary} />
                <Text style={[styles.detailText, { color: tokens.colors.text.secondary }]}>
                  {member.email}
                </Text>
              </View>
            )}
            
            {member.phone && (
              <View style={styles.detailRow}>
                <MaterialIcons name="phone" size={20} color={tokens.colors.text.secondary} />
                <Text style={[styles.detailText, { color: tokens.colors.text.secondary }]}>
                  {member.phone}
                </Text>
              </View>
            )}
            
            {member.churchName && (
              <View style={styles.detailRow}>
                <MaterialIcons name="church" size={20} color={tokens.colors.text.secondary} />
                <Text style={[styles.detailText, { color: tokens.colors.text.secondary }]}>
                  {member.churchName}
                </Text>
              </View>
            )}
          </Card>

          <View style={{ height: tokens.spacing['4xl'] }} />
        </ScrollView>
      </View>
    </View>
  );
};

export default function DirectoryPage() {
  const { user } = useAuth();
  const tokens = useTokens();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  // Debounce search query to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch members with search functionality
  const { data: members, isLoading, error, refetch } = useQuery({
    queryKey: ['directory', debouncedSearchQuery],
    queryFn: async (): Promise<Member[]> => {
      if (debouncedSearchQuery) {
        return await membersRepository.search(debouncedSearchQuery);
      }
      return await membersRepository.getAll();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleMemberPress = useCallback((member: Member) => {
    setSelectedMember(member);
    setShowProfile(true);
  }, []);

  const handleCloseProfile = useCallback(() => {
    setShowProfile(false);
    setSelectedMember(null);
  }, []);

  const renderItem = useCallback(({ item }: { item: Member }) => (
    <MemberCard item={item} onPress={handleMemberPress} />
  ), [handleMemberPress]);

  const keyExtractor = useCallback((item: Member) => item.id, []);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.bg.surface }]}>
        <View style={[styles.header, { backgroundColor: tokens.colors.bg.primary }]}>
          <Skeleton width={100} height={24} />
          <SyncStatusBadge size="sm" showText={false} />
        </View>
        <View style={[styles.searchContainer, { marginHorizontal: tokens.spacing.md }]}>
          <Skeleton height={48} style={{ borderRadius: tokens.radii.lg }} />
        </View>
        <View style={{ paddingHorizontal: tokens.spacing.md }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton 
              key={index}
              height={80}
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
          title="Couldn't load directory"
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
            Directory
          </Text>
          <SyncStatusBadge size="sm" showText={false} />
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { marginHorizontal: tokens.spacing.md }]}>
        <AppTextInput
          placeholder="Search members..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search"
          clearable
          style={styles.searchInput}
          accessibilityLabel="Search members"
        />
      </View>

      {/* Members List */}
      {!members?.length ? (
        <EmptyState
          icon="people"
          title={searchQuery ? "No members found" : "No members yet"}
          message={
            searchQuery 
              ? "Try adjusting your search terms."
              : "Members will appear here when they join."
          }
          actionLabel={searchQuery ? "Clear Search" : undefined}
          onAction={searchQuery ? () => setSearchQuery('') : undefined}
        />
      ) : (
        <FlashList
          data={members}
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
          estimatedItemSize={88}
        />
      )}

      {/* Member Profile Sheet */}
      <MemberProfileSheet
        member={selectedMember}
        isVisible={showProfile}
        onClose={handleCloseProfile}
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
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  searchContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  searchInput: {
    // Custom input styles handled by AppTextInput component
  },
  listContainer: {
    paddingBottom: 20,
  },
  memberCard: {
    padding: 16,
  },
  memberContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  memberChurch: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Profile Sheet Styles
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
  profileSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
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
  closeButton: {
    padding: 8,
  },
  sheetContent: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  contactActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 8,
  },
  contactButton: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    flex: 1,
  },
});