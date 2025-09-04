/**
 * Mock Data for Check-In System
 * Used for offline testing and development
 */

export interface MockMember {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'CHURCH_ADMIN' | 'VIP' | 'LEADER' | 'MEMBER';
  church: string;
  isActive: boolean;
  joinedDate: string;
}

export interface MockService {
  id: string;
  name: string;
  date: string;
  time: string;
  church: string;
  status: 'ACTIVE' | 'UPCOMING' | 'CLOSED';
  attendeeCount: number;
  capacity: number;
}

export interface MockCheckIn {
  id: string;
  memberId: string;
  serviceId: string;
  checkInTime: string;
  isNewBeliever: boolean;
}

export const mockMembers: MockMember[] = [
  {
    id: 'member_1',
    name: 'John Dela Cruz',
    email: 'john.delacruz@test.com',
    role: 'MEMBER',
    church: 'HPCI Manila',
    isActive: true,
    joinedDate: '2023-01-15',
  },
  {
    id: 'member_2',
    name: 'Maria Santos',
    email: 'maria.santos@test.com',
    role: 'LEADER',
    church: 'HPCI Manila',
    isActive: true,
    joinedDate: '2022-06-10',
  },
  {
    id: 'member_3',
    name: 'Carlos Reyes',
    email: 'carlos.reyes@test.com',
    role: 'MEMBER',
    church: 'HPCI Cebu',
    isActive: true,
    joinedDate: '2023-03-20',
  },
  {
    id: 'member_4',
    name: 'Ana Garcia',
    email: 'ana.garcia@test.com',
    role: 'VIP',
    church: 'HPCI Manila',
    isActive: true,
    joinedDate: '2021-11-05',
  },
  {
    id: 'member_5',
    name: 'Robert Tan',
    email: 'robert.tan@test.com',
    role: 'MEMBER',
    church: 'HPCI Manila',
    isActive: true,
    joinedDate: '2023-08-12',
  },
  {
    id: 'member_6',
    name: 'Catherine Lim',
    email: 'catherine.lim@test.com',
    role: 'MEMBER',
    church: 'HPCI Cebu',
    isActive: true,
    joinedDate: '2023-05-18',
  },
  {
    id: 'member_7',
    name: 'Michael Torres',
    email: 'michael.torres@test.com',
    role: 'LEADER',
    church: 'HPCI Manila',
    isActive: true,
    joinedDate: '2022-09-03',
  },
  {
    id: 'member_8',
    name: 'Lisa Cruz',
    email: 'lisa.cruz@test.com',
    role: 'MEMBER',
    church: 'HPCI Manila',
    isActive: true,
    joinedDate: '2023-12-01',
  },
  {
    id: 'member_9',
    name: 'David Kim',
    email: 'david.kim@test.com',
    role: 'MEMBER',
    church: 'HPCI Cebu',
    isActive: false,
    joinedDate: '2023-02-14',
  },
  {
    id: 'member_10',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@test.com',
    role: 'CHURCH_ADMIN',
    church: 'HPCI Manila',
    isActive: true,
    joinedDate: '2020-12-10',
  },
];

export const mockServices: MockService[] = [
  {
    id: 'service_1',
    name: 'Sunday Morning Service',
    date: '2025-01-05',
    time: '09:00 AM',
    church: 'HPCI Manila',
    status: 'ACTIVE',
    attendeeCount: 142,
    capacity: 200,
  },
  {
    id: 'service_2',
    name: 'Sunday Evening Service',
    date: '2025-01-05',
    time: '06:00 PM',
    church: 'HPCI Manila',
    status: 'UPCOMING',
    attendeeCount: 0,
    capacity: 150,
  },
  {
    id: 'service_3',
    name: 'Sunday Morning Service',
    date: '2025-01-05',
    time: '10:00 AM',
    church: 'HPCI Cebu',
    status: 'ACTIVE',
    attendeeCount: 89,
    capacity: 120,
  },
  {
    id: 'service_4',
    name: 'Wednesday Bible Study',
    date: '2025-01-08',
    time: '07:00 PM',
    church: 'HPCI Manila',
    status: 'UPCOMING',
    attendeeCount: 0,
    capacity: 80,
  },
  {
    id: 'service_5',
    name: 'Sunday Morning Service',
    date: '2024-12-29',
    time: '09:00 AM',
    church: 'HPCI Manila',
    status: 'CLOSED',
    attendeeCount: 187,
    capacity: 200,
  },
];

export const mockCheckIns: MockCheckIn[] = [
  {
    id: 'checkin_1',
    memberId: 'member_1',
    serviceId: 'service_1',
    checkInTime: '2025-01-05T08:45:00Z',
    isNewBeliever: false,
  },
  {
    id: 'checkin_2',
    memberId: 'member_2',
    serviceId: 'service_1',
    checkInTime: '2025-01-05T08:30:00Z',
    isNewBeliever: false,
  },
  {
    id: 'checkin_3',
    memberId: 'member_3',
    serviceId: 'service_3',
    checkInTime: '2025-01-05T09:45:00Z',
    isNewBeliever: true,
  },
];

// Helper functions
export const getMemberById = (id: string): MockMember | undefined => {
  return mockMembers.find(member => member.id === id);
};

export const getServiceById = (id: string): MockService | undefined => {
  return mockServices.find(service => service.id === id);
};

export const searchMembers = (query: string): MockMember[] => {
  if (!query.trim()) return [];

  const lowercaseQuery = query.toLowerCase();
  return mockMembers.filter(
    member =>
      member.name.toLowerCase().includes(lowercaseQuery) ||
      member.email.toLowerCase().includes(lowercaseQuery)
  );
};

export const getActiveServices = (): MockService[] => {
  return mockServices.filter(service => service.status === 'ACTIVE');
};

export const getUpcomingServices = (): MockService[] => {
  return mockServices.filter(service => service.status === 'UPCOMING');
};

export const getAllServices = (): MockService[] => {
  return mockServices.filter(service => service.status !== 'CLOSED');
};

export const isCheckedIn = (memberId: string, serviceId: string): boolean => {
  return mockCheckIns.some(
    checkIn => checkIn.memberId === memberId && checkIn.serviceId === serviceId
  );
};

export const getServiceStatus = (
  service: MockService
): {
  color: string;
  text: string;
  icon: string;
} => {
  switch (service.status) {
    case 'ACTIVE':
      return {
        color: '#006e1c', // Success green
        text: 'Check-In Open',
        icon: 'check-circle',
      };
    case 'UPCOMING':
      return {
        color: '#ff8f00', // Warning orange
        text: 'Starts Soon',
        icon: 'clock',
      };
    case 'CLOSED':
      return {
        color: '#79747e', // Neutral gray
        text: 'Check-In Closed',
        icon: 'close-circle',
      };
    default:
      return {
        color: '#79747e',
        text: 'Unknown',
        icon: 'help-circle',
      };
  }
};

export const getRoleColor = (role: MockMember['role']): string => {
  switch (role) {
    case 'SUPER_ADMIN':
      return '#6750a4'; // Purple
    case 'CHURCH_ADMIN':
      return '#1e7ce8'; // Primary blue
    case 'VIP':
      return '#e5c453'; // Secondary gold
    case 'LEADER':
      return '#006e1c'; // Success green
    case 'MEMBER':
      return '#49454f'; // Neutral
    default:
      return '#49454f';
  }
};

// ==================== EVENTS DATA ====================

export interface MockEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date string
  time: string;
  location: string;
  church: string;
  category: 'WORSHIP' | 'FELLOWSHIP' | 'OUTREACH' | 'TRAINING' | 'SPECIAL';
  capacity: number;
  currentAttendees: number;
  fee?: number; // Optional fee in PHP
  imageUrl?: string;
  requiresRSVP: boolean;
  rsvpDeadline?: string; // ISO date string
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  createdBy: string; // Member ID
  createdAt: string;
  visibility: 'PUBLIC' | 'MEMBERS_ONLY' | 'LEADERS_ONLY';
}

export interface MockRSVP {
  id: string;
  eventId: string;
  memberId: string;
  status: 'CONFIRMED' | 'WAITLIST' | 'CANCELLED';
  rsvpDate: string;
  notes?: string;
  hasPaid?: boolean;
}

export const mockEvents: MockEvent[] = [
  {
    id: 'event_1',
    title: 'Sunday Morning Worship',
    description:
      'Join us for our weekly Sunday morning worship service with inspiring message, uplifting music, and fellowship.',
    date: '2025-01-12',
    time: '09:00 AM',
    location: 'Main Sanctuary',
    church: 'HPCI Manila',
    category: 'WORSHIP',
    capacity: 250,
    currentAttendees: 180,
    requiresRSVP: false,
    status: 'UPCOMING',
    createdBy: 'member_10',
    createdAt: '2025-01-01T08:00:00Z',
    visibility: 'PUBLIC',
  },
  {
    id: 'event_2',
    title: 'New Year Youth Night',
    description:
      "An exciting night of worship, games, and fellowship specifically designed for our youth (ages 13-25). Come experience God's love with your peers!",
    date: '2025-01-10',
    time: '07:00 PM',
    location: 'Youth Hall',
    church: 'HPCI Manila',
    category: 'FELLOWSHIP',
    capacity: 80,
    currentAttendees: 65,
    requiresRSVP: true,
    rsvpDeadline: '2025-01-09T18:00:00Z',
    status: 'UPCOMING',
    createdBy: 'member_2',
    createdAt: '2024-12-20T10:00:00Z',
    visibility: 'MEMBERS_ONLY',
  },
  {
    id: 'event_3',
    title: 'Community Outreach - Tondo',
    description:
      "Join our community outreach program as we share God's love through feeding program, medical mission, and evangelism in Tondo area.",
    date: '2025-01-15',
    time: '08:00 AM',
    location: 'Tondo Community Center',
    church: 'HPCI Manila',
    category: 'OUTREACH',
    capacity: 50,
    currentAttendees: 35,
    fee: 200, // PHP 200 for transportation and meals
    requiresRSVP: true,
    rsvpDeadline: '2025-01-13T23:59:59Z',
    status: 'UPCOMING',
    createdBy: 'member_7',
    createdAt: '2024-12-15T14:00:00Z',
    visibility: 'MEMBERS_ONLY',
  },
  {
    id: 'event_4',
    title: 'Leadership Training Seminar',
    description:
      'A comprehensive training for current and aspiring ministry leaders. Topics include biblical leadership, team management, and spiritual development.',
    date: '2025-01-18',
    time: '02:00 PM',
    location: 'Conference Room A',
    church: 'HPCI Manila',
    category: 'TRAINING',
    capacity: 30,
    currentAttendees: 28,
    fee: 500, // PHP 500 for materials and snacks
    requiresRSVP: true,
    rsvpDeadline: '2025-01-16T12:00:00Z',
    status: 'UPCOMING',
    createdBy: 'member_10',
    createdAt: '2024-12-10T09:00:00Z',
    visibility: 'LEADERS_ONLY',
  },
  {
    id: 'event_5',
    title: 'Family Fun Day',
    description:
      'A day of fun activities for the whole family! Games, food, prizes, and fellowship for all ages. Bring your family and friends!',
    date: '2025-01-25',
    time: '10:00 AM',
    location: 'Church Grounds',
    church: 'HPCI Manila',
    category: 'FELLOWSHIP',
    capacity: 200,
    currentAttendees: 45,
    fee: 150, // PHP 150 per person for food and activities
    requiresRSVP: true,
    rsvpDeadline: '2025-01-23T18:00:00Z',
    status: 'UPCOMING',
    createdBy: 'member_4',
    createdAt: '2025-01-02T11:00:00Z',
    visibility: 'PUBLIC',
  },
  {
    id: 'event_6',
    title: 'Sunday Morning Worship - Cebu',
    description:
      'Sunday morning worship service at our Cebu location with powerful worship and life-changing message.',
    date: '2025-01-12',
    time: '10:30 AM',
    location: 'Main Hall',
    church: 'HPCI Cebu',
    category: 'WORSHIP',
    capacity: 150,
    currentAttendees: 95,
    requiresRSVP: false,
    status: 'UPCOMING',
    createdBy: 'member_3',
    createdAt: '2025-01-01T08:00:00Z',
    visibility: 'PUBLIC',
  },
  {
    id: 'event_7',
    title: 'Christmas Celebration 2024',
    description:
      'A wonderful Christmas celebration with special performances, testimonies, and fellowship meal.',
    date: '2024-12-25',
    time: '06:00 PM',
    location: 'Main Sanctuary',
    church: 'HPCI Manila',
    category: 'SPECIAL',
    capacity: 300,
    currentAttendees: 285,
    requiresRSVP: true,
    status: 'COMPLETED',
    createdBy: 'member_10',
    createdAt: '2024-11-15T10:00:00Z',
    visibility: 'PUBLIC',
  },
  {
    id: 'event_8',
    title: 'Mid-Week Bible Study',
    description:
      "Join us for our weekly Bible study as we dive deeper into God's Word and grow in our faith together.",
    date: '2025-01-08',
    time: '07:30 PM',
    location: 'Fellowship Hall',
    church: 'HPCI Manila',
    category: 'TRAINING',
    capacity: 60,
    currentAttendees: 42,
    requiresRSVP: false,
    status: 'UPCOMING',
    createdBy: 'member_2',
    createdAt: '2024-12-28T15:00:00Z',
    visibility: 'MEMBERS_ONLY',
  },
];

export const mockRSVPs: MockRSVP[] = [
  {
    id: 'rsvp_1',
    eventId: 'event_2',
    memberId: 'member_1',
    status: 'CONFIRMED',
    rsvpDate: '2024-12-22T10:30:00Z',
  },
  {
    id: 'rsvp_2',
    eventId: 'event_2',
    memberId: 'member_5',
    status: 'CONFIRMED',
    rsvpDate: '2024-12-23T14:15:00Z',
  },
  {
    id: 'rsvp_3',
    eventId: 'event_3',
    memberId: 'member_1',
    status: 'CONFIRMED',
    rsvpDate: '2024-12-20T09:45:00Z',
    hasPaid: true,
  },
  {
    id: 'rsvp_4',
    eventId: 'event_3',
    memberId: 'member_7',
    status: 'CONFIRMED',
    rsvpDate: '2024-12-21T16:20:00Z',
    hasPaid: false,
  },
  {
    id: 'rsvp_5',
    eventId: 'event_4',
    memberId: 'member_2',
    status: 'CONFIRMED',
    rsvpDate: '2024-12-12T11:00:00Z',
    hasPaid: true,
  },
  {
    id: 'rsvp_6',
    eventId: 'event_4',
    memberId: 'member_7',
    status: 'WAITLIST',
    rsvpDate: '2024-12-18T13:30:00Z',
    notes: 'Willing to wait for available spot',
  },
  {
    id: 'rsvp_7',
    eventId: 'event_5',
    memberId: 'member_1',
    status: 'CONFIRMED',
    rsvpDate: '2025-01-03T08:15:00Z',
    hasPaid: false,
  },
  {
    id: 'rsvp_8',
    eventId: 'event_7',
    memberId: 'member_1',
    status: 'CONFIRMED',
    rsvpDate: '2024-11-20T12:00:00Z',
  },
  {
    id: 'rsvp_9',
    eventId: 'event_7',
    memberId: 'member_2',
    status: 'CONFIRMED',
    rsvpDate: '2024-11-22T09:30:00Z',
  },
];

// ==================== EVENTS HELPER FUNCTIONS ====================

export const getEventById = (id: string): MockEvent | undefined => {
  return mockEvents.find(event => event.id === id);
};

export const getUpcomingEvents = (): MockEvent[] => {
  return mockEvents
    .filter(event => event.status === 'UPCOMING')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const getEventsByChurch = (church: string): MockEvent[] => {
  return mockEvents
    .filter(event => event.church === church)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const getEventsByCategory = (
  category: MockEvent['category']
): MockEvent[] => {
  return mockEvents
    .filter(event => event.category === category)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const getUserRSVP = (
  eventId: string,
  memberId: string
): MockRSVP | undefined => {
  return mockRSVPs.find(
    rsvp => rsvp.eventId === eventId && rsvp.memberId === memberId
  );
};

export const getEventRSVPs = (eventId: string): MockRSVP[] => {
  return mockRSVPs.filter(rsvp => rsvp.eventId === eventId);
};

export const isEventFull = (event: MockEvent): boolean => {
  return event.currentAttendees >= event.capacity;
};

export const getWaitlistPosition = (
  eventId: string,
  memberId: string
): number | null => {
  const waitlistRSVPs = mockRSVPs
    .filter(rsvp => rsvp.eventId === eventId && rsvp.status === 'WAITLIST')
    .sort(
      (a, b) => new Date(a.rsvpDate).getTime() - new Date(b.rsvpDate).getTime()
    );

  const position = waitlistRSVPs.findIndex(rsvp => rsvp.memberId === memberId);
  return position !== -1 ? position + 1 : null;
};

export const canUserRSVP = (
  event: MockEvent,
  userRole: MockMember['role']
): boolean => {
  // Check visibility permissions
  if (event.visibility === 'LEADERS_ONLY') {
    return ['SUPER_ADMIN', 'CHURCH_ADMIN', 'VIP', 'LEADER'].includes(userRole);
  }

  if (event.visibility === 'MEMBERS_ONLY') {
    return ['SUPER_ADMIN', 'CHURCH_ADMIN', 'VIP', 'LEADER', 'MEMBER'].includes(
      userRole
    );
  }

  // PUBLIC events are open to all
  return true;
};

export const getEventStatus = (
  event: MockEvent
): {
  color: string;
  text: string;
  icon: string;
} => {
  const now = new Date();
  const eventDate = new Date(event.date);

  switch (event.status) {
    case 'UPCOMING':
      if (eventDate < now) {
        return {
          color: '#ff8f00', // Warning orange
          text: 'Starting Soon',
          icon: 'clock',
        };
      }
      return {
        color: '#006e1c', // Success green
        text: 'Open for RSVP',
        icon: 'calendar-check',
      };
    case 'ONGOING':
      return {
        color: '#1e7ce8', // Primary blue
        text: 'In Progress',
        icon: 'play-circle',
      };
    case 'COMPLETED':
      return {
        color: '#79747e', // Neutral gray
        text: 'Completed',
        icon: 'check-circle',
      };
    case 'CANCELLED':
      return {
        color: '#ba1a1a', // Error red
        text: 'Cancelled',
        icon: 'close-circle',
      };
    default:
      return {
        color: '#79747e',
        text: 'Unknown',
        icon: 'help-circle',
      };
  }
};

export const getCategoryIcon = (category: MockEvent['category']): string => {
  switch (category) {
    case 'WORSHIP':
      return 'music';
    case 'FELLOWSHIP':
      return 'account-group';
    case 'OUTREACH':
      return 'hand-heart';
    case 'TRAINING':
      return 'school';
    case 'SPECIAL':
      return 'star';
    default:
      return 'calendar';
  }
};

export const getCategoryColor = (category: MockEvent['category']): string => {
  switch (category) {
    case 'WORSHIP':
      return '#6750a4'; // Purple
    case 'FELLOWSHIP':
      return '#1e7ce8'; // Primary blue
    case 'OUTREACH':
      return '#e5c453'; // Secondary gold
    case 'TRAINING':
      return '#006e1c'; // Success green
    case 'SPECIAL':
      return '#d63384'; // Pink
    default:
      return '#49454f'; // Neutral
  }
};
