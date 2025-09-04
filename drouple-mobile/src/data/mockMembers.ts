/**
 * Mock Members Data
 * Sample church members for testing Directory functionality
 */

export interface MockMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'PASTOR' | 'ADMIN' | 'LEADER' | 'VIP' | 'MEMBER';
  churchId: string;
  avatar?: string;
  joinDate: string;
  birthDate?: string;
  address?: string;
  lifeGroups: string[];
  ministries: string[];
  interests: string[];
  status: 'active' | 'inactive';
  lastSeen?: string;
  isOnline?: boolean;
}

export const MOCK_MEMBERS: MockMember[] = [
  {
    id: 'member-1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    role: 'PASTOR',
    churchId: 'hpci-manila',
    joinDate: '2020-01-15',
    birthDate: '1980-05-20',
    lifeGroups: ['lg-1', 'lg-2'],
    ministries: ['worship', 'youth'],
    interests: ['music', 'sports', 'reading'],
    status: 'active',
    lastSeen: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    isOnline: true,
  },
  {
    id: 'member-2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1 (555) 234-5678',
    role: 'ADMIN',
    churchId: 'hpci-manila',
    joinDate: '2019-08-10',
    birthDate: '1985-11-12',
    lifeGroups: ['lg-1'],
    ministries: ['children', 'outreach'],
    interests: ['teaching', 'crafts', 'cooking'],
    status: 'active',
    lastSeen: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    isOnline: false,
  },
  {
    id: 'member-3',
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael.brown@example.com',
    phone: '+1 (555) 345-6789',
    role: 'LEADER',
    churchId: 'hpci-manila',
    joinDate: '2021-03-22',
    birthDate: '1992-07-08',
    lifeGroups: ['lg-3'],
    ministries: ['youth', 'media'],
    interests: ['technology', 'gaming', 'photography'],
    status: 'active',
    lastSeen: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    isOnline: false,
  },
  {
    id: 'member-4',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@example.com',
    phone: '+1 (555) 456-7890',
    role: 'VIP',
    churchId: 'hpci-manila',
    joinDate: '2022-01-05',
    birthDate: '1988-03-15',
    lifeGroups: ['lg-2', 'lg-4'],
    ministries: ['worship', 'prayer'],
    interests: ['music', 'prayer', 'mentoring'],
    status: 'active',
    lastSeen: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    isOnline: false,
  },
  {
    id: 'member-5',
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david.wilson@example.com',
    phone: '+1 (555) 567-8901',
    role: 'MEMBER',
    churchId: 'hpci-manila',
    joinDate: '2023-06-18',
    birthDate: '1995-09-25',
    lifeGroups: ['lg-1'],
    ministries: ['media', 'tech'],
    interests: ['technology', 'fitness', 'music'],
    status: 'active',
    lastSeen: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    isOnline: true,
  },
  {
    id: 'member-6',
    firstName: 'Jessica',
    lastName: 'Miller',
    email: 'jessica.miller@example.com',
    phone: '+1 (555) 678-9012',
    role: 'MEMBER',
    churchId: 'hpci-manila',
    joinDate: '2023-02-14',
    birthDate: '1990-12-03',
    lifeGroups: ['lg-4'],
    ministries: ['children', 'hospitality'],
    interests: ['children', 'cooking', 'event planning'],
    status: 'active',
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    isOnline: false,
  },
  {
    id: 'member-7',
    firstName: 'Robert',
    lastName: 'Garcia',
    email: 'robert.garcia@example.com',
    phone: '+1 (555) 789-0123',
    role: 'LEADER',
    churchId: 'hpci-cebu',
    joinDate: '2020-11-30',
    birthDate: '1983-04-18',
    lifeGroups: ['lg-5'],
    ministries: ['men', 'counseling'],
    interests: ['mentoring', 'sports', 'counseling'],
    status: 'active',
    lastSeen: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    isOnline: false,
  },
  {
    id: 'member-8',
    firstName: 'Lisa',
    lastName: 'Anderson',
    email: 'lisa.anderson@example.com',
    phone: '+1 (555) 890-1234',
    role: 'MEMBER',
    churchId: 'hpci-cebu',
    joinDate: '2022-09-12',
    birthDate: '1987-06-30',
    lifeGroups: ['lg-5', 'lg-6'],
    ministries: ['women', 'prayer'],
    interests: ['prayer', 'bible study', 'fellowship'],
    status: 'active',
    lastSeen: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    isOnline: false,
  },
  {
    id: 'member-9',
    firstName: 'James',
    lastName: 'Taylor',
    email: 'james.taylor@example.com',
    role: 'MEMBER',
    churchId: 'hpci-manila',
    joinDate: '2023-05-08',
    birthDate: '1998-01-22',
    lifeGroups: ['lg-3'],
    ministries: ['youth', 'outreach'],
    interests: ['evangelism', 'sports', 'community service'],
    status: 'active',
    lastSeen: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    isOnline: false,
  },
  {
    id: 'member-10',
    firstName: 'Amanda',
    lastName: 'Thomas',
    email: 'amanda.thomas@example.com',
    phone: '+1 (555) 012-3456',
    role: 'VIP',
    churchId: 'hpci-manila',
    joinDate: '2021-12-01',
    birthDate: '1991-10-14',
    lifeGroups: ['lg-2'],
    ministries: ['hospitality', 'newcomers'],
    interests: ['hospitality', 'event planning', 'networking'],
    status: 'active',
    lastSeen: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    isOnline: true,
  },
];

// Helper functions for member data
export const getMemberById = (id: string): MockMember | undefined => {
  return MOCK_MEMBERS.find(member => member.id === id);
};

export const getMembersByChurch = (churchId: string): MockMember[] => {
  return MOCK_MEMBERS.filter(member => member.churchId === churchId);
};

export const searchMembers = (
  query: string,
  churchId?: string
): MockMember[] => {
  const searchQuery = query.toLowerCase().trim();
  if (!searchQuery)
    return churchId ? getMembersByChurch(churchId) : MOCK_MEMBERS;

  const members = churchId ? getMembersByChurch(churchId) : MOCK_MEMBERS;

  return members.filter(
    member =>
      member.firstName.toLowerCase().includes(searchQuery) ||
      member.lastName.toLowerCase().includes(searchQuery) ||
      member.email.toLowerCase().includes(searchQuery) ||
      member.ministries.some(ministry =>
        ministry.toLowerCase().includes(searchQuery)
      ) ||
      member.interests.some(interest =>
        interest.toLowerCase().includes(searchQuery)
      )
  );
};

export const getMembersByMinistry = (
  ministry: string,
  churchId?: string
): MockMember[] => {
  const members = churchId ? getMembersByChurch(churchId) : MOCK_MEMBERS;
  return members.filter(member =>
    member.ministries.some(m => m.toLowerCase() === ministry.toLowerCase())
  );
};

export const getMembersByLifeGroup = (lifeGroupId: string): MockMember[] => {
  return MOCK_MEMBERS.filter(member => member.lifeGroups.includes(lifeGroupId));
};

export const getOnlineMembers = (churchId?: string): MockMember[] => {
  const members = churchId ? getMembersByChurch(churchId) : MOCK_MEMBERS;
  return members.filter(member => member.isOnline);
};

export const getActiveMembers = (churchId?: string): MockMember[] => {
  const members = churchId ? getMembersByChurch(churchId) : MOCK_MEMBERS;
  return members.filter(member => member.status === 'active');
};

export const getMemberFullName = (member: MockMember): string => {
  return `${member.firstName} ${member.lastName}`;
};

export const getMemberInitials = (member: MockMember): string => {
  return `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
};

export const formatLastSeen = (lastSeen?: string): string => {
  if (!lastSeen) return 'Never';

  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return lastSeenDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const getRoleBadgeColor = (role: MockMember['role']): string => {
  switch (role) {
    case 'SUPER_ADMIN':
      return '#9c27b0';
    case 'PASTOR':
      return '#3f51b5';
    case 'ADMIN':
      return '#f44336';
    case 'LEADER':
      return '#ff9800';
    case 'VIP':
      return '#4caf50';
    case 'MEMBER':
      return '#607d8b';
    default:
      return '#607d8b';
  }
};

export default {
  MOCK_MEMBERS,
  getMemberById,
  getMembersByChurch,
  searchMembers,
  getMembersByMinistry,
  getMembersByLifeGroup,
  getOnlineMembers,
  getActiveMembers,
  getMemberFullName,
  getMemberInitials,
  formatLastSeen,
  getRoleBadgeColor,
};
