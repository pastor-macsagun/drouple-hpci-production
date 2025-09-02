/**
 * Production Testing Configuration
 * Defines test accounts, URLs, and scenarios for automated production testing
 */

export interface TestAccount {
  email: string;
  password: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'LEADER' | 'MEMBER';
  church?: 'Manila' | 'Cebu';
  expectedDashboard: string;
  description: string;
}

export interface TestScenario {
  name: string;
  description: string;
  requiredRole: string;
  steps: TestStep[];
  cleanup?: CleanupStep[];
}

export interface TestStep {
  action: 'navigate' | 'click' | 'fill' | 'submit' | 'verify' | 'wait';
  selector?: string;
  value?: string;
  url?: string;
  expected?: string;
  timeout?: number;
}

export interface CleanupStep {
  action: 'delete' | 'restore' | 'reset';
  target: string;
  identifier?: string;
}

export interface TestRecord {
  id: string;
  type: 'member' | 'service' | 'event' | 'lifegroup' | 'pathway';
  createdBy: string;
  createdAt: Date;
  data: Record<string, any>;
  cleanupRequired: boolean;
}

// Production Test Configuration
export const PROD_CONFIG = {
  baseUrl: 'https://www.drouple.app',
  timeout: 30000,
  recordsFile: './test-records.json',
  screenshotDir: './screenshots',
  reportsDir: './reports'
};

// Test Accounts
export const TEST_ACCOUNTS: TestAccount[] = [
  {
    email: 'superadmin@test.com',
    password: 'Hpci!Test2025',
    role: 'SUPER_ADMIN',
    expectedDashboard: '/super',
    description: 'Super Administrator with full system access'
  },
  {
    email: 'admin.manila@test.com',
    password: 'Hpci!Test2025',
    role: 'ADMIN',
    church: 'Manila',
    expectedDashboard: '/admin',
    description: 'Manila Church Administrator'
  },
  {
    email: 'admin.cebu@test.com',
    password: 'Hpci!Test2025',
    role: 'ADMIN',
    church: 'Cebu',
    expectedDashboard: '/admin',
    description: 'Cebu Church Administrator'
  },
  {
    email: 'leader.manila@test.com',
    password: 'Hpci!Test2025',
    role: 'LEADER',
    church: 'Manila',
    expectedDashboard: '/leader',
    description: 'Manila Church Leader'
  },
  {
    email: 'leader.cebu@test.com',
    password: 'Hpci!Test2025',
    role: 'LEADER',
    church: 'Cebu',
    expectedDashboard: '/leader',
    description: 'Cebu Church Leader'
  },
  {
    email: 'member1@test.com',
    password: 'Hpci!Test2025',
    role: 'MEMBER',
    church: 'Manila',
    expectedDashboard: '/dashboard',
    description: 'Manila Church Member'
  },
  {
    email: 'member2@test.com',
    password: 'Hpci!Test2025',
    role: 'MEMBER',
    church: 'Cebu',
    expectedDashboard: '/dashboard',
    description: 'Cebu Church Member'
  },
  {
    email: 'member3@test.com',
    password: 'Hpci!Test2025',
    role: 'MEMBER',
    church: 'Manila',
    expectedDashboard: '/dashboard',
    description: 'Manila Church Member for concurrent testing'
  }
];

// Test Scenarios
export const TEST_SCENARIOS: TestScenario[] = [
  {
    name: 'Authentication Flow',
    description: 'Test login and role-based redirects',
    requiredRole: 'ANY',
    steps: [
      { action: 'navigate', url: '/auth/signin' },
      { action: 'fill', selector: '#email', value: '{{email}}' },
      { action: 'fill', selector: '#password', value: '{{password}}' },
      { action: 'click', selector: 'button[type="submit"]' },
      { action: 'wait', timeout: 5000 },
      { action: 'verify', expected: '{{expectedDashboard}}' }
    ]
  },
  {
    name: 'Member Management',
    description: 'Create, edit, and manage members',
    requiredRole: 'ADMIN',
    steps: [
      { action: 'navigate', url: '/admin/members' },
      { action: 'click', selector: '[data-testid="add-member-button"]' },
      { action: 'fill', selector: '#name', value: 'Test Member {{timestamp}}' },
      { action: 'fill', selector: '#email', value: 'test-{{timestamp}}@example.com' },
      { action: 'click', selector: '#role' },
      { action: 'click', selector: '[data-value="MEMBER"]' },
      { action: 'submit', selector: 'form' },
      { action: 'verify', expected: 'Member created successfully' }
    ],
    cleanup: [
      { action: 'delete', target: 'member', identifier: 'test-{{timestamp}}@example.com' }
    ]
  },
  {
    name: 'Service Creation',
    description: 'Create and manage Sunday services',
    requiredRole: 'ADMIN',
    steps: [
      { action: 'navigate', url: '/admin/services' },
      { action: 'click', selector: '[data-testid="create-service-button"]' },
      { action: 'fill', selector: '#name', value: 'Test Service {{timestamp}}' },
      { action: 'fill', selector: '#date', value: '2025-12-25' },
      { action: 'fill', selector: '#time', value: '10:00' },
      { action: 'submit', selector: 'form' },
      { action: 'verify', expected: 'Service created successfully' }
    ],
    cleanup: [
      { action: 'delete', target: 'service', identifier: 'Test Service {{timestamp}}' }
    ]
  },
  {
    name: 'Event Management',
    description: 'Create events and test RSVP flow',
    requiredRole: 'ADMIN',
    steps: [
      { action: 'navigate', url: '/admin/events' },
      { action: 'click', selector: '[data-testid="create-event-button"]' },
      { action: 'fill', selector: '#title', value: 'Test Event {{timestamp}}' },
      { action: 'fill', selector: '#description', value: 'Automated test event' },
      { action: 'fill', selector: '#date', value: '2025-12-31' },
      { action: 'fill', selector: '#capacity', value: '50' },
      { action: 'submit', selector: 'form' },
      { action: 'verify', expected: 'Event created successfully' }
    ],
    cleanup: [
      { action: 'delete', target: 'event', identifier: 'Test Event {{timestamp}}' }
    ]
  },
  {
    name: 'LifeGroup Management',
    description: 'Create and manage LifeGroups',
    requiredRole: 'ADMIN',
    steps: [
      { action: 'navigate', url: '/admin/lifegroups' },
      { action: 'click', selector: '[data-testid="create-lifegroup-button"]' },
      { action: 'fill', selector: '#name', value: 'Test LifeGroup {{timestamp}}' },
      { action: 'fill', selector: '#description', value: 'Automated test group' },
      { action: 'fill', selector: '#capacity', value: '20' },
      { action: 'submit', selector: 'form' },
      { action: 'verify', expected: 'LifeGroup created successfully' }
    ],
    cleanup: [
      { action: 'delete', target: 'lifegroup', identifier: 'Test LifeGroup {{timestamp}}' }
    ]
  },
  {
    name: 'Sunday Check-in',
    description: 'Test member check-in functionality',
    requiredRole: 'MEMBER',
    steps: [
      { action: 'navigate', url: '/checkin' },
      { action: 'verify', expected: 'Sunday Check-In' },
      { action: 'click', selector: '[data-testid="checkin-button"]' },
      { action: 'verify', expected: 'Checked in successfully' }
    ]
  },
  {
    name: 'Event RSVP',
    description: 'Test event RSVP functionality as member',
    requiredRole: 'MEMBER',
    steps: [
      { action: 'navigate', url: '/events' },
      { action: 'click', selector: '[data-testid="event-card"]:first-of-type' },
      { action: 'click', selector: '[data-testid="rsvp-button"]' },
      { action: 'verify', expected: 'RSVP confirmed' }
    ]
  },
  {
    name: 'LifeGroup Join Request',
    description: 'Test LifeGroup join functionality',
    requiredRole: 'MEMBER',
    steps: [
      { action: 'navigate', url: '/lifegroups' },
      { action: 'click', selector: '[data-testid="lifegroup-card"]:first-of-type' },
      { action: 'click', selector: '[data-testid="join-button"]' },
      { action: 'verify', expected: 'Join request sent' }
    ]
  },
  {
    name: 'Tenant Isolation',
    description: 'Verify users only see their church data',
    requiredRole: 'ADMIN',
    steps: [
      { action: 'navigate', url: '/admin/members' },
      { action: 'verify', selector: '[data-testid="member-count"]', expected: '{{churchMemberCount}}' },
      { action: 'navigate', url: '/admin/services' },
      { action: 'verify', selector: '[data-testid="services-list"]', expected: 'contains-church-{{church}}' }
    ]
  }
];

export default {
  PROD_CONFIG,
  TEST_ACCOUNTS,
  TEST_SCENARIOS
};