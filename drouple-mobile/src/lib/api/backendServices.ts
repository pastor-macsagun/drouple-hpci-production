/**
 * Production Backend Services
 * Real API implementations using production backend
 */

import { productionApiClient } from './productionClient';
import type { ApiResponse } from './productionClient';

// =============================================================================
// Authentication Service
// =============================================================================

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    churchId: string;
    preferences: Record<string, any>;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  churchId: string;
  avatar?: string;
  phone?: string;
  address?: string;
  preferences: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export const authBackendService = {
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return productionApiClient.post('/auth/login', credentials, {
      cache: false,
      offline: false,
    });
  },

  async logout(): Promise<ApiResponse<void>> {
    const result = await productionApiClient.post(
      '/auth/logout',
      {},
      {
        cache: false,
        offline: false,
      }
    );

    // Clear local tokens
    productionApiClient.clearTokens();

    return result;
  },

  async refreshToken(): Promise<
    ApiResponse<{ accessToken: string; refreshToken: string }>
  > {
    return productionApiClient.post(
      '/auth/refresh',
      {},
      {
        cache: false,
        offline: false,
      }
    );
  },

  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return productionApiClient.get('/auth/profile', {
      cache: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
    });
  },

  async updateProfile(
    data: Partial<UserProfile>
  ): Promise<ApiResponse<UserProfile>> {
    return productionApiClient.patch('/auth/profile', data, {
      cache: false,
    });
  },

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<void>> {
    return productionApiClient.post('/auth/change-password', data, {
      cache: false,
      offline: false,
    });
  },
};

// =============================================================================
// Events Service
// =============================================================================

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: string;
  capacity?: number;
  fee?: number;
  imageUrl?: string;
  category: string;
  visibility: 'PUBLIC' | 'MEMBERS_ONLY' | 'LEADERS_ONLY';
  requiresRSVP: boolean;
  rsvpDeadline?: string;
  createdBy: string;
  churchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventWithStats extends Event {
  stats: {
    totalRSVPs: number;
    confirmedRSVPs: number;
    waitlistedRSVPs: number;
    availableSpots?: number;
  };
}

export interface RSVP {
  id: string;
  eventId: string;
  userId: string;
  status: 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED';
  notes?: string;
  paidAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export const eventsBackendService = {
  async getEvents(params?: {
    page?: number;
    limit?: number;
    upcoming?: boolean;
    category?: string;
    search?: string;
  }): Promise<ApiResponse<{ events: EventWithStats[]; pagination: any }>> {
    return productionApiClient.get('/events', {
      cache: true,
      cacheTTL: 2 * 60 * 1000, // 2 minutes
    });
  },

  async getEvent(eventId: string): Promise<ApiResponse<EventWithStats>> {
    return productionApiClient.get(`/events/${eventId}`, {
      cache: true,
      cacheTTL: 1 * 60 * 1000, // 1 minute
    });
  },

  async createEvent(
    data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<Event>> {
    return productionApiClient.post('/events', data, {
      cache: false,
      idempotencyKey: `create_event_${Date.now()}`,
    });
  },

  async updateEvent(
    eventId: string,
    data: Partial<Event>
  ): Promise<ApiResponse<Event>> {
    return productionApiClient.patch(`/events/${eventId}`, data, {
      cache: false,
      idempotencyKey: `update_event_${eventId}_${Date.now()}`,
    });
  },

  async deleteEvent(eventId: string): Promise<ApiResponse<void>> {
    return productionApiClient.delete(`/events/${eventId}`, {
      cache: false,
    });
  },

  async rsvpToEvent(data: {
    eventId: string;
    notes?: string;
  }): Promise<ApiResponse<RSVP>> {
    return productionApiClient.post(`/events/${data.eventId}/rsvp`, data, {
      cache: false,
      offline: true,
      idempotencyKey: `rsvp_${data.eventId}_${Date.now()}`,
    });
  },

  async cancelRSVP(eventId: string): Promise<ApiResponse<void>> {
    return productionApiClient.delete(`/events/${eventId}/rsvp`, {
      cache: false,
      offline: true,
    });
  },

  async getUserRSVPs(
    upcoming?: boolean
  ): Promise<ApiResponse<(RSVP & { event: Event })[]>> {
    const params = upcoming ? '?upcoming=true' : '';
    return productionApiClient.get(`/events/rsvps${params}`, {
      cache: true,
      cacheTTL: 1 * 60 * 1000,
    });
  },
};

// =============================================================================
// Check-in Service
// =============================================================================

export interface Service {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  capacity?: number;
  churchId: string;
  isActive: boolean;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckIn {
  id: string;
  serviceId: string;
  userId: string;
  checkInTime: string;
  location?: string;
  method: 'MANUAL' | 'QR_CODE' | 'KIOSK';
  notes?: string;
  createdAt: string;
}

export const checkInBackendService = {
  async getTodaysServices(): Promise<ApiResponse<Service[]>> {
    return productionApiClient.get('/services/today', {
      cache: true,
      cacheTTL: 30 * 1000, // 30 seconds
    });
  },

  async getServices(params?: {
    date?: string;
    upcoming?: boolean;
    limit?: number;
  }): Promise<ApiResponse<Service[]>> {
    return productionApiClient.get('/services', {
      cache: true,
      cacheTTL: 1 * 60 * 1000,
    });
  },

  async checkIn(data: {
    serviceId: string;
    location?: string;
    notes?: string;
  }): Promise<ApiResponse<CheckIn>> {
    return productionApiClient.post(
      `/services/${data.serviceId}/checkin`,
      data,
      {
        cache: false,
        offline: true,
        idempotencyKey: `checkin_${data.serviceId}_${Date.now()}`,
      }
    );
  },

  async validateQRCode(qrToken: string): Promise<
    ApiResponse<{
      valid: boolean;
      service?: Service;
      canCheckIn: boolean;
      message?: string;
    }>
  > {
    return productionApiClient.post(
      '/services/validate-qr',
      { token: qrToken },
      {
        cache: false,
        offline: false,
      }
    );
  },

  async checkInViaQR(qrToken: string): Promise<ApiResponse<CheckIn>> {
    return productionApiClient.post(
      '/services/checkin-qr',
      { token: qrToken },
      {
        cache: false,
        offline: true,
        idempotencyKey: `qr_checkin_${Date.now()}`,
      }
    );
  },

  async getCheckInHistory(params?: {
    limit?: number;
    serviceId?: string;
  }): Promise<ApiResponse<(CheckIn & { service: Service })[]>> {
    return productionApiClient.get('/services/checkins/history', {
      cache: true,
      cacheTTL: 2 * 60 * 1000,
    });
  },
};

// =============================================================================
// Life Groups Service
// =============================================================================

export interface LifeGroup {
  id: string;
  name: string;
  description: string;
  category: 'MEN' | 'WOMEN' | 'MIXED' | 'YOUTH' | 'SENIORS' | 'FAMILIES';
  meetingDay: string;
  meetingTime: string;
  location: string;
  capacity?: number;
  leaderId: string;
  churchId: string;
  isOpen: boolean;
  imageUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupMembership {
  id: string;
  groupId: string;
  userId: string;
  role: 'MEMBER' | 'LEADER' | 'CO_LEADER';
  joinedAt: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface JoinRequest {
  id: string;
  groupId: string;
  userId: string;
  message?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export const groupsBackendService = {
  async getGroups(params?: {
    category?: string;
    isOpen?: boolean;
    available?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ groups: LifeGroup[]; pagination: any }>> {
    return productionApiClient.get('/groups', {
      cache: true,
      cacheTTL: 2 * 60 * 1000,
    });
  },

  async getGroup(groupId: string): Promise<
    ApiResponse<
      LifeGroup & {
        memberCount: number;
        availableSpots?: number;
        leader: { name: string; avatar?: string };
      }
    >
  > {
    return productionApiClient.get(`/groups/${groupId}`, {
      cache: true,
      cacheTTL: 1 * 60 * 1000,
    });
  },

  async requestToJoin(data: {
    groupId: string;
    message?: string;
  }): Promise<ApiResponse<JoinRequest>> {
    return productionApiClient.post(`/groups/${data.groupId}/join`, data, {
      cache: false,
      offline: true,
      idempotencyKey: `join_request_${data.groupId}_${Date.now()}`,
    });
  },

  async cancelJoinRequest(groupId: string): Promise<ApiResponse<void>> {
    return productionApiClient.delete(`/groups/${groupId}/join`, {
      cache: false,
    });
  },

  async leaveGroup(groupId: string): Promise<ApiResponse<void>> {
    return productionApiClient.delete(`/groups/${groupId}/leave`, {
      cache: false,
      offline: true,
    });
  },

  async getUserGroups(): Promise<
    ApiResponse<(GroupMembership & { group: LifeGroup })[]>
  > {
    return productionApiClient.get('/groups/my-groups', {
      cache: true,
      cacheTTL: 2 * 60 * 1000,
    });
  },

  async getGroupMembers(groupId: string): Promise<
    ApiResponse<
      (GroupMembership & {
        user: { name: string; avatar?: string };
      })[]
    >
  > {
    return productionApiClient.get(`/groups/${groupId}/members`, {
      cache: true,
      cacheTTL: 1 * 60 * 1000,
    });
  },
};

// =============================================================================
// Discipleship Pathways Service
// =============================================================================

export interface Pathway {
  id: string;
  title: string;
  description: string;
  category: 'SPIRITUAL_GROWTH' | 'MINISTRY' | 'LEADERSHIP' | 'SERVICE';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedDuration: number; // in days
  imageUrl?: string;
  isPublished: boolean;
  churchId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PathwayStep {
  id: string;
  pathwayId: string;
  title: string;
  description: string;
  content?: string;
  order: number;
  type: 'READING' | 'VIDEO' | 'ACTIVITY' | 'REFLECTION' | 'ASSESSMENT';
  resources: Array<{
    type: 'LINK' | 'DOCUMENT' | 'VIDEO';
    title: string;
    url: string;
  }>;
  estimatedTime: number; // in minutes
  isRequired: boolean;
}

export interface PathwayEnrollment {
  id: string;
  pathwayId: string;
  userId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'DROPPED';
  progress: number; // 0-100
  currentStepId?: string;
  enrolledAt: string;
  completedAt?: string;
  updatedAt: string;
}

export interface StepCompletion {
  id: string;
  enrollmentId: string;
  stepId: string;
  completedAt: string;
  notes?: string;
  timeSpent?: number; // in minutes
}

export const pathwaysBackendService = {
  async getAvailablePathways(params?: {
    category?: string;
    difficulty?: string;
    search?: string;
  }): Promise<ApiResponse<Pathway[]>> {
    return productionApiClient.get('/pathways', {
      cache: true,
      cacheTTL: 5 * 60 * 1000,
    });
  },

  async getPathway(pathwayId: string): Promise<
    ApiResponse<
      Pathway & {
        steps: PathwayStep[];
        enrollmentCount: number;
        averageCompletionTime: number;
      }
    >
  > {
    return productionApiClient.get(`/pathways/${pathwayId}`, {
      cache: true,
      cacheTTL: 2 * 60 * 1000,
    });
  },

  async enrollInPathway(
    pathwayId: string
  ): Promise<ApiResponse<PathwayEnrollment>> {
    return productionApiClient.post(
      `/pathways/${pathwayId}/enroll`,
      {},
      {
        cache: false,
        offline: true,
        idempotencyKey: `enroll_pathway_${pathwayId}_${Date.now()}`,
      }
    );
  },

  async getEnrollments(): Promise<
    ApiResponse<(PathwayEnrollment & { pathway: Pathway })[]>
  > {
    return productionApiClient.get('/pathways/enrollments', {
      cache: true,
      cacheTTL: 1 * 60 * 1000,
    });
  },

  async getEnrollmentProgress(enrollmentId: string): Promise<
    ApiResponse<{
      enrollment: PathwayEnrollment;
      pathway: Pathway;
      completedSteps: StepCompletion[];
      nextStep?: PathwayStep;
      totalSteps: number;
    }>
  > {
    return productionApiClient.get(
      `/pathways/enrollments/${enrollmentId}/progress`,
      {
        cache: true,
        cacheTTL: 30 * 1000,
      }
    );
  },

  async completeStep(
    enrollmentId: string,
    data: {
      stepId: string;
      notes?: string;
      timeSpent?: number;
    }
  ): Promise<ApiResponse<StepCompletion>> {
    return productionApiClient.post(
      `/pathways/enrollments/${enrollmentId}/steps`,
      data,
      {
        cache: false,
        offline: true,
        idempotencyKey: `complete_step_${data.stepId}_${Date.now()}`,
      }
    );
  },

  async getProgressSummary(): Promise<
    ApiResponse<{
      totalEnrollments: number;
      completedPathways: number;
      averageProgress: number;
      timeSpent: number; // total minutes
      recentActivity: Array<{
        pathwayTitle: string;
        lastActivity: string;
        progress: number;
      }>;
    }>
  > {
    return productionApiClient.get('/pathways/progress-summary', {
      cache: true,
      cacheTTL: 5 * 60 * 1000,
    });
  },
};

// =============================================================================
// Export all services
// =============================================================================

export const backendServices = {
  auth: authBackendService,
  events: eventsBackendService,
  checkIn: checkInBackendService,
  groups: groupsBackendService,
  pathways: pathwaysBackendService,
};
