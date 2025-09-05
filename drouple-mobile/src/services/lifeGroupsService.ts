/**
 * Life Groups Service
 * Handles group discovery, join requests, and attendance marking - minimal MVP version
 */

import { QueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { database } from '@/lib/db/database';
import { ENDPOINTS } from '@/config/endpoints';
import { 
  MockLifeGroup, 
  GroupSession,
  MOCK_LIFE_GROUPS 
} from '@/data/mockGroups';
import { NotificationService } from '@/lib/notifications/notificationService';
import { SentryService } from '@/lib/monitoring/sentryService';
import toast from '@/utils/toast';

const GROUPS_CACHE_KEY = 'cached_life_groups';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export interface JoinRequestAction {
  clientRequestId: string;
  groupId: string;
  userId: string;
  message?: string;
  timestamp: string;
}

export interface AttendanceAction {
  clientRequestId: string;
  groupId: string;
  sessionId: string;
  userId: string;
  isPresent: boolean;
  timestamp: string;
}

export interface GroupStats {
  totalGroups: number;
  myGroups: number;
  availableGroups: number;
  totalAttendances: number;
}

class LifeGroupsService {
  private queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Submit join request for a life group
   */
  async requestToJoinGroup(
    groupId: string, 
    userId: string, 
    message?: string
  ): Promise<boolean> {
    const clientRequestId = this.generateRequestId();
    
    const joinRequest: JoinRequestAction = {
      clientRequestId,
      groupId,
      userId,
      message,
      timestamp: new Date().toISOString(),
    };

    try {
      // Try online submission first
      await this.submitJoinRequest(joinRequest);
      
      // Update local state optimistically
      await this.updateLocalJoinRequest(joinRequest);
      
      toast.success('Join request sent successfully!');
      
      // Invalidate queries to refetch
      this.queryClient.invalidateQueries({ queryKey: ['lifeGroups'] });
      
      return true;
    } catch (error) {
      console.log('Online join request failed, queuing for offline sync:', error);
      SentryService.captureError(error as Error, {
        feature: 'life_groups',
        action: 'join_request',
        context: { groupId, userId },
      });
      
      // Queue for offline sync
      await database.enqueue('GROUP_JOIN_REQUEST', joinRequest);
      
      // Update local state optimistically
      await this.updateLocalJoinRequest(joinRequest);
      
      toast.info('Join request queued - will sync when online');
      
      // Invalidate queries to show updated state
      this.queryClient.invalidateQueries({ queryKey: ['lifeGroups'] });
      
      return false; // Indicate it was queued, not completed online
    }
  }

  /**
   * Mark attendance for a group session
   */
  async markAttendance(
    groupId: string,
    sessionId: string,
    userId: string,
    isPresent: boolean = true
  ): Promise<boolean> {
    const clientRequestId = this.generateRequestId();
    
    const attendance: AttendanceAction = {
      clientRequestId,
      groupId,
      sessionId,
      userId,
      isPresent,
      timestamp: new Date().toISOString(),
    };

    try {
      // Try online submission first
      await this.submitAttendance(attendance);
      
      // Update local state optimistically
      await this.updateLocalAttendance(attendance);
      
      toast.success(isPresent ? 'Attendance marked!' : 'Absence marked!');
      
      // Invalidate queries to refetch
      this.queryClient.invalidateQueries({ queryKey: ['lifeGroups'] });
      
      return true;
    } catch (error) {
      console.log('Online attendance failed, queuing for offline sync:', error);
      SentryService.captureError(error as Error, {
        feature: 'life_groups',
        action: 'mark_attendance',
        context: { groupId, sessionId, userId },
      });
      
      // Queue for offline sync
      await database.enqueue('GROUP_ATTENDANCE', attendance);
      
      // Update local state optimistically
      await this.updateLocalAttendance(attendance);
      
      toast.info('Attendance queued - will sync when online');
      
      // Invalidate queries to show updated state
      this.queryClient.invalidateQueries({ queryKey: ['lifeGroups'] });
      
      return false; // Indicate it was queued, not completed online
    }
  }

  /**
   * Get group statistics for user
   */
  async getGroupStats(userId: string, churchId: string): Promise<GroupStats> {
    try {
      const cachedGroups = await this.getCachedGroups();
      const churchGroups = cachedGroups.filter(g => g.churchId === churchId);
      const myGroups = churchGroups.filter(g => 
        g.members.some(m => m.id === userId && m.isActive)
      );
      const availableGroups = churchGroups.filter(g => 
        g.isOpen && 
        g.currentMembers < g.capacity &&
        !g.members.some(m => m.id === userId)
      );

      // Calculate total attendances for user
      let totalAttendances = 0;
      for (const group of myGroups) {
        for (const session of group.sessions) {
          if (session.attendees.includes(userId)) {
            totalAttendances++;
          }
        }
      }

      return {
        totalGroups: churchGroups.length,
        myGroups: myGroups.length,
        availableGroups: availableGroups.length,
        totalAttendances,
      };
    } catch (error) {
      console.error('Failed to get group stats:', error);
      return {
        totalGroups: 0,
        myGroups: 0,
        availableGroups: 0,
        totalAttendances: 0,
      };
    }
  }

  /**
   * Create a new group session (for leaders)
   */
  async createGroupSession(
    groupId: string,
    topic?: string,
    notes?: string
  ): Promise<GroupSession | null> {
    try {
      const sessionId = `session-${Date.now()}`;
      const newSession: GroupSession = {
        id: sessionId,
        date: new Date().toISOString(),
        topic,
        notes,
        attendees: [],
        createdBy: 'current-user', // In real app, get from auth context
      };

      // Update local cache
      const cachedGroups = await this.getCachedGroups();
      const updatedGroups = cachedGroups.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            sessions: [...group.sessions, newSession],
          };
        }
        return group;
      });

      await this.cacheGroups(updatedGroups);
      
      toast.success('Group session created!');
      this.queryClient.invalidateQueries({ queryKey: ['lifeGroups'] });
      
      return newSession;
    } catch (error) {
      console.error('Failed to create group session:', error);
      SentryService.captureError(error as Error, {
        feature: 'life_groups',
        action: 'create_session',
        context: { groupId },
      });
      
      toast.error('Failed to create session');
      return null;
    }
  }

  /**
   * Get all life groups for church
   */
  async getLifeGroups(churchId?: string): Promise<MockLifeGroup[]> {
    try {
      const cachedGroups = await this.getCachedGroups();
      
      if (churchId) {
        return cachedGroups.filter(group => group.churchId === churchId);
      }
      
      return cachedGroups;
    } catch (error) {
      console.error('Failed to get life groups:', error);
      return churchId ? MOCK_LIFE_GROUPS.filter(g => g.churchId === churchId) : MOCK_LIFE_GROUPS;
    }
  }

  /**
   * Get single life group by ID
   */
  async getLifeGroup(groupId: string): Promise<MockLifeGroup | null> {
    try {
      const cachedGroups = await this.getCachedGroups();
      return cachedGroups.find(g => g.id === groupId) || null;
    } catch (error) {
      console.error('Failed to get life group:', error);
      return MOCK_LIFE_GROUPS.find(g => g.id === groupId) || null;
    }
  }

  /**
   * Submit join request to API
   */
  private async submitJoinRequest(request: JoinRequestAction): Promise<void> {
    const payload = {
      clientRequestId: request.clientRequestId,
      groupId: request.groupId,
      userId: request.userId,
      message: request.message,
    };

    const response = await apiClient.post(
      ENDPOINTS.GROUPS?.JOIN_REQUEST(request.groupId) || `/groups/${request.groupId}/join`,
      payload
    );

    if (!response.success) {
      throw new Error(response.error || 'Join request failed');
    }
  }

  /**
   * Submit attendance to API
   */
  private async submitAttendance(attendance: AttendanceAction): Promise<void> {
    const payload = {
      clientRequestId: attendance.clientRequestId,
      groupId: attendance.groupId,
      sessionId: attendance.sessionId,
      userId: attendance.userId,
      isPresent: attendance.isPresent,
    };

    const response = await apiClient.post(
      ENDPOINTS.GROUPS?.ATTENDANCE(attendance.groupId) || `/groups/${attendance.groupId}/attendance`,
      payload
    );

    if (!response.success) {
      throw new Error(response.error || 'Attendance submission failed');
    }
  }

  /**
   * Update local join request optimistically
   */
  private async updateLocalJoinRequest(request: JoinRequestAction): Promise<void> {
    try {
      const cachedGroups = await this.getCachedGroups();
      
      const updatedGroups = cachedGroups.map(group => {
        if (group.id === request.groupId) {
          const newJoinRequest = {
            id: `req-${Date.now()}`,
            userId: request.userId,
            userName: 'Current User', // In real app, get from user context
            requestedAt: request.timestamp,
            status: 'pending' as const,
            message: request.message,
          };
          
          return {
            ...group,
            joinRequests: [...group.joinRequests, newJoinRequest],
          };
        }
        return group;
      });
      
      await this.cacheGroups(updatedGroups);
    } catch (error) {
      console.error('Failed to update local join request:', error);
    }
  }

  /**
   * Update local attendance optimistically
   */
  private async updateLocalAttendance(attendance: AttendanceAction): Promise<void> {
    try {
      const cachedGroups = await this.getCachedGroups();
      
      const updatedGroups = cachedGroups.map(group => {
        if (group.id === attendance.groupId) {
          const updatedSessions = group.sessions.map(session => {
            if (session.id === attendance.sessionId) {
              let updatedAttendees = [...session.attendees];
              
              if (attendance.isPresent) {
                // Add user to attendees if not already present
                if (!updatedAttendees.includes(attendance.userId)) {
                  updatedAttendees.push(attendance.userId);
                }
              } else {
                // Remove user from attendees
                updatedAttendees = updatedAttendees.filter(id => id !== attendance.userId);
              }
              
              return {
                ...session,
                attendees: updatedAttendees,
              };
            }
            return session;
          });
          
          return {
            ...group,
            sessions: updatedSessions,
          };
        }
        return group;
      });
      
      await this.cacheGroups(updatedGroups);
    } catch (error) {
      console.error('Failed to update local attendance:', error);
    }
  }

  /**
   * Cache life groups in key-value store
   */
  private async cacheGroups(groups: MockLifeGroup[]): Promise<void> {
    const cacheData = {
      groups,
      timestamp: Date.now(),
    };
    await database.setKV(GROUPS_CACHE_KEY, cacheData);
  }

  /**
   * Get cached life groups
   */
  private async getCachedGroups(): Promise<MockLifeGroup[]> {
    try {
      const cached = await database.getKVJson<{
        groups: MockLifeGroup[];
        timestamp: number;
      }>(GROUPS_CACHE_KEY);

      if (!cached) {
        // Initialize with mock data
        await this.cacheGroups(MOCK_LIFE_GROUPS);
        return MOCK_LIFE_GROUPS;
      }

      // Check if cache is still valid
      const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
      if (isExpired) {
        console.log('Life groups cache expired');
        return MOCK_LIFE_GROUPS;
      }

      return cached.groups || MOCK_LIFE_GROUPS;
    } catch (error) {
      console.error('Failed to get cached life groups:', error);
      return MOCK_LIFE_GROUPS;
    }
  }

  /**
   * Sync offline life group actions
   */
  async syncGroupActions(): Promise<void> {
    try {
      // Sync join requests
      const joinRequests = await database.getQueue('GROUP_JOIN_REQUEST');
      for (const item of joinRequests) {
        try {
          await this.submitJoinRequest(item.data as JoinRequestAction);
          await database.removeFromQueue(item.id);
        } catch (error) {
          console.log('Failed to sync join request:', error);
        }
      }

      // Sync attendance
      const attendances = await database.getQueue('GROUP_ATTENDANCE');
      for (const item of attendances) {
        try {
          await this.submitAttendance(item.data as AttendanceAction);
          await database.removeFromQueue(item.id);
        } catch (error) {
          console.log('Failed to sync attendance:', error);
        }
      }

      console.log(`Synced ${joinRequests.length} join requests and ${attendances.length} attendances`);
    } catch (error) {
      console.error('Failed to sync life group actions:', error);
      SentryService.captureError(error as Error, {
        feature: 'life_groups',
        action: 'sync_actions',
      });
    }
  }

  /**
   * Clear life groups cache
   */
  async clearCache(): Promise<void> {
    await database.deleteKV(GROUPS_CACHE_KEY);
    this.queryClient.removeQueries({ queryKey: ['lifeGroups'] });
  }

  /**
   * Generate unique request ID for idempotency
   */
  private generateRequestId(): string {
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance (will be initialized with queryClient)
export let lifeGroupsService: LifeGroupsService;

export const initializeLifeGroupsService = (queryClient: QueryClient) => {
  lifeGroupsService = new LifeGroupsService(queryClient);
  return lifeGroupsService;
};

export default LifeGroupsService;