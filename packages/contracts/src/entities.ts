/**
 * Entity Types & Schemas for Mobile API
 * Core business entities used by mobile endpoints
 */

import { z } from 'zod';
import { UserRoleSchema } from './auth';

// Service/Event entity
export const ServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  date: z.string(), // ISO string
  churchId: z.string(),
  isActive: z.boolean(),
  attendeeCount: z.number().int().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Service = z.infer<typeof ServiceSchema>;

// Check-in entity
export const CheckInSchema = z.object({
  id: z.string(),
  userId: z.string(),
  serviceId: z.string(),
  checkedInAt: z.string(),
  isFirstTime: z.boolean(),
  notes: z.string().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
});

export type CheckIn = z.infer<typeof CheckInSchema>;

// Event entity
export const EventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  location: z.string().optional(),
  maxAttendees: z.number().int().min(0).optional(),
  currentAttendees: z.number().int().min(0),
  fee: z.number().min(0).optional(),
  churchId: z.string(),
  createdBy: z.string(),
  visibility: z.enum(['LOCAL_CHURCH', 'WHOLE_CHURCH']),
  restrictedToRoles: z.array(UserRoleSchema).optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Event = z.infer<typeof EventSchema>;

// RSVP entity
export const RSVPSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  userId: z.string(),
  status: z.enum(['ATTENDING', 'WAITLISTED', 'CANCELLED']),
  rsvpedAt: z.string(),
  isPaid: z.boolean(),
  notes: z.string().optional(),
});

export type RSVP = z.infer<typeof RSVPSchema>;

// Life Group entity
export const LifeGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  leaderId: z.string(),
  leaderName: z.string(),
  maxMembers: z.number().int().min(1).optional(),
  currentMembers: z.number().int().min(0),
  meetingDay: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']).optional(),
  meetingTime: z.string().optional(),
  location: z.string().optional(),
  churchId: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type LifeGroup = z.infer<typeof LifeGroupSchema>;

// Life Group Membership entity
export const LifeGroupMembershipSchema = z.object({
  id: z.string(),
  lifeGroupId: z.string(),
  userId: z.string(),
  status: z.enum(['PENDING', 'ACTIVE', 'INACTIVE']),
  joinedAt: z.string(),
  role: z.enum(['MEMBER', 'CO_LEADER', 'LEADER']).default('MEMBER'),
});

export type LifeGroupMembership = z.infer<typeof LifeGroupMembershipSchema>;

// Discipleship Pathway entity
export const PathwaySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['ROOTS', 'VINES', 'RETREAT']),
  isRequired: z.boolean(),
  order: z.number().int(),
  estimatedDuration: z.string().optional(),
  churchId: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Pathway = z.infer<typeof PathwaySchema>;

// Pathway Step entity
export const PathwayStepSchema = z.object({
  id: z.string(),
  pathwayId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  order: z.number().int(),
  isRequired: z.boolean(),
  estimatedDuration: z.string().optional(),
  resources: z.array(z.string()).optional(),
  isActive: z.boolean(),
});

export type PathwayStep = z.infer<typeof PathwayStepSchema>;

// Pathway Progress entity
export const PathwayProgressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  pathwayId: z.string(),
  status: z.enum(['ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'DROPPED']),
  enrolledAt: z.string(),
  completedAt: z.string().optional(),
  progressPercentage: z.number().min(0).max(100),
  currentStep: z.string().optional(),
  completedSteps: z.array(z.string()),
});

export type PathwayProgress = z.infer<typeof PathwayProgressSchema>;

// Member entity (simplified for mobile)
export const MemberSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  profileImage: z.string().optional(),
  roles: z.array(UserRoleSchema),
  churchId: z.string(),
  churchName: z.string(),
  isActive: z.boolean(),
  joinDate: z.string().optional(),
  // Privacy-aware fields (only shown based on permissions)
  phone: z.string().optional(),
  address: z.string().optional(),
  birthDate: z.string().optional(),
});

export type Member = z.infer<typeof MemberSchema>;

// Notification entity
export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.enum(['INFO', 'WARNING', 'SUCCESS', 'ERROR', 'EVENT', 'ANNOUNCEMENT']),
  category: z.string().optional(),
  isRead: z.boolean(),
  actionUrl: z.string().optional(),
  expiresAt: z.string().optional(),
  createdAt: z.string(),
  readAt: z.string().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;