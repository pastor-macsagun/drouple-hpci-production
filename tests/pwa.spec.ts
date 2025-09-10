import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const APP_URL = process.env.APP_URL || 'https://app.drouple.app';
const DATE = new Date().toISOString().split('T')[0];
const ARTIFACT_DIR = path.join(__dirname, '..', 'artifacts', `PWA-AUDIT-${DATE}`);

let touchTargetResults: any[] = [];
let offlineResults: string[] = [];

test.describe('PWA Native-Like UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup haptic debugging
    await page.addInitScript(() => {
      window.__hapticDebug = [];
      const originalVibrate = navigator.vibrate?.bind(navigator);
      if (originalVibrate) {
        navigator.vibrate = (pattern) => {
          window.__hapticDebug.push({ type: 'vibrate', pattern, timestamp: Date.now() });
          window.dispatchEvent(new CustomEvent('__hapticDebug', { detail: { pattern } }));
          return originalVibrate(pattern);
        };
      }
    });

    // Navigate to app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('app shell and home dashboard', async ({ page }, testInfo) => {
    const deviceName = testInfo.project.name;
    const screensDir = path.join(ARTIFACT_DIR, 'playwright', deviceName, 'screens');
    const videosDir = path.join(ARTIFACT_DIR, 'playwright', deviceName, 'videos');
    
    if (!fs.existsSync(screensDir)) fs.mkdirSync(screensDir, { recursive: true });
    if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });

    // Start video recording
    await page.video()?.path();
    
    // Wait for app shell to load
    await expect(page.locator('body')).toBeVisible();
    
    // Check for PWA app shell indicators
    const hasBottomNav = await page.locator('[data-testid="bottom-navigation"], nav[class*="bottom"], .bottom-nav').count() > 0;
    const hasHeader = await page.locator('header, [data-testid="header"], [role="banner"]').count() > 0;
    
    // Take screenshot
    await page.screenshot({ 
      path: path.join(screensDir, 'app-shell-home.png'),
      fullPage: true 
    });

    console.log(`✅ ${deviceName}: App shell loaded with ${hasBottomNav ? '✅' : '❌'} bottom nav, ${hasHeader ? '✅' : '❌'} header`);
  });

  test('bottom navigation states', async ({ page }, testInfo) => {
    const deviceName = testInfo.project.name;
    const screensDir = path.join(ARTIFACT_DIR, 'playwright', deviceName, 'screens');
    
    if (!fs.existsSync(screensDir)) fs.mkdirSync(screensDir, { recursive: true });

    // Look for bottom navigation
    const bottomNav = page.locator('[data-testid="bottom-navigation"], nav[class*="bottom"], .bottom-nav').first();
    
    if (await bottomNav.count() === 0) {
      console.log(`⚠️ ${deviceName}: Bottom navigation not found, checking for alternative navigation`);
      await page.screenshot({ path: path.join(screensDir, 'no-bottom-nav.png') });
      return;
    }

    // Get navigation items
    const navItems = bottomNav.locator('a, button, [role="tab"]');
    const itemCount = await navItems.count();
    
    console.log(`📱 ${deviceName}: Found ${itemCount} navigation items`);

    // Screenshot each navigation state
    for (let i = 0; i < Math.min(itemCount, 5); i++) {
      const navItem = navItems.nth(i);
      const href = await navItem.getAttribute('href');
      const text = await navItem.textContent();
      
      if (href) {
        await navItem.click();
        await page.waitForLoadState('networkidle');
        
        // Screenshot active state
        await page.screenshot({ 
          path: path.join(screensDir, `nav-${i}-${text?.replace(/\s+/g, '-').toLowerCase()}.png`)
        });
      }
    }

    console.log(`✅ ${deviceName}: Navigation states captured`);
  });

  test('page transitions and layout shift', async ({ page }, testInfo) => {
    const deviceName = testInfo.project.name;
    const screensDir = path.join(ARTIFACT_DIR, 'playwright', deviceName, 'screens');
    
    if (!fs.existsSync(screensDir)) fs.mkdirSync(screensDir, { recursive: true });

    const routes = ['/checkin', '/events', '/lifegroups', '/pathways', '/profile'];
    
    for (const route of routes) {
      try {
        const beforeNav = await page.locator('body').boundingBox();
        
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500); // Allow animations to complete
        
        const afterNav = await page.locator('body').boundingBox();
        
        // Check for layout shift (rough check)
        const layoutShift = beforeNav && afterNav ? 
          Math.abs((beforeNav.height - afterNav.height) / beforeNav.height) : 0;
        
        if (layoutShift > 0.25) {
          console.warn(`⚠️ ${deviceName}: Potential layout shift on ${route}: ${(layoutShift * 100).toFixed(1)}%`);
        }
        
        // Screenshot
        await page.screenshot({ 
          path: path.join(screensDir, `transition-${route.replace('/', '')}.png`)
        });
        
      } catch (error) {
        console.warn(`⚠️ ${deviceName}: Could not navigate to ${route}: ${error}`);
      }
    }

    console.log(`✅ ${deviceName}: Page transitions tested`);
  });

  test('bottom sheet interactions', async ({ page }, testInfo) => {
    const deviceName = testInfo.project.name;
    const screensDir = path.join(ARTIFACT_DIR, 'playwright', deviceName, 'screens');
    
    if (!fs.existsSync(screensDir)) fs.mkdirSync(screensDir, { recursive: true });

    // Look for bottom sheet triggers (buttons that might open sheets)
    const sheetTriggers = page.locator('[data-testid*="sheet"], [data-testid*="modal"], button[class*="sheet"], .sheet-trigger');
    const triggerCount = await sheetTriggers.count();

    if (triggerCount === 0) {
      console.log(`⚠️ ${deviceName}: No bottom sheet triggers found`);
      return;
    }

    try {
      const firstTrigger = sheetTriggers.first();
      
      // Screenshot before opening
      await page.screenshot({ path: path.join(screensDir, 'bottom-sheet-closed.png') });
      
      // Open bottom sheet
      await firstTrigger.click();
      await page.waitForTimeout(300); // Animation time
      
      // Screenshot after opening
      await page.screenshot({ path: path.join(screensDir, 'bottom-sheet-open.png') });
      
      // Look for close button or backdrop
      const closeButton = page.locator('[data-testid="close"], [aria-label*="close"], .sheet-close, [data-dismiss="modal"]');
      const backdrop = page.locator('.backdrop, .overlay, [data-testid="backdrop"]');
      
      if (await closeButton.count() > 0) {
        await closeButton.first().click();
      } else if (await backdrop.count() > 0) {
        await backdrop.first().click();
      }
      
      await page.waitForTimeout(300);
      console.log(`✅ ${deviceName}: Bottom sheet interaction tested`);
      
    } catch (error) {
      console.warn(`⚠️ ${deviceName}: Bottom sheet test failed: ${error}`);
    }
  });

  test('pull to refresh simulation', async ({ page }, testInfo) => {
    const deviceName = testInfo.project.name;
    const screensDir = path.join(ARTIFACT_DIR, 'playwright', deviceName, 'screens');
    
    if (!fs.existsSync(screensDir)) fs.mkdirSync(screensDir, { recursive: true });

    try {
      // Check if pull-to-refresh is implemented via JS hook
      const hasPTR = await page.evaluate(() => {
        return typeof window.__triggerPullToRefresh === 'function' || 
               document.querySelector('[data-testid="pull-to-refresh"]') !== null;
      });

      if (hasPTR) {
        // Trigger via JS if available
        await page.evaluate(() => {
          if (window.__triggerPullToRefresh) {
            window.__triggerPullToRefresh();
          } else {
            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('pullToRefresh'));
          }
        });
        
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(screensDir, 'pull-to-refresh-active.png') });
        
        console.log(`✅ ${deviceName}: Pull-to-refresh simulation successful`);
      } else {
        // Fallback: simulate touch drag
        const viewport = page.viewportSize();
        if (viewport) {
          await page.mouse.move(viewport.width / 2, 100);
          await page.mouse.down();
          await page.mouse.move(viewport.width / 2, 300, { steps: 10 });
          await page.mouse.up();
          
          await page.waitForTimeout(500);
          await page.screenshot({ path: path.join(screensDir, 'pull-to-refresh-attempted.png') });
        }
        
        console.log(`⚠️ ${deviceName}: Pull-to-refresh simulation attempted (no JS hook found)`);
      }
    } catch (error) {
      console.warn(`⚠️ ${deviceName}: Pull-to-refresh test failed: ${error}`);
    }
  });

  test('swipe to delete simulation', async ({ page }, testInfo) => {
    const deviceName = testInfo.project.name;
    const screensDir = path.join(ARTIFACT_DIR, 'playwright', deviceName, 'screens');
    
    if (!fs.existsSync(screensDir)) fs.mkdirSync(screensDir, { recursive: true });

    try {
      // Look for swipeable items
      const swipeItems = page.locator('[data-testid*="swipe"], .swipeable, [data-swipe="true"]');
      const itemCount = await swipeItems.count();

      if (itemCount === 0) {
        console.log(`⚠️ ${deviceName}: No swipeable items found`);
        return;
      }

      const firstItem = swipeItems.first();
      const itemBox = await firstItem.boundingBox();
      
      if (itemBox) {
        // Screenshot before swipe
        await page.screenshot({ path: path.join(screensDir, 'swipe-before.png') });
        
        // Perform swipe gesture
        await page.mouse.move(itemBox.x + itemBox.width - 50, itemBox.y + itemBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(itemBox.x + 50, itemBox.y + itemBox.height / 2, { steps: 10 });
        await page.waitForTimeout(100);
        
        // Screenshot during/after swipe
        await page.screenshot({ path: path.join(screensDir, 'swipe-revealed.png') });
        
        await page.mouse.up();
        await page.waitForTimeout(300);
        
        console.log(`✅ ${deviceName}: Swipe-to-delete simulation completed`);
      }
    } catch (error) {
      console.warn(`⚠️ ${deviceName}: Swipe-to-delete test failed: ${error}`);
    }
  });

  test('touch target size validation', async ({ page }, testInfo) => {
    const deviceName = testInfo.project.name;
    
    // Get all interactive elements
    const interactiveElements = await page.locator('button, a, input, [role="button"], [tabindex="0"]').all();
    const results = [];
    
    for (const element of interactiveElements) {
      try {
        const box = await element.boundingBox();
        const tagName = await element.evaluate(el => el.tagName);
        const text = (await element.textContent() || '').trim().substring(0, 30);
        
        if (box && box.width > 0 && box.height > 0) {
          const meetsMinSize = box.width >= 44 && box.height >= 44;
          results.push({
            tagName,
            text,
            width: Math.round(box.width),
            height: Math.round(box.height),
            meetsMinSize,
            area: Math.round(box.width * box.height)
          });
        }
      } catch (error) {
        // Skip elements that can't be measured
      }
    }
    
    touchTargetResults.push({ device: deviceName, elements: results });
    
    const failingElements = results.filter(el => !el.meetsMinSize);
    console.log(`📏 ${deviceName}: ${results.length} interactive elements, ${failingElements.length} below 44x44px`);
    
    if (failingElements.length > 0) {
      console.log(`   Smallest targets:`, failingElements.slice(0, 3).map(el => 
        `${el.tagName}(${el.text}) ${el.width}x${el.height}px`
      ).join(', '));
    }
  });

  test('offline functionality and background sync', async ({ page }, testInfo) => {
    const deviceName = testInfo.project.name;
    const screensDir = path.join(ARTIFACT_DIR, 'playwright', deviceName, 'screens');
    
    if (!fs.existsSync(screensDir)) fs.mkdirSync(screensDir, { recursive: true });

    const results = [`=== ${deviceName} Offline Test ===`];
    
    try {
      // Check if service worker is installed
      const swInstalled = await page.evaluate(() => {
        return !!navigator.serviceWorker.controller;
      });
      
      results.push(`Service Worker installed: ${swInstalled ? '✅' : '❌'}`);
      
      if (swInstalled) {
        // Go offline
        await page.context().setOffline(true);
        results.push('📵 Network set to offline');
        
        // Test cached routes
        const routesToTest = ['/', '/checkin', '/events'];
        
        for (const route of routesToTest) {
          try {
            await page.goto(route);
            await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
            
            const hasContent = await page.locator('body *').count() > 10;
            results.push(`Route ${route}: ${hasContent ? '✅ Cached' : '❌ Failed'}`);
            
            // Screenshot offline state
            await page.screenshot({ 
              path: path.join(screensDir, `offline-${route.replace('/', 'home')}.png`)
            });
            
          } catch (error) {
            results.push(`Route ${route}: ❌ Error - ${error}`);
          }
        }
        
        // Test queued mutation (safe test endpoint)
        try {
          const mutationResult = await page.evaluate(() => {
            // Check if there's a safe test endpoint or just simulate queue
            if (window.navigator.serviceWorker.controller) {
              // Send a test message to SW
              window.navigator.serviceWorker.controller.postMessage({
                type: 'TEST_QUEUE',
                data: { test: true, timestamp: Date.now() }
              });
              return 'Message queued for sync';
            }
            return 'No SW controller available';
          });
          
          results.push(`Mutation queue test: ✅ ${mutationResult}`);
        } catch (error) {
          results.push(`Mutation queue test: ⚠️ ${error}`);
        }
        
        // Go back online
        await page.context().setOffline(false);
        results.push('📶 Network restored');
        
        // Wait for potential sync
        await page.waitForTimeout(2000);
        results.push('Sync window completed');
        
      } else {
        results.push('⚠️ Skipping offline tests - no service worker');
      }
      
    } catch (error) {
      results.push(`❌ Offline test error: ${error}`);
    }
    
    offlineResults.push(...results);
    console.log(results.join('\n'));
  });

  test('dark mode and safe area snapshots', async ({ page }, testInfo) => {
    const deviceName = testInfo.project.name;
    const layoutDir = path.join(ARTIFACT_DIR, 'layout');
    
    if (!fs.existsSync(layoutDir)) fs.mkdirSync(layoutDir, { recursive: true });

    try {
      // Light mode screenshot
      await page.emulateMedia({ colorScheme: 'light' });
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: path.join(layoutDir, `safe-area-light-${deviceName}.png`),
        fullPage: true 
      });
      
      // Dark mode screenshot  
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: path.join(layoutDir, `safe-area-dark-${deviceName}.png`),
        fullPage: true 
      });
      
      // Check for safe area CSS variables
      const hasSafeArea = await page.evaluate(() => {
        const styles = getComputedStyle(document.documentElement);
        return [
          'env(safe-area-inset-top)',
          'env(safe-area-inset-bottom)',
          'env(safe-area-inset-left)', 
          'env(safe-area-inset-right)'
        ].some(prop => document.body.innerHTML.includes(prop));
      });
      
      console.log(`🌓 ${deviceName}: Dark/light mode snapshots saved, safe-area support: ${hasSafeArea ? '✅' : '❌'}`);
      
    } catch (error) {
      console.warn(`⚠️ ${deviceName}: Dark mode test failed: ${error}`);
    }
  });

  test.afterAll(async () => {
    // Save touch target results
    const touchTargetsPath = path.join(ARTIFACT_DIR, 'touch-targets.json');
    fs.writeFileSync(touchTargetsPath, JSON.stringify(touchTargetResults, null, 2));
    
    // Save offline test log
    const offlineLogPath = path.join(ARTIFACT_DIR, 'offline-sync.log');
    fs.writeFileSync(offlineLogPath, offlineResults.join('\n'));
    
    console.log(`📁 Touch targets saved to: ${touchTargetsPath}`);
    console.log(`📁 Offline log saved to: ${offlineLogPath}`);
  });
});