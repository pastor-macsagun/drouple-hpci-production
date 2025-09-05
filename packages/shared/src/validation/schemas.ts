import { z } from 'zod';
import { UserRole, EventScope, RsvpStatus, PathwayType, AnnouncementScope, AnnouncementPriority } from '../types/enums';

// Auth schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const TokenRequestSchema = z.object({
  sessionToken: z.string().min(1, 'Session token is required'),
});

// User schemas
export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio too long').optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial();

// Checkin schemas
export const CreateCheckinSchema = z.object({
  serviceId: z.string().cuid('Invalid service ID'),
  isNewBeliever: z.boolean().default(false),
});

export const QrValidationSchema = z.object({
  qrData: z.string().min(1, 'QR data is required'),
});

// Event schemas
export const CreateEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date').optional(),
  location: z.string().max(200, 'Location too long').optional(),
  capacity: z.number().int().positive('Capacity must be positive').optional(),
  fee: z.number().nonnegative('Fee must be non-negative').optional(),
  scope: z.nativeEnum(EventScope),
  restrictedRoles: z.array(z.nativeEnum(UserRole)).optional(),
});

export const UpdateEventSchema = CreateEventSchema.partial();

export const CreateRsvpSchema = z.object({
  eventId: z.string().cuid('Invalid event ID'),
  notes: z.string().max(500, 'Notes too long').optional(),
});

export const UpdateRsvpSchema = z.object({
  status: z.nativeEnum(RsvpStatus),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Life Group schemas
export const CreateLifeGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  capacity: z.number().int().positive('Capacity must be positive'),
  leaderId: z.string().cuid('Invalid leader ID'),
});

export const UpdateLifeGroupSchema = CreateLifeGroupSchema.partial();

// Pathway schemas
export const CreatePathwaySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  type: z.nativeEnum(PathwayType),
});

export const CreatePathwayStepSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  order: z.number().int().nonnegative('Order must be non-negative'),
});

// Announcement schemas
export const CreateAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
  scope: z.nativeEnum(AnnouncementScope),
  priority: z.nativeEnum(AnnouncementPriority).default(AnnouncementPriority.NORMAL),
  expiresAt: z.string().datetime('Invalid expiration date').optional(),
});

export const UpdateAnnouncementSchema = CreateAnnouncementSchema.partial();

// Notification schemas
export const RegisterDeviceSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
  platform: z.enum(['ios', 'android'], { message: 'Platform must be ios or android' }),
  pushToken: z.string().optional(),
  appVersion: z.string().min(1, 'App version is required'),
  osVersion: z.string().min(1, 'OS version is required'),
});

export const NotificationPreferencesSchema = z.object({
  general: z.boolean().default(true),
  prayerRequests: z.boolean().default(true),
  announcements: z.boolean().default(true),
  events: z.boolean().default(true),
  pathways: z.boolean().default(true),
});

// Pagination schemas
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Sync schemas
export const SyncRequestSchema = z.object({
  lastSync: z.string().datetime().optional(),
  entities: z.array(z.string()).optional(),
});

// Idempotency schema
export const IdempotencySchema = z.object({
  'idempotency-key': z.string().uuid('Invalid idempotency key'),
});

// Export schema types
export type LoginData = z.infer<typeof LoginSchema>;
export type TokenRequestData = z.infer<typeof TokenRequestSchema>;
export type CreateUserData = z.infer<typeof CreateUserSchema>;
export type UpdateUserData = z.infer<typeof UpdateUserSchema>;
export type CreateCheckinData = z.infer<typeof CreateCheckinSchema>;
export type QrValidationData = z.infer<typeof QrValidationSchema>;
export type CreateEventData = z.infer<typeof CreateEventSchema>;
export type UpdateEventData = z.infer<typeof UpdateEventSchema>;
export type CreateRsvpData = z.infer<typeof CreateRsvpSchema>;
export type UpdateRsvpData = z.infer<typeof UpdateRsvpSchema>;
export type CreateLifeGroupData = z.infer<typeof CreateLifeGroupSchema>;
export type UpdateLifeGroupData = z.infer<typeof UpdateLifeGroupSchema>;
export type CreatePathwayData = z.infer<typeof CreatePathwaySchema>;
export type CreatePathwayStepData = z.infer<typeof CreatePathwayStepSchema>;
export type CreateAnnouncementData = z.infer<typeof CreateAnnouncementSchema>;
export type UpdateAnnouncementData = z.infer<typeof UpdateAnnouncementSchema>;
export type RegisterDeviceData = z.infer<typeof RegisterDeviceSchema>;
export type NotificationPreferencesData = z.infer<typeof NotificationPreferencesSchema>;
export type PaginationData = z.infer<typeof PaginationSchema>;
export type SyncRequestData = z.infer<typeof SyncRequestSchema>;