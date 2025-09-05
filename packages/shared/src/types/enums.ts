// Shared enums that match the Prisma schema
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PASTOR = 'PASTOR',
  ADMIN = 'ADMIN',
  VIP = 'VIP',
  LEADER = 'LEADER',
  MEMBER = 'MEMBER',
}

export enum ProfileVisibility {
  PUBLIC = 'PUBLIC',
  MEMBERS = 'MEMBERS',
  LEADERS = 'LEADERS',
  PRIVATE = 'PRIVATE',
}

export enum BelieverStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  COMPLETED = 'COMPLETED',
}

export enum MemberStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum MembershipStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LEFT = 'LEFT',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum EventScope {
  LOCAL_CHURCH = 'LOCAL_CHURCH',
  WHOLE_CHURCH = 'WHOLE_CHURCH',
}

export enum RsvpStatus {
  GOING = 'GOING',
  WAITLIST = 'WAITLIST',
  CANCELLED = 'CANCELLED',
}

export enum PathwayType {
  ROOTS = 'ROOTS',
  VINES = 'VINES',
  RETREAT = 'RETREAT',
}

export enum EnrollmentStatus {
  ENROLLED = 'ENROLLED',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
}

export enum AnnouncementScope {
  PUBLIC = 'PUBLIC',
  MEMBERS = 'MEMBERS',
  LEADERS = 'LEADERS',
  ADMINS = 'ADMINS',
}

export enum AnnouncementPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}