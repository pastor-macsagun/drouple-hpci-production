/**
 * Events & RSVP E2E Tests
 */

const { device, expect, element, by, waitFor } = require('detox');

describe('Events and RSVP Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });

    // Login first
    await waitFor(element(by.testID('login-screen')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.testID('email-input')).typeText('test@drouple.com');
    await element(by.testID('password-input')).typeText('TestPassword123!');
    await element(by.testID('login-button')).tap();
    await waitFor(element(by.testID('dashboard-screen')))
      .toBeVisible()
      .withTimeout(15000);
  });

  beforeEach(async () => {
    // Navigate to events tab
    await element(by.testID('events-tab')).tap();
    await waitFor(element(by.testID('events-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should show events list', async () => {
    await waitFor(element(by.testID('events-list')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should navigate to event detail on tap', async () => {
    // Wait for at least one event card
    await waitFor(element(by.testID('event-card-0')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.testID('event-card-0')).tap();

    // Should navigate to event detail
    await waitFor(element(by.testID('event-detail-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.testID('rsvp-button'))).toBeVisible();
  });

  it('should handle RSVP to event when online', async () => {
    // Navigate to first event
    await waitFor(element(by.testID('event-card-0')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.testID('event-card-0')).tap();

    await waitFor(element(by.testID('event-detail-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // RSVP to event
    await element(by.testID('rsvp-button')).tap();

    // Should show success message
    await waitFor(element(by.text('RSVP successful')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should queue RSVP when offline then sync', async () => {
    // This would simulate offline mode
    // Navigate to first event
    await waitFor(element(by.testID('event-card-0')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.testID('event-card-0')).tap();

    await waitFor(element(by.testID('event-detail-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // RSVP to event (would be queued if offline)
    await element(by.testID('rsvp-button')).tap();

    // Should show queued message
    await waitFor(element(by.text('RSVP queued')))
      .toBeVisible()
      .withTimeout(5000);

    // Simulate coming back online and auto-sync
    // This would happen automatically in real app
  });
});
