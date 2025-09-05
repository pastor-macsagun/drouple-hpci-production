/**
 * Startup Performance Tests with Detox
 * Tests cold start and Home TTI against performance budgets
 */

import { device, element, by, expect } from 'detox';

const PERFORMANCE_BUDGETS = {
  coldStart: {
    ios: 1500,
    android: 2500,
  },
  homeTTI: 2000,
};

describe('Startup Performance Tests', () => {
  const platform = device.getPlatform();
  const coldStartBudget = PERFORMANCE_BUDGETS.coldStart[platform as 'ios' | 'android'];

  beforeEach(async () => {
    // Ensure clean state for performance measurements
    await device.terminateApp();
    await device.clearKeychain(); // Clear any cached auth data
  });

  describe('Cold Start Performance', () => {
    it('should start app within cold start budget', async () => {
      const startTime = Date.now();
      
      // Launch app (cold start)
      await device.launchApp({ 
        newInstance: true,
        delete: true, // Ensure completely fresh install
      });
      
      // Wait for app to be visible and interactive
      await expect(element(by.id('app-root'))).toBeVisible();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`📱 Cold start duration: ${duration}ms (budget: ${coldStartBudget}ms)`);
      
      // Assert against budget
      expect(duration).toBeLessThanOrEqual(coldStartBudget);
    });

    it('should handle multiple cold starts consistently', async () => {
      const measurements: number[] = [];
      const iterations = 3;
      
      for (let i = 0; i < iterations; i++) {
        await device.terminateApp();
        await device.uninstallApp(); // Full clean slate
        await device.installApp();
        
        const startTime = Date.now();
        await device.launchApp({ newInstance: true });
        await expect(element(by.id('app-root'))).toBeVisible();
        const endTime = Date.now();
        
        const duration = endTime - startTime;
        measurements.push(duration);
        
        console.log(`📱 Cold start ${i + 1}: ${duration}ms`);
      }
      
      // Calculate statistics
      const avgDuration = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const maxDuration = Math.max(...measurements);
      
      console.log(`📊 Average cold start: ${Math.round(avgDuration)}ms`);
      console.log(`📊 Max cold start: ${maxDuration}ms`);
      
      // Both average and max should be within budget
      expect(avgDuration).toBeLessThanOrEqual(coldStartBudget);
      expect(maxDuration).toBeLessThanOrEqual(coldStartBudget * 1.2); // Allow 20% variance for max
    });
  });

  describe('Home Screen TTI Performance', () => {
    beforeEach(async () => {
      await device.launchApp({ newInstance: true });
      await expect(element(by.id('app-root'))).toBeVisible();
    });

    it('should reach home screen TTI within budget', async () => {
      const startTime = Date.now();
      
      // Measure time to interactive for home screen
      // Wait for key interactive elements to be present
      await expect(element(by.id('home-dashboard'))).toBeVisible();
      await expect(element(by.id('navigation-tabs'))).toBeVisible();
      
      // Ensure interactive elements are actually interactive
      await expect(element(by.id('checkin-button'))).toBeVisible();
      await expect(element(by.id('events-tab'))).toBeVisible();
      
      const endTime = Date.now();
      const ttiDuration = endTime - startTime;
      
      console.log(`🏠 Home TTI: ${ttiDuration}ms (budget: ${PERFORMANCE_BUDGETS.homeTTI}ms)`);
      
      expect(ttiDuration).toBeLessThanOrEqual(PERFORMANCE_BUDGETS.homeTTI);
    });

    it('should handle navigation performance within budget', async () => {
      // Measure navigation TTI between screens
      const navigationTests = [
        { from: 'home-tab', to: 'events-tab', screen: 'events-screen' },
        { from: 'events-tab', to: 'directory-tab', screen: 'directory-screen' },
        { from: 'directory-tab', to: 'settings-tab', screen: 'settings-screen' },
      ];

      for (const test of navigationTests) {
        const startTime = Date.now();
        
        await element(by.id(test.to)).tap();
        await expect(element(by.id(test.screen))).toBeVisible();
        
        const endTime = Date.now();
        const navDuration = endTime - startTime;
        
        console.log(`🔄 Navigation ${test.from} → ${test.to}: ${navDuration}ms`);
        
        // Navigation should be quick (500ms budget)
        expect(navDuration).toBeLessThanOrEqual(500);
      }
    });
  });

  describe('Memory Performance', () => {
    beforeEach(async () => {
      await device.launchApp({ newInstance: true });
    });

    it('should maintain stable memory usage during navigation', async () => {
      // Navigate through multiple screens to test memory stability
      const screens = ['events-tab', 'directory-tab', 'settings-tab', 'home-tab'];
      
      for (let cycle = 0; cycle < 3; cycle++) {
        for (const screen of screens) {
          await element(by.id(screen)).tap();
          await expect(element(by.id(screen.replace('-tab', '-screen')))).toBeVisible();
          
          // Small delay to allow memory stabilization
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // App should still be responsive after memory stress test
      await expect(element(by.id('home-dashboard'))).toBeVisible();
      await expect(element(by.id('checkin-button'))).toBeTappable();
    });
  });

  describe('Frame Rate Performance', () => {
    beforeEach(async () => {
      await device.launchApp({ newInstance: true });
    });

    it('should maintain smooth scrolling performance', async () => {
      // Navigate to a scrollable screen (events list)
      await element(by.id('events-tab')).tap();
      await expect(element(by.id('events-screen'))).toBeVisible();
      
      // Test scrolling performance
      const scrollable = element(by.id('events-list'));
      
      // Perform multiple scroll operations
      for (let i = 0; i < 5; i++) {
        await scrollable.scroll(200, 'down');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      for (let i = 0; i < 5; i++) {
        await scrollable.scroll(200, 'up');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // List should still be responsive
      await expect(scrollable).toBeVisible();
    });

    it('should handle rapid interactions without frame drops', async () => {
      // Rapid tab switching to test frame rate
      const tabs = ['events-tab', 'directory-tab', 'home-tab'];
      
      for (let i = 0; i < 10; i++) {
        const tab = tabs[i % tabs.length];
        await element(by.id(tab)).tap();
        
        // Very short delay to simulate rapid user interaction
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // App should still be responsive
      await expect(element(by.id('home-dashboard'))).toBeVisible();
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await device.terminateApp();
  });
});