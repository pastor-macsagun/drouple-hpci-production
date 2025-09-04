/**
 * Life Groups API Service
 * Real backend integration for life groups management
 */

import { apiClient } from '../client';
import type { ApiResponse } from '../contracts';

// Types
export interface LifeGroup {
  id: string;
  name: string;
  description: string;
  category: 'men' | 'women' | 'mixed' | 'youth' | 'seniors' | 'families';
  meetingDay: string;
  meetingTime: string;
  location: string;
  capacity: number;
  currentMembers: number;
  isOpen: boolean;
  leaderId: string;
  coLeaderIds: string[];
  tags: string[];
  ageRange?: string;
  imageUrl?: string;
  churchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  groupId: string;
  role: 'leader' | 'co_leader' | 'member';
  joinedAt: string;
  isActive: boolean;
}

export interface GroupJoinRequest {
  id: string;
  groupId: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  respondedAt?: string;
  respondedBy?: string;
}

export interface GroupSession {
  id: string;
  groupId: string;
  date: string;
  topic?: string;
  notes?: string;
  attendees: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupRequest {
  name: string;
  description: string;
  category: LifeGroup['category'];
  meetingDay: string;
  meetingTime: string;
  location: string;
  capacity: number;
  tags?: string[];
  ageRange?: string;
  imageUrl?: string;
}

export interface UpdateGroupRequest extends Partial<CreateGroupRequest> {
  isOpen?: boolean;
  isActive?: boolean;
  leaderId?: string;
  coLeaderIds?: string[];
}

export interface JoinGroupRequest {
  groupId: string;
  message?: string;
}

export interface CreateSessionRequest {
  groupId: string;
  date: string;
  topic?: string;
  notes?: string;
  attendees: string[];
}

export interface GroupsQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: LifeGroup['category'];
  isOpen?: boolean;
  userGroups?: boolean;
  available?: boolean;
  churchId?: string;
}

// Life Groups API Service
export class GroupsApiService {
  /**
   * Get life groups list with filtering
   */
  async getGroups(query: GroupsQuery = {}): Promise<
    ApiResponse<{
      groups: LifeGroup[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  > {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const endpoint = queryString ? `/groups?${queryString}` : '/groups';

    return apiClient.get(endpoint, { cache: true, cacheTTL: 2 * 60 * 1000 });
  }

  /**
   * Get single group by ID
   */
  async getGroup(groupId: string): Promise<
    ApiResponse<
      LifeGroup & {
        members: GroupMember[];
        recentSessions: GroupSession[];
      }
    >
  > {
    return apiClient.get(`/groups/${groupId}`, {
      cache: true,
      cacheTTL: 5 * 60 * 1000,
    });
  }

  /**
   * Create new life group
   */
  async createGroup(
    request: CreateGroupRequest
  ): Promise<ApiResponse<LifeGroup>> {
    return apiClient.post('/groups', request, {
      idempotencyKey: apiClient.generateIdempotencyKey(),
    });
  }

  /**
   * Update existing group
   */
  async updateGroup(
    groupId: string,
    request: UpdateGroupRequest
  ): Promise<ApiResponse<LifeGroup>> {
    return apiClient.put(`/groups/${groupId}`, request);
  }

  /**
   * Delete group
   */
  async deleteGroup(
    groupId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/groups/${groupId}`, {
      idempotencyKey: apiClient.generateIdempotencyKey(),
    });
  }

  /**
   * Request to join a group
   */
  async requestToJoin(
    request: JoinGroupRequest
  ): Promise<ApiResponse<GroupJoinRequest>> {
    return apiClient.post(
      `/groups/${request.groupId}/join`,
      {
        message: request.message,
      },
      {
        idempotencyKey: apiClient.generateIdempotencyKey(),
      }
    );
  }

  /**
   * Cancel join request
   */
  async cancelJoinRequest(
    groupId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/groups/${groupId}/join`, {
      idempotencyKey: apiClient.generateIdempotencyKey(),
    });
  }

  /**
   * Leave group
   */
  async leaveGroup(groupId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/groups/${groupId}/leave`, {
      idempotencyKey: apiClient.generateIdempotencyKey(),
    });
  }

  /**
   * Get group members (leader/admin only)
   */
  async getGroupMembers(groupId: string): Promise<ApiResponse<GroupMember[]>> {
    return apiClient.get(`/groups/${groupId}/members`);
  }

  /**
   * Add member to group (leader/admin only)
   */
  async addMember(
    groupId: string,
    userId: string,
    role: GroupMember['role'] = 'member'
  ): Promise<ApiResponse<GroupMember>> {
    return apiClient.post(
      `/groups/${groupId}/members`,
      {
        userId,
        role,
      },
      {
        idempotencyKey: apiClient.generateIdempotencyKey(),
      }
    );
  }

  /**
   * Remove member from group (leader/admin only)
   */
  async removeMember(
    groupId: string,
    userId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/groups/${groupId}/members/${userId}`, {
      idempotencyKey: apiClient.generateIdempotencyKey(),
    });
  }

  /**
   * Update member role (leader/admin only)
   */
  async updateMemberRole(
    groupId: string,
    userId: string,
    role: GroupMember['role']
  ): Promise<ApiResponse<GroupMember>> {
    return apiClient.patch(`/groups/${groupId}/members/${userId}`, { role });
  }

  /**
   * Get join requests (leader/admin only)
   */
  async getJoinRequests(
    groupId: string
  ): Promise<ApiResponse<GroupJoinRequest[]>> {
    return apiClient.get(`/groups/${groupId}/requests`);
  }

  /**
   * Respond to join request (leader/admin only)
   */
  async respondToJoinRequest(
    groupId: string,
    requestId: string,
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<ApiResponse<GroupJoinRequest>> {
    return apiClient.patch(`/groups/${groupId}/requests/${requestId}`, {
      action,
      reason,
    });
  }

  /**
   * Get group sessions (leader/admin only)
   */
  async getGroupSessions(
    groupId: string,
    query?: {
      page?: number;
      limit?: number;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<
    ApiResponse<{
      sessions: GroupSession[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  > {
    const params = new URLSearchParams();

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const endpoint = queryString
      ? `/groups/${groupId}/sessions?${queryString}`
      : `/groups/${groupId}/sessions`;

    return apiClient.get(endpoint);
  }

  /**
   * Create session and track attendance (leader/admin only)
   */
  async createSession(
    request: CreateSessionRequest
  ): Promise<ApiResponse<GroupSession>> {
    return apiClient.post(
      `/groups/${request.groupId}/sessions`,
      {
        date: request.date,
        topic: request.topic,
        notes: request.notes,
        attendees: request.attendees,
      },
      {
        idempotencyKey: apiClient.generateIdempotencyKey(),
      }
    );
  }

  /**
   * Update session (leader/admin only)
   */
  async updateSession(
    groupId: string,
    sessionId: string,
    data: {
      topic?: string;
      notes?: string;
      attendees?: string[];
    }
  ): Promise<ApiResponse<GroupSession>> {
    return apiClient.put(`/groups/${groupId}/sessions/${sessionId}`, data);
  }

  /**
   * Delete session (leader/admin only)
   */
  async deleteSession(
    groupId: string,
    sessionId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/groups/${groupId}/sessions/${sessionId}`, {
      idempotencyKey: apiClient.generateIdempotencyKey(),
    });
  }

  /**
   * Get user's groups
   */
  async getUserGroups(): Promise<
    ApiResponse<(GroupMember & { group: LifeGroup })[]>
  > {
    return apiClient.get('/groups/my-groups');
  }

  /**
   * Export group roster (leader/admin only)
   */
  async exportRoster(
    groupId: string,
    format: 'csv' | 'json' = 'csv'
  ): Promise<
    ApiResponse<{
      downloadUrl: string;
      fileName: string;
    }>
  > {
    return apiClient.post(
      `/groups/${groupId}/export/roster`,
      { format },
      {
        idempotencyKey: apiClient.generateIdempotencyKey(),
      }
    );
  }

  /**
   * Export attendance history (leader/admin only)
   */
  async exportAttendance(
    groupId: string,
    format: 'csv' | 'json' = 'csv',
    dateFrom?: string,
    dateTo?: string
  ): Promise<
    ApiResponse<{
      downloadUrl: string;
      fileName: string;
    }>
  > {
    return apiClient.post(
      `/groups/${groupId}/export/attendance`,
      {
        format,
        dateFrom,
        dateTo,
      },
      {
        idempotencyKey: apiClient.generateIdempotencyKey(),
      }
    );
  }

  /**
   * Get group statistics (leader/admin only)
   */
  async getGroupStats(groupId: string): Promise<
    ApiResponse<{
      totalMembers: number;
      activeMembers: number;
      averageAttendance: number;
      attendanceRate: number;
      recentSessions: number;
      membershipGrowth: {
        month: string;
        members: number;
      }[];
      attendanceTrends: {
        date: string;
        attendance: number;
      }[];
    }>
  > {
    return apiClient.get(`/groups/${groupId}/stats`);
  }

  /**
   * Search groups
   */
  async searchGroups(
    query: string,
    filters?: {
      category?: LifeGroup['category'];
      location?: string;
      meetingDay?: string;
      isOpen?: boolean;
    }
  ): Promise<ApiResponse<LifeGroup[]>> {
    const params = new URLSearchParams({ q: query });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    return apiClient.get(`/groups/search?${params.toString()}`, {
      cache: true,
      cacheTTL: 30 * 1000, // 30 seconds cache
    });
  }

  /**
   * Get available groups for user
   */
  async getAvailableGroups(limit?: number): Promise<ApiResponse<LifeGroup[]>> {
    const params = limit ? `?limit=${limit}` : '';
    return apiClient.get(`/groups/available${params}`, {
      cache: true,
      cacheTTL: 2 * 60 * 1000, // 2 minutes cache
    });
  }
}

// Create singleton instance
export const groupsService = new GroupsApiService();
