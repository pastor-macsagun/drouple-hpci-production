/**
 * Group Detail Screen
 * Minimal implementation for group viewing and attendance marking
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  Button,
  List,
  Chip,
  IconButton,
  Divider,
  Surface,
  ActivityIndicator,
  FAB,
} from 'react-native-paper';
import {
  useRoute,
  type RouteProp,
  useNavigation,
} from '@react-navigation/native';

import { colors } from '@/theme/colors';
import { useAuthStore } from '@/lib/store/authStore';
import {
  getCategoryIcon,
  getCategoryColor,
  formatMeetingTime,
  isUserGroupMember,
  isUserGroupLeader,
  type MockLifeGroup,
} from '@/data/mockGroups';
import {
  initializeLifeGroupsService,
  lifeGroupsService,
} from '@/services/lifeGroupsService';
import { queryClient } from '@/lib/api/react-query';

type GroupDetailRouteProp = RouteProp<
  { GroupDetail: { groupId: string } },
  'GroupDetail'
>;

export const GroupDetailScreen: React.FC = () => {
  const route = useRoute<GroupDetailRouteProp>();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { groupId } = route.params;

  const [group, setGroup] = useState<MockLifeGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);

  // Initialize life groups service
  useEffect(() => {
    initializeLifeGroupsService(queryClient);
  }, []);

  // Load group data
  useEffect(() => {
    const loadGroup = async () => {
      try {
        setIsLoading(true);
        const groupData = await lifeGroupsService.getLifeGroup(groupId);
        setGroup(groupData);
      } catch (error) {
        console.error('Failed to load group:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGroup();
  }, [groupId]);

  const handleJoinRequest = async () => {
    if (!group || !user?.id) return;

    Alert.alert(
      'Join Life Group',
      `Request to join "${group.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Request',
          onPress: async () => {
            const success = await lifeGroupsService.requestToJoinGroup(
              group.id,
              user.id,
              `Hi! I'd like to join ${group.name}. Looking forward to fellowship and growth together!`
            );
            
            if (success) {
              // Reload group data
              const updatedGroup = await lifeGroupsService.getLifeGroup(group.id);
              if (updatedGroup) {
                setGroup(updatedGroup);
              }
            }
          },
        },
      ]
    );
  };

  const handleMarkAttendance = async () => {
    if (!group || !user?.id) return;

    // Get today's session or create one
    const today = new Date().toISOString().split('T')[0];
    let todaySession = group.sessions.find(session => 
      session.date.split('T')[0] === today
    );

    if (!todaySession) {
      // Create today's session
      todaySession = await lifeGroupsService.createGroupSession(
        group.id,
        'Group Meeting',
        `${group.meetingDay} meeting`
      );
      
      if (!todaySession) {
        Alert.alert('Error', 'Failed to create today\'s session');
        return;
      }

      // Reload group to get the new session
      const updatedGroup = await lifeGroupsService.getLifeGroup(group.id);
      if (updatedGroup) {
        setGroup(updatedGroup);
        todaySession = updatedGroup.sessions.find(s => s.id === todaySession!.id);
      }
    }

    if (!todaySession) return;

    const isCurrentlyPresent = todaySession.attendees.includes(user.id);
    
    Alert.alert(
      'Mark Attendance',
      isCurrentlyPresent 
        ? 'Mark yourself as absent for today\'s session?'
        : 'Mark yourself as present for today\'s session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isCurrentlyPresent ? 'Mark Absent' : 'Mark Present',
          onPress: async () => {
            setIsMarkingAttendance(true);
            
            const success = await lifeGroupsService.markAttendance(
              group.id,
              todaySession.id,
              user.id,
              !isCurrentlyPresent
            );
            
            if (success || !success) { // Always update optimistically
              // Reload group data to show updated attendance
              const updatedGroup = await lifeGroupsService.getLifeGroup(group.id);
              if (updatedGroup) {
                setGroup(updatedGroup);
              }
            }
            
            setIsMarkingAttendance(false);
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={colors.primary.main} />
          <Text variant='bodyMedium' style={styles.loadingText}>
            Loading group details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text variant='headlineSmall'>Group not found</Text>
          <Button mode='contained' onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const userIsMember = isUserGroupMember(group.id, user?.id || '');
  const userIsLeader = isUserGroupLeader(group.id, user?.id || '');
  const hasRequested = group.joinRequests.some(
    req => req.userId === user?.id && req.status === 'pending'
  );
  
  const today = new Date().toISOString().split('T')[0];
  const todaySession = group.sessions.find(session => 
    session.date.split('T')[0] === today
  );
  const userMarkedPresent = todaySession?.attendees.includes(user?.id || '');

  const recentSessions = group.sessions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Group Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.groupHeader}>
              <View style={styles.groupTitleRow}>
                <IconButton
                  icon={getCategoryIcon(group.category)}
                  size={24}
                  iconColor={getCategoryColor(group.category)}
                  style={styles.categoryIcon}
                />
                <Text variant='headlineSmall' style={styles.groupTitle}>
                  {group.name}
                </Text>
              </View>

              <View style={styles.groupMeta}>
                <Chip
                  mode='flat'
                  style={[
                    styles.categoryChip,
                    { backgroundColor: getCategoryColor(group.category) + '20' },
                  ]}
                  textStyle={[
                    styles.categoryText,
                    { color: getCategoryColor(group.category) },
                  ]}
                >
                  {group.category.replace('_', ' ')}
                </Chip>

                {group.ageRange && (
                  <Chip mode='outlined' style={styles.ageChip}>
                    {group.ageRange}
                  </Chip>
                )}
              </View>
            </View>

            <Text variant='bodyMedium' style={styles.groupDescription}>
              {group.description}
            </Text>

            {/* Group Details */}
            <View style={styles.detailsSection}>
              <List.Item
                title={formatMeetingTime(group.meetingDay, group.meetingTime)}
                description='Meeting Time'
                left={() => <List.Icon icon='calendar-clock' />}
                style={styles.detailItem}
              />
              <List.Item
                title={group.location}
                description='Location'
                left={() => <List.Icon icon='map-marker' />}
                style={styles.detailItem}
              />
              <List.Item
                title={`${group.currentMembers}/${group.capacity} members`}
                description='Capacity'
                left={() => <List.Icon icon='account-group' />}
                style={styles.detailItem}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsSection}>
              {userIsMember ? (
                <View style={styles.memberActions}>
                  <Text variant='titleMedium' style={styles.memberTitle}>
                    You're a member! 🎉
                  </Text>
                  
                  {/* Attendance Status for Today */}
                  <Surface style={styles.attendanceStatus} elevation={1}>
                    <Text variant='bodyMedium' style={styles.attendanceTitle}>
                      Today's Session ({new Date().toLocaleDateString()})
                    </Text>
                    
                    {userMarkedPresent ? (
                      <View style={styles.presentStatus}>
                        <IconButton icon='check-circle' iconColor={colors.success} size={20} />
                        <Text style={styles.presentText}>You're marked as present</Text>
                      </View>
                    ) : (
                      <View style={styles.absentStatus}>
                        <IconButton icon='clock-outline' iconColor={colors.text.secondary} size={20} />
                        <Text style={styles.absentText}>Not yet marked</Text>
                      </View>
                    )}
                  </Surface>
                </View>
              ) : hasRequested ? (
                <Button mode='outlined' disabled style={styles.actionButton}>
                  Request Pending
                </Button>
              ) : group.isOpen && group.currentMembers < group.capacity ? (
                <Button
                  mode='contained'
                  onPress={handleJoinRequest}
                  style={styles.actionButton}
                >
                  Request to Join
                </Button>
              ) : (
                <Button mode='contained' disabled style={styles.actionButton}>
                  {!group.isOpen ? 'Group Closed' : 'Group Full'}
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Recent Sessions */}
        {userIsMember && recentSessions.length > 0 && (
          <Card style={styles.sessionsCard}>
            <Card.Content>
              <Text variant='titleMedium' style={styles.sectionTitle}>
                Recent Sessions
              </Text>
              
              {recentSessions.map((session, index) => (
                <View key={session.id}>
                  <List.Item
                    title={session.topic || 'Group Meeting'}
                    description={`${new Date(session.date).toLocaleDateString()} • ${session.attendees.length} attended`}
                    left={() => (
                      <List.Icon 
                        icon={session.attendees.includes(user?.id || '') ? 'check-circle' : 'circle-outline'} 
                        color={session.attendees.includes(user?.id || '') ? colors.success : colors.text.secondary}
                      />
                    )}
                    style={styles.sessionItem}
                  />
                  {index < recentSessions.length - 1 && <Divider />}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Group Tags */}
        {group.tags.length > 0 && (
          <Card style={styles.tagsCard}>
            <Card.Content>
              <Text variant='titleMedium' style={styles.sectionTitle}>
                Topics & Focus
              </Text>
              <View style={styles.tagsContainer}>
                {group.tags.map(tag => (
                  <Chip
                    key={tag}
                    mode='outlined'
                    compact
                    style={styles.tagChip}
                  >
                    {tag}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Floating Attendance Button */}
      {userIsMember && (
        <FAB
          icon={userMarkedPresent ? 'check-circle' : 'plus-circle'}
          label={userMarkedPresent ? 'Present' : 'Mark Attendance'}
          style={[
            styles.fab,
            userMarkedPresent && styles.fabPresent,
          ]}
          onPress={handleMarkAttendance}
          loading={isMarkingAttendance}
          disabled={isMarkingAttendance}
        />
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
    gap: 16,
  },
  loadingText: {
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 32,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
  },
  groupHeader: {
    marginBottom: 16,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    margin: 0,
    marginRight: 8,
  },
  groupTitle: {
    flex: 1,
    fontWeight: '600',
    color: colors.primary.main,
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
  groupDescription: {
    lineHeight: 22,
    marginBottom: 16,
    color: colors.text.secondary,
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailItem: {
    paddingLeft: 0,
    paddingVertical: 4,
  },
  actionsSection: {
    gap: 12,
  },
  memberActions: {
    gap: 12,
  },
  memberTitle: {
    textAlign: 'center',
    color: colors.success,
    fontWeight: '600',
  },
  attendanceStatus: {
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  attendanceTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  presentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  presentText: {
    color: colors.success,
    fontWeight: '500',
  },
  absentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  absentText: {
    color: colors.text.secondary,
  },
  actionButton: {
    marginTop: 8,
  },
  sessionsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
    color: colors.primary.main,
  },
  sessionItem: {
    paddingLeft: 0,
    paddingVertical: 8,
  },
  tagsCard: {
    marginBottom: 80, // Space for FAB
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    height: 24,
    marginBottom: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary.main,
  },
  fabPresent: {
    backgroundColor: colors.success,
  },
});

export default GroupDetailScreen;