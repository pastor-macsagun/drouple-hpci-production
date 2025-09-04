/**
 * Mock Data Fixtures
 * Realistic test data for all app entities
 */

import { User, Service, Event, Member } from '../../types';

export const mockUsers = {
  superAdmin: {
    id: 'user-super-admin',
    email: 'superadmin@drouple.com',
    name: 'Super Admin',
    role: 'SUPER_ADMIN',
    tenantId: null,
    churchId: null,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  } as User,

  churchAdmin: {
    id: 'user-church-admin',
    email: 'admin@manila.drouple.com',
    name: 'Church Admin Manila',
    role: 'CHURCH_ADMIN',
    tenantId: 'tenant-hpci',
    churchId: 'church-manila',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  } as User,

  vip: {
    id: 'user-vip',
    email: 'vip@manila.drouple.com',
    name: 'VIP Team Member',
    role: 'VIP',
    tenantId: 'tenant-hpci',
    churchId: 'church-manila',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  } as User,

  leader: {
    id: 'user-leader',
    email: 'leader@manila.drouple.com',
    name: 'Life Group Leader',
    role: 'LEADER',
    tenantId: 'tenant-hpci',
    churchId: 'church-manila',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  } as User,

  member: {
    id: 'user-member',
    email: 'member@manila.drouple.com',
    name: 'Church Member',
    role: 'MEMBER',
    tenantId: 'tenant-hpci',
    churchId: 'church-manila',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  } as User,
};

export const mockServices = [
  {
    id: 'service-sunday-1',
    name: 'Sunday Service',
    churchId: 'church-manila',
    date: new Date().toISOString(),
    time: '09:00',
    isActive: true,
    attendanceCount: 125,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'service-sunday-2',
    name: 'Sunday Service 2nd',
    churchId: 'church-manila',
    date: new Date().toISOString(),
    time: '11:00',
    isActive: true,
    attendanceCount: 98,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
] as Service[];

export const mockEvents = [
  {
    id: 'event-youth-night',
    title: 'Youth Night',
    description: 'Monthly youth gathering',
    churchId: 'church-manila',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    time: '19:00',
    location: 'Main Auditorium',
    capacity: 100,
    attendeeCount: 45,
    waitlistCount: 5,
    fee: 0,
    requiresRSVP: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'event-conference-2024',
    title: 'Annual Conference 2024',
    description: 'Annual church conference with guest speakers',
    churchId: 'church-manila',
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    time: '08:00',
    location: 'Convention Center',
    capacity: 500,
    attendeeCount: 234,
    waitlistCount: 12,
    fee: 1500,
    requiresRSVP: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
] as Event[];

export const mockMembers = [
  {
    id: 'member-john',
    email: 'john@example.com',
    name: 'John Doe',
    phone: '+639123456789',
    role: 'MEMBER',
    churchId: 'church-manila',
    lifeGroupId: 'group-youth',
    isActive: true,
    joinedAt: '2023-06-15T00:00:00Z',
    createdAt: '2023-06-15T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'member-jane',
    email: 'jane@example.com',
    name: 'Jane Smith',
    phone: '+639123456788',
    role: 'MEMBER',
    churchId: 'church-manila',
    lifeGroupId: 'group-adults',
    isActive: true,
    joinedAt: '2023-03-10T00:00:00Z',
    createdAt: '2023-03-10T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
] as Member[];

export const mockPathways = [
  {
    id: 'pathway-roots',
    name: 'ROOTS - Foundation',
    description: 'Basic discipleship pathway for new believers',
    type: 'ROOTS',
    steps: [
      {
        id: 'step-salvation',
        title: 'Salvation',
        description: 'Understanding salvation through Jesus Christ',
        order: 1,
        isCompleted: true,
        completedAt: '2024-01-15T00:00:00Z',
      },
      {
        id: 'step-baptism',
        title: 'Water Baptism',
        description: 'Public declaration of faith',
        order: 2,
        isCompleted: false,
        completedAt: null,
      },
    ],
    progress: 50,
    isActive: true,
    enrolledAt: '2024-01-01T00:00:00Z',
  },
];

export const mockGroups = [
  {
    id: 'group-youth',
    name: 'Youth Life Group',
    description: 'Life group for young adults (18-25)',
    leaderId: 'user-leader',
    churchId: 'church-manila',
    capacity: 15,
    memberCount: 8,
    meetingDay: 'Friday',
    meetingTime: '19:00',
    location: 'Youth Room',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'group-adults',
    name: 'Adult Life Group',
    description: 'Life group for adults (26+)',
    leaderId: 'user-leader',
    churchId: 'church-manila',
    capacity: 20,
    memberCount: 12,
    meetingDay: 'Thursday',
    meetingTime: '19:30',
    location: 'Conference Room',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

export const mockReports = {
  attendance: {
    totalAttendance: 450,
    growthRate: 5.2,
    averagePerService: 225,
    trends: [
      { date: '2024-01-01', count: 200 },
      { date: '2024-01-08', count: 215 },
      { date: '2024-01-15', count: 230 },
      { date: '2024-01-22', count: 225 },
      { date: '2024-01-29', count: 235 },
    ],
  },
  membership: {
    totalMembers: 890,
    activeMembers: 845,
    newMembersThisMonth: 12,
    retentionRate: 94.8,
  },
  events: {
    totalEvents: 24,
    upcomingEvents: 8,
    averageAttendance: 75,
    rsvpRate: 85.5,
  },
};

// Mock notifications
export const mockNotifications = [
  {
    id: 'notif-1',
    title: 'Sunday Service Reminder',
    body: "Don't forget about Sunday service at 9:00 AM!",
    type: 'service_reminder',
    data: { serviceId: 'service-sunday-1' },
    isRead: false,
    receivedAt: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    title: 'New Event: Youth Night',
    body: 'Join us for an exciting youth gathering!',
    type: 'event_announcement',
    data: { eventId: 'event-youth-night' },
    isRead: true,
    receivedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Export utility functions for testing
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  ...mockUsers.member,
  ...overrides,
});

export const createMockService = (
  overrides: Partial<Service> = {}
): Service => ({
  ...mockServices[0],
  ...overrides,
});

export const createMockEvent = (overrides: Partial<Event> = {}): Event => ({
  ...mockEvents[0],
  ...overrides,
});

export const createMockMember = (overrides: Partial<Member> = {}): Member => ({
  ...mockMembers[0],
  ...overrides,
});
