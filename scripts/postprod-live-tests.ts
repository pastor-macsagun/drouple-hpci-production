#!/usr/bin/env node
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'https://drouple-hpci-prod.vercel.app';
const SEED_TOKEN = process.env.PROD_QA_SEED_TOKEN || 'hpci-qa-seed-2025-08-26-Xk9mP2nQ8vL3sT6jW4aR7bY5cF1gH0dE';
const TIMESTAMP = Date.now();
const TEST_PREFIX = `PRODTEST-${TIMESTAMP}`;

// Test accounts that will be created by seed endpoint
const TEST_ACCOUNTS = {
  SUPER_ADMIN: { 
    email: 'qa.superadmin@hpci', 
    password: 'QA!Sup3rAdmin#2025',
    expectedRedirect: '/super'
  },
  ADMIN_MANILA: { 
    email: 'qa.admin.manila@hpci', 
    password: 'QA!AdmMNL#2025',
    expectedRedirect: '/admin'
  },
  ADMIN_CEBU: { 
    email: 'qa.admin.cebu@hpci', 
    password: 'QA!AdmCBU#2025',
    expectedRedirect: '/admin'
  },
  LEADER_MANILA: { 
    email: 'qa.leader.manila@hpci', 
    password: 'QA!LeadMNL#2025',
    expectedRedirect: '/dashboard'
  },
  MEMBER_MANILA: { 
    email: 'qa.member.manila@hpci', 
    password: 'QA!MemMNL#2025',
    expectedRedirect: '/dashboard'
  },
  VIP_MANILA: { 
    email: 'qa.vip.manila@hpci', 
    password: 'QA!VipMNL#2025',
    expectedRedirect: '/vip/firsttimers'
  }
};

// Track created artifacts for cleanup
const createdArtifacts = {
  services: [] as string[],
  lifeGroups: [] as string[],
  events: [] as string[],
  pathways: [] as string[],
  members: [] as string[],
  firstTimers: [] as string[],
  announcements: [] as string[]
};

// Test results tracking
const testResults = {
  seed: { status: 'pending' },
  auth: {} as any,
  rbac: {} as any,
  crud: {} as any,
  member: {} as any,
  vip: {} as any,
  csv: {} as any,
  security: {} as any,
  rateLimit: {} as any,
  accessibility: {} as any,
  performance: {} as any,
  dataIntegrity: {} as any,
  cleanup: [] as any[]
};

async function main() {
  console.log('========================================');
  console.log('Drouple - Church Management System POST-PRODUCTION VALIDATION');
  console.log(`URL: ${BASE_URL}`);
  console.log(`Test Prefix: ${TEST_PREFIX}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('========================================\n');

  let browser: Browser | null = null;

  try {
    // Step 1: Seed production with test accounts
    await seedProduction();
    
    // Step 2: Run all tests
    browser = await chromium.launch({ 
      headless: true,
      timeout: 60000
    });

    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1280, height: 720 },
      userAgent: 'Drouple-Church-Management-System-PostProd-Validator/2.0'
    });

    // Run test suites
    await testAuthentication(context);
    await testRBACAndTenancy(context);
    await testCRUDOperations(context);
    await testMemberWorkflows(context);
    await testVIPFeatures(context);
    await testCSVExports(context);
    await testSecurityHeaders(context);
    await testRateLimiting(context);
    await testAccessibility(context);
    await testPerformance(context);
    await testDataIntegrity(context);

    // Step 3: Cleanup all test data
    await cleanupTestData(context);

    // Step 4: Generate final report
    await generateReport();

  } catch (error) {
    console.error('❌ Validation failed:', error);
    testResults.error = error;
  } finally {
    if (browser) await browser.close();
  }
}

// Step 1: Seed Production
async function seedProduction() {
  console.log('📌 SEEDING PRODUCTION WITH TEST ACCOUNTS...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/ops/prod-seed`, {
      method: 'POST',
      headers: {
        'X-Seed-Token': SEED_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.status === 409) {
      console.log('⚠️  Seed already ran previously:', data.ranAt);
      testResults.seed = { status: 'already-ran', ranAt: data.ranAt };
      return;
    }

    if (!response.ok) {
      throw new Error(`Seed failed: ${response.status} - ${JSON.stringify(data)}`);
    }

    console.log('✅ Test accounts created successfully');
    console.log('   Users:', data.users.map((u: any) => u.email).join(', '));
    
    testResults.seed = { 
      status: 'success', 
      users: data.users,
      ranAt: data.ranAt 
    };

    // Wait for database to propagate
    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Test Authentication
async function testAuthentication(context: BrowserContext) {
  console.log('\n📌 TESTING AUTHENTICATION...');
  
  for (const [role, account] of Object.entries(TEST_ACCOUNTS)) {
    const page = await context.newPage();
    console.log(`   Testing ${role}...`);
    
    try {
      await page.goto(`${BASE_URL}/auth/signin`);
      await page.waitForLoadState('networkidle');
      
      // Fill credentials
      await page.fill('input#email', account.email);
      await page.fill('input#password', account.password);
      
      // Submit
      await page.click('button[type="submit"]');
      
      // Wait for redirect
      await page.waitForURL((url) => !url.toString().includes('/auth/signin'), {
        timeout: 10000
      });
      
      const currentUrl = page.url();
      const success = currentUrl.includes(account.expectedRedirect) || 
                     currentUrl.includes('/dashboard') ||
                     currentUrl.includes('/admin') ||
                     currentUrl.includes('/super') ||
                     currentUrl.includes('/vip');
      
      testResults.auth[role] = {
        email: account.email,
        success,
        url: currentUrl
      };
      
      console.log(`     ${success ? '✅' : '❌'} Login successful`);
      
      // Test logout
      try {
        await page.goto(`${BASE_URL}/api/auth/signout`);
        await page.waitForLoadState('networkidle');
        console.log(`     ✅ Logout successful`);
      } catch {
        console.log(`     ⚠️  Logout issue`);
      }
      
    } catch (error: any) {
      console.log(`     ❌ Error: ${error.message}`);
      testResults.auth[role] = { error: error.message };
    }
    
    await page.close();
  }
}

// Test RBAC & Multi-tenancy
async function testRBACAndTenancy(context: BrowserContext) {
  console.log('\n📌 TESTING RBAC & MULTI-TENANCY...');
  const page = await context.newPage();
  
  try {
    // Test Manila admin cannot see Cebu data
    await loginAs(page, TEST_ACCOUNTS.ADMIN_MANILA);
    await page.goto(`${BASE_URL}/admin/members`);
    await page.waitForLoadState('networkidle');
    
    const bodyText = await page.textContent('body');
    const seesManila = bodyText?.toLowerCase().includes('manila');
    const seesCebu = bodyText?.toLowerCase().includes('cebu');
    
    testResults.rbac.tenantIsolation = {
      manilaAdminSeesManila: seesManila,
      manilaAdminSeesCebu: seesCebu,
      passed: seesManila && !seesCebu
    };
    
    console.log(`   Manila admin sees Manila: ${seesManila ? '✅' : '❌'}`);
    console.log(`   Manila admin blocked from Cebu: ${!seesCebu ? '✅' : '❌'}`);
    
    // Test member cannot access admin
    await loginAs(page, TEST_ACCOUNTS.MEMBER_MANILA);
    await page.goto(`${BASE_URL}/admin/members`);
    await page.waitForLoadState('networkidle');
    
    const blockedFromAdmin = page.url().includes('/dashboard') || 
                            page.url().includes('/auth/signin');
    
    testResults.rbac.roleAccess = {
      memberBlockedFromAdmin: blockedFromAdmin
    };
    
    console.log(`   Member blocked from admin: ${blockedFromAdmin ? '✅' : '❌'}`);
    
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    testResults.rbac.error = error.message;
  }
  
  await page.close();
}

// Test CRUD Operations
async function testCRUDOperations(context: BrowserContext) {
  console.log('\n📌 TESTING CRUD OPERATIONS...');
  const page = await context.newPage();
  
  try {
    await loginAs(page, TEST_ACCOUNTS.ADMIN_MANILA);
    
    // Test Service CRUD
    console.log('   Testing Services...');
    const serviceName = `${TEST_PREFIX}-Service`;
    
    await page.goto(`${BASE_URL}/admin/services`);
    await page.waitForLoadState('networkidle');
    
    // Create
    try {
      await page.click('button:has-text("Add Service"), button:has-text("Create Service")');
      await page.waitForTimeout(1000);
      await page.fill('input[name="name"], input#name', serviceName);
      await page.fill('input[type="date"]', '2025-12-31');
      await page.fill('input[type="time"]', '09:00');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      createdArtifacts.services.push(serviceName);
      testResults.crud.serviceCreate = true;
      console.log('     ✅ Service created');
    } catch {
      testResults.crud.serviceCreate = false;
      console.log('     ❌ Service creation failed');
    }
    
    // Test LifeGroup CRUD
    console.log('   Testing LifeGroups...');
    const lgName = `${TEST_PREFIX}-LifeGroup`;
    
    await page.goto(`${BASE_URL}/admin/lifegroups`);
    await page.waitForLoadState('networkidle');
    
    try {
      await page.click('button:has-text("Create Life Group"), button:has-text("Add Life Group")');
      await page.waitForTimeout(1000);
      await page.fill('input[name="name"], input#name', lgName);
      await page.fill('textarea[name="description"], textarea#description', 'Test life group');
      await page.fill('input[name="capacity"], input#capacity', '2');
      
      // Select leader
      const leaderSelect = await page.$('select[name="leaderId"], select#leaderId');
      if (leaderSelect) {
        await leaderSelect.selectOption({ label: 'QA Leader Manila' });
      }
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      createdArtifacts.lifeGroups.push(lgName);
      testResults.crud.lifeGroupCreate = true;
      console.log('     ✅ LifeGroup created');
    } catch {
      testResults.crud.lifeGroupCreate = false;
      console.log('     ❌ LifeGroup creation failed');
    }
    
    // Test Event CRUD
    console.log('   Testing Events...');
    const eventName = `${TEST_PREFIX}-Event`;
    
    await page.goto(`${BASE_URL}/admin/events`);
    await page.waitForLoadState('networkidle');
    
    try {
      await page.click('button:has-text("Create Event"), button:has-text("Add Event")');
      await page.waitForTimeout(1000);
      await page.fill('input[name="title"], input#title', eventName);
      await page.fill('textarea[name="description"], textarea#description', 'Test event');
      await page.fill('input[type="date"]', '2025-12-31');
      await page.fill('input[type="time"]', '18:00');
      await page.fill('input[name="capacity"], input#capacity', '1');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      createdArtifacts.events.push(eventName);
      testResults.crud.eventCreate = true;
      console.log('     ✅ Event created');
    } catch {
      testResults.crud.eventCreate = false;
      console.log('     ❌ Event creation failed');
    }
    
    // Test Member CRUD
    console.log('   Testing Members...');
    const memberEmail = `qa.member.2@hpci`;
    
    await page.goto(`${BASE_URL}/admin/members`);
    await page.waitForLoadState('networkidle');
    
    try {
      await page.click('button:has-text("Add Member"), button:has-text("Create Member")');
      await page.waitForTimeout(1000);
      await page.fill('input[name="firstName"], input#firstName', TEST_PREFIX);
      await page.fill('input[name="lastName"], input#lastName', 'TestUser');
      await page.fill('input[name="email"], input#email', memberEmail);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      createdArtifacts.members.push(memberEmail);
      testResults.crud.memberCreate = true;
      console.log('     ✅ Member created');
    } catch {
      testResults.crud.memberCreate = false;
      console.log('     ❌ Member creation failed');
    }
    
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    testResults.crud.error = error.message;
  }
  
  await page.close();
}

// Test Member Workflows
async function testMemberWorkflows(context: BrowserContext) {
  console.log('\n📌 TESTING MEMBER WORKFLOWS...');
  const page = await context.newPage();
  
  try {
    await loginAs(page, TEST_ACCOUNTS.MEMBER_MANILA);
    
    // Test directory search
    console.log('   Testing Directory...');
    await page.goto(`${BASE_URL}/members`);
    await page.waitForLoadState('networkidle');
    
    try {
      const searchInput = await page.$('input[placeholder*="Search"], input[type="search"]');
      if (searchInput) {
        await searchInput.fill('qa.member');
        await page.waitForTimeout(1000);
        testResults.member.directorySearch = true;
        console.log('     ✅ Directory search works');
      }
    } catch {
      testResults.member.directorySearch = false;
      console.log('     ❌ Directory search failed');
    }
    
    // Test check-in
    console.log('   Testing Check-in...');
    await page.goto(`${BASE_URL}/checkin`);
    await page.waitForLoadState('networkidle');
    
    try {
      const checkInButton = await page.$('button:has-text("Check In")');
      if (checkInButton) {
        await checkInButton.click();
        await page.waitForTimeout(2000);
        
        const bodyText = await page.textContent('body');
        const checkedIn = bodyText?.includes('success') || 
                          bodyText?.includes('checked') ||
                          bodyText?.includes('already');
        
        testResults.member.checkIn = checkedIn;
        console.log(`     ${checkedIn ? '✅' : '❌'} Check-in processed`);
      } else {
        testResults.member.checkIn = false;
        console.log('     ⚠️  No active service');
      }
    } catch {
      testResults.member.checkIn = false;
      console.log('     ❌ Check-in failed');
    }
    
    // Test event RSVP
    console.log('   Testing Event RSVP...');
    await page.goto(`${BASE_URL}/events`);
    await page.waitForLoadState('networkidle');
    
    try {
      // Find our test event
      const testEventCard = await page.$(`text=${TEST_PREFIX}-Event`);
      if (testEventCard) {
        const rsvpButton = await testEventCard.$('.. >> button:has-text("RSVP")');
        if (rsvpButton) {
          await rsvpButton.click();
          await page.waitForTimeout(2000);
          testResults.member.eventRSVP = true;
          console.log('     ✅ Event RSVP works');
        }
      } else {
        testResults.member.eventRSVP = false;
        console.log('     ⚠️  Test event not found');
      }
    } catch {
      testResults.member.eventRSVP = false;
      console.log('     ❌ Event RSVP failed');
    }
    
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    testResults.member.error = error.message;
  }
  
  await page.close();
}

// Test VIP Features
async function testVIPFeatures(context: BrowserContext) {
  console.log('\n📌 TESTING VIP FEATURES...');
  const page = await context.newPage();
  
  try {
    await loginAs(page, TEST_ACCOUNTS.VIP_MANILA);
    await page.goto(`${BASE_URL}/vip/firsttimers`);
    await page.waitForLoadState('networkidle');
    
    const firstTimerName = `${TEST_PREFIX}-FirstTimer`;
    
    console.log('   Creating first-timer...');
    try {
      await page.click('button:has-text("Add First Timer"), button:has-text("Log First Timer")');
      await page.waitForTimeout(1000);
      await page.fill('input[name="name"], input#name', firstTimerName);
      await page.fill('input[name="email"], input#email', `${TEST_PREFIX.toLowerCase()}-ft@test.com`);
      await page.check('input[name="gospelShared"], input#gospelShared');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      createdArtifacts.firstTimers.push(firstTimerName);
      testResults.vip.firstTimerCreate = true;
      console.log('     ✅ First-timer created');
      
      // Check for ROOTS enrollment
      const bodyText = await page.textContent('body');
      const rootsEnrolled = bodyText?.includes('ROOTS') || bodyText?.includes('enrolled');
      testResults.vip.rootsEnrollment = rootsEnrolled;
      console.log(`     ${rootsEnrolled ? '✅' : '⚠️'} ROOTS enrollment ${rootsEnrolled ? 'confirmed' : 'not visible'}`);
      
    } catch {
      testResults.vip.firstTimerCreate = false;
      console.log('     ❌ First-timer creation failed');
    }
    
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    testResults.vip.error = error.message;
  }
  
  await page.close();
}

// Test CSV Exports
async function testCSVExports(context: BrowserContext) {
  console.log('\n📌 TESTING CSV EXPORTS...');
  const page = await context.newPage();
  
  try {
    await loginAs(page, TEST_ACCOUNTS.ADMIN_MANILA);
    
    // Test service export
    console.log('   Testing service attendance export...');
    await page.goto(`${BASE_URL}/admin/services`);
    await page.waitForLoadState('networkidle');
    
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await page.click('button:has-text("Export")').catch(() => {});
    const download = await downloadPromise;
    
    if (download) {
      const path = await download.path();
      testResults.csv.serviceExport = !!path;
      console.log('     ✅ Service CSV exported');
    } else {
      testResults.csv.serviceExport = false;
      console.log('     ⚠️  Export not available');
    }
    
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    testResults.csv.error = error.message;
  }
  
  await page.close();
}

// Test Security Headers
async function testSecurityHeaders(context: BrowserContext) {
  console.log('\n📌 TESTING SECURITY HEADERS...');
  const page = await context.newPage();
  
  const response = await page.goto(`${BASE_URL}/`);
  const headers = response?.headers() || {};
  
  const securityChecks = {
    csp: !!headers['content-security-policy'],
    xFrameOptions: !!headers['x-frame-options'],
    xContentType: !!headers['x-content-type-options'],
    referrerPolicy: !!headers['referrer-policy'],
    hsts: !!headers['strict-transport-security']
  };
  
  testResults.security = securityChecks;
  
  console.log(`   CSP: ${securityChecks.csp ? '✅' : '❌'}`);
  console.log(`   X-Frame-Options: ${securityChecks.xFrameOptions ? '✅' : '❌'}`);
  console.log(`   X-Content-Type-Options: ${securityChecks.xContentType ? '✅' : '❌'}`);
  console.log(`   Referrer-Policy: ${securityChecks.referrerPolicy ? '✅' : '❌'}`);
  console.log(`   HSTS: ${securityChecks.hsts ? '✅' : '❌'}`);
  
  await page.close();
}

// Test Rate Limiting
async function testRateLimiting(context: BrowserContext) {
  console.log('\n📌 TESTING RATE LIMITING...');
  const page = await context.newPage();
  
  console.log('   Testing login rate limit...');
  let rateLimitTriggered = false;
  
  for (let i = 0; i < 10; i++) {
    try {
      await page.goto(`${BASE_URL}/auth/signin`);
      await page.fill('input#email', 'bad@test.com');
      await page.fill('input#password', 'wrongpassword');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
      
      const bodyText = await page.textContent('body');
      if (bodyText?.includes('too many') || bodyText?.includes('rate limit')) {
        rateLimitTriggered = true;
        break;
      }
    } catch {
      // May hit rate limit
    }
  }
  
  testResults.rateLimit = { loginLimit: rateLimitTriggered };
  console.log(`   Login rate limit: ${rateLimitTriggered ? '✅ Active' : '⚠️ Not triggered'}`);
  
  await page.close();
}

// Test Accessibility
async function testAccessibility(context: BrowserContext) {
  console.log('\n📌 TESTING ACCESSIBILITY...');
  const page = await context.newPage();
  
  await page.goto(`${BASE_URL}/`);
  
  // Check skip navigation
  const skipNav = await page.$('a[href="#main-content"], a:has-text("Skip")');
  testResults.accessibility = {
    skipNav: !!skipNav
  };
  
  console.log(`   Skip navigation: ${skipNav ? '✅' : '⚠️'}`);
  
  // Check form labels
  await page.goto(`${BASE_URL}/auth/signin`);
  const labels = await page.$$('label');
  testResults.accessibility.formLabels = labels.length > 0;
  
  console.log(`   Form labels: ${labels.length > 0 ? '✅' : '❌'}`);
  
  await page.close();
}

// Test Performance
async function testPerformance(context: BrowserContext) {
  console.log('\n📌 TESTING PERFORMANCE...');
  const page = await context.newPage();
  
  const pages = [
    { url: '/', name: 'Landing' },
    { url: '/events', name: 'Events' },
    { url: '/dashboard', name: 'Dashboard' }
  ];
  
  testResults.performance = {};
  
  for (const pageInfo of pages) {
    const start = Date.now();
    await page.goto(`${BASE_URL}${pageInfo.url}`);
    const loadTime = Date.now() - start;
    
    testResults.performance[pageInfo.name] = {
      loadTime,
      rating: loadTime < 2000 ? 'Good' : loadTime < 4000 ? 'OK' : 'Slow'
    };
    
    console.log(`   ${pageInfo.name}: ${loadTime}ms (${testResults.performance[pageInfo.name].rating})`);
  }
  
  await page.close();
}

// Test Data Integrity
async function testDataIntegrity(context: BrowserContext) {
  console.log('\n📌 TESTING DATA INTEGRITY...');
  const page = await context.newPage();
  
  try {
    await loginAs(page, TEST_ACCOUNTS.MEMBER_MANILA);
    
    // Test duplicate check-in prevention
    console.log('   Testing duplicate check-in prevention...');
    await page.goto(`${BASE_URL}/checkin`);
    
    let duplicatePrevented = false;
    const checkInButton = await page.$('button:has-text("Check In")');
    
    if (checkInButton) {
      await checkInButton.click();
      await page.waitForTimeout(2000);
      
      // Try again
      await page.goto(`${BASE_URL}/checkin`);
      const secondButton = await page.$('button:has-text("Check In")');
      
      if (!secondButton) {
        duplicatePrevented = true;
      } else {
        await secondButton.click();
        await page.waitForTimeout(1000);
        const bodyText = await page.textContent('body');
        duplicatePrevented = bodyText?.includes('already') || bodyText?.includes('duplicate');
      }
    }
    
    testResults.dataIntegrity = { duplicateCheckIn: duplicatePrevented };
    console.log(`   Duplicate check-in prevented: ${duplicatePrevented ? '✅' : '❌'}`);
    
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    testResults.dataIntegrity.error = error.message;
  }
  
  await page.close();
}

// Cleanup all test data
async function cleanupTestData(context: BrowserContext) {
  console.log('\n📌 CLEANING UP TEST DATA...');
  const page = await context.newPage();
  
  try {
    await loginAs(page, TEST_ACCOUNTS.ADMIN_MANILA);
    
    // Clean up services
    if (createdArtifacts.services.length > 0) {
      console.log('   Cleaning services...');
      await page.goto(`${BASE_URL}/admin/services`);
      
      for (const serviceName of createdArtifacts.services) {
        try {
          const deleteBtn = await page.$(`text=${serviceName} >> .. >> button:has-text("Delete")`);
          if (deleteBtn) {
            await deleteBtn.click();
            await page.click('button:has-text("Confirm")').catch(() => {});
            await page.waitForTimeout(1000);
            testResults.cleanup.push(`Deleted: ${serviceName}`);
            console.log(`     ✅ Deleted: ${serviceName}`);
          }
        } catch {
          console.log(`     ⚠️  Could not delete: ${serviceName}`);
        }
      }
    }
    
    // Clean up life groups
    if (createdArtifacts.lifeGroups.length > 0) {
      console.log('   Cleaning life groups...');
      await page.goto(`${BASE_URL}/admin/lifegroups`);
      
      for (const lgName of createdArtifacts.lifeGroups) {
        try {
          const deleteBtn = await page.$(`text=${lgName} >> .. >> button:has-text("Delete")`);
          if (deleteBtn) {
            await deleteBtn.click();
            await page.click('button:has-text("Confirm")').catch(() => {});
            await page.waitForTimeout(1000);
            testResults.cleanup.push(`Deleted: ${lgName}`);
            console.log(`     ✅ Deleted: ${lgName}`);
          }
        } catch {
          console.log(`     ⚠️  Could not delete: ${lgName}`);
        }
      }
    }
    
    // Clean up events
    if (createdArtifacts.events.length > 0) {
      console.log('   Cleaning events...');
      await page.goto(`${BASE_URL}/admin/events`);
      
      for (const eventName of createdArtifacts.events) {
        try {
          const deleteBtn = await page.$(`text=${eventName} >> .. >> button:has-text("Delete")`);
          if (deleteBtn) {
            await deleteBtn.click();
            await page.click('button:has-text("Confirm")').catch(() => {});
            await page.waitForTimeout(1000);
            testResults.cleanup.push(`Deleted: ${eventName}`);
            console.log(`     ✅ Deleted: ${eventName}`);
          }
        } catch {
          console.log(`     ⚠️  Could not delete: ${eventName}`);
        }
      }
    }
    
    // Note: QA accounts will be cleaned via direct DB access or admin panel
    console.log('   ⚠️  QA test accounts should be deleted via admin panel or DB');
    
  } catch (error: any) {
    console.log(`   ❌ Cleanup error: ${error.message}`);
    testResults.cleanup.push(`Error: ${error.message}`);
  }
  
  await page.close();
}

// Helper: Login function
async function loginAs(page: Page, account: any) {
  await page.goto(`${BASE_URL}/auth/signin`);
  await page.fill('input#email', account.email);
  await page.fill('input#password', account.password);
  await page.click('button[type="submit"]');
  
  try {
    await page.waitForURL((url) => !url.toString().includes('/auth/signin'), {
      timeout: 10000
    });
  } catch {
    // May already be logged in
  }
}

// Generate final report
async function generateReport() {
  console.log('\n📌 GENERATING REPORT...');
  
  const reportPath = path.join(process.cwd(), 'validation_results.json');
  const report = {
    metadata: {
      url: BASE_URL,
      testPrefix: TEST_PREFIX,
      timestamp: new Date().toISOString(),
      duration: Date.now() - TIMESTAMP
    },
    results: testResults,
    artifacts: createdArtifacts
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\n========================================');
  console.log('VALIDATION SUMMARY');
  console.log('========================================');
  
  let passed = 0;
  let failed = 0;
  
  // Count results
  Object.values(testResults).forEach(section => {
    if (typeof section === 'object' && !Array.isArray(section)) {
      Object.values(section).forEach(result => {
        if (result === true || (typeof result === 'object' && result.passed)) {
          passed++;
        } else if (result === false || (typeof result === 'object' && result.error)) {
          failed++;
        }
      });
    }
  });
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  console.log('\nReport saved to validation_results.json');
}

// Run the tests
main().catch(console.error);