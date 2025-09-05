import { z } from 'zod';
import { UserRole, EventScope, RsvpStatus, PathwayType, AnnouncementScope, AnnouncementPriority } from '../types/enums';
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const TokenRequestSchema: z.ZodObject<{
    sessionToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionToken: string;
}, {
    sessionToken: string;
}>;
export declare const CreateUserSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodString;
    role: z.ZodNativeEnum<typeof UserRole>;
    phone: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    zipCode: z.ZodOptional<z.ZodString>;
    emergencyContact: z.ZodOptional<z.ZodString>;
    emergencyPhone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    role: UserRole;
    phone?: string | undefined;
    bio?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    zipCode?: string | undefined;
    emergencyContact?: string | undefined;
    emergencyPhone?: string | undefined;
}, {
    email: string;
    name: string;
    role: UserRole;
    phone?: string | undefined;
    bio?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    zipCode?: string | undefined;
    emergencyContact?: string | undefined;
    emergencyPhone?: string | undefined;
}>;
export declare const UpdateUserSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodNativeEnum<typeof UserRole>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    bio: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    dateOfBirth: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    city: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    zipCode: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    emergencyContact: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    emergencyPhone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    name?: string | undefined;
    role?: UserRole | undefined;
    phone?: string | undefined;
    bio?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    zipCode?: string | undefined;
    emergencyContact?: string | undefined;
    emergencyPhone?: string | undefined;
}, {
    email?: string | undefined;
    name?: string | undefined;
    role?: UserRole | undefined;
    phone?: string | undefined;
    bio?: string | undefined;
    dateOfBirth?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    zipCode?: string | undefined;
    emergencyContact?: string | undefined;
    emergencyPhone?: string | undefined;
}>;
export declare const CreateCheckinSchema: z.ZodObject<{
    serviceId: z.ZodString;
    isNewBeliever: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    serviceId: string;
    isNewBeliever: boolean;
}, {
    serviceId: string;
    isNewBeliever?: boolean | undefined;
}>;
export declare const QrValidationSchema: z.ZodObject<{
    qrData: z.ZodString;
}, "strip", z.ZodTypeAny, {
    qrData: string;
}, {
    qrData: string;
}>;
export declare const CreateEventSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    startDate: z.ZodString;
    endDate: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    capacity: z.ZodOptional<z.ZodNumber>;
    fee: z.ZodOptional<z.ZodNumber>;
    scope: z.ZodNativeEnum<typeof EventScope>;
    restrictedRoles: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof UserRole>, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    startDate: string;
    scope: EventScope;
    description?: string | undefined;
    endDate?: string | undefined;
    location?: string | undefined;
    capacity?: number | undefined;
    fee?: number | undefined;
    restrictedRoles?: UserRole[] | undefined;
}, {
    title: string;
    startDate: string;
    scope: EventScope;
    description?: string | undefined;
    endDate?: string | undefined;
    location?: string | undefined;
    capacity?: number | undefined;
    fee?: number | undefined;
    restrictedRoles?: UserRole[] | undefined;
}>;
export declare const UpdateEventSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    location: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    capacity: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    fee: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    scope: z.ZodOptional<z.ZodNativeEnum<typeof EventScope>>;
    restrictedRoles: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof UserRole>, "many">>>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    description?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    location?: string | undefined;
    capacity?: number | undefined;
    fee?: number | undefined;
    scope?: EventScope | undefined;
    restrictedRoles?: UserRole[] | undefined;
}, {
    title?: string | undefined;
    description?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    location?: string | undefined;
    capacity?: number | undefined;
    fee?: number | undefined;
    scope?: EventScope | undefined;
    restrictedRoles?: UserRole[] | undefined;
}>;
export declare const CreateRsvpSchema: z.ZodObject<{
    eventId: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    eventId: string;
    notes?: string | undefined;
}, {
    eventId: string;
    notes?: string | undefined;
}>;
export declare const UpdateRsvpSchema: z.ZodObject<{
    status: z.ZodNativeEnum<typeof RsvpStatus>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: RsvpStatus;
    notes?: string | undefined;
}, {
    status: RsvpStatus;
    notes?: string | undefined;
}>;
export declare const CreateLifeGroupSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    capacity: z.ZodNumber;
    leaderId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    capacity: number;
    leaderId: string;
    description?: string | undefined;
}, {
    name: string;
    capacity: number;
    leaderId: string;
    description?: string | undefined;
}>;
export declare const UpdateLifeGroupSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    capacity: z.ZodOptional<z.ZodNumber>;
    leaderId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    capacity?: number | undefined;
    leaderId?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    capacity?: number | undefined;
    leaderId?: string | undefined;
}>;
export declare const CreatePathwaySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodNativeEnum<typeof PathwayType>;
}, "strip", z.ZodTypeAny, {
    type: PathwayType;
    name: string;
    description?: string | undefined;
}, {
    type: PathwayType;
    name: string;
    description?: string | undefined;
}>;
export declare const CreatePathwayStepSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    order: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    title: string;
    order: number;
    description?: string | undefined;
}, {
    title: string;
    order: number;
    description?: string | undefined;
}>;
export declare const CreateAnnouncementSchema: z.ZodObject<{
    title: z.ZodString;
    content: z.ZodString;
    scope: z.ZodNativeEnum<typeof AnnouncementScope>;
    priority: z.ZodDefault<z.ZodNativeEnum<typeof AnnouncementPriority>>;
    expiresAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    scope: AnnouncementScope;
    content: string;
    priority: AnnouncementPriority;
    expiresAt?: string | undefined;
}, {
    title: string;
    scope: AnnouncementScope;
    content: string;
    priority?: AnnouncementPriority | undefined;
    expiresAt?: string | undefined;
}>;
export declare const UpdateAnnouncementSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    scope: z.ZodOptional<z.ZodNativeEnum<typeof AnnouncementScope>>;
    priority: z.ZodOptional<z.ZodDefault<z.ZodNativeEnum<typeof AnnouncementPriority>>>;
    expiresAt: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    scope?: AnnouncementScope | undefined;
    content?: string | undefined;
    priority?: AnnouncementPriority | undefined;
    expiresAt?: string | undefined;
}, {
    title?: string | undefined;
    scope?: AnnouncementScope | undefined;
    content?: string | undefined;
    priority?: AnnouncementPriority | undefined;
    expiresAt?: string | undefined;
}>;
export declare const RegisterDeviceSchema: z.ZodObject<{
    deviceId: z.ZodString;
    platform: z.ZodEnum<["ios", "android"]>;
    pushToken: z.ZodOptional<z.ZodString>;
    appVersion: z.ZodString;
    osVersion: z.ZodString;
}, "strip", z.ZodTypeAny, {
    deviceId: string;
    platform: "ios" | "android";
    appVersion: string;
    osVersion: string;
    pushToken?: string | undefined;
}, {
    deviceId: string;
    platform: "ios" | "android";
    appVersion: string;
    osVersion: string;
    pushToken?: string | undefined;
}>;
export declare const NotificationPreferencesSchema: z.ZodObject<{
    general: z.ZodDefault<z.ZodBoolean>;
    prayerRequests: z.ZodDefault<z.ZodBoolean>;
    announcements: z.ZodDefault<z.ZodBoolean>;
    events: z.ZodDefault<z.ZodBoolean>;
    pathways: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    general: boolean;
    prayerRequests: boolean;
    announcements: boolean;
    events: boolean;
    pathways: boolean;
}, {
    general?: boolean | undefined;
    prayerRequests?: boolean | undefined;
    announcements?: boolean | undefined;
    events?: boolean | undefined;
    pathways?: boolean | undefined;
}>;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    sortBy?: string | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const SyncRequestSchema: z.ZodObject<{
    lastSync: z.ZodOptional<z.ZodString>;
    entities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    lastSync?: string | undefined;
    entities?: string[] | undefined;
}, {
    lastSync?: string | undefined;
    entities?: string[] | undefined;
}>;
export declare const IdempotencySchema: z.ZodObject<{
    'idempotency-key': z.ZodString;
}, "strip", z.ZodTypeAny, {
    'idempotency-key': string;
}, {
    'idempotency-key': string;
}>;
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
