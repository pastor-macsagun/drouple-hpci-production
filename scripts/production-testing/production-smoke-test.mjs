#!/usr/bin/env node

/**
 * PRODUCTION SMOKE TEST SUITE
 * Comprehensive authentication flow validation for Auth.js v5 fixes
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const PRODUCTION_URL = 'https://www.drouple.app';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'test-artifacts', 'production-smoke');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Test accounts for different roles
const TEST_ACCOUNTS = [
  { email: 'admin.manila@test.com', password: 'Hpci!Test2025', role: 'ADMIN', expectedRedirect: '/admin' },
  { email: 'member1@test.com', password: 'Hpci!Test2025', role: 'MEMBER', expectedRedirect: '/dashboard' },
  { email: 'superadmin@test.com', password: 'Hpci!Test2025', role: 'SUPER_ADMIN', expectedRedirect: '/super' }
];

class ProductionSmokeTest {
  constructor() {
    this.browser = null;
    this.results = [];
  }

  async initialize() {
    console.log('🚀 Initializing Production Smoke Test Suite...');
    this.browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false'
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async screenshot(page, name) {
    const timestamp = Date.now();
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    return filepath;
  }

  async testAuthenticationFlow(testAccount) {
    console.log(`\n🔍 Testing authentication for ${testAccount.email} (${testAccount.role})...`);
    
    const context = await this.browser.newContext({
      viewport: { width: 1200, height: 800 }
    });
    
    const page = await context.newPage();
    
    try {
      // Step 1: Navigate to login page
      console.log('   ➤ Navigating to login page...');
      await page.goto(`${PRODUCTION_URL}/auth/signin`);
      await page.waitForLoadState('networkidle');
      await this.screenshot(page, `${testAccount.role}-01-login-page`);

      // Step 2: Fill login form
      console.log('   ➤ Filling login credentials...');
      await page.fill('#email', testAccount.email);
      await page.fill('#password', testAccount.password);
      await this.screenshot(page, `${testAccount.role}-02-credentials-filled`);

      // Step 3: Submit login
      console.log('   ➤ Submitting login form...');
      await page.click('button[type="submit"]');
      
      // Wait for redirect (may take a moment)
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      await this.screenshot(page, `${testAccount.role}-03-post-login`);

      // Step 4: Verify role-based redirect
      const currentUrl = page.url();
      console.log(`   ➤ Current URL: ${currentUrl}`);
      
      const redirectSuccess = currentUrl.includes(testAccount.expectedRedirect) || 
                              currentUrl.endsWith(testAccount.expectedRedirect);
      
      console.log(`   ➤ Expected redirect: ${testAccount.expectedRedirect}`);
      console.log(`   ➤ Redirect success: ${redirectSuccess ? '✅' : '❌'}`);

      // Step 5: Test session persistence - refresh page
      console.log('   ➤ Testing session persistence with page refresh...');
      await page.reload();
      await page.waitForLoadState('networkidle');
      await this.screenshot(page, `${testAccount.role}-04-after-refresh`);
      
      const sessionPersisted = !page.url().includes('/auth/signin');
      console.log(`   ➤ Session persisted after refresh: ${sessionPersisted ? '✅' : '❌'}`);

      // Step 6: Test new tab session
      console.log('   ➤ Testing session in new tab...');
      const newTab = await context.newPage();
      await newTab.goto(`${PRODUCTION_URL}${testAccount.expectedRedirect}`);
      await newTab.waitForLoadState('networkidle');
      await this.screenshot(newTab, `${testAccount.role}-05-new-tab`);
      
      const newTabAccess = !newTab.url().includes('/auth/signin');
      console.log(`   ➤ New tab has session access: ${newTabAccess ? '✅' : '❌'}`);
      await newTab.close();

      // Step 7: Test protected route access
      console.log('   ➤ Testing protected route access...');
      const protectedRoutes = {
        'ADMIN': ['/admin/members', '/admin/services'],
        'MEMBER': ['/dashboard', '/members'],
        'SUPER_ADMIN': ['/super', '/admin/members']
      };
      
      const routesToTest = protectedRoutes[testAccount.role] || [];
      let protectedAccessSuccess = true;
      
      for (const route of routesToTest) {
        await page.goto(`${PRODUCTION_URL}${route}`);
        await page.waitForLoadState('networkidle');
        if (page.url().includes('/auth/signin')) {
          protectedAccessSuccess = false;
          console.log(`   ➤ Failed to access ${route} - redirected to login`);
          break;
        }
      }
      
      console.log(`   ➤ Protected route access: ${protectedAccessSuccess ? '✅' : '❌'}`);

      // Step 8: Test logout functionality
      console.log('   ➤ Testing logout functionality...');
      try {
        // Look for logout button/link
        await page.goto(`${PRODUCTION_URL}${testAccount.expectedRedirect}`);
        await page.waitForLoadState('networkidle');
        
        // Try to find and click logout
        const logoutButton = page.locator('text="Sign Out"').or(
          page.locator('text="Logout"').or(
            page.locator('[data-testid="logout-button"]')
          )
        );
        
        if (await logoutButton.isVisible()) {
          await logoutButton.click();
          await page.waitForLoadState('networkidle');
          const loggedOut = page.url().includes('/auth/signin') || page.url() === `${PRODUCTION_URL}/`;
          console.log(`   ➤ Logout successful: ${loggedOut ? '✅' : '❌'}`);
        } else {
          console.log('   ➤ Logout button not found - skipping logout test');
        }
      } catch (error) {
        console.log(`   ➤ Logout test error: ${error.message}`);
      }

      // Record results
      this.results.push({
        account: testAccount.email,
        role: testAccount.role,
        loginSuccess: !page.url().includes('/auth/signin'),
        redirectSuccess,
        sessionPersisted,
        newTabAccess,
        protectedAccessSuccess,
        timestamp: new Date().toISOString()
      });

      return {
        success: redirectSuccess && sessionPersisted && newTabAccess && protectedAccessSuccess,
        details: {
          redirectSuccess,
          sessionPersisted,
          newTabAccess,
          protectedAccessSuccess
        }
      };

    } catch (error) {
      console.error(`   ❌ Test failed for ${testAccount.email}:`, error.message);
      await this.screenshot(page, `${testAccount.role}-ERROR`);
      
      this.results.push({
        account: testAccount.email,
        role: testAccount.role,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      return { success: false, error: error.message };
    } finally {
      await context.close();
    }
  }

  async testCookieSecurityHeaders() {
    console.log('\n🔒 Testing Cookie Security Headers...');
    
    const context = await this.browser.newContext();
    const page = await context.newPage();
    
    try {
      // Navigate to login and perform authentication to get cookies
      await page.goto(`${PRODUCTION_URL}/auth/signin`);
      await page.fill('#email', 'admin.manila@test.com');
      await page.fill('#password', 'Hpci!Test2025');
      
      // Capture network response to check Set-Cookie headers
      let cookieHeaders = [];
      page.on('response', response => {
        const setCookieHeaders = response.headers()['set-cookie'];
        if (setCookieHeaders) {
          cookieHeaders.push(...setCookieHeaders.split('\n'));
        }
      });
      
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      
      // Check for Auth.js v5 cookie names
      const hasAuthJSCookies = cookieHeaders.some(header => 
        header.includes('authjs.session-token') || 
        header.includes('__Secure-authjs.session-token')
      );
      
      const hasSecureFlag = cookieHeaders.some(header => 
        header.includes('Secure')
      );
      
      const hasHttpOnlyFlag = cookieHeaders.some(header => 
        header.includes('HttpOnly')
      );
      
      const hasSameSiteFlag = cookieHeaders.some(header => 
        header.includes('SameSite')
      );
      
      console.log(`   ➤ Auth.js v5 cookies found: ${hasAuthJSCookies ? '✅' : '❌'}`);
      console.log(`   ➤ Secure flag present: ${hasSecureFlag ? '✅' : '❌'}`);
      console.log(`   ➤ HttpOnly flag present: ${hasHttpOnlyFlag ? '✅' : '❌'}`);
      console.log(`   ➤ SameSite flag present: ${hasSameSiteFlag ? '✅' : '❌'}`);
      
      return {
        hasAuthJSCookies,
        hasSecureFlag,
        hasHttpOnlyFlag,
        hasSameSiteFlag
      };
      
    } finally {
      await context.close();
    }
  }

  async runFullSuite() {
    console.log('🎯 Starting Complete Production Smoke Test Suite');
    console.log('=' .repeat(60));
    
    const startTime = Date.now();
    let totalTests = 0;
    let passedTests = 0;
    
    // Test each user role
    for (const testAccount of TEST_ACCOUNTS) {
      const result = await this.testAuthenticationFlow(testAccount);
      totalTests++;
      if (result.success) passedTests++;
    }
    
    // Test cookie security
    const cookieResult = await this.testCookieSecurityHeaders();
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Generate summary report
    console.log('\n' + '=' .repeat(60));
    console.log('📊 PRODUCTION SMOKE TEST RESULTS');
    console.log('=' .repeat(60));
    console.log(`Total Authentication Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`Duration: ${duration}s`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    console.log('\n🔒 Cookie Security Analysis:');
    console.log(`   Auth.js v5 Cookies: ${cookieResult.hasAuthJSCookies ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Secure Flag: ${cookieResult.hasSecureFlag ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   HttpOnly Flag: ${cookieResult.hasHttpOnlyFlag ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   SameSite Flag: ${cookieResult.hasSameSiteFlag ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log('\n📁 Screenshots saved to:', SCREENSHOTS_DIR);
    
    // Save detailed results
    const reportPath = path.join(SCREENSHOTS_DIR, 'smoke-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        successRate: (passedTests / totalTests) * 100,
        duration,
        timestamp: new Date().toISOString()
      },
      cookieSecurity: cookieResult,
      detailedResults: this.results
    }, null, 2));
    
    console.log('📄 Detailed report saved to:', reportPath);
    
    // Return overall success
    const overallSuccess = passedTests === totalTests && 
                           cookieResult.hasAuthJSCookies && 
                           cookieResult.hasSecureFlag;
    
    console.log(`\n🎯 OVERALL RESULT: ${overallSuccess ? '✅ SUCCESS' : '❌ FAILURE'}`);
    
    return overallSuccess;
  }
}

// Execute tests if run directly
async function main() {
  const smokeTest = new ProductionSmokeTest();
  
  try {
    await smokeTest.initialize();
    const success = await smokeTest.runFullSuite();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Smoke test suite failed:', error);
    process.exit(1);
  } finally {
    await smokeTest.cleanup();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default ProductionSmokeTest;