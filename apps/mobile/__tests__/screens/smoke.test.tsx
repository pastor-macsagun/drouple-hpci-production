/**
 * Component Smoke Tests
 * Basic rendering tests for all MVP screens to ensure they don't crash
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';

// Mock the theme provider
jest.mock('@/theme', () => ({
  useTokens: () => ({
    colors: {
      bg: { surface: '#f8f9fa', primary: '#ffffff', secondary: '#f1f3f5' },
      text: { primary: '#333', secondary: '#666', tertiary: '#999', primaryOnBrand: '#fff' },
      brand: { primary: '#1e7ce8', secondary: '#4a90e2' },
      state: { success: '#28a745', error: '#dc3545', warning: '#ffc107' },
      border: { primary: 'rgba(0,0,0,0.1)' },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '4xl': 64 },
    radii: { lg: 12 },
  }),
}));

// Mock auth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'MEMBER' },
    signOut: jest.fn(),
  }),
}));

// Mock expo router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useGlobalSearchParams: () => ({}),
}));

// Mock React Query
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

// Mock repositories with basic implementations
jest.mock('@/data/repos/attendance', () => ({
  attendanceRepository: {
    getTodayStats: () => Promise.resolve({
      totalToday: 45,
      totalThisWeek: 150,
      recentCheckIns: [],
    }),
    checkIn: () => Promise.resolve({}),
    isCheckedInToday: () => Promise.resolve(false),
  },
}));

jest.mock('@/data/repos/members', () => ({
  membersRepository: {
    getAll: () => Promise.resolve([]),
    search: () => Promise.resolve([]),
  },
}));

jest.mock('@/data/repos/events', () => ({
  eventsRepository: {
    getAll: () => Promise.resolve([]),
    updateRSVP: () => Promise.resolve({}),
  },
}));

jest.mock('@/data/repos/announcements', () => ({
  announcementsRepository: {
    getAll: () => Promise.resolve([]),
    markAsRead: () => Promise.resolve({}),
  },
}));

// Mock sync components
jest.mock('@/components/sync/SyncStatusBadge', () => ({
  SyncStatusBadge: () => null,
  OfflineBadge: () => null,
  PendingSyncBadge: () => null,
}));

// Mock other complex components
jest.mock('@/components/ui/QRScanner', () => ({
  QRScanner: () => null,
}));

jest.mock('@/components/patterns', () => ({
  Skeleton: () => null,
  EmptyState: () => null,
  ErrorState: () => null,
}));

jest.mock('@shopify/flash-list', () => ({
  FlashList: ({ data, renderItem }: any) => {
    return data?.map((item: any, index: number) => renderItem({ item, index })) || null;
  },
}));

// Import screens
import HomePage from '@/app/(tabs)/home';
import CheckinsPage from '@/app/(tabs)/checkins';
import DirectoryPage from '@/app/(tabs)/directory';
import EventsPage from '@/app/(tabs)/events';
import AnnouncementsPage from '@/app/(tabs)/announcements';
import SettingsPage from '@/app/(tabs)/settings';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      {children}
    </QueryClientProvider>
  );
};

describe('Screen Smoke Tests', () => {
  it('should render Home screen without crashing', () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>
    );
  });

  it('should render Check-ins screen without crashing', () => {
    render(
      <TestWrapper>
        <CheckinsPage />
      </TestWrapper>
    );
  });

  it('should render Directory screen without crashing', () => {
    render(
      <TestWrapper>
        <DirectoryPage />
      </TestWrapper>
    );
  });

  it('should render Events screen without crashing', () => {
    render(
      <TestWrapper>
        <EventsPage />
      </TestWrapper>
    );
  });

  it('should render Announcements screen without crashing', () => {
    render(
      <TestWrapper>
        <AnnouncementsPage />
      </TestWrapper>
    );
  });

  it('should render Settings screen without crashing', () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );
  });
});