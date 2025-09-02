#!/usr/bin/env tsx
/**
 * Form Selector Testing and Verification
 * Tests the actual form selectors and authentication flow
 */

import { chromium, Browser, Page } from 'playwright';

async function testFormSelectors(): Promise<void> {
  console.log('🔍 Testing Form Selectors and Authentication Flow');
  console.log('═════════════════════════════════════════════════');

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Navigate to login page
    console.log('📍 Navigating to login page...');
    await page.goto('https://www.drouple.app/auth/signin');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'test-form-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved: test-form-screenshot.png');
    
    // Test form selectors
    console.log('\n🔍 Testing Form Selectors:');
    
    const emailField = await page.locator('#email').count();
    const passwordField = await page.locator('#password').count();
    const submitButton = await page.locator('button[type="submit"]').count();
    
    console.log(`📧 Email field (#email): ${emailField > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`🔐 Password field (#password): ${passwordField > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`🔘 Submit button (button[type="submit"]): ${submitButton > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);
    
    if (emailField === 0 || passwordField === 0 || submitButton === 0) {
      console.log('\n⚠️  Some form elements not found. Checking alternative selectors...');
      
      // Check alternative selectors
      const emailAlts = [
        'input[type="email"]',
        'input[name="email"]',
        '[data-testid="email"]',
        'input[placeholder*="email" i]'
      ];
      
      const passwordAlts = [
        'input[type="password"]',
        'input[name="password"]',
        '[data-testid="password"]',
        'input[placeholder*="password" i]'
      ];
      
      const submitAlts = [
        'button:has-text("Sign In")',
        'button:has-text("Login")',
        'input[type="submit"]',
        '[data-testid="submit"]'
      ];
      
      console.log('\n📧 Alternative Email Selectors:');
      for (const selector of emailAlts) {
        const count = await page.locator(selector).count();
        console.log(`   ${selector}: ${count > 0 ? '✅' : '❌'}`);
      }
      
      console.log('\n🔐 Alternative Password Selectors:');
      for (const selector of passwordAlts) {
        const count = await page.locator(selector).count();
        console.log(`   ${selector}: ${count > 0 ? '✅' : '❌'}`);
      }
      
      console.log('\n🔘 Alternative Submit Selectors:');
      for (const selector of submitAlts) {
        const count = await page.locator(selector).count();
        console.log(`   ${selector}: ${count > 0 ? '✅' : '❌'}`);
      }
    }
    
    // Test authentication with a known test account
    console.log('\n🧪 Testing Authentication Flow with superadmin@test.com...');
    
    try {
      await page.fill('#email', 'superadmin@test.com');
      await page.fill('#password', 'Hpci!Test2025');
      
      console.log('📝 Form fields filled');
      
      // Take screenshot before submit
      await page.screenshot({ path: 'test-form-before-submit.png', fullPage: true });
      console.log('📸 Before submit screenshot: test-form-before-submit.png');
      
      await page.click('button[type="submit"]');
      console.log('🔘 Submit button clicked');
      
      // Wait for navigation or error
      await page.waitForTimeout(5000);
      
      const currentUrl = page.url();
      console.log(`🔗 Current URL after submit: ${currentUrl}`);
      
      // Take screenshot after submit
      await page.screenshot({ path: 'test-form-after-submit.png', fullPage: true });
      console.log('📸 After submit screenshot: test-form-after-submit.png');
      
      if (currentUrl.includes('/super') || currentUrl.includes('/admin') || currentUrl.includes('/dashboard')) {
        console.log('✅ Authentication successful - redirected to dashboard');
      } else if (currentUrl.includes('/auth/signin')) {
        console.log('❌ Authentication failed - still on login page');
        
        // Check for error messages
        const errorElements = await page.locator('[role="alert"], .alert, .error').count();
        if (errorElements > 0) {
          const errorText = await page.locator('[role="alert"], .alert, .error').first().textContent();
          console.log(`⚠️  Error message: ${errorText}`);
        }
      } else {
        console.log(`⚠️  Unexpected redirect: ${currentUrl}`);
      }
      
    } catch (authError) {
      console.log(`❌ Authentication test failed: ${authError}`);
    }
    
    await context.close();
    
  } finally {
    await browser.close();
  }
  
  console.log('\n✅ Form selector testing completed');
  console.log('Check the generated screenshots for visual verification');
}

if (require.main === module) {
  testFormSelectors().catch(console.error);
}

export default testFormSelectors;