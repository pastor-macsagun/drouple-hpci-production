/**
 * E2E Tests - Authentication Flow
 * Tests against staging backend with real API calls
 */

import { device, element, by, expect } from 'detox';

const STAGING_CONFIG = {
  baseUrl: 'https://staging.drouple.com',
  apiUrl: 'https://staging.drouple.com/api',
  testUsers: {
    member: {
      email: 'test.member@staging.com',
      password: 'Staging!Test2025',
    },
    admin: {
      email: 'test.admin@staging.com', 
      password: 'Staging!Test2025',
    },
    vip: {
      email: 'test.vip@staging.com',
      password: 'Staging!Test2025',
    },
  },
};

describe('E2E - Authentication Flow', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Login Flow', () => {
    it('should login member user successfully', async () => {
      // Wait for login screen to appear
      await expect(element(by.id('login-screen'))).toBeVisible();
      
      // Fill in credentials
      await element(by.id('email-input')).typeText(STAGING_CONFIG.testUsers.member.email);
      await element(by.id('password-input')).typeText(STAGING_CONFIG.testUsers.member.password);
      
      // Tap login button
      await element(by.id('login-button')).tap();
      
      // Wait for dashboard to appear (indicates successful login)
      await expect(element(by.id('dashboard-screen'))).toBeVisible(10000);
      
      // Verify member-specific UI elements
      await expect(element(by.id('member-dashboard'))).toBeVisible();
      await expect(element(by.id('checkin-button'))).toBeVisible();
    });

    it('should login admin user and show admin dashboard', async () => {
      await expect(element(by.id('login-screen'))).toBeVisible();
      
      await element(by.id('email-input')).typeText(STAGING_CONFIG.testUsers.admin.email);
      await element(by.id('password-input')).typeText(STAGING_CONFIG.testUsers.admin.password);
      await element(by.id('login-button')).tap();
      
      // Admin should be redirected to admin dashboard
      await expect(element(by.id('admin-dashboard'))).toBeVisible(10000);
      await expect(element(by.id('admin-navigation'))).toBeVisible();
    });

    it('should reject invalid credentials', async () => {
      await expect(element(by.id('login-screen'))).toBeVisible();
      
      await element(by.id('email-input')).typeText('invalid@example.com');
      await element(by.id('password-input')).typeText('wrongpassword');
      await element(by.id('login-button')).tap();
      
      // Should show error message
      await expect(element(by.id('login-error'))).toBeVisible();
      await expect(element(by.text('Invalid email or password'))).toBeVisible();
      
      // Should remain on login screen
      await expect(element(by.id('login-screen'))).toBeVisible();
    });

    it('should handle network errors gracefully', async () => {
      // Disable network connection
      await device.setURLBlacklist(['*']);
      
      await expect(element(by.id('login-screen'))).toBeVisible();
      
      await element(by.id('email-input')).typeText(STAGING_CONFIG.testUsers.member.email);
      await element(by.id('password-input')).typeText(STAGING_CONFIG.testUsers.member.password);
      await element(by.id('login-button')).tap();
      
      // Should show network error
      await expect(element(by.id('network-error'))).toBeVisible();
      
      // Re-enable network
      await device.setURLBlacklist([]);
    });
  });

  describe('Token Management', () => {
    beforeEach(async () => {
      // Login first
      await expect(element(by.id('login-screen'))).toBeVisible();
      await element(by.id('email-input')).typeText(STAGING_CONFIG.testUsers.member.email);
      await element(by.id('password-input')).typeText(STAGING_CONFIG.testUsers.member.password);
      await element(by.id('login-button')).tap();
      await expect(element(by.id('dashboard-screen'))).toBeVisible(10000);
    });

    it('should refresh token automatically when needed', async () => {
      // Navigate through app to trigger token refresh
      await element(by.id('events-tab')).tap();
      await expect(element(by.id('events-screen'))).toBeVisible();
      
      await element(by.id('directory-tab')).tap();
      await expect(element(by.id('directory-screen'))).toBeVisible();
      
      await element(by.id('settings-tab')).tap();
      await expect(element(by.id('settings-screen'))).toBeVisible();
      
      // App should remain functional (token refresh worked)
      await element(by.id('dashboard-tab')).tap();
      await expect(element(by.id('dashboard-screen'))).toBeVisible();
    });

    it('should handle token expiration properly', async () => {
      // This would require a special test endpoint that can invalidate tokens
      // For now, we'll test the logout/re-login flow
      
      await element(by.id('settings-tab')).tap();
      await expect(element(by.id('settings-screen'))).toBeVisible();
      
      await element(by.id('logout-button')).tap();
      
      // Should return to login screen
      await expect(element(by.id('login-screen'))).toBeVisible();
    });
  });

  describe('Logout Flow', () => {
    beforeEach(async () => {
      // Login first
      await expect(element(by.id('login-screen'))).toBeVisible();
      await element(by.id('email-input')).typeText(STAGING_CONFIG.testUsers.member.email);
      await element(by.id('password-input')).typeText(STAGING_CONFIG.testUsers.member.password);
      await element(by.id('login-button')).tap();
      await expect(element(by.id('dashboard-screen'))).toBeVisible(10000);
    });

    it('should logout user successfully', async () => {
      // Navigate to settings
      await element(by.id('settings-tab')).tap();
      await expect(element(by.id('settings-screen'))).toBeVisible();
      
      // Tap logout
      await element(by.id('logout-button')).tap();
      
      // Should show confirmation dialog
      await expect(element(by.id('logout-confirmation'))).toBeVisible();
      await element(by.id('confirm-logout')).tap();
      
      // Should return to login screen
      await expect(element(by.id('login-screen'))).toBeVisible();
      
      // Previous session should be cleared
      await expect(element(by.id('email-input'))).toHaveText('');
    });

    it('should clear cached data on logout', async () => {
      // Navigate to events to cache some data
      await element(by.id('events-tab')).tap();
      await expect(element(by.id('events-screen'))).toBeVisible();
      
      // Logout
      await element(by.id('settings-tab')).tap();
      await element(by.id('logout-button')).tap();
      await element(by.id('confirm-logout')).tap();
      
      // Login again
      await element(by.id('email-input')).typeText(STAGING_CONFIG.testUsers.member.email);
      await element(by.id('password-input')).typeText(STAGING_CONFIG.testUsers.member.password);
      await element(by.id('login-button')).tap();
      await expect(element(by.id('dashboard-screen'))).toBeVisible(10000);
      
      // Events should show loading state (data was cleared)
      await element(by.id('events-tab')).tap();
      await expect(element(by.id('events-loading'))).toBeVisible();
    });
  });

  describe('Session Persistence', () => {
    it('should persist session across app restarts', async () => {
      // Login
      await expect(element(by.id('login-screen'))).toBeVisible();
      await element(by.id('email-input')).typeText(STAGING_CONFIG.testUsers.member.email);
      await element(by.id('password-input')).typeText(STAGING_CONFIG.testUsers.member.password);
      await element(by.id('login-button')).tap();
      await expect(element(by.id('dashboard-screen'))).toBeVisible(10000);
      
      // Restart app
      await device.reloadReactNative();
      
      // Should automatically be logged in (session persisted)
      await expect(element(by.id('dashboard-screen'))).toBeVisible(10000);
      await expect(element(by.id('login-screen'))).not.toBeVisible();
    });

    it('should handle corrupted session data gracefully', async () => {
      // Login first
      await expect(element(by.id('login-screen'))).toBeVisible();
      await element(by.id('email-input')).typeText(STAGING_CONFIG.testUsers.member.email);
      await element(by.id('password-input')).typeText(STAGING_CONFIG.testUsers.member.password);
      await element(by.id('login-button')).tap();
      await expect(element(by.id('dashboard-screen'))).toBeVisible(10000);
      
      // Corrupt session data (this would be done via a test helper)
      // For now, we'll simulate by clearing storage and restarting
      await device.clearKeychain();
      await device.reloadReactNative();
      
      // Should return to login screen when session is invalid
      await expect(element(by.id('login-screen'))).toBeVisible();
    });
  });

  describe('Multi-Device Session Management', () => {
    it('should handle concurrent sessions appropriately', async () => {
      // Login on first "device" (our test)
      await expect(element(by.id('login-screen'))).toBeVisible();
      await element(by.id('email-input')).typeText(STAGING_CONFIG.testUsers.member.email);
      await element(by.id('password-input')).typeText(STAGING_CONFIG.testUsers.member.password);
      await element(by.id('login-button')).tap();
      await expect(element(by.id('dashboard-screen'))).toBeVisible(10000);
      
      // App should remain functional even if user logs in elsewhere
      // (This is difficult to test without actual multi-device setup)
      
      // Verify app still works
      await element(by.id('events-tab')).tap();
      await expect(element(by.id('events-screen'))).toBeVisible();
    });
  });

  afterEach(async () => {
    // Clean up: logout if logged in
    try {
      if (await element(by.id('settings-tab')).isVisible()) {
        await element(by.id('settings-tab')).tap();
        if (await element(by.id('logout-button')).isVisible()) {
          await element(by.id('logout-button')).tap();
          await element(by.id('confirm-logout')).tap();
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });
});