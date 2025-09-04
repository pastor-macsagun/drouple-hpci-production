/**
 * Events & RSVP E2E Tests
 * Tests event discovery, RSVP flow, offline queueing, and calendar integration
 */

import {
  loginAsUser,
  waitForElementToBeVisible,
  takeScreenshot,
  scrollToElement,
} from './setup';

describe('Events & RSVP System', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await loginAsUser('member');
  });

  describe('Event Discovery', () => {
    it('should display upcoming events', async () => {
      await element(by.id('tab-events')).tap();
      await waitForElementToBeVisible('events-screen');

      // Should show event list
      await expect(element(by.id('events-list'))).toBeVisible();
      await expect(element(by.text('Youth Night'))).toBeVisible();

      await takeScreenshot('events-list');
    });

    it('should filter events by date range', async () => {
      await element(by.id('tab-events')).tap();
      await waitForElementToBeVisible('events-screen');

      // Open filter
      await element(by.id('filter-button')).tap();
      await waitForElementToBeVisible('event-filter-modal');

      // Set date range
      await element(by.id('date-from-picker')).tap();
      // Mock date selection
      await element(by.text('15')).tap(); // Select 15th
      await element(by.text('OK')).tap();

      await element(by.id('apply-filter-button')).tap();

      // Should filter events
      await waitForElementToBeVisible('events-list');

      await takeScreenshot('filtered-events');
    });

    it('should search events by title', async () => {
      await element(by.id('tab-events')).tap();
      await waitForElementToBeVisible('events-screen');

      // Use search
      await element(by.id('search-input')).typeText('Youth');

      // Should show filtered results
      await expect(element(by.text('Youth Night'))).toBeVisible();

      await takeScreenshot('event-search');
    });
  });

  describe('Event Details', () => {
    it('should show complete event information', async () => {
      await element(by.id('tab-events')).tap();
      await waitForElementToBeVisible('events-screen');

      // Tap on event
      await element(by.id('event-youth-night')).tap();
      await waitForElementToBeVisible('event-detail-screen');

      // Should show all details
      await expect(element(by.text('Youth Night'))).toBeVisible();
      await expect(element(by.text('Monthly youth gathering'))).toBeVisible();
      await expect(element(by.text('Main Auditorium'))).toBeVisible();
      await expect(element(by.id('attendance-info'))).toBeVisible();

      await takeScreenshot('event-details');
    });

    it('should show capacity and availability', async () => {
      await element(by.id('tab-events')).tap();
      await element(by.id('event-youth-night')).tap();
      await waitForElementToBeVisible('event-detail-screen');

      // Should show capacity info
      await expect(element(by.text('45 / 100 registered'))).toBeVisible();
      await expect(element(by.text('55 spots available'))).toBeVisible();

      await takeScreenshot('event-capacity');
    });
  });

  describe('RSVP Flow', () => {
    it('should successfully RSVP to free event', async () => {
      await element(by.id('tab-events')).tap();
      await element(by.id('event-youth-night')).tap();
      await waitForElementToBeVisible('event-detail-screen');

      // RSVP
      await element(by.id('rsvp-button')).tap();

      // Should show confirmation
      await waitForElementToBeVisible('rsvp-success');
      await expect(element(by.text('RSVP confirmed!'))).toBeVisible();

      // Button should change to "Cancel RSVP"
      await expect(element(by.text('Cancel RSVP'))).toBeVisible();

      await takeScreenshot('rsvp-success');
    });

    it('should handle paid event RSVP', async () => {
      await element(by.id('tab-events')).tap();
      await element(by.id('event-conference-2024')).tap();
      await waitForElementToBeVisible('event-detail-screen');

      // Should show fee
      await expect(element(by.text('₱1,500.00'))).toBeVisible();

      // RSVP with payment
      await element(by.id('rsvp-button')).tap();
      await waitForElementToBeVisible('payment-info-modal');

      // Should show payment instructions
      await expect(element(by.text('Payment Instructions'))).toBeVisible();
      await expect(element(by.text('GCash: 0917-123-4567'))).toBeVisible();

      await element(by.id('confirm-rsvp-button')).tap();

      // Should show pending payment status
      await waitForElementToBeVisible('rsvp-pending');
      await expect(element(by.text('RSVP pending payment'))).toBeVisible();

      await takeScreenshot('paid-event-rsvp');
    });

    it('should join waitlist when event is full', async () => {
      // Mock full event
      await element(by.id('tab-events')).tap();
      await element(by.id('event-full')).tap(); // Mock full event
      await waitForElementToBeVisible('event-detail-screen');

      // Should show "Join Waitlist" button
      await expect(element(by.text('Join Waitlist'))).toBeVisible();

      await element(by.id('waitlist-button')).tap();

      // Should confirm waitlist
      await waitForElementToBeVisible('waitlist-success');
      await expect(element(by.text('Added to waitlist'))).toBeVisible();

      await takeScreenshot('waitlist-joined');
    });

    it('should cancel RSVP successfully', async () => {
      // RSVP first
      await element(by.id('tab-events')).tap();
      await element(by.id('event-youth-night')).tap();
      await element(by.id('rsvp-button')).tap();
      await waitForElementToBeVisible('rsvp-success');

      // Cancel RSVP
      await element(by.text('Cancel RSVP')).tap();
      await waitForElementToBeVisible('cancel-rsvp-modal');

      await element(by.id('confirm-cancel-button')).tap();

      // Should revert to RSVP button
      await expect(element(by.text('RSVP'))).toBeVisible();

      await takeScreenshot('rsvp-cancelled');
    });
  });

  describe('Offline RSVP', () => {
    it('should queue RSVP when offline', async () => {
      await device.disableNetwork();

      await element(by.id('tab-events')).tap();
      await waitForElementToBeVisible('offline-indicator');

      await element(by.id('event-youth-night')).tap();
      await element(by.id('rsvp-button')).tap();

      // Should queue for sync
      await waitForElementToBeVisible('rsvp-queued');
      await expect(element(by.text('RSVP queued for sync'))).toBeVisible();

      await takeScreenshot('offline-rsvp-queued');

      await device.enableNetwork();
    });

    it('should sync queued RSVPs when back online', async () => {
      // Queue RSVP offline
      await device.disableNetwork();
      await element(by.id('tab-events')).tap();
      await element(by.id('event-youth-night')).tap();
      await element(by.id('rsvp-button')).tap();
      await waitForElementToBeVisible('rsvp-queued');

      // Enable network
      await device.enableNetwork();

      // Should auto-sync
      await waitForElementToBeVisible('sync-notification');
      await expect(element(by.text('1 RSVP synced'))).toBeVisible();

      await takeScreenshot('rsvp-sync-success');
    });
  });

  describe('Calendar Integration', () => {
    it('should add event to device calendar', async () => {
      await element(by.id('tab-events')).tap();
      await element(by.id('event-youth-night')).tap();
      await waitForElementToBeVisible('event-detail-screen');

      // Scroll to calendar button
      await scrollToElement('add-to-calendar-button', 'event-detail-scroll');

      await element(by.id('add-to-calendar-button')).tap();

      // Should show calendar permission prompt
      await waitForElementToBeVisible('calendar-permission-modal');
      await element(by.id('grant-calendar-permission')).tap();

      // Should show success
      await waitForElementToBeVisible('calendar-added');
      await expect(element(by.text('Added to calendar'))).toBeVisible();

      await takeScreenshot('calendar-integration');
    });
  });

  describe('Event Notifications', () => {
    it('should schedule event reminder notification', async () => {
      await element(by.id('tab-events')).tap();
      await element(by.id('event-youth-night')).tap();
      await element(by.id('rsvp-button')).tap();
      await waitForElementToBeVisible('rsvp-success');

      // Should show reminder option
      await expect(element(by.text('Set reminder'))).toBeVisible();

      await element(by.id('set-reminder-button')).tap();

      // Should show reminder options
      await waitForElementToBeVisible('reminder-options');
      await element(by.text('1 hour before')).tap();

      // Should confirm
      await waitForElementToBeVisible('reminder-set');
      await expect(element(by.text('Reminder set'))).toBeVisible();

      await takeScreenshot('event-reminder-set');
    });
  });

  describe('Deep Links', () => {
    it('should handle event deep link navigation', async () => {
      // Mock deep link
      await device.openURL('drouple://events/youth-night');

      // Should navigate directly to event
      await waitForElementToBeVisible('event-detail-screen');
      await expect(element(by.text('Youth Night'))).toBeVisible();

      await takeScreenshot('event-deeplink');
    });

    it('should handle RSVP deep link', async () => {
      await device.openURL('drouple://events/youth-night/rsvp');

      // Should go to event and trigger RSVP
      await waitForElementToBeVisible('event-detail-screen');
      await waitForElementToBeVisible('rsvp-confirmation-modal');

      await takeScreenshot('rsvp-deeplink');
    });
  });

  describe('Accessibility', () => {
    it('should have proper event accessibility labels', async () => {
      await element(by.id('tab-events')).tap();
      await waitForElementToBeVisible('events-screen');

      const eventCard = element(by.id('event-youth-night'));
      await expect(eventCard).toHaveAccessibilityRole('button');
      await expect(eventCard).toHaveAccessibilityLabel(
        'Youth Night event, January 15, 7:00 PM, 45 of 100 registered'
      );

      await takeScreenshot('events-accessibility');
    });

    it('should announce RSVP status changes', async () => {
      await element(by.id('tab-events')).tap();
      await element(by.id('event-youth-night')).tap();
      await element(by.id('rsvp-button')).tap();

      const successMessage = element(by.id('rsvp-success'));
      await expect(successMessage).toHaveAccessibilityRole('alert');
      await expect(successMessage).toHaveAccessibilityLiveRegion('polite');

      await takeScreenshot('rsvp-accessibility-announcement');
    });
  });
});
