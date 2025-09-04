/**
 * Shared TypeScript contracts between Drouple web and mobile apps
 * Core types for API communication and data structures
 */

// User roles in hierarchy order (highest to lowest privilege)
export type Role = 
  | 'SUPER_ADMIN'   // System-wide access
  | 'PASTOR'        // Church leadership
  | 'ADMIN'         // Church administrator
  | 'LEADER'        // Ministry leader
  | 'VIP'           // First-timer team
  | 'MEMBER';       // Regular member

// User Data Transfer Object
export interface UserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  tenantId: string;
  churchId: string;
  isActive: boolean;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

// Check-in request from mobile/web client
export interface CheckInRequest {
  clientRequestId: string;  // Client-generated UUID for deduplication
  memberId: string;         // User ID checking in
  serviceId: string;        // Service being attended
  newBeliever?: boolean;    // Is this a new believer (first-time visitor)
}

// Check-in response
export interface CheckInResult {
  id: string;                    // Server-generated check-in ID
  status: 'ok' | 'duplicate';   // Success or already checked in
}

// Event Data Transfer Object
export interface EventDTO {
  id: string;
  title: string;
  startsAt: string;           // ISO datetime string
  location?: string;
  capacity?: number;          // Maximum attendees
  spotsLeft?: number;         // Available spots (capacity - current attendees)
}

// RSVP request for events
export interface RSVPRequest {
  clientRequestId: string;    // Client-generated UUID for deduplication
  eventId: string;
  action: 'RSVP' | 'CANCEL';  // RSVP or cancel existing RSVP
}

// Device registration for push notifications
export interface DeviceRegisterRequest {
  token: string;                    // Push notification token from device
  platform: 'ios' | 'android';     // Device platform
  appVersion?: string;              // App version for compatibility
}

// Member directory entry (privacy-aware)
export interface DirectoryEntry {
  id: string;
  name: string;              // Full name (firstName + lastName)
  roles: Role[];
  phone?: string;            // Only visible based on privacy settings
  email?: string;            // Only visible based on privacy settings
}

// Discipleship pathway progress
export interface PathwayProgress {
  id: string;
  pathwayId: string;
  pathwayName: string;
  userId: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
  enrolledAt: string;        // ISO datetime string
  completedAt?: string;      // ISO datetime string if completed
  progressPercentage: number; // 0-100
  currentStepId?: string;
  completedSteps: string[];  // Array of completed step IDs
}

// Life Group Data Transfer Object
export interface GroupDTO {
  id: string;
  name: string;
  description?: string;
  leaderId: string;
  leaderName: string;
  maxMembers?: number;
  currentMembers: number;
  meetingDay?: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  meetingTime?: string;      // e.g., "19:00" (24-hour format)
  location?: string;
  isActive: boolean;
}

// Report summary for dashboards
export interface ReportSummary {
  id: string;
  title: string;
  type: 'attendance' | 'engagement' | 'growth' | 'financial';
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  value: number;             // Main metric value
  unit: string;              // e.g., "people", "events", "percentage"
  trend?: 'up' | 'down' | 'stable'; // Compared to previous period
  changePercentage?: number; // e.g., +15.5 or -8.2
  lastUpdated: string;       // ISO datetime string
}

// Additional request/response types for mobile API endpoints

// Standard success response
export interface SuccessResponse {
  status: 'ok';
  message?: string;
}

// Pathway step completion request
export interface PathwayStepRequest {
  clientRequestId: string;
  stepId: string;
  action: 'COMPLETE';
}

// Group join request
export interface GroupJoinRequest {
  clientRequestId: string;
  groupId: string;
}

// ===== REALTIME & PUSH NOTIFICATION TYPES =====

// Generic API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: keyof typeof ErrorCodes;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
  requestId?: string;
}

// Error codes for API responses
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Mobile user representation with preferences
export interface MobileUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  tenantId: string;
  churchId: string;
  isActive: boolean;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
  preferences: {
    notificationsEnabled: boolean;
    biometricEnabled: boolean;
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
}

// Device platforms for push notifications
export type DevicePlatform = 'ios' | 'android';

// Push notification topics
export type NotificationTopic = 
  | 'announcements'
  | 'event_reminders' 
  | 'pathway_milestones'
  | 'admin_alerts';

// Push notification priority levels
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH';

// Push notification payload
export interface PushNotificationPayload {
  title: string;
  body: string;
  priority?: NotificationPriority;
  badge?: number;
  imageUrl?: string;
  clickAction?: string;
  data?: Record<string, string>;
}

// Push notification result
export interface PushNotificationResult {
  success: boolean;
  messageId?: string;
  token: string;
  error?: string;
  errorCode?: string;
}

// ===== SYNC & OFFLINE TYPES =====

// Live service counts response
export interface ServiceCountsResponse {
  services: Array<{
    serviceId: string;
    churchId: string;
    churchName: string;
    serviceName: string;
    serviceDate: string;
    serviceTime?: string;
    totalCheckins: number;
    currentAttendance: number;
    recentCheckins: number;
    lastUpdated: string;
  }>;
  timestamp: string;
  refreshInterval: number;
}

// Mobile event representation for sync
export interface MobileEvent {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  eventTime?: string;
  location?: string;
  capacity?: number;
  fee?: number;
  visibility: 'PUBLIC' | 'MEMBERS' | 'LEADERS' | 'ADMINS';
  scope: 'WHOLE_CHURCH' | 'LOCAL_CHURCH';
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  churchId: string;
  churchName: string;
  userRsvp?: {
    id: string;
    status: 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED';
    rsvpDate: string;
  };
  attendeeCount: number;
  isFull: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mobile member representation for sync
export interface MobileMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  churchId: string;
  churchName: string;
  isActive: boolean;
  profileImage?: string;
  phone?: string; // Only for admins
  createdAt: string;
  updatedAt: string;
}

// Event sync response
export interface EventSyncResponse {
  events: MobileEvent[];
  hasMore: boolean;
  nextOffset?: number;
  timestamp: string;
  syncVersion: number;
}

// Member sync response
export interface MemberSyncResponse {
  members: MobileMember[];
  hasMore: boolean;
  nextOffset?: number;
  timestamp: string;
  syncVersion: number;
}

// Bulk operation result
export interface BulkOperationResult {
  success: boolean;
  id: string; // Client-provided ID (offlineId or clientId)
  serverId?: string; // Server-generated ID if successful
  action?: 'created' | 'updated';
  error?: string;
  conflictType?: 'duplicate';
  warning?: string;
}

// Bulk check-in request
export interface BulkCheckinRequest {
  checkins: Array<{
    serviceId: string;
    checkinTime: string; // ISO datetime
    clientId?: string;
    offlineId?: string;
  }>;
  conflictResolution: 'last-write-wins' | 'fail-on-conflict';
}

// Bulk check-in response
export interface BulkCheckinResponse {
  results: BulkOperationResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    conflicts: number;
  };
  timestamp: string;
}

// Bulk RSVP request
export interface BulkRsvpRequest {
  rsvps: Array<{
    eventId: string;
    status: 'CONFIRMED' | 'CANCELLED';
    rsvpDate: string; // ISO datetime
    clientId?: string;
    offlineId?: string;
  }>;
  conflictResolution: 'last-write-wins' | 'fail-on-conflict';
}

// Bulk RSVP response
export interface BulkRsvpResponse {
  results: BulkOperationResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    conflicts: number;
    waitlisted: number;
  };
  timestamp: string;
}