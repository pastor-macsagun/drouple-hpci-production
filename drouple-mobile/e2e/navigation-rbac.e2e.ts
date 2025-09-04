/**
 * Navigation & RBAC E2E Tests
 * Tests role-based access control and navigation restrictions
 */

import {
  loginAsUser,
  logout,
  waitForElementToBeVisible,
  takeScreenshot,
} from './setup';

describe('Navigation & RBAC', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Member Navigation', () => {
    beforeEach(async () => {
      await loginAsUser('member');
    });

    it('should show member-appropriate tabs only', async () => {
      // Should have these tabs
      await expect(element(by.id('tab-dashboard'))).toBeVisible();
      await expect(element(by.id('tab-checkin'))).toBeVisible();
      await expect(element(by.id('tab-events'))).toBeVisible();
      await expect(element(by.id('tab-pathways'))).toBeVisible();
      await expect(element(by.id('tab-more'))).toBeVisible();

      // Should NOT have admin tabs
      await expect(element(by.id('tab-reports'))).not.toBeVisible();
      await expect(element(by.id('tab-manage'))).not.toBeVisible();

      await takeScreenshot('member-navigation');
    });

    it('should restrict access to admin features', async () => {
      // Try to access admin URL via deep link
      await device.openURL('drouple://admin/members');

      // Should redirect to appropriate screen or show access denied
      await waitForElementToBeVisible('access-denied-screen');
      await expect(element(by.text('Access Denied'))).toBeVisible();

      await takeScreenshot('member-access-denied');
    });
  });

  describe('Leader Navigation', () => {
    beforeEach(async () => {
      await loginAsUser('leader');
    });

    it('should show leader-appropriate tabs', async () => {
      // Should have member tabs plus reports
      await expect(element(by.id('tab-dashboard'))).toBeVisible();
      await expect(element(by.id('tab-checkin'))).toBeVisible();
      await expect(element(by.id('tab-events'))).toBeVisible();
      await expect(element(by.id('tab-groups'))).toBeVisible();
      await expect(element(by.id('tab-reports'))).toBeVisible();

      await takeScreenshot('leader-navigation');
    });

    it('should allow access to group management', async () => {
      await element(by.id('tab-groups')).tap();
      await waitForElementToBeVisible('groups-screen');

      // Should see leader-specific features
      await expect(element(by.id('manage-my-groups'))).toBeVisible();
      await expect(element(by.id('attendance-tracking'))).toBeVisible();

      await takeScreenshot('leader-groups-access');
    });
  });

  describe('VIP Navigation', () => {
    beforeEach(async () => {
      await loginAsUser('vip');
    });

    it('should show VIP-specific navigation', async () => {
      await expect(element(by.id('tab-first-timers'))).toBeVisible();
      await expect(element(by.id('tab-follow-up'))).toBeVisible();

      await takeScreenshot('vip-navigation');
    });

    it('should allow access to first-timer management', async () => {
      await element(by.id('tab-first-timers')).tap();
      await waitForElementToBeVisible('first-timers-screen');

      await expect(element(by.id('new-first-timer-button'))).toBeVisible();
      await expect(element(by.id('follow-up-assignments'))).toBeVisible();

      await takeScreenshot('vip-first-timers-access');
    });
  });

  describe('Church Admin Navigation', () => {
    beforeEach(async () => {
      await loginAsUser('churchAdmin');
    });

    it('should show full admin navigation', async () => {
      await expect(element(by.id('tab-dashboard'))).toBeVisible();
      await expect(element(by.id('tab-members'))).toBeVisible();
      await expect(element(by.id('tab-services'))).toBeVisible();
      await expect(element(by.id('tab-events'))).toBeVisible();
      await expect(element(by.id('tab-reports'))).toBeVisible();

      await takeScreenshot('admin-navigation');
    });

    it('should allow access to member management', async () => {
      await element(by.id('tab-members')).tap();
      await waitForElementToBeVisible('members-screen');

      await expect(element(by.id('add-member-button'))).toBeVisible();
      await expect(element(by.id('bulk-actions-menu'))).toBeVisible();

      await takeScreenshot('admin-members-access');
    });

    it('should restrict cross-tenant access', async () => {
      // Try to access Cebu data as Manila admin
      await device.openURL('drouple://admin/members?churchId=church-cebu');

      // Should filter to only Manila data or show access denied
      await waitForElementToBeVisible('members-screen');
      await expect(element(by.text('Manila'))).toBeVisible();
      await expect(element(by.text('Cebu'))).not.toBeVisible();

      await takeScreenshot('tenant-isolation');
    });
  });

  describe('Deep Link Navigation', () => {
    it('should handle role-appropriate deep links for member', async () => {
      await loginAsUser('member');

      // Valid deep link for member
      await device.openURL('drouple://events/youth-night');
      await waitForElementToBeVisible('event-detail-screen');

      await takeScreenshot('member-valid-deeplink');

      // Invalid deep link for member
      await device.openURL('drouple://admin/members');
      await waitForElementToBeVisible('access-denied-screen');

      await takeScreenshot('member-invalid-deeplink');
    });

    it('should handle authenticated deep links', async () => {
      // Try deep link without authentication
      await device.openURL('drouple://dashboard');

      // Should redirect to login
      await waitForElementToBeVisible('login-screen');

      // Login and should navigate to intended destination
      await loginAsUser('member');
      await waitForElementToBeVisible('dashboard-screen');

      await takeScreenshot('authenticated-deeplink');
    });
  });

  describe('Progressive Role Access', () => {
    it('should upgrade navigation when role changes', async () => {
      // Login as member
      await loginAsUser('member');

      // Mock role upgrade to leader
      await device.mockRoleUpgrade('LEADER');

      // Trigger navigation refresh
      await device.reloadReactNative();

      // Should now see leader navigation
      await waitForElementToBeVisible('dashboard-screen');
      await expect(element(by.id('tab-groups'))).toBeVisible();

      await takeScreenshot('role-upgrade-navigation');
    });
  });

  describe('Accessibility Navigation', () => {
    it('should support screen reader navigation', async () => {
      await loginAsUser('member');
      await device.enableAccessibility();

      // Should announce current screen
      const dashboard = element(by.id('dashboard-screen'));
      await expect(dashboard).toHaveAccessibilityRole('main');
      await expect(dashboard).toHaveAccessibilityLabel('Dashboard screen');

      // Navigation should be accessible
      const checkInTab = element(by.id('tab-checkin'));
      await expect(checkInTab).toHaveAccessibilityRole('tab');
      await expect(checkInTab).toHaveAccessibilityLabel('Check In tab');

      await takeScreenshot('accessible-navigation');
    });

    it('should support keyboard navigation', async () => {
      await loginAsUser('member');

      // Should focus first tab
      await device.pressKey('tab');
      await expect(element(by.id('tab-dashboard'))).toBeFocused();

      // Should navigate between tabs
      await device.pressKey('right');
      await expect(element(by.id('tab-checkin'))).toBeFocused();

      await takeScreenshot('keyboard-navigation');
    });
  });

  describe('Offline Navigation', () => {
    it('should maintain navigation in offline mode', async () => {
      await loginAsUser('member');
      await device.disableNetwork();

      // Should show offline indicator
      await waitForElementToBeVisible('offline-indicator');

      // Navigation should still work for cached screens
      await element(by.id('tab-checkin')).tap();
      await waitForElementToBeVisible('checkin-screen');

      await takeScreenshot('offline-navigation');

      await device.enableNetwork();
    });

    it('should disable network-dependent features when offline', async () => {
      await loginAsUser('churchAdmin');
      await device.disableNetwork();

      await element(by.id('tab-members')).tap();
      await waitForElementToBeVisible('members-screen');

      // Network-dependent actions should be disabled
      await expect(
        element(by.id('add-member-button'))
      ).toHaveAccessibilityState({ disabled: true });

      await takeScreenshot('offline-disabled-features');

      await device.enableNetwork();
    });
  });
});
