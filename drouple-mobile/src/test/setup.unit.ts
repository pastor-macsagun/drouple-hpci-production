/**
 * Unit Test Setup
 * Additional configuration for unit tests
 */

import './setup';

// Mock navigation for unit tests
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  }),
  useRoute: () => ({ params: {} }),
  useFocusEffect: jest.fn(),
}));

// Mock Zustand stores
jest.mock('../lib/store/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    user: null,
    isAuthenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    isLoading: false,
  })),
}));
