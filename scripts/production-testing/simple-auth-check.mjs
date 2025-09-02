#!/usr/bin/env node

/**
 * Simple Auth Diagnostic Tool
 * Checks basic auth functionality without Playwright complexity
 */

import { chromium } from 'playwright';

const PRODUCTION_URL = 'https://www.drouple.app';

async function simpleAuthCheck() {
  console.log('🔍 Simple Auth Check Starting...');
  
  const browser = await chromium.launch({ 
    headless: false,  // Show browser for debugging
    slowMo: 1000      // Slow down for visibility
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Enable request/response logging
    page.on('request', request => {
      if (request.url().includes('/api/auth/')) {
        console.log('➤ AUTH REQUEST:', request.method(), request.url());
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/auth/')) {
        console.log('➤ AUTH RESPONSE:', response.status(), response.url());
      }
    });
    
    // Navigate to signin page
    console.log('➤ Navigating to signin page...');
    await page.goto(`${PRODUCTION_URL}/auth/signin`, { waitUntil: 'networkidle' });
    
    // Wait a bit more to ensure page is fully loaded
    await page.waitForTimeout(3000);
    
    // Check if login form exists
    const emailInput = await page.locator('#email').first();
    const passwordInput = await page.locator('#password').first();
    const submitButton = await page.locator('button[type="submit"]').first();
    
    console.log('➤ Checking form elements...');
    console.log('   Email input exists:', await emailInput.isVisible());
    console.log('   Password input exists:', await passwordInput.isVisible());
    console.log('   Submit button exists:', await submitButton.isVisible());
    
    if (!await emailInput.isVisible()) {
      console.log('❌ Email input not found - page may not be loading correctly');
      
      // Let's see what's actually on the page
      const pageTitle = await page.title();
      const pageContent = await page.textContent('body');
      console.log('Page title:', pageTitle);
      console.log('Page content (first 500 chars):', pageContent?.substring(0, 500));
      
      return false;
    }
    
    // Try to fill and submit the form
    console.log('➤ Filling login form...');
    await emailInput.fill('admin.manila@test.com');
    await passwordInput.fill('Hpci!Test2025');
    
    console.log('➤ Submitting form...');
    await submitButton.click();
    
    // Wait for response and check result
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log('➤ Current URL after login:', currentUrl);
    
    const isStillOnSignin = currentUrl.includes('/auth/signin');
    console.log('➤ Login success:', !isStillOnSignin);
    
    // Check for error messages
    const errorMessage = await page.locator('[role="alert"]').first().textContent().catch(() => null);
    if (errorMessage) {
      console.log('➤ Error message:', errorMessage);
    }
    
    // Take a screenshot for manual inspection
    await page.screenshot({ path: 'debug-auth-result.png', fullPage: true });
    console.log('➤ Screenshot saved as debug-auth-result.png');
    
    return !isStillOnSignin;
    
  } catch (error) {
    console.error('❌ Simple auth check failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the check
simpleAuthCheck().then(success => {
  console.log(`\n🎯 Simple Auth Check Result: ${success ? '✅ SUCCESS' : '❌ FAILURE'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});