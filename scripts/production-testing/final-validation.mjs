#!/usr/bin/env node

/**
 * Final Production Validation - Simplified UI Test
 * Now that backend auth is confirmed working
 */

import { chromium } from 'playwright';

const PRODUCTION_URL = 'https://www.drouple.app';

async function validateAuthentication() {
  console.log('🎯 Final Production Authentication Validation');
  console.log('='.repeat(50));

  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Test 1: Login Flow
    console.log('➤ Testing login flow...');
    await page.goto(`${PRODUCTION_URL}/auth/signin`);
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    await page.fill('#email', 'admin.manila@test.com');
    await page.fill('#password', 'Hpci!Test2025');
    
    // Submit and wait for navigation
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const postLoginUrl = page.url();
    const loginSuccess = !postLoginUrl.includes('/auth/signin');
    
    console.log('   Login success:', loginSuccess ? '✅' : '❌');
    console.log('   Post-login URL:', postLoginUrl);

    if (!loginSuccess) {
      console.log('❌ Login failed - stopping validation');
      return false;
    }

    // Test 2: Session Persistence - Page Refresh
    console.log('➤ Testing session persistence with refresh...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const afterRefreshUrl = page.url();
    const sessionPersisted = !afterRefreshUrl.includes('/auth/signin');
    
    console.log('   Session persisted after refresh:', sessionPersisted ? '✅' : '❌');

    // Test 3: Access Protected Route
    console.log('➤ Testing protected route access...');
    await page.goto(`${PRODUCTION_URL}/admin`);
    await page.waitForLoadState('networkidle');
    
    const adminUrl = page.url();
    const adminAccess = adminUrl.includes('/admin') && !adminUrl.includes('/auth/signin');
    
    console.log('   Admin route access:', adminAccess ? '✅' : '❌');

    // Test 4: New Tab Session Sharing
    console.log('➤ Testing session in new tab...');
    const newTab = await context.newPage();
    await newTab.goto(`${PRODUCTION_URL}/admin`);
    await newTab.waitForLoadState('networkidle');
    
    const newTabUrl = newTab.url();
    const newTabAccess = newTabUrl.includes('/admin') && !newTabUrl.includes('/auth/signin');
    
    console.log('   New tab access:', newTabAccess ? '✅' : '❌');
    await newTab.close();

    // Summary
    const allTestsPassed = loginSuccess && sessionPersisted && adminAccess && newTabAccess;
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL VALIDATION RESULTS');
    console.log('='.repeat(50));
    console.log('Login Success:', loginSuccess ? '✅ PASS' : '❌ FAIL');
    console.log('Session Persistence:', sessionPersisted ? '✅ PASS' : '❌ FAIL');
    console.log('Protected Route Access:', adminAccess ? '✅ PASS' : '❌ FAIL');
    console.log('New Tab Session:', newTabAccess ? '✅ PASS' : '❌ FAIL');
    console.log('\n🎯 OVERALL RESULT:', allTestsPassed ? '✅ SUCCESS' : '❌ FAILURE');

    return allTestsPassed;

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run validation
validateAuthentication()
  .then(success => {
    console.log(`\n🏁 Production validation ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });