/**
 * Mock Reports Data
 * Sample analytics and metrics for testing reports functionality
 */

export interface AttendanceMetric {
  date: string;
  count: number;
  service?: string;
}

export interface EventMetric {
  eventId: string;
  eventName: string;
  totalRSVPs: number;
  confirmed: number;
  waitlisted: number;
  attended?: number;
}

export interface GroupMetric {
  groupId: string;
  groupName: string;
  totalMembers: number;
  activeMembers: number;
  averageAttendance: number;
}

export interface PathwayMetric {
  pathwayId: string;
  pathwayName: string;
  totalEnrolled: number;
  completed: number;
  averageProgress: number;
}

export interface MemberGrowthMetric {
  month: string;
  newMembers: number;
  totalMembers: number;
}

export interface ReportSummary {
  id: string;
  churchId: string;
  generatedAt: string;
  period: {
    startDate: string;
    endDate: string;
    type: 'week' | 'month' | 'quarter' | 'year';
  };
  attendance: {
    thisWeek: number;
    lastWeek: number;
    weeklyChange: number;
    weeklyChangePercent: number;
    monthlyAverage: number;
    yearlyTotal: number;
    breakdown: AttendanceMetric[];
  };
  events: {
    totalEvents: number;
    totalRSVPs: number;
    averageAttendance: number;
    upcomingEvents: number;
    breakdown: EventMetric[];
  };
  lifeGroups: {
    totalGroups: number;
    totalMembers: number;
    activeGroups: number;
    averageGroupSize: number;
    breakdown: GroupMetric[];
  };
  pathways: {
    totalPathways: number;
    totalEnrollments: number;
    completionRate: number;
    averageProgress: number;
    breakdown: PathwayMetric[];
  };
  members: {
    totalMembers: number;
    newThisMonth: number;
    activeMembers: number;
    memberGrowth: MemberGrowthMetric[];
  };
  highlights: Array<{
    type: 'positive' | 'neutral' | 'attention';
    title: string;
    description: string;
    metric?: number;
    trend?: 'up' | 'down' | 'stable';
  }>;
}

export const MOCK_REPORTS: ReportSummary[] = [
  {
    id: 'report-1',
    churchId: 'hpci-manila',
    generatedAt: new Date().toISOString(),
    period: {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      type: 'week',
    },
    attendance: {
      thisWeek: 245,
      lastWeek: 232,
      weeklyChange: 13,
      weeklyChangePercent: 5.6,
      monthlyAverage: 238,
      yearlyTotal: 12156,
      breakdown: [
        {
          date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          count: 45,
          service: 'Sunday Morning',
        },
        {
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          count: 32,
          service: 'Monday Prayer',
        },
        {
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          count: 28,
          service: 'Wednesday Bible Study',
        },
        {
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          count: 67,
          service: 'Friday Youth',
        },
        {
          date: new Date(Date.now() - 0 * 24 * 60 * 60 * 1000).toISOString(),
          count: 73,
          service: 'Sunday Service',
        },
      ],
    },
    events: {
      totalEvents: 6,
      totalRSVPs: 423,
      averageAttendance: 85.2,
      upcomingEvents: 4,
      breakdown: [
        {
          eventId: 'event-1',
          eventName: 'Sunday Worship Service',
          totalRSVPs: 255,
          confirmed: 255,
          waitlisted: 0,
          attended: 245,
        },
        {
          eventId: 'event-2',
          eventName: 'Youth Night - Game Tournament',
          totalRSVPs: 58,
          confirmed: 50,
          waitlisted: 8,
          attended: 52,
        },
        {
          eventId: 'event-3',
          eventName: 'Community Outreach - Food Drive',
          totalRSVPs: 25,
          confirmed: 13,
          waitlisted: 0,
          attended: 15,
        },
        {
          eventId: 'event-4',
          eventName: "Women's Bible Study Retreat",
          totalRSVPs: 22,
          confirmed: 22,
          waitlisted: 0,
        },
        {
          eventId: 'event-5',
          eventName: "Men's Prayer Breakfast",
          totalRSVPs: 25,
          confirmed: 25,
          waitlisted: 0,
        },
        {
          eventId: 'event-6',
          eventName: 'Christmas Concert Rehearsal',
          totalRSVPs: 38,
          confirmed: 15,
          waitlisted: 0,
        },
      ],
    },
    lifeGroups: {
      totalGroups: 4,
      totalMembers: 38,
      activeGroups: 4,
      averageGroupSize: 9.5,
      breakdown: [
        {
          groupId: 'lg-1',
          groupName: 'Growing in Faith',
          totalMembers: 8,
          activeMembers: 8,
          averageAttendance: 6.5,
        },
        {
          groupId: 'lg-2',
          groupName: 'Men of Purpose',
          totalMembers: 6,
          activeMembers: 6,
          averageAttendance: 4.8,
        },
        {
          groupId: 'lg-3',
          groupName: 'Young Adults Connect',
          totalMembers: 12,
          activeMembers: 11,
          averageAttendance: 9.2,
        },
        {
          groupId: 'lg-4',
          groupName: 'Women of Grace',
          totalMembers: 8,
          activeMembers: 8,
          averageAttendance: 7.1,
        },
      ],
    },
    pathways: {
      totalPathways: 5,
      totalEnrollments: 12,
      completionRate: 25,
      averageProgress: 42,
      breakdown: [
        {
          pathwayId: 'pathway-1',
          pathwayName: 'New Believer Foundation',
          totalEnrolled: 3,
          completed: 1,
          averageProgress: 65,
        },
        {
          pathwayId: 'pathway-2',
          pathwayName: 'Leadership Development',
          totalEnrolled: 2,
          completed: 0,
          averageProgress: 15,
        },
        {
          pathwayId: 'pathway-3',
          pathwayName: 'Worship Ministry Training',
          totalEnrolled: 4,
          completed: 1,
          averageProgress: 52,
        },
        {
          pathwayId: 'pathway-4',
          pathwayName: 'Community Outreach',
          totalEnrolled: 2,
          completed: 0,
          averageProgress: 25,
        },
        {
          pathwayId: 'pathway-5',
          pathwayName: 'Biblical Studies Intensive',
          totalEnrolled: 1,
          completed: 0,
          averageProgress: 8,
        },
      ],
    },
    members: {
      totalMembers: 156,
      newThisMonth: 8,
      activeMembers: 142,
      memberGrowth: [
        { month: '2024-06', newMembers: 5, totalMembers: 148 },
        { month: '2024-07', newMembers: 3, totalMembers: 151 },
        { month: '2024-08', newMembers: 7, totalMembers: 158 },
        { month: '2024-09', newMembers: 8, totalMembers: 156 },
      ],
    },
    highlights: [
      {
        type: 'positive',
        title: 'Weekly Attendance Up 5.6%',
        description:
          'Sunday services showing consistent growth with 13 more attendees than last week.',
        metric: 5.6,
        trend: 'up',
      },
      {
        type: 'positive',
        title: 'Youth Engagement Strong',
        description:
          'Youth Night events are consistently full with active waitlists.',
        metric: 116,
        trend: 'up',
      },
      {
        type: 'neutral',
        title: 'Life Groups Stable',
        description: 'All groups meeting regularly with good attendance rates.',
        metric: 95,
        trend: 'stable',
      },
      {
        type: 'attention',
        title: 'Pathway Completion Rate',
        description:
          'Only 25% completion rate on discipleship pathways - consider follow-up support.',
        metric: 25,
        trend: 'down',
      },
    ],
  },
];

// Helper functions for reports data
export const getReportByChurch = (
  churchId: string
): ReportSummary | undefined => {
  return MOCK_REPORTS.find(report => report.churchId === churchId);
};

export const getLatestReport = (
  churchId: string
): ReportSummary | undefined => {
  return MOCK_REPORTS.filter(report => report.churchId === churchId).sort(
    (a, b) =>
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  )[0];
};

export const formatMetricChange = (
  change: number,
  isPercentage: boolean = false
): {
  text: string;
  color: string;
  icon: string;
} => {
  const isPositive = change > 0;
  const isNeutral = change === 0;

  return {
    text: isNeutral
      ? '0' + (isPercentage ? '%' : '')
      : (isPositive ? '+' : '') +
        change.toFixed(isPercentage ? 1 : 0) +
        (isPercentage ? '%' : ''),
    color: isNeutral ? '#607d8b' : isPositive ? '#4caf50' : '#f44336',
    icon: isNeutral ? 'minus' : isPositive ? 'trending-up' : 'trending-down',
  };
};

export const getHighlightColor = (
  type: ReportSummary['highlights'][0]['type']
): string => {
  switch (type) {
    case 'positive':
      return '#4caf50';
    case 'attention':
      return '#ff9800';
    case 'neutral':
      return '#607d8b';
    default:
      return '#607d8b';
  }
};

export const getHighlightIcon = (
  type: ReportSummary['highlights'][0]['type']
): string => {
  switch (type) {
    case 'positive':
      return 'thumb-up';
    case 'attention':
      return 'alert';
    case 'neutral':
      return 'information';
    default:
      return 'information';
  }
};

export const getTrendIcon = (trend?: 'up' | 'down' | 'stable'): string => {
  switch (trend) {
    case 'up':
      return 'trending-up';
    case 'down':
      return 'trending-down';
    case 'stable':
      return 'minus';
    default:
      return 'minus';
  }
};

export const formatPeriodText = (period: ReportSummary['period']): string => {
  const startDate = new Date(period.startDate);
  const endDate = new Date(period.endDate);

  switch (period.type) {
    case 'week':
      return `Week of ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    case 'month':
      return startDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    case 'quarter':
      return `Q${Math.ceil((startDate.getMonth() + 1) / 3)} ${startDate.getFullYear()}`;
    case 'year':
      return startDate.getFullYear().toString();
    default:
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  }
};

export const calculateGrowthRate = (
  current: number,
  previous: number
): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export default {
  MOCK_REPORTS,
  getReportByChurch,
  getLatestReport,
  formatMetricChange,
  getHighlightColor,
  getHighlightIcon,
  getTrendIcon,
  formatPeriodText,
  calculateGrowthRate,
};
