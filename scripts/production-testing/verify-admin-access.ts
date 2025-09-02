#!/usr/bin/env tsx
/**
 * Verify Admin Access After Authentication Fix
 * Tests if admin routes are now accessible after login
 */

import { chromium, Browser, Page } from 'playwright';

async function verifyAdminAccess(): Promise<void> {
  console.log('🔍 Verifying Admin Access After Authentication Fix');
  console.log('═══════════════════════════════════════════════════');

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000 
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Step 1: Login as admin
    console.log('🔐 Step 1: Authenticating as admin...');
    await page.goto('https://www.drouple.app/auth/signin');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', 'admin.manila@test.com');
    await page.fill('#password', 'Hpci!Test2025');
    await page.waitForTimeout(2000);
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    console.log(`📍 After login URL: ${page.url()}`);
    await page.screenshot({ path: 'admin-access-1-post-login.png', fullPage: true });
    
    // Step 2: Try to access admin dashboard
    console.log('🏠 Step 2: Accessing admin dashboard...');
    await page.goto('https://www.drouple.app/admin');
    await page.waitForTimeout(3000);
    
    const adminUrl = page.url();
    console.log(`📍 Admin page URL: ${adminUrl}`);
    await page.screenshot({ path: 'admin-access-2-admin-page.png', fullPage: true });
    
    // Check if we're on admin page or redirected back to login
    if (adminUrl.includes('/auth/signin')) {
      console.log('❌ AUTHENTICATION STILL FAILING - Redirected back to login');
      console.log(`   Login redirect URL: ${adminUrl}`);
    } else if (adminUrl.includes('/admin')) {
      console.log('✅ AUTHENTICATION WORKING - Successfully accessing admin page');
      
      // Test admin functionality
      console.log('🧪 Step 3: Testing admin functionality...');
      
      const pageTitle = await page.title();
      console.log(`   Page Title: ${pageTitle}`);
      
      // Check for admin UI elements
      const elements = ['h1', 'h2', 'nav', 'button', '[data-testid]'];
      for (const selector of elements) {
        try {
          const count = await page.locator(selector).count();
          if (count > 0) {
            console.log(`   ${selector}: ${count} elements found`);
            if (count <= 3) {
              for (let i = 0; i < count; i++) {
                const text = await page.locator(selector).nth(i).textContent();
                if (text && text.trim().length > 0 && text.trim().length < 50) {
                  console.log(`     [${i}]: "${text.trim()}"`);
                }
              }
            }
          }
        } catch (e) {
          // Element not found
        }
      }
    } else {
      console.log(`⚠️  UNEXPECTED BEHAVIOR - Redirected to: ${adminUrl}`);
    }
    
    // Step 4: Test session persistence with page refresh
    console.log('🔄 Step 4: Testing session persistence...');
    await page.reload();
    await page.waitForTimeout(3000);
    
    const refreshUrl = page.url();
    console.log(`📍 After refresh URL: ${refreshUrl}`);
    await page.screenshot({ path: 'admin-access-3-after-refresh.png', fullPage: true });
    
    if (refreshUrl.includes('/admin') && !refreshUrl.includes('/auth/signin')) {
      console.log('✅ SESSION PERSISTENCE WORKING - Admin page accessible after refresh');
    } else {
      console.log('❌ SESSION PERSISTENCE FAILING - Lost session on refresh');
    }
    
    // Step 5: Test opening new tab
    console.log('🔗 Step 5: Testing new tab session...');
    const newPage = await context.newPage();
    await newPage.goto('https://www.drouple.app/admin');
    await newPage.waitForTimeout(3000);
    
    const newTabUrl = newPage.url();
    console.log(`📍 New tab URL: ${newTabUrl}`);
    await newPage.screenshot({ path: 'admin-access-4-new-tab.png', fullPage: true });
    
    if (newTabUrl.includes('/admin') && !newTabUrl.includes('/auth/signin')) {
      console.log('✅ SESSION SHARING WORKING - Admin accessible in new tab');
    } else {
      console.log('❌ SESSION SHARING FAILING - No session in new tab');
    }
    
    await newPage.close();
    await context.close();
    
  } finally {
    await browser.close();
  }
  
  console.log('\n✅ Admin access verification completed');
  console.log('Check the generated screenshots for visual confirmation');
}

if (require.main === module) {
  verifyAdminAccess().catch(console.error);
}

export default verifyAdminAccess;