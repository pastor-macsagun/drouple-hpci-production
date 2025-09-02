#!/usr/bin/env node

/**
 * Debug Signin Form Submission
 */

import { chromium } from 'playwright';

const PRODUCTION_URL = 'https://www.drouple.app';

async function debugSignin() {
  console.log('🔍 Debugging Signin Form...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Listen to console messages from the page
    page.on('console', msg => {
      console.log('   [Browser Console]:', msg.text());
    });
    
    // Listen to page errors
    page.on('pageerror', err => {
      console.log('   [Page Error]:', err.message);
    });
    
    // Listen to network failures
    page.on('requestfailed', req => {
      console.log('   [Network Failed]:', req.url(), req.failure()?.errorText);
    });
    
    // Navigate to signin page
    console.log('➤ Going to signin page...');
    await page.goto(`${PRODUCTION_URL}/auth/signin`);
    await page.waitForLoadState('networkidle');
    
    console.log('➤ Page title:', await page.title());
    
    // Check form elements
    const emailExists = await page.locator('#email').isVisible();
    const passwordExists = await page.locator('#password').isVisible();
    const submitExists = await page.locator('button[type="submit"]').isVisible();
    
    console.log('➤ Form elements:');
    console.log('   Email input:', emailExists ? '✅' : '❌');
    console.log('   Password input:', passwordExists ? '✅' : '❌');
    console.log('   Submit button:', submitExists ? '✅' : '❌');
    
    if (!emailExists || !passwordExists || !submitExists) {
      console.log('❌ Form elements missing');
      return;
    }
    
    // Fill and submit
    console.log('➤ Filling form...');
    await page.fill('#email', 'admin.manila@test.com');
    await page.fill('#password', 'Hpci!Test2025');
    
    console.log('➤ Clicking submit...');
    
    // Watch for navigation
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/auth/callback/credentials')
    );
    
    await page.click('button[type="submit"]');
    
    try {
      const authResponse = await responsePromise;
      console.log('➤ Auth response status:', authResponse.status());
      console.log('➤ Auth response URL:', authResponse.url());
      
      // Check if we got redirected
      await page.waitForTimeout(3000);
      console.log('➤ Current URL after submit:', page.url());
      
      // Check for error messages on the page
      const errorAlert = page.locator('[role="alert"]');
      if (await errorAlert.isVisible()) {
        const errorText = await errorAlert.textContent();
        console.log('➤ Error message:', errorText);
      }
      
    } catch (error) {
      console.log('➤ No auth response received:', error.message);
    }
    
    // Wait and see final state
    await page.waitForTimeout(5000);
    console.log('➤ Final URL:', page.url());
    
  } finally {
    await browser.close();
  }
}

debugSignin().catch(console.error);