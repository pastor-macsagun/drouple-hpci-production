import * as Linking from 'expo-linking';
import { router } from 'expo-router';

// URL scheme configuration
const prefix = Linking.createURL('/');

export const linking = {
  prefixes: [
    prefix,
    'hpci-chms://',
    'https://chms.hpci.org',
    'https://staging.chms.hpci.org',
  ],
  config: {
    screens: {
      // Root screens
      index: '/',
      
      // Tab screens
      '(tabs)': {
        initialRouteName: 'home',
        screens: {
          home: '/home',
          checkins: '/checkins',
          directory: '/directory',
          events: '/events',
          announcements: '/announcements',
          settings: '/settings',
        },
      },
      
      // Modal screens
      '(modals)': {
        screens: {
          'event-detail': '/event/:id',
          'member-profile': '/member/:id',
          'checkin-qr': '/checkin/qr',
          'announcement-detail': '/announcement/:id',
          'settings-profile': '/settings/profile',
          'settings-notifications': '/settings/notifications',
          'settings-about': '/settings/about',
        },
      },
      
      // Auth screens
      auth: {
        screens: {
          signin: '/auth/signin',
          onboarding: '/auth/onboarding',
        },
      },
      
      // Catch all
      '+not-found': '*',
    },
  },
};

// Deep link handlers
export const handleDeepLink = (url: string) => {
  const parsed = Linking.parse(url);
  const { hostname, queryParams } = parsed;
  const pathname = parsed.path;
  
  console.log('🔗 Deep link received:', { hostname, pathname, queryParams });
  
  // Handle different link patterns
  switch (pathname) {
    case '/event':
      if (queryParams?.id) {
        router.push(`/(modals)/event-detail?id=${queryParams.id}`);
      }
      break;
      
    case '/member':
      if (queryParams?.id) {
        router.push(`/(modals)/member-profile?id=${queryParams.id}`);
      }
      break;
      
    case '/checkin':
      router.push('/(tabs)/checkins');
      if (queryParams?.qr === 'true') {
        router.push('/(modals)/checkin-qr');
      }
      break;
      
    case '/announcement':
      if (queryParams?.id) {
        router.push(`/(modals)/announcement-detail?id=${queryParams.id}`);
      }
      break;
      
    default:
      // Navigate to home if no specific handler
      router.push('/(tabs)/home');
  }
};

// Initialize deep linking
export const initializeDeepLinking = () => {
  // Handle cold start links
  Linking.getInitialURL().then((url) => {
    if (url) {
      console.log('🔗 Initial URL:', url);
      handleDeepLink(url);
    }
  });
  
  // Handle links when app is already running
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleDeepLink(url);
  });
  
  return () => subscription?.remove();
};

// Utility to create app links
export const createAppLink = (path: string, params?: Record<string, string>) => {
  const url = new URL(path, 'https://chms.hpci.org');
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
};

// Share utilities
export const shareEvent = (eventId: string) => {
  return createAppLink('/event', { id: eventId });
};

export const shareMember = (memberId: string) => {
  return createAppLink('/member', { id: memberId });
};

export const shareCheckin = () => {
  return createAppLink('/checkin', { qr: 'true' });
};