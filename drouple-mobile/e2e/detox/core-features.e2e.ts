/**
 * E2E Tests - Core Features
 * Tests check-in, events, directory features against staging backend
 */

import { device, element, by, expect } from 'detox';

const STAGING_CONFIG = {
  testUsers: {
    member: {
      email: 'test.member@staging.com',
      password: 'Staging!Test2025',
    },
  },
};

describe('E2E - Core Features', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    
    // Login before each test
    await expect(element(by.id('login-screen'))).toBeVisible();
    await element(by.id('email-input')).typeText(STAGING_CONFIG.testUsers.member.email);
    await element(by.id('password-input')).typeText(STAGING_CONFIG.testUsers.member.password);
    await element(by.id('login-button')).tap();
    await expect(element(by.id('dashboard-screen'))).toBeVisible(10000);
  });

  describe('Check-In Feature', () => {
    it('should complete check-in flow successfully', async () => {
      // Navigate to check-in
      await element(by.id('checkin-button')).tap();
      await expect(element(by.id('checkin-screen'))).toBeVisible();
      
      // Should show available services
      await expect(element(by.id('available-services'))).toBeVisible();
      
      // Select a service
      await element(by.id('service-item-0')).tap();
      
      // Should show check-in confirmation
      await expect(element(by.id('checkin-confirmation'))).toBeVisible();
      
      // Confirm check-in
      await element(by.id('confirm-checkin')).tap();
      
      // Should show success message
      await expect(element(by.id('checkin-success'))).toBeVisible();
      await expect(element(by.text('Check-in successful!'))).toBeVisible();
    });

    it('should handle QR code scanning', async () => {
      await element(by.id('checkin-button')).tap();
      await expect(element(by.id('checkin-screen'))).toBeVisible();
      
      // Tap QR scan button
      await element(by.id('qr-scan-button')).tap();
      
      // Should show camera screen
      await expect(element(by.id('qr-camera-screen'))).toBeVisible();
      
      // Test QR code would be scanned here
      // For testing, we'll simulate a valid QR code
      await element(by.id('simulate-qr-scan')).tap();
      
      // Should process QR and complete check-in
      await expect(element(by.id('checkin-success'))).toBeVisible();
    });

    it('should mark new believer during check-in', async () => {
      await element(by.id('checkin-button')).tap();
      await expect(element(by.id('checkin-screen'))).toBeVisible();
      
      await element(by.id('service-item-0')).tap();
      
      // Toggle new believer option
      await element(by.id('new-believer-toggle')).tap();
      await expect(element(by.id('new-believer-toggle'))).toHaveToggleValue(true);
      
      await element(by.id('confirm-checkin')).tap();
      
      // Should show new believer welcome message
      await expect(element(by.id('new-believer-welcome'))).toBeVisible();
      await expect(element(by.text('Welcome to the family!'))).toBeVisible();
    });

    it('should handle offline check-in', async () => {
      // Disable network
      await device.setURLBlacklist(['*']);
      
      await element(by.id('checkin-button')).tap();
      await expect(element(by.id('checkin-screen'))).toBeVisible();
      
      // Should show offline mode indicator
      await expect(element(by.id('offline-mode'))).toBeVisible();
      
      await element(by.id('service-item-0')).tap();
      await element(by.id('confirm-checkin')).tap();
      
      // Should show offline check-in confirmation
      await expect(element(by.id('offline-checkin-queued'))).toBeVisible();
      await expect(element(by.text('Check-in saved - will sync when online'))).toBeVisible();
      
      // Re-enable network
      await device.setURLBlacklist([]);
      
      // Should sync automatically
      await expect(element(by.id('sync-complete'))).toBeVisible(10000);
    });
  });

  describe('Events Feature', () => {
    it('should display events list', async () => {
      await element(by.id('events-tab')).tap();
      await expect(element(by.id('events-screen'))).toBeVisible();
      
      // Should load and display events
      await expect(element(by.id('events-list'))).toBeVisible();
      
      // Should show at least one event
      await expect(element(by.id('event-item-0'))).toBeVisible();
    });

    it('should show event details and RSVP', async () => {
      await element(by.id('events-tab')).tap();
      await expect(element(by.id('events-screen'))).toBeVisible();
      
      // Tap on first event
      await element(by.id('event-item-0')).tap();
      
      // Should show event details
      await expect(element(by.id('event-detail-screen'))).toBeVisible();
      await expect(element(by.id('event-title'))).toBeVisible();
      await expect(element(by.id('event-description'))).toBeVisible();
      await expect(element(by.id('event-date'))).toBeVisible();
      
      // Should show RSVP button
      await expect(element(by.id('rsvp-button'))).toBeVisible();
      
      // Tap RSVP
      await element(by.id('rsvp-button')).tap();
      
      // Should show RSVP confirmation
      await expect(element(by.id('rsvp-success'))).toBeVisible();
      await expect(element(by.text('RSVP confirmed!'))).toBeVisible();
    });

    it('should handle event waitlist', async () => {
      await element(by.id('events-tab')).tap();
      await expect(element(by.id('events-screen'))).toBeVisible();
      
      // Find an event at capacity (would be marked in test data)
      await element(by.id('full-event-item')).tap();
      
      await expect(element(by.id('event-detail-screen'))).toBeVisible();
      
      // Should show waitlist button instead of RSVP
      await expect(element(by.id('waitlist-button'))).toBeVisible();
      
      await element(by.id('waitlist-button')).tap();
      
      // Should confirm waitlist registration
      await expect(element(by.id('waitlist-success'))).toBeVisible();
      await expect(element(by.text('Added to waitlist'))).toBeVisible();
    });

    it('should filter events by type', async () => {
      await element(by.id('events-tab')).tap();
      await expect(element(by.id('events-screen'))).toBeVisible();
      
      // Open filter options
      await element(by.id('filter-button')).tap();
      await expect(element(by.id('filter-modal'))).toBeVisible();
      
      // Select a specific event type
      await element(by.id('filter-service')).tap();
      await element(by.id('apply-filters')).tap();
      
      // Should show filtered results
      await expect(element(by.id('events-list'))).toBeVisible();
      await expect(element(by.id('filter-active-indicator'))).toBeVisible();
    });
  });

  describe('Member Directory', () => {
    it('should display member directory', async () => {
      await element(by.id('directory-tab')).tap();
      await expect(element(by.id('directory-screen'))).toBeVisible();
      
      // Should load and display members
      await expect(element(by.id('member-list'))).toBeVisible();
      await expect(element(by.id('member-item-0'))).toBeVisible();
    });

    it('should search members successfully', async () => {
      await element(by.id('directory-tab')).tap();
      await expect(element(by.id('directory-screen'))).toBeVisible();
      
      // Use search functionality
      await element(by.id('search-input')).typeText('John');
      
      // Should filter results
      await expect(element(by.id('member-list'))).toBeVisible();
      
      // Results should contain search term
      await expect(element(by.text('John'))).toBeVisible();
    });

    it('should show member profile details', async () => {
      await element(by.id('directory-tab')).tap();
      await expect(element(by.id('directory-screen'))).toBeVisible();
      
      // Tap on a member
      await element(by.id('member-item-0')).tap();
      
      // Should show member profile modal
      await expect(element(by.id('member-profile-modal'))).toBeVisible();
      await expect(element(by.id('member-name'))).toBeVisible();
      await expect(element(by.id('member-role'))).toBeVisible();
      
      // Should have contact options
      await expect(element(by.id('call-button'))).toBeVisible();
      await expect(element(by.id('text-button'))).toBeVisible();
    });

    it('should respect privacy settings', async () => {
      await element(by.id('directory-tab')).tap();
      await expect(element(by.id('directory-screen'))).toBeVisible();
      
      // Find a member with private profile (marked in test data)
      await element(by.id('private-member-item')).tap();
      
      // Should show limited information
      await expect(element(by.id('member-profile-modal'))).toBeVisible();
      await expect(element(by.id('member-name'))).toBeVisible();
      
      // Contact info should be hidden
      await expect(element(by.id('member-phone'))).not.toBeVisible();
      await expect(element(by.id('call-button'))).not.toBeVisible();
    });
  });

  describe('Real-time Updates', () => {
    it('should receive real-time event updates', async () => {
      await element(by.id('events-tab')).tap();
      await expect(element(by.id('events-screen'))).toBeVisible();
      
      // This would require triggering an update from the backend
      // For testing, we'll simulate a push notification
      await device.sendToHome();
      
      // Simulate receiving push notification
      await device.launchApp({
        newInstance: false,
        url: 'drouple://events/updated'
      });
      
      // Should show updated event information
      await expect(element(by.id('events-screen'))).toBeVisible();
      await expect(element(by.id('update-indicator'))).toBeVisible();
    });

    it('should sync data when returning from background', async () => {
      // Navigate to events to load data
      await element(by.id('events-tab')).tap();
      await expect(element(by.id('events-screen'))).toBeVisible();
      
      // Put app in background
      await device.sendToHome();
      
      // Wait a moment then return
      await new Promise(resolve => setTimeout(resolve, 2000));
      await device.launchApp({ newInstance: false });
      
      // Should show sync indicator
      await expect(element(by.id('sync-indicator'))).toBeVisible();
      
      // Data should be refreshed
      await expect(element(by.id('events-list'))).toBeVisible();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Navigate to a feature and trigger an error
      await element(by.id('events-tab')).tap();
      await expect(element(by.id('events-screen'))).toBeVisible();
      
      // Simulate server error (this would need special test endpoints)
      await device.setURLBlacklist(['*staging.drouple.com/api/v2/events*']);
      
      // Try to refresh
      await element(by.id('refresh-button')).tap();
      
      // Should show error state
      await expect(element(by.id('error-state'))).toBeVisible();
      await expect(element(by.text('Unable to load events'))).toBeVisible();
      
      // Should have retry option
      await expect(element(by.id('retry-button'))).toBeVisible();
      
      // Re-enable network
      await device.setURLBlacklist([]);
      
      // Retry should work
      await element(by.id('retry-button')).tap();
      await expect(element(by.id('events-list'))).toBeVisible();
    });

    it('should show appropriate loading states', async () => {
      // Clear cache to ensure loading state
      await device.clearKeychain();
      await device.reloadReactNative();
      
      // Login
      await element(by.id('email-input')).typeText(STAGING_CONFIG.testUsers.member.email);
      await element(by.id('password-input')).typeText(STAGING_CONFIG.testUsers.member.password);
      await element(by.id('login-button')).tap();
      
      // Should show loading state
      await expect(element(by.id('dashboard-loading'))).toBeVisible();
      
      // Then show dashboard
      await expect(element(by.id('dashboard-screen'))).toBeVisible(10000);
    });
  });

  afterEach(async () => {
    // Clean up
    try {
      await device.setURLBlacklist([]); // Re-enable network
    } catch (error) {
      // Ignore cleanup errors
    }
  });
});