/**
 * Mock Pathways Data
 * Sample discipleship pathways for testing pathway functionality
 */

export interface PathwayStep {
  id: string;
  title: string;
  description: string;
  order: number;
  estimatedDuration?: string; // e.g., "2 weeks", "1 month"
  resources?: Array<{
    type: 'video' | 'document' | 'book' | 'website';
    title: string;
    url?: string;
    description?: string;
  }>;
  isCompleted?: boolean;
  completedAt?: string;
  notes?: string;
}

export interface MockPathway {
  id: string;
  title: string;
  description: string;
  category: 'spiritual_growth' | 'ministry' | 'leadership' | 'service';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: string;
  steps: PathwayStep[];
  totalSteps: number;
  completedSteps: number;
  isEnrolled: boolean;
  enrolledAt?: string;
  completedAt?: string;
  progress: number; // 0-100
  prerequisites?: string[];
  tags: string[];
  imageUrl?: string;
}

export const MOCK_PATHWAYS: MockPathway[] = [
  {
    id: 'pathway-1',
    title: 'New Believer Foundation',
    description:
      'Essential foundations for new Christians covering salvation, baptism, prayer, and Bible reading.',
    category: 'spiritual_growth',
    difficulty: 'beginner',
    estimatedDuration: '8 weeks',
    totalSteps: 8,
    completedSteps: 3,
    isEnrolled: true,
    enrolledAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
    progress: 38,
    tags: ['baptism', 'prayer', 'bible', 'salvation'],
    steps: [
      {
        id: 'step-1-1',
        title: 'Understanding Salvation',
        description: "Learn about God's gift of salvation through Jesus Christ",
        order: 1,
        estimatedDuration: '1 week',
        isCompleted: true,
        completedAt: new Date(
          Date.now() - 12 * 24 * 60 * 60 * 1000
        ).toISOString(),
        resources: [
          {
            type: 'video',
            title: 'What is Salvation?',
            description: 'A 15-minute video explaining the gospel',
          },
          {
            type: 'document',
            title: 'Salvation Study Guide',
            description: 'Biblical verses and reflection questions',
          },
        ],
      },
      {
        id: 'step-1-2',
        title: 'Water Baptism',
        description:
          'Prepare for and understand the significance of water baptism',
        order: 2,
        estimatedDuration: '1 week',
        isCompleted: true,
        completedAt: new Date(
          Date.now() - 10 * 24 * 60 * 60 * 1000
        ).toISOString(),
        resources: [
          {
            type: 'video',
            title: 'Baptism Explained',
            description: 'Understanding the biblical meaning of baptism',
          },
        ],
      },
      {
        id: 'step-1-3',
        title: 'Prayer Life',
        description:
          'Learn how to develop a personal prayer relationship with God',
        order: 3,
        estimatedDuration: '1 week',
        isCompleted: true,
        completedAt: new Date(
          Date.now() - 8 * 24 * 60 * 60 * 1000
        ).toISOString(),
        notes: 'Started daily morning prayer routine',
      },
      {
        id: 'step-1-4',
        title: 'Bible Reading',
        description: 'Establish a regular Bible reading habit',
        order: 4,
        estimatedDuration: '1 week',
        isCompleted: false,
        resources: [
          {
            type: 'document',
            title: 'New Believer Reading Plan',
            description: '30-day reading plan for new Christians',
          },
        ],
      },
      {
        id: 'step-1-5',
        title: 'Fellowship & Community',
        description: 'Learn about the importance of Christian community',
        order: 5,
        estimatedDuration: '1 week',
        isCompleted: false,
      },
      {
        id: 'step-1-6',
        title: 'Serving Others',
        description: 'Discover how to serve in the church and community',
        order: 6,
        estimatedDuration: '1 week',
        isCompleted: false,
      },
      {
        id: 'step-1-7',
        title: 'Spiritual Disciplines',
        description: 'Introduction to fasting, worship, and meditation',
        order: 7,
        estimatedDuration: '1 week',
        isCompleted: false,
      },
      {
        id: 'step-1-8',
        title: 'Sharing Your Faith',
        description: 'Learn how to share your testimony with others',
        order: 8,
        estimatedDuration: '1 week',
        isCompleted: false,
      },
    ],
  },
  {
    id: 'pathway-2',
    title: 'Leadership Development',
    description:
      'Comprehensive training for emerging church leaders covering biblical leadership principles.',
    category: 'leadership',
    difficulty: 'intermediate',
    estimatedDuration: '12 weeks',
    totalSteps: 6,
    completedSteps: 0,
    isEnrolled: false,
    progress: 0,
    prerequisites: ['New Believer Foundation'],
    tags: ['leadership', 'ministry', 'discipleship'],
    steps: [
      {
        id: 'step-2-1',
        title: 'Biblical Leadership Foundations',
        description: 'Study biblical models of leadership from Scripture',
        order: 1,
        estimatedDuration: '2 weeks',
        isCompleted: false,
      },
      {
        id: 'step-2-2',
        title: 'Character Development',
        description: 'Develop the character qualities of a godly leader',
        order: 2,
        estimatedDuration: '2 weeks',
        isCompleted: false,
      },
      {
        id: 'step-2-3',
        title: 'Team Building',
        description: 'Learn to build and lead effective ministry teams',
        order: 3,
        estimatedDuration: '2 weeks',
        isCompleted: false,
      },
      {
        id: 'step-2-4',
        title: 'Communication Skills',
        description: 'Develop effective teaching and communication abilities',
        order: 4,
        estimatedDuration: '2 weeks',
        isCompleted: false,
      },
      {
        id: 'step-2-5',
        title: 'Conflict Resolution',
        description: 'Learn to handle conflicts in ministry settings',
        order: 5,
        estimatedDuration: '2 weeks',
        isCompleted: false,
      },
      {
        id: 'step-2-6',
        title: 'Vision Casting',
        description: 'Learn to cast vision and inspire others',
        order: 6,
        estimatedDuration: '2 weeks',
        isCompleted: false,
      },
    ],
  },
  {
    id: 'pathway-3',
    title: 'Worship Ministry Training',
    description:
      'Training for worship team members covering music, theology, and team dynamics.',
    category: 'ministry',
    difficulty: 'intermediate',
    estimatedDuration: '10 weeks',
    totalSteps: 5,
    completedSteps: 2,
    isEnrolled: true,
    enrolledAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks ago
    progress: 40,
    tags: ['worship', 'music', 'ministry'],
    steps: [
      {
        id: 'step-3-1',
        title: 'Heart of Worship',
        description: 'Understanding the biblical foundation of worship',
        order: 1,
        estimatedDuration: '2 weeks',
        isCompleted: true,
        completedAt: new Date(
          Date.now() - 18 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        id: 'step-3-2',
        title: 'Musical Excellence',
        description: 'Developing musical skills and practice habits',
        order: 2,
        estimatedDuration: '2 weeks',
        isCompleted: true,
        completedAt: new Date(
          Date.now() - 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        id: 'step-3-3',
        title: 'Team Dynamics',
        description: 'Working effectively as part of a worship team',
        order: 3,
        estimatedDuration: '2 weeks',
        isCompleted: false,
      },
      {
        id: 'step-3-4',
        title: 'Leading Others in Worship',
        description: 'How to lead congregational worship effectively',
        order: 4,
        estimatedDuration: '2 weeks',
        isCompleted: false,
      },
      {
        id: 'step-3-5',
        title: 'Technical Skills',
        description: 'Sound, lighting, and technical aspects of worship',
        order: 5,
        estimatedDuration: '2 weeks',
        isCompleted: false,
      },
    ],
  },
  {
    id: 'pathway-4',
    title: 'Community Outreach',
    description:
      'Equipping members for effective community service and evangelism.',
    category: 'service',
    difficulty: 'beginner',
    estimatedDuration: '6 weeks',
    totalSteps: 4,
    completedSteps: 0,
    isEnrolled: false,
    progress: 0,
    tags: ['outreach', 'evangelism', 'service', 'community'],
    steps: [
      {
        id: 'step-4-1',
        title: 'Understanding Your Community',
        description:
          'Learn about the needs and demographics of your local area',
        order: 1,
        estimatedDuration: '1.5 weeks',
        isCompleted: false,
      },
      {
        id: 'step-4-2',
        title: 'Service Projects',
        description: 'Plan and execute community service initiatives',
        order: 2,
        estimatedDuration: '1.5 weeks',
        isCompleted: false,
      },
      {
        id: 'step-4-3',
        title: 'Sharing Your Faith',
        description: 'Natural ways to share the gospel in community settings',
        order: 3,
        estimatedDuration: '1.5 weeks',
        isCompleted: false,
      },
      {
        id: 'step-4-4',
        title: 'Building Relationships',
        description: 'Develop lasting relationships with community members',
        order: 4,
        estimatedDuration: '1.5 weeks',
        isCompleted: false,
      },
    ],
  },
  {
    id: 'pathway-5',
    title: 'Biblical Studies Intensive',
    description:
      'In-depth Bible study methods and theological foundations for mature believers.',
    category: 'spiritual_growth',
    difficulty: 'advanced',
    estimatedDuration: '16 weeks',
    totalSteps: 8,
    completedSteps: 0,
    isEnrolled: false,
    progress: 0,
    prerequisites: ['New Believer Foundation'],
    tags: ['bible study', 'theology', 'scripture'],
    steps: [
      {
        id: 'step-5-1',
        title: 'Bible Study Methods',
        description: 'Learn various approaches to studying Scripture',
        order: 1,
        estimatedDuration: '2 weeks',
        isCompleted: false,
      },
      {
        id: 'step-5-2',
        title: 'Old Testament Survey',
        description: 'Overview of Old Testament books and themes',
        order: 2,
        estimatedDuration: '2 weeks',
        isCompleted: false,
      },
      {
        id: 'step-5-3',
        title: 'New Testament Survey',
        description: 'Overview of New Testament books and themes',
        order: 3,
        estimatedDuration: '2 weeks',
        isCompleted: false,
      },
      {
        id: 'step-5-4',
        title: 'Biblical Interpretation',
        description: 'Principles of proper biblical interpretation',
        order: 4,
        estimatedDuration: '2 weeks',
        isCompleted: false,
      },
      {
        id: 'step-5-5',
        title: 'Church History',
        description: 'Understanding the history of the Christian church',
        order: 5,
        estimatedDuration: '2 weeks',
        isCompleted: false,
      },
      {
        id: 'step-5-6',
        title: 'Christian Doctrine',
        description: 'Core beliefs and theological foundations',
        order: 6,
        estimatedDuration: '2 weeks',
        isCompleted: false,
      },
      {
        id: 'step-5-7',
        title: 'Apologetics',
        description: 'Defending and explaining the Christian faith',
        order: 7,
        estimatedDuration: '2 weeks',
        isCompleted: false,
      },
      {
        id: 'step-5-8',
        title: 'Teaching Others',
        description: 'How to effectively teach biblical truth to others',
        order: 8,
        estimatedDuration: '2 weeks',
        isCompleted: false,
      },
    ],
  },
];

// Helper functions for pathway data
export const getPathwayById = (id: string): MockPathway | undefined => {
  return MOCK_PATHWAYS.find(pathway => pathway.id === id);
};

export const getEnrolledPathways = (): MockPathway[] => {
  return MOCK_PATHWAYS.filter(pathway => pathway.isEnrolled);
};

export const getAvailablePathways = (): MockPathway[] => {
  return MOCK_PATHWAYS.filter(pathway => !pathway.isEnrolled);
};

export const getPathwaysByCategory = (
  category: MockPathway['category']
): MockPathway[] => {
  return MOCK_PATHWAYS.filter(pathway => pathway.category === category);
};

export const getPathwaysByDifficulty = (
  difficulty: MockPathway['difficulty']
): MockPathway[] => {
  return MOCK_PATHWAYS.filter(pathway => pathway.difficulty === difficulty);
};

export const getCompletedPathways = (): MockPathway[] => {
  return MOCK_PATHWAYS.filter(pathway => pathway.completedAt);
};

export const getInProgressPathways = (): MockPathway[] => {
  return MOCK_PATHWAYS.filter(
    pathway =>
      pathway.isEnrolled && !pathway.completedAt && pathway.completedSteps > 0
  );
};

export const searchPathways = (query: string): MockPathway[] => {
  const searchQuery = query.toLowerCase().trim();
  if (!searchQuery) return MOCK_PATHWAYS;

  return MOCK_PATHWAYS.filter(
    pathway =>
      pathway.title.toLowerCase().includes(searchQuery) ||
      pathway.description.toLowerCase().includes(searchQuery) ||
      pathway.tags.some(tag => tag.toLowerCase().includes(searchQuery))
  );
};

export const getStepById = (
  pathwayId: string,
  stepId: string
): PathwayStep | undefined => {
  const pathway = getPathwayById(pathwayId);
  return pathway?.steps.find(step => step.id === stepId);
};

export const getNextStep = (pathway: MockPathway): PathwayStep | undefined => {
  return pathway.steps.find(step => !step.isCompleted);
};

export const getDifficultyColor = (
  difficulty: MockPathway['difficulty']
): string => {
  switch (difficulty) {
    case 'beginner':
      return '#4caf50';
    case 'intermediate':
      return '#ff9800';
    case 'advanced':
      return '#f44336';
    default:
      return '#607d8b';
  }
};

export const getCategoryIcon = (category: MockPathway['category']): string => {
  switch (category) {
    case 'spiritual_growth':
      return 'leaf';
    case 'ministry':
      return 'church';
    case 'leadership':
      return 'account-star';
    case 'service':
      return 'hand-heart';
    default:
      return 'book';
  }
};

export const formatEstimatedDuration = (duration: string): string => {
  return duration.replace(/(\d+)/, '$1');
};

export const canEnrollInPathway = (
  pathway: MockPathway,
  completedPathwayIds: string[]
): boolean => {
  if (!pathway.prerequisites) return true;
  return pathway.prerequisites.every(prereq => {
    // In a real app, this would check actual pathway completion
    // For mock data, we'll assume some pathways are completed
    return completedPathwayIds.includes(
      prereq.toLowerCase().replace(/\s+/g, '-')
    );
  });
};

export default {
  MOCK_PATHWAYS,
  getPathwayById,
  getEnrolledPathways,
  getAvailablePathways,
  getPathwaysByCategory,
  getPathwaysByDifficulty,
  getCompletedPathways,
  getInProgressPathways,
  searchPathways,
  getStepById,
  getNextStep,
  getDifficultyColor,
  getCategoryIcon,
  formatEstimatedDuration,
  canEnrollInPathway,
};
