#!/usr/bin/env tsx
/**
 * Detailed Authentication Testing
 * More thorough testing with better error detection
 */

import { chromium, Browser, Page } from 'playwright';

async function testAuthenticationDetailed(): Promise<void> {
  console.log('🔍 Detailed Authentication Testing');
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
    
    // Enable detailed console logging
    page.on('console', msg => {
      console.log(`🖥️  Console (${msg.type()}): ${msg.text()}`);
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/auth/')) {
        console.log(`🌐 API Response: ${response.status()} ${response.url()}`);
      }
    });
    
    // Navigate to login page
    console.log('📍 Navigating to login page...');
    await page.goto('https://www.drouple.app/auth/signin');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'auth-test-1-initial.png', fullPage: true });
    console.log('📸 Screenshot saved: auth-test-1-initial.png');
    
    // Fill form
    console.log('📝 Filling login form...');
    await page.fill('#email', 'superadmin@test.com');
    await page.fill('#password', 'Hpci!Test2025');
    
    // Wait and screenshot before submit
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'auth-test-2-filled.png', fullPage: true });
    console.log('📸 Screenshot saved: auth-test-2-filled.png');
    
    // Get initial URL for comparison
    const initialUrl = page.url();
    console.log(`🔗 Initial URL: ${initialUrl}`);
    
    // Submit form and monitor network
    console.log('🔘 Submitting form...');
    
    // Listen for navigation
    const navigationPromise = page.waitForNavigation({ 
      waitUntil: 'networkidle',
      timeout: 15000 
    }).catch(() => {
      console.log('⚠️  No navigation detected within timeout');
      return null;
    });
    
    await page.click('button[type="submit"]');
    console.log('✅ Submit button clicked');
    
    // Wait for either navigation or timeout
    await Promise.race([
      navigationPromise,
      page.waitForTimeout(10000)
    ]);
    
    // Take screenshot after submit
    await page.screenshot({ path: 'auth-test-3-after-submit.png', fullPage: true });
    console.log('📸 Screenshot saved: auth-test-3-after-submit.png');
    
    const finalUrl = page.url();
    console.log(`🔗 Final URL: ${finalUrl}`);
    
    // Check for error messages with better selectors
    const errorSelectors = [
      '[role="alert"]',
      '.alert-destructive',
      '.text-destructive',
      '[data-testid="error"]',
      '.error',
      '.alert'
    ];
    
    for (const selector of errorSelectors) {
      try {
        const elements = await page.locator(selector).count();
        if (elements > 0) {
          const errorText = await page.locator(selector).first().textContent();
          if (errorText && errorText.trim() && !errorText.includes('HPCI ChMS')) {
            console.log(`❌ Error found (${selector}): ${errorText.trim()}`);
          }
        }
      } catch (e) {
        // Selector not found, continue
      }
    }
    
    // Analyze the result
    if (finalUrl !== initialUrl) {
      if (finalUrl.includes('/super') || finalUrl.includes('/admin') || finalUrl.includes('/dashboard')) {
        console.log('✅ AUTHENTICATION SUCCESSFUL - Redirected to dashboard');
      } else {
        console.log(`⚠️  Unexpected redirect: ${finalUrl}`);
      }
    } else {
      console.log('❌ AUTHENTICATION FAILED - Remained on login page');
      
      // Check if form was cleared (indicates failed attempt)
      const emailValue = await page.inputValue('#email');
      const passwordValue = await page.inputValue('#password');
      
      console.log(`📧 Email field after submit: "${emailValue}"`);
      console.log(`🔐 Password field after submit: "${passwordValue ? '[FILLED]' : '[EMPTY]'}"`);
      
      if (emailValue === 'superadmin@test.com' && passwordValue) {
        console.log('💡 Form values retained - might be server-side validation issue');
      } else if (emailValue !== 'superadmin@test.com') {
        console.log('💡 Form was reset - indicates failed authentication');
      }
    }
    
    await context.close();
    
  } finally {
    await browser.close();
  }
  
  console.log('\n✅ Detailed authentication testing completed');
}

if (require.main === module) {
  testAuthenticationDetailed().catch(console.error);
}

export default testAuthenticationDetailed;