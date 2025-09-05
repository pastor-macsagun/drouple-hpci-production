/**
 * DirectoryScreen Unit Tests
 * Tests for Member Directory with contact functionality
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { useAuthStore } from '@/lib/store/authStore';
import { DirectoryScreen } from '../DirectoryScreen';
import { getMembersByChurch, searchMembers } from '@/data/mockMembers';

// Mock React Native components and modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
    Linking: {
      canOpenURL: jest.fn(),
      openURL: jest.fn(),
    },
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios),
    },
  };
});

// Mock specific React Native components that cause issues in tests
jest.mock('react-native/Libraries/Lists/FlatList', () => {
  const React = require('react');
  return React.forwardRef((props, ref) => {
    const { data, renderItem, keyExtractor } = props;
    return React.createElement(
      'View',
      { testID: 'flatlist-mock' },
      data?.map((item, index) =>
        React.createElement(
          'View',
          { key: keyExtractor ? keyExtractor(item, index) : index },
          renderItem({ item, index })
        )
      )
    );
  });
});

jest.mock('react-native-paper', () => {
  const React = require('react');
  return {
    ...jest.requireActual('react-native-paper'),
    Portal: ({ children }) => children,
    Modal: ({ visible, children, ...props }) =>
      visible ? React.createElement('View', { testID: 'modal', ...props }, children) : null,
  };
});

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({}),
}));

jest.mock('@/lib/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/data/mockMembers', () => ({
  getMembersByChurch: jest.fn(),
  searchMembers: jest.fn(),
  getMemberFullName: jest.fn((member: any) => `${member.firstName} ${member.lastName}`),
  getMemberInitials: jest.fn((member: any) => `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()),
  formatLastSeen: jest.fn(() => '2h ago'),
  getRoleBadgeColor: jest.fn(() => '#607d8b'),
  getOnlineMembers: jest.fn(() => []),
}));

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'ADMIN' as const,
  churchId: 'hpci-manila',
};

const mockMembers = [
  {
    id: 'member-1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    role: 'PASTOR' as const,
    churchId: 'hpci-manila',
    joinDate: '2020-01-15',
    birthDate: '1980-05-20',
    address: '123 Main St, Manila',
    lifeGroups: ['lg-1'],
    ministries: ['worship', 'youth'],
    interests: ['music', 'sports'],
    status: 'active' as const,
    lastSeen: '2025-01-07T10:00:00Z',
    isOnline: true,
  },
  {
    id: 'member-2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah@example.com',
    role: 'MEMBER' as const,
    churchId: 'hpci-manila',
    joinDate: '2021-03-22',
    lifeGroups: ['lg-2'],
    ministries: ['children'],
    interests: ['teaching'],
    status: 'active' as const,
    lastSeen: '2025-01-07T08:00:00Z',
    isOnline: false,
  },
];

const renderDirectoryScreen = () => {
  return render(
    <PaperProvider>
      <DirectoryScreen />
    </PaperProvider>
  );
};

describe('DirectoryScreen', () => {
  const mockAlert = Alert.alert as jest.Mock;
  const mockLinking = Linking as jest.Mocked<typeof Linking>;

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as jest.Mock).mockReturnValue({ user: mockUser });
    (getMembersByChurch as jest.Mock).mockReturnValue(mockMembers);
    (searchMembers as jest.Mock).mockReturnValue(mockMembers);
    mockLinking.canOpenURL.mockResolvedValue(true);
    mockLinking.openURL.mockResolvedValue(true);
  });

  describe('Basic Rendering', () => {
    it('should render member directory with header', async () => {
      renderDirectoryScreen();

      await waitFor(() => {
        expect(screen.getByText('Member Directory')).toBeTruthy();
        expect(screen.getByPlaceholderText('Search members...')).toBeTruthy();
      });
    });

    it('should display member list with contact buttons for members with phone numbers', async () => {
      renderDirectoryScreen();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeTruthy();
        expect(screen.getByText('Sarah Johnson')).toBeTruthy();
      });

      // Should show contact buttons only for member with phone
      const phoneIcons = screen.queryAllByTestId('contact-phone-button');
      const smsIcons = screen.queryAllByTestId('contact-sms-button');
      
      // John has phone, Sarah doesn't
      expect(phoneIcons).toHaveLength(1);
      expect(smsIcons).toHaveLength(1);
    });
  });

  describe('Contact Functionality', () => {
    it('should handle phone call when device supports calling', async () => {
      mockLinking.canOpenURL.mockResolvedValue(true);
      renderDirectoryScreen();

      await waitFor(() => {
        const phoneButton = screen.getByTestId('contact-phone-button');
        fireEvent.press(phoneButton);
      });

      await waitFor(() => {
        expect(mockLinking.canOpenURL).toHaveBeenCalledWith('tel:+15551234567');
        expect(mockLinking.openURL).toHaveBeenCalledWith('tel:+15551234567');
      });
    });

    it('should handle SMS when device supports messaging', async () => {
      mockLinking.canOpenURL.mockResolvedValue(true);
      renderDirectoryScreen();

      await waitFor(() => {
        const smsButton = screen.getByTestId('contact-sms-button');
        fireEvent.press(smsButton);
      });

      await waitFor(() => {
        expect(mockLinking.canOpenURL).toHaveBeenCalledWith('sms:+15551234567');
        expect(mockLinking.openURL).toHaveBeenCalledWith('sms:+15551234567');
      });
    });

    it('should show error when device does not support calling', async () => {
      mockLinking.canOpenURL.mockResolvedValue(false);
      renderDirectoryScreen();

      await waitFor(() => {
        const phoneButton = screen.getByTestId('contact-phone-button');
        fireEvent.press(phoneButton);
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Call Not Available',
          'Your device does not support making phone calls.',
          [{ text: 'OK' }]
        );
      });
    });

    it('should show error when device does not support SMS', async () => {
      mockLinking.canOpenURL.mockResolvedValue(false);
      renderDirectoryScreen();

      await waitFor(() => {
        const smsButton = screen.getByTestId('contact-sms-button');
        fireEvent.press(smsButton);
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'SMS Not Available',
          'Your device does not support sending text messages.',
          [{ text: 'OK' }]
        );
      });
    });

    it('should handle Linking errors gracefully', async () => {
      mockLinking.canOpenURL.mockRejectedValue(new Error('Link error'));
      renderDirectoryScreen();

      await waitFor(() => {
        const phoneButton = screen.getByTestId('contact-phone-button');
        fireEvent.press(phoneButton);
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Error',
          'Unable to make phone call. Please try again.',
          [{ text: 'OK' }]
        );
      });
    });
  });

  describe('Member Profile Modal', () => {
    it('should open member profile modal when member card is tapped', async () => {
      renderDirectoryScreen();

      await waitFor(() => {
        const memberCard = screen.getByText('John Smith').parent?.parent;
        fireEvent.press(memberCard!);
      });

      await waitFor(() => {
        expect(screen.getByText('Member Profile')).toBeTruthy();
        expect(screen.getByText('john@example.com')).toBeTruthy();
        expect(screen.getByText('+1 (555) 123-4567')).toBeTruthy();
      });
    });

    it('should close member profile modal when close button is pressed', async () => {
      renderDirectoryScreen();

      // Open modal
      await waitFor(() => {
        const memberCard = screen.getByText('John Smith').parent?.parent;
        fireEvent.press(memberCard!);
      });

      // Close modal
      await waitFor(() => {
        const closeButton = screen.getByTestId('close-profile-modal');
        fireEvent.press(closeButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Member Profile')).toBeNull();
      });
    });

    it('should display comprehensive member information in modal', async () => {
      renderDirectoryScreen();

      await waitFor(() => {
        const memberCard = screen.getByText('John Smith').parent?.parent;
        fireEvent.press(memberCard!);
      });

      await waitFor(() => {
        // Profile header
        expect(screen.getByText('John Smith')).toBeTruthy();
        expect(screen.getByText('PASTOR')).toBeTruthy();
        
        // Contact info
        expect(screen.getByText('Contact Information')).toBeTruthy();
        expect(screen.getByText('john@example.com')).toBeTruthy();
        expect(screen.getByText('+1 (555) 123-4567')).toBeTruthy();
        
        // Ministries
        expect(screen.getByText('Ministries')).toBeTruthy();
        expect(screen.getByText('worship')).toBeTruthy();
        expect(screen.getByText('youth')).toBeTruthy();
        
        // Interests
        expect(screen.getByText('Interests')).toBeTruthy();
        expect(screen.getByText('music')).toBeTruthy();
        expect(screen.getByText('sports')).toBeTruthy();

        // Address
        expect(screen.getByText('Address')).toBeTruthy();
        expect(screen.getByText('123 Main St, Manila')).toBeTruthy();
      });
    });

    it('should handle members without phone numbers gracefully in modal', async () => {
      renderDirectoryScreen();

      await waitFor(() => {
        const memberCard = screen.getByText('Sarah Johnson').parent?.parent;
        fireEvent.press(memberCard!);
      });

      await waitFor(() => {
        expect(screen.getByText('Member Profile')).toBeTruthy();
        expect(screen.getByText('sarah@example.com')).toBeTruthy();
        expect(screen.queryByText('Phone')).toBeNull();
        
        // Should not show contact buttons
        expect(screen.queryByTestId('profile-contact-phone-button')).toBeNull();
        expect(screen.queryByTestId('profile-contact-sms-button')).toBeNull();
      });
    });
  });

  describe('Search and Filtering', () => {
    it('should filter members based on search query', async () => {
      const filteredMembers = [mockMembers[0]]; // Only John
      (searchMembers as jest.Mock).mockReturnValue(filteredMembers);

      renderDirectoryScreen();

      const searchInput = screen.getByPlaceholderText('Search members...');
      fireEvent.changeText(searchInput, 'John');

      await waitFor(() => {
        expect(searchMembers).toHaveBeenCalledWith('John', 'hpci-manila');
        expect(screen.getByText('John Smith')).toBeTruthy();
        expect(screen.queryByText('Sarah Johnson')).toBeNull();
      });
    });

    it('should maintain contact functionality after filtering', async () => {
      const filteredMembers = [mockMembers[0]]; // Only John
      (searchMembers as jest.Mock).mockReturnValue(filteredMembers);
      mockLinking.canOpenURL.mockResolvedValue(true);

      renderDirectoryScreen();

      const searchInput = screen.getByPlaceholderText('Search members...');
      fireEvent.changeText(searchInput, 'John');

      await waitFor(() => {
        const phoneButton = screen.getByTestId('contact-phone-button');
        fireEvent.press(phoneButton);
      });

      await waitFor(() => {
        expect(mockLinking.openURL).toHaveBeenCalledWith('tel:+15551234567');
      });
    });
  });

  describe('Role-Based Privacy', () => {
    it('should respect church isolation for user access', async () => {
      renderDirectoryScreen();

      expect(getMembersByChurch).toHaveBeenCalledWith('hpci-manila');
    });

    it('should display member count correctly', async () => {
      renderDirectoryScreen();

      await waitFor(() => {
        expect(screen.getByText(/2 members/)).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle empty member list gracefully', async () => {
      (getMembersByChurch as jest.Mock).mockReturnValue([]);
      (searchMembers as jest.Mock).mockReturnValue([]);

      renderDirectoryScreen();

      await waitFor(() => {
        expect(screen.getByText('No members found')).toBeTruthy();
      });
    });

    it('should handle member data without required fields', async () => {
      const incompleteMembers = [{
        id: 'member-incomplete',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'MEMBER' as const,
        churchId: 'hpci-manila',
        joinDate: '2025-01-01',
        lifeGroups: [],
        ministries: [],
        interests: [],
        status: 'active' as const,
      }];

      (getMembersByChurch as jest.Mock).mockReturnValue(incompleteMembers);
      (searchMembers as jest.Mock).mockReturnValue(incompleteMembers);

      renderDirectoryScreen();

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeTruthy();
        // Should not show contact buttons for member without phone
        expect(screen.queryAllByTestId('contact-phone-button')).toHaveLength(0);
      });
    });
  });
});