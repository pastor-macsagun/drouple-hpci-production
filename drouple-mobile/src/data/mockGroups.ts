/**
 * Mock Life Groups Data
 * Sample life groups for testing group functionality
 */

export interface GroupMember {
  id: string;
  firstName: string;
  lastName: string;
  role: 'leader' | 'co_leader' | 'member';
  joinedAt: string;
  isActive: boolean;
  avatar?: string;
}

export interface GroupSession {
  id: string;
  date: string;
  topic?: string;
  attendees: string[]; // member IDs
  notes?: string;
  createdBy: string;
}

export interface MockLifeGroup {
  id: string;
  name: string;
  description: string;
  category: 'men' | 'women' | 'mixed' | 'youth' | 'seniors' | 'families';
  meetingDay:
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday'
    | 'Sunday';
  meetingTime: string;
  location: string;
  capacity: number;
  currentMembers: number;
  isOpen: boolean;
  leaderId: string;
  coLeaderIds: string[];
  members: GroupMember[];
  joinRequests: Array<{
    id: string;
    userId: string;
    userName: string;
    requestedAt: string;
    status: 'pending' | 'approved' | 'rejected';
    message?: string;
  }>;
  sessions: GroupSession[];
  tags: string[];
  ageRange?: string;
  churchId: string;
  createdAt: string;
  imageUrl?: string;
}

export const MOCK_LIFE_GROUPS: MockLifeGroup[] = [
  {
    id: 'lg-1',
    name: 'Growing in Faith',
    description:
      'A mixed group focused on spiritual growth and biblical foundations for believers of all ages.',
    category: 'mixed',
    meetingDay: 'Wednesday',
    meetingTime: '7:00 PM',
    location: 'Church Fellowship Hall',
    capacity: 12,
    currentMembers: 8,
    isOpen: true,
    leaderId: 'member-1',
    coLeaderIds: ['member-2'],
    churchId: 'hpci-manila',
    createdAt: '2023-01-15',
    tags: ['bible study', 'spiritual growth', 'fellowship'],
    ageRange: '18+',
    members: [
      {
        id: 'member-1',
        firstName: 'John',
        lastName: 'Smith',
        role: 'leader',
        joinedAt: '2023-01-15',
        isActive: true,
      },
      {
        id: 'member-2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'co_leader',
        joinedAt: '2023-01-20',
        isActive: true,
      },
      {
        id: 'member-5',
        firstName: 'David',
        lastName: 'Wilson',
        role: 'member',
        joinedAt: '2023-06-18',
        isActive: true,
      },
      {
        id: 'member-6',
        firstName: 'Jessica',
        lastName: 'Miller',
        role: 'member',
        joinedAt: '2023-02-14',
        isActive: true,
      },
    ],
    joinRequests: [
      {
        id: 'req-1',
        userId: 'member-9',
        userName: 'James Taylor',
        requestedAt: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
        status: 'pending',
        message:
          "Hi! I'd love to join this group to grow spiritually alongside others.",
      },
    ],
    sessions: [
      {
        id: 'session-1',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        topic: 'Faith and Trust in God',
        attendees: ['member-1', 'member-2', 'member-5', 'member-6'],
        notes: 'Great discussion about trusting God in difficult times.',
        createdBy: 'member-1',
      },
      {
        id: 'session-2',
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        topic: 'Prayer Life',
        attendees: ['member-1', 'member-2', 'member-5'],
        notes: 'Shared prayer requests and prayed together.',
        createdBy: 'member-1',
      },
    ],
  },
  {
    id: 'lg-2',
    name: 'Men of Purpose',
    description:
      'Men supporting each other in their walk with Christ, discussing real-life challenges and victories.',
    category: 'men',
    meetingDay: 'Saturday',
    meetingTime: '8:00 AM',
    location: 'Conference Room A',
    capacity: 10,
    currentMembers: 6,
    isOpen: true,
    leaderId: 'member-7',
    coLeaderIds: [],
    churchId: 'hpci-manila',
    createdAt: '2022-09-10',
    tags: ['men', 'accountability', 'discipleship'],
    ageRange: '25+',
    members: [
      {
        id: 'member-7',
        firstName: 'Robert',
        lastName: 'Garcia',
        role: 'leader',
        joinedAt: '2022-09-10',
        isActive: true,
      },
    ],
    joinRequests: [],
    sessions: [
      {
        id: 'session-3',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        topic: 'Leading Your Family',
        attendees: ['member-7'],
        notes: 'Discussed biblical principles of family leadership.',
        createdBy: 'member-7',
      },
    ],
  },
  {
    id: 'lg-3',
    name: 'Young Adults Connect',
    description:
      'Young adults navigating life, career, and faith together in a supportive community.',
    category: 'youth',
    meetingDay: 'Friday',
    meetingTime: '7:30 PM',
    location: 'Youth Hall',
    capacity: 15,
    currentMembers: 12,
    isOpen: true,
    leaderId: 'member-3',
    coLeaderIds: ['member-9'],
    churchId: 'hpci-manila',
    createdAt: '2023-03-20',
    tags: ['young adults', 'career', 'relationships', 'purpose'],
    ageRange: '18-30',
    members: [
      {
        id: 'member-3',
        firstName: 'Michael',
        lastName: 'Brown',
        role: 'leader',
        joinedAt: '2023-03-20',
        isActive: true,
      },
      {
        id: 'member-9',
        firstName: 'James',
        lastName: 'Taylor',
        role: 'co_leader',
        joinedAt: '2023-05-08',
        isActive: true,
      },
    ],
    joinRequests: [],
    sessions: [
      {
        id: 'session-4',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        topic: 'Finding Your Purpose',
        attendees: ['member-3', 'member-9'],
        notes: 'Explored how God uses our gifts and passions for His kingdom.',
        createdBy: 'member-3',
      },
    ],
  },
  {
    id: 'lg-4',
    name: 'Women of Grace',
    description:
      "Women encouraging one another through life's seasons with prayer, fellowship, and biblical wisdom.",
    category: 'women',
    meetingDay: 'Tuesday',
    meetingTime: '10:00 AM',
    location: "Women's Ministry Room",
    capacity: 8,
    currentMembers: 8,
    isOpen: false, // Full group
    leaderId: 'member-4',
    coLeaderIds: ['member-10'],
    churchId: 'hpci-manila',
    createdAt: '2022-08-05',
    tags: ['women', 'prayer', 'encouragement', 'biblical wisdom'],
    ageRange: '25+',
    members: [
      {
        id: 'member-4',
        firstName: 'Emily',
        lastName: 'Davis',
        role: 'leader',
        joinedAt: '2022-08-05',
        isActive: true,
      },
      {
        id: 'member-10',
        firstName: 'Amanda',
        lastName: 'Thomas',
        role: 'co_leader',
        joinedAt: '2021-12-01',
        isActive: true,
      },
      {
        id: 'member-8',
        firstName: 'Lisa',
        lastName: 'Anderson',
        role: 'member',
        joinedAt: '2022-09-12',
        isActive: true,
      },
    ],
    joinRequests: [
      {
        id: 'req-2',
        userId: 'member-6',
        userName: 'Jessica Miller',
        requestedAt: new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
        status: 'pending',
        message:
          'Would love to be part of this group for fellowship and prayer support.',
      },
    ],
    sessions: [
      {
        id: 'session-5',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        topic: 'Proverbs 31 Woman',
        attendees: ['member-4', 'member-10', 'member-8'],
        notes: 'Studied the characteristics of a godly woman.',
        createdBy: 'member-4',
      },
    ],
  },
  {
    id: 'lg-5',
    name: 'Family Life',
    description:
      'Families growing together in faith, sharing parenting wisdom and supporting each other.',
    category: 'families',
    meetingDay: 'Sunday',
    meetingTime: '2:00 PM',
    location: 'Family Room',
    capacity: 20,
    currentMembers: 14,
    isOpen: true,
    leaderId: 'member-7',
    coLeaderIds: [],
    churchId: 'hpci-cebu',
    createdAt: '2023-02-28',
    tags: ['families', 'parenting', 'children', 'marriage'],
    ageRange: 'All ages',
    members: [
      {
        id: 'member-7',
        firstName: 'Robert',
        lastName: 'Garcia',
        role: 'leader',
        joinedAt: '2023-02-28',
        isActive: true,
      },
      {
        id: 'member-8',
        firstName: 'Lisa',
        lastName: 'Anderson',
        role: 'member',
        joinedAt: '2023-03-15',
        isActive: true,
      },
    ],
    joinRequests: [],
    sessions: [
      {
        id: 'session-6',
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        topic: 'Raising Children in Faith',
        attendees: ['member-7', 'member-8'],
        notes: 'Discussed practical ways to teach children about God.',
        createdBy: 'member-7',
      },
    ],
  },
];

// Helper functions for life groups data
export const getLifeGroupById = (id: string): MockLifeGroup | undefined => {
  return MOCK_LIFE_GROUPS.find(group => group.id === id);
};

export const getLifeGroupsByChurch = (churchId: string): MockLifeGroup[] => {
  return MOCK_LIFE_GROUPS.filter(group => group.churchId === churchId);
};

export const getOpenLifeGroups = (churchId?: string): MockLifeGroup[] => {
  const groups = churchId ? getLifeGroupsByChurch(churchId) : MOCK_LIFE_GROUPS;
  return groups.filter(
    group => group.isOpen && group.currentMembers < group.capacity
  );
};

export const getUserJoinedGroups = (userId: string): MockLifeGroup[] => {
  return MOCK_LIFE_GROUPS.filter(group =>
    group.members.some(member => member.id === userId && member.isActive)
  );
};

export const getLifeGroupsByCategory = (
  category: MockLifeGroup['category'],
  churchId?: string
): MockLifeGroup[] => {
  const groups = churchId ? getLifeGroupsByChurch(churchId) : MOCK_LIFE_GROUPS;
  return groups.filter(group => group.category === category);
};

export const searchLifeGroups = (
  query: string,
  churchId?: string
): MockLifeGroup[] => {
  const searchQuery = query.toLowerCase().trim();
  if (!searchQuery)
    return churchId ? getLifeGroupsByChurch(churchId) : MOCK_LIFE_GROUPS;

  const groups = churchId ? getLifeGroupsByChurch(churchId) : MOCK_LIFE_GROUPS;

  return groups.filter(
    group =>
      group.name.toLowerCase().includes(searchQuery) ||
      group.description.toLowerCase().includes(searchQuery) ||
      group.location.toLowerCase().includes(searchQuery) ||
      group.tags.some(tag => tag.toLowerCase().includes(searchQuery))
  );
};

export const getGroupsByMeetingDay = (
  day: MockLifeGroup['meetingDay'],
  churchId?: string
): MockLifeGroup[] => {
  const groups = churchId ? getLifeGroupsByChurch(churchId) : MOCK_LIFE_GROUPS;
  return groups.filter(group => group.meetingDay === day);
};

export const isUserGroupMember = (groupId: string, userId: string): boolean => {
  const group = getLifeGroupById(groupId);
  return (
    group?.members.some(member => member.id === userId && member.isActive) ||
    false
  );
};

export const isUserGroupLeader = (groupId: string, userId: string): boolean => {
  const group = getLifeGroupById(groupId);
  return (
    group?.leaderId === userId || group?.coLeaderIds.includes(userId) || false
  );
};

export const hasUserRequestedToJoin = (
  groupId: string,
  userId: string
): boolean => {
  const group = getLifeGroupById(groupId);
  return (
    group?.joinRequests.some(
      request => request.userId === userId && request.status === 'pending'
    ) || false
  );
};

export const getCategoryIcon = (
  category: MockLifeGroup['category']
): string => {
  switch (category) {
    case 'men':
      return 'account-tie';
    case 'women':
      return 'flower';
    case 'youth':
      return 'school';
    case 'families':
      return 'home-heart';
    case 'seniors':
      return 'account-supervisor';
    case 'mixed':
      return 'account-group';
    default:
      return 'account-group';
  }
};

export const getCategoryColor = (
  category: MockLifeGroup['category']
): string => {
  switch (category) {
    case 'men':
      return '#2196f3';
    case 'women':
      return '#e91e63';
    case 'youth':
      return '#4caf50';
    case 'families':
      return '#ff9800';
    case 'seniors':
      return '#9c27b0';
    case 'mixed':
      return '#607d8b';
    default:
      return '#607d8b';
  }
};

export const formatMeetingTime = (day: string, time: string): string => {
  return `${day}s at ${time}`;
};

export const getGroupAvailableSpots = (group: MockLifeGroup): number => {
  return Math.max(0, group.capacity - group.currentMembers);
};

export const getRecentSessions = (
  groupId: string,
  limit: number = 5
): GroupSession[] => {
  const group = getLifeGroupById(groupId);
  if (!group) return [];

  return group.sessions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
};

export const getAverageAttendance = (groupId: string): number => {
  const sessions = getRecentSessions(groupId);
  if (sessions.length === 0) return 0;

  const totalAttendees = sessions.reduce(
    (sum, session) => sum + session.attendees.length,
    0
  );
  return Math.round((totalAttendees / sessions.length) * 10) / 10;
};

export default {
  MOCK_LIFE_GROUPS,
  getLifeGroupById,
  getLifeGroupsByChurch,
  getOpenLifeGroups,
  getUserJoinedGroups,
  getLifeGroupsByCategory,
  searchLifeGroups,
  getGroupsByMeetingDay,
  isUserGroupMember,
  isUserGroupLeader,
  hasUserRequestedToJoin,
  getCategoryIcon,
  getCategoryColor,
  formatMeetingTime,
  getGroupAvailableSpots,
  getRecentSessions,
  getAverageAttendance,
};
