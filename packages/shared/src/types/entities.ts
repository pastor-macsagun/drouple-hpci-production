// Core entity types for mobile and web
import {
  UserRole,
  ProfileVisibility,
  BelieverStatus,
  MemberStatus,
  MembershipStatus,
  RequestStatus,
  EventScope,
  RsvpStatus,
  PathwayType,
  EnrollmentStatus,
  AnnouncementScope,
  AnnouncementPriority,
} from './enums';

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: UserRole;
  tenantId?: string;
  isNewBeliever: boolean;
  memberStatus: MemberStatus;
  phone?: string;
  bio?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  joinedAt: string;
  profileVisibility: ProfileVisibility;
  allowContact: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocalChurch {
  id: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  scheduledAt: string;
  localChurchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  localChurch?: LocalChurch;
  checkinCount?: number;
}

export interface Checkin {
  id: string;
  serviceId: string;
  userId: string;
  isNewBeliever: boolean;
  checkedInAt: string;
  service?: Service;
  user?: User;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  capacity?: number;
  fee?: number;
  scope: EventScope;
  restrictedRoles?: UserRole[];
  localChurchId: string;
  createdById: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  localChurch?: LocalChurch;
  createdBy?: User;
  rsvpCount?: number;
  waitlistCount?: number;
  userRsvp?: EventRsvp;
}

export interface EventRsvp {
  id: string;
  eventId: string;
  userId: string;
  status: RsvpStatus;
  hasPaid: boolean;
  notes?: string;
  rsvpedAt: string;
  updatedAt: string;
  event?: Event;
  user?: User;
}

export interface LifeGroup {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  leaderId: string;
  localChurchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  leader?: User;
  localChurch?: LocalChurch;
  memberCount?: number;
  requestCount?: number;
}

export interface LifeGroupMembership {
  id: string;
  lifeGroupId: string;
  userId: string;
  status: MembershipStatus;
  joinedAt: string;
  leftAt?: string;
  createdAt: string;
  updatedAt: string;
  lifeGroup?: LifeGroup;
  user?: User;
}

export interface Pathway {
  id: string;
  name: string;
  description?: string;
  type: PathwayType;
  localChurchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  localChurch?: LocalChurch;
  steps?: PathwayStep[];
  stepCount?: number;
}

export interface PathwayStep {
  id: string;
  title: string;
  description?: string;
  order: number;
  pathwayId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  pathway?: Pathway;
}

export interface PathwayEnrollment {
  id: string;
  pathwayId: string;
  userId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt?: string;
  droppedAt?: string;
  createdAt: string;
  updatedAt: string;
  pathway?: Pathway;
  user?: User;
  progressPercentage?: number;
  completedSteps?: number;
  totalSteps?: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  scope: AnnouncementScope;
  priority: AnnouncementPriority;
  localChurchId?: string;
  authorId: string;
  isPublished: boolean;
  publishedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  localChurch?: LocalChurch;
  author?: User;
}