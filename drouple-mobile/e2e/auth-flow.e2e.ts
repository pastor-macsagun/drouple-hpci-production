/**
 * Authentication Flow E2E Tests
 * Tests complete auth journey including biometric and offline scenarios
 */

import {
  loginAsUser,
  logout,
  testUsers,
  waitForElementToBeVisible,
  takeScreenshot,
} from './setup';

describe('Authentication Flow', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Login Flow', () => {
    it('should successfully login as member', async () => {
      await loginAsUser('member');

      // Verify dashboard is visible
      await waitForElementToBeVisible('dashboard-screen');
      await expect(element(by.text('Welcome, Church Member'))).toBeVisible();

      await takeScreenshot('member-dashboard');
    });

    it('should successfully login as leader', async () => {
      await loginAsUser('leader');

      // Verify leader-specific elements
      await waitForElementToBeVisible('groups-management-card');
      await expect(element(by.text('Life Group Leader'))).toBeVisible();

      await takeScreenshot('leader-dashboard');
    });

    it('should successfully login as VIP', async () => {
      await loginAsUser('vip');

      // Verify VIP-specific elements
      await waitForElementToBeVisible('first-timers-card');
      await expect(element(by.text('VIP Team Member'))).toBeVisible();

      await takeScreenshot('vip-dashboard');
    });

    it('should successfully login as church admin', async () => {
      await loginAsUser('churchAdmin');

      // Verify admin-specific elements
      await waitForElementToBeVisible('members-management-card');
      await expect(element(by.text('Church Admin'))).toBeVisible();

      await takeScreenshot('admin-dashboard');
    });

    it('should handle invalid credentials', async () => {
      await waitForElementToBeVisible('login-screen');

      await element(by.id('email-input')).typeText('invalid@example.com');
      await element(by.id('password-input')).typeText('wrongpassword');
      await element(by.id('login-button')).tap();

      // Should show error message
      await waitForElementToBeVisible('login-error');
      await expect(element(by.text('Invalid credentials'))).toBeVisible();

      await takeScreenshot('login-error');
    });
  });

  describe('Biometric Authentication', () => {
    it('should enable biometric login', async () => {
      await loginAsUser('member');

      // Navigate to settings
      await element(by.id('tab-more')).tap();
      await waitForElementToBeVisible('more-screen');

      await element(by.id('security-settings-button')).tap();
      await waitForElementToBeVisible('security-screen');

      // Enable biometric
      await element(by.id('biometric-toggle')).tap();

      // Should show biometric prompt
      await waitForElementToBeVisible('biometric-prompt');

      // Mock biometric success
      await device.setBiometricEnrollment(true);

      await takeScreenshot('biometric-enabled');

      // Logout and test biometric login
      await logout();

      await waitForElementToBeVisible('biometric-login-button');
      await element(by.id('biometric-login-button')).tap();

      // Should login successfully
      await waitForElementToBeVisible('dashboard-screen');
    });
  });

  describe('Offline Authentication', () => {
    it('should handle offline login with cached credentials', async () => {
      // First, login while online to cache credentials
      await loginAsUser('member');
      await logout();

      // Disable network
      await device.disableNetwork();

      // Attempt login
      await waitForElementToBeVisible('login-screen');
      await element(by.id('email-input')).typeText(testUsers.member.email);
      await element(by.id('password-input')).typeText(
        testUsers.member.password
      );
      await element(by.id('login-button')).tap();

      // Should show offline indicator but allow login
      await waitForElementToBeVisible('offline-indicator');
      await waitForElementToBeVisible('dashboard-screen');

      await takeScreenshot('offline-login-success');

      // Re-enable network
      await device.enableNetwork();
    });

    it('should show offline warning when network is unavailable', async () => {
      await device.disableNetwork();

      await waitForElementToBeVisible('login-screen');

      // Should show offline indicator
      await waitForElementToBeVisible('offline-indicator');
      await expect(element(by.text('Offline Mode'))).toBeVisible();

      await takeScreenshot('offline-login-screen');

      await device.enableNetwork();
    });
  });

  describe('Session Management', () => {
    it('should auto-refresh expired tokens', async () => {
      await loginAsUser('member');

      // Mock token expiration
      await device.setStatusBar({ time: '2024-12-31T23:59:59Z' });

      // Navigate to trigger token refresh
      await element(by.id('tab-events')).tap();

      // Should refresh token silently
      await waitForElementToBeVisible('events-screen');

      await takeScreenshot('token-refreshed');
    });

    it('should redirect to login when refresh token expires', async () => {
      await loginAsUser('member');

      // Mock both tokens expired
      await device.setStatusBar({ time: '2025-12-31T23:59:59Z' });

      // Navigate to trigger token validation
      await element(by.id('tab-events')).tap();

      // Should redirect to login
      await waitForElementToBeVisible('login-screen');
      await expect(element(by.text('Session expired'))).toBeVisible();

      await takeScreenshot('session-expired');
    });
  });

  describe('Logout Flow', () => {
    it('should successfully logout', async () => {
      await loginAsUser('member');
      await logout();

      // Should be back to login screen
      await waitForElementToBeVisible('login-screen');

      await takeScreenshot('logout-success');
    });

    it('should clear biometric data on logout', async () => {
      // Enable biometric first
      await loginAsUser('member');
      await element(by.id('tab-more')).tap();
      await element(by.id('security-settings-button')).tap();
      await element(by.id('biometric-toggle')).tap();

      await logout();

      // Biometric button should not be visible
      await waitForElementToBeVisible('login-screen');
      await expect(element(by.id('biometric-login-button'))).not.toBeVisible();

      await takeScreenshot('biometric-cleared');
    });
  });
});
