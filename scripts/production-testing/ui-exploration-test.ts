#!/usr/bin/env tsx
/**
 * UI Exploration Test
 * Explores actual UI structure in production to update test selectors
 */

import { chromium, Browser, Page } from 'playwright';

async function exploreProductionUI(): Promise<void> {
  console.log('🔍 Exploring Production UI Structure');
  console.log('═══════════════════════════════════');

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000 
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Authenticate as admin
    console.log('🔐 Authenticating as admin...');
    await page.goto('https://www.drouple.app/auth/signin');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', 'admin.manila@test.com');
    await page.fill('#password', 'Hpci!Test2025');
    await page.waitForTimeout(1000);
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(5000);
    console.log(`📍 Current URL after login: ${page.url()}`);
    
    // Take screenshot of post-login state
    await page.screenshot({ path: 'ui-exploration-1-post-login.png', fullPage: true });
    console.log('📸 Screenshot: ui-exploration-1-post-login.png');
    
    // Try navigating to admin pages and document what we find
    const adminPages = [
      '/admin',
      '/admin/members', 
      '/admin/services',
      '/admin/events',
      '/admin/lifegroups',
      '/admin/pathways'
    ];
    
    for (let i = 0; i < adminPages.length; i++) {
      const adminPage = adminPages[i];
      console.log(`\n📄 Exploring: ${adminPage}`);
      
      try {
        await page.goto(`https://www.drouple.app${adminPage}`);
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        console.log(`   Current URL: ${currentUrl}`);
        
        // Take screenshot
        await page.screenshot({ 
          path: `ui-exploration-${i+2}-${adminPage.replace(/\//g, '-')}.png`, 
          fullPage: true 
        });
        console.log(`   Screenshot: ui-exploration-${i+2}-${adminPage.replace(/\//g, '-')}.png`);
        
        // Get page title
        const title = await page.title();
        console.log(`   Page Title: ${title}`);
        
        // Check for common UI elements
        const elements = [
          'h1', 'h2', 'h3',
          '[data-testid]',
          'button',
          'table',
          '.card',
          '.btn',
          'nav'
        ];
        
        for (const selector of elements) {
          try {
            const count = await page.locator(selector).count();
            if (count > 0) {
              console.log(`   ${selector}: ${count} found`);
              
              // Get text content of first few elements
              if (count <= 5) {
                for (let j = 0; j < count; j++) {
                  const text = await page.locator(selector).nth(j).textContent();
                  if (text && text.trim().length > 0 && text.trim().length < 100) {
                    console.log(`     [${j}]: "${text.trim()}"`);
                  }
                }
              }
            }
          } catch (e) {
            // Element not found, continue
          }
        }
        
        // Get all data-testid attributes
        try {
          const testIds = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('[data-testid]'))
              .map(el => el.getAttribute('data-testid'))
              .filter(Boolean);
          });
          if (testIds.length > 0) {
            console.log(`   Test IDs found: ${testIds.join(', ')}`);
          }
        } catch (e) {
          // No test IDs found
        }
        
      } catch (error) {
        console.log(`   ❌ Error accessing ${adminPage}: ${error}`);
      }
    }
    
    await context.close();
    
  } finally {
    await browser.close();
  }
  
  console.log('\n✅ UI exploration completed');
  console.log('Check the generated screenshots for visual verification');
}

if (require.main === module) {
  exploreProductionUI().catch(console.error);
}

export default exploreProductionUI;