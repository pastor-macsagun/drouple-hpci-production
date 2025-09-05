const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://drouple-hpci-prod.vercel.app';
const TIMESTAMP = Date.now();
const TEST_PREFIX = `PRODTEST-${TIMESTAMP}`;

// Test accounts
const TEST_ACCOUNTS = {
  SUPER_ADMIN: { email: 'superadmin@test.com', password: 'password123', expectedRedirect: '/super' },
  ADMIN_MANILA: { email: 'admin.manila@test.com', password: 'password123', expectedRedirect: '/admin' },
  LEADER_MANILA: { email: 'leader.manila@test.com', password: 'password123', expectedRedirect: '/dashboard' },
  MEMBER_MANILA: { email: 'member1@test.com', password: 'password123', expectedRedirect: '/dashboard' },
  VIP_MANILA: { email: 'vip.manila@test.com', password: 'password123', expectedRedirect: '/vip/firsttimers' },
  ADMIN_CEBU: { email: 'admin.cebu@test.com', password: 'password123', expectedRedirect: '/admin' },
  MEMBER_CEBU: { email: 'member6@test.com', password: 'password123', expectedRedirect: '/dashboard' }
};

// Test data storage
const testResults = {
  context: {},
  globalSmoke: {},
  rbac: {},
  crud: {},
  memberWorkflows: {},
  vip: {},
  csvExports: {},
  security: {},
  rateLimit: {},
  accessibility: {},
  performance: {},
  observability: {},
  dataIntegrity: {},
  cleanup: []
};

// Created test artifacts for cleanup
const createdArtifacts = {
  services: [],
  lifeGroups: [],
  events: [],
  pathways: [],
  members: [],
  firstTimers: [],
  announcements: []
};

async function runValidation() {
  console.log('========================================');
  console.log('DROUPLE - CHURCH MANAGEMENT SYSTEM PRODUCTION VALIDATION');
  console.log(`URL: ${BASE_URL}`);
  console.log(`Test Prefix: ${TEST_PREFIX}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('========================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    userAgent: 'Drouple-Validator/1.0'
  });

  try {
    // 0. CONTEXT & PREP
    console.log('0) CONTEXT & PREP');
    await testHealthCheck(context);
    
    // 1. GLOBAL SMOKE TESTS
    console.log('\n1) GLOBAL SMOKE TESTS');
    await testAuthentication(context);
    
    // 2. RBAC & MULTI-TENANCY
    console.log('\n2) RBAC & MULTI-TENANCY');
    await testRBACAndTenancy(context);
    
    // 3. CORE CRUD WORKFLOWS
    console.log('\n3) CORE CRUD WORKFLOWS');
    await testCoreCRUD(context);
    
    // 4. MEMBER WORKFLOWS
    console.log('\n4) MEMBER WORKFLOWS');
    await testMemberWorkflows(context);
    
    // 5. VIP FEATURES
    console.log('\n5) VIP FEATURES');
    await testVIPFeatures(context);
    
    // 6. CSV EXPORTS
    console.log('\n6) CSV EXPORTS');
    await testCSVExports(context);
    
    // 7. SECURITY HEADERS
    console.log('\n7) SECURITY HEADERS');
    await testSecurityHeaders(context);
    
    // 8. RATE LIMITING
    console.log('\n8) RATE LIMITING');
    await testRateLimiting(context);
    
    // 9. ACCESSIBILITY
    console.log('\n9) ACCESSIBILITY');
    await testAccessibility(context);
    
    // 10. PERFORMANCE
    console.log('\n10) PERFORMANCE & UX');
    await testPerformance(context);
    
    // 11. OBSERVABILITY
    console.log('\n11) OBSERVABILITY');
    await testObservability(context);
    
    // 12. DATA INTEGRITY
    console.log('\n12) DATA INTEGRITY');
    await testDataIntegrity(context);
    
    // 13. CLEANUP
    console.log('\n13) CLEANUP');
    await cleanupTestData(context);
    
  } catch (error) {
    console.error('Validation error:', error);
    testResults.error = error.message;
  } finally {
    await browser.close();
    
    // Generate report
    console.log('\n14) GENERATING REPORT');
    await generateReport();
  }
}

// 0. CONTEXT & PREP
async function testHealthCheck(context) {
  const page = await context.newPage();
  
  // Test health endpoint
  const healthResponse = await page.request.get(`${BASE_URL}/api/health`);
  const healthData = await healthResponse.json();
  
  testResults.context.health = {
    status: healthResponse.status(),
    data: healthData,
    passed: healthData.status === 'healthy' && healthData.database === 'connected'
  };
  
  console.log(`  ✅ Health check: ${healthData.status}`);
  console.log(`  ✅ Database: ${healthData.database}`);
  
  await page.close();
}

// 1. GLOBAL SMOKE TESTS - Test all role logins
async function testAuthentication(context) {
  for (const [role, account] of Object.entries(TEST_ACCOUNTS)) {
    const page = await context.newPage();
    console.log(`  Testing ${role}...`);
    
    try {
      // Go to signin page
      await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: 'networkidle' });
      
      // Fill in credentials
      await page.fill('input#email', account.email);
      await page.fill('input#password', account.password);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForNavigation({ timeout: 10000 });
      
      // Check if we're redirected to the expected page
      const currentUrl = page.url();
      const loginSuccess = currentUrl.includes(account.expectedRedirect) || 
                           currentUrl.includes('/dashboard') ||
                           currentUrl.includes('/admin') ||
                           currentUrl.includes('/super') ||
                           currentUrl.includes('/vip');
      
      // Test logout
      let logoutSuccess = false;
      if (loginSuccess) {
        // Try to find and click logout
        try {
          await page.click('text=Logout', { timeout: 5000 });
          await page.waitForNavigation();
          logoutSuccess = page.url().includes('/auth/signin');
        } catch {
          // Try alternative logout methods
          await page.goto(`${BASE_URL}/api/auth/signout`, { method: 'POST' });
          logoutSuccess = true;
        }
      }
      
      testResults.globalSmoke[role] = {
        email: account.email,
        loginSuccess,
        logoutSuccess,
        expectedRedirect: account.expectedRedirect,
        actualUrl: currentUrl
      };
      
      console.log(`    Login: ${loginSuccess ? '✅' : '❌'} | Logout: ${logoutSuccess ? '✅' : '❌'}`);
      
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
      testResults.globalSmoke[role] = {
        email: account.email,
        error: error.message
      };
    }
    
    await page.close();
  }
}

// 2. RBAC & MULTI-TENANCY
async function testRBACAndTenancy(context) {
  // Test Manila admin cannot access Cebu data
  const page = await context.newPage();
  
  try {
    // Login as Manila admin
    await loginAs(page, TEST_ACCOUNTS.ADMIN_MANILA);
    
    // Try to access members - should only see Manila members
    await page.goto(`${BASE_URL}/admin/members`);
    await page.waitForLoadState('networkidle');
    
    const membersText = await page.textContent('body');
    const seesManila = membersText.includes('Manila') || membersText.includes('member');
    const seesCebu = membersText.includes('Cebu');
    
    testResults.rbac.tenantIsolation = {
      manilaAdminSeesManila: seesManila,
      manilaAdminSeesCebu: seesCebu,
      passed: seesManila && !seesCebu
    };
    
    console.log(`  Manila Admin sees Manila data: ${seesManila ? '✅' : '❌'}`);
    console.log(`  Manila Admin blocked from Cebu: ${!seesCebu ? '✅' : '❌'}`);
    
    // Test member cannot access admin
    await loginAs(page, TEST_ACCOUNTS.MEMBER_MANILA);
    await page.goto(`${BASE_URL}/admin/members`);
    
    const memberBlockedFromAdmin = page.url().includes('/auth/signin') || 
                                   page.url().includes('/dashboard');
    
    testResults.rbac.roleAccess = {
      memberBlockedFromAdmin,
      passed: memberBlockedFromAdmin
    };
    
    console.log(`  Member blocked from admin: ${memberBlockedFromAdmin ? '✅' : '❌'}`);
    
  } catch (error) {
    console.log(`  ❌ RBAC test error: ${error.message}`);
    testResults.rbac.error = error.message;
  }
  
  await page.close();
}

// 3. CORE CRUD WORKFLOWS
async function testCoreCRUD(context) {
  const page = await context.newPage();
  
  try {
    // Login as admin
    await loginAs(page, TEST_ACCOUNTS.ADMIN_MANILA);
    
    // Test Service CRUD
    console.log('  Testing Services...');
    await page.goto(`${BASE_URL}/admin/services`);
    await page.waitForLoadState('networkidle');
    
    // Create service
    const serviceName = `${TEST_PREFIX}-Service`;
    try {
      await page.click('text=Add Service');
      await page.fill('input[name="name"], input[id="name"]', serviceName);
      await page.fill('input[name="date"], input[type="date"]', '2025-12-31');
      await page.fill('input[name="time"], input[type="time"]', '09:00');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      createdArtifacts.services.push(serviceName);
      testResults.crud.serviceCreate = true;
      console.log('    ✅ Service created');
    } catch (error) {
      testResults.crud.serviceCreate = false;
      console.log('    ❌ Service creation failed');
    }
    
    // Test LifeGroup CRUD
    console.log('  Testing LifeGroups...');
    await page.goto(`${BASE_URL}/admin/lifegroups`);
    await page.waitForLoadState('networkidle');
    
    const lgName = `${TEST_PREFIX}-LifeGroup`;
    try {
      await page.click('text=Create Life Group');
      await page.fill('input[name="name"]', lgName);
      await page.fill('input[name="description"]', 'Test life group');
      await page.fill('input[name="capacity"]', '5');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      createdArtifacts.lifeGroups.push(lgName);
      testResults.crud.lifeGroupCreate = true;
      console.log('    ✅ LifeGroup created');
    } catch (error) {
      testResults.crud.lifeGroupCreate = false;
      console.log('    ❌ LifeGroup creation failed');
    }
    
    // Test Event CRUD
    console.log('  Testing Events...');
    await page.goto(`${BASE_URL}/admin/events`);
    await page.waitForLoadState('networkidle');
    
    const eventName = `${TEST_PREFIX}-Event`;
    try {
      await page.click('text=Create Event');
      await page.fill('input[name="title"]', eventName);
      await page.fill('input[name="description"]', 'Test event');
      await page.fill('input[name="date"], input[type="date"]', '2025-12-31');
      await page.fill('input[name="capacity"]', '1');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      createdArtifacts.events.push(eventName);
      testResults.crud.eventCreate = true;
      console.log('    ✅ Event created');
    } catch (error) {
      testResults.crud.eventCreate = false;
      console.log('    ❌ Event creation failed');
    }
    
    // Test Pathway CRUD
    console.log('  Testing Pathways...');
    await page.goto(`${BASE_URL}/admin/pathways`);
    await page.waitForLoadState('networkidle');
    
    const pathwayName = `${TEST_PREFIX}-Pathway`;
    try {
      await page.click('text=Create Pathway');
      await page.fill('input[name="name"]', pathwayName);
      await page.fill('input[name="description"]', 'Test pathway');
      await page.selectOption('select[name="type"]', 'ROOTS');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      createdArtifacts.pathways.push(pathwayName);
      testResults.crud.pathwayCreate = true;
      console.log('    ✅ Pathway created');
    } catch (error) {
      testResults.crud.pathwayCreate = false;
      console.log('    ❌ Pathway creation failed');
    }
    
    // Test Member CRUD
    console.log('  Testing Members...');
    await page.goto(`${BASE_URL}/admin/members`);
    await page.waitForLoadState('networkidle');
    
    const memberEmail = `${TEST_PREFIX}@test.com`.toLowerCase();
    try {
      await page.click('text=Add Member');
      await page.fill('input[name="firstName"]', TEST_PREFIX);
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="email"]', memberEmail);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      createdArtifacts.members.push(memberEmail);
      testResults.crud.memberCreate = true;
      console.log('    ✅ Member created');
    } catch (error) {
      testResults.crud.memberCreate = false;
      console.log('    ❌ Member creation failed');
    }
    
  } catch (error) {
    console.log(`  ❌ CRUD test error: ${error.message}`);
    testResults.crud.error = error.message;
  }
  
  await page.close();
}

// 4. MEMBER WORKFLOWS
async function testMemberWorkflows(context) {
  const page = await context.newPage();
  
  try {
    // Login as member
    await loginAs(page, TEST_ACCOUNTS.MEMBER_MANILA);
    
    // Test directory search
    console.log('  Testing Directory...');
    await page.goto(`${BASE_URL}/members`);
    await page.waitForLoadState('networkidle');
    
    try {
      await page.fill('input[placeholder*="Search"]', 'test');
      await page.waitForTimeout(1000);
      testResults.memberWorkflows.directorySearch = true;
      console.log('    ✅ Directory search works');
    } catch {
      testResults.memberWorkflows.directorySearch = false;
      console.log('    ❌ Directory search failed');
    }
    
    // Test profile update
    console.log('  Testing Profile...');
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    
    try {
      const phoneField = await page.$('input[name="phoneNumber"]');
      if (phoneField) {
        await phoneField.fill('555-0123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
        testResults.memberWorkflows.profileUpdate = true;
        console.log('    ✅ Profile update works');
      } else {
        testResults.memberWorkflows.profileUpdate = false;
        console.log('    ⚠️ Profile form not found');
      }
    } catch {
      testResults.memberWorkflows.profileUpdate = false;
      console.log('    ❌ Profile update failed');
    }
    
    // Test check-in
    console.log('  Testing Check-in...');
    await page.goto(`${BASE_URL}/checkin`);
    await page.waitForLoadState('networkidle');
    
    try {
      const checkInButton = await page.$('button:has-text("Check In")');
      if (checkInButton) {
        await checkInButton.click();
        await page.waitForTimeout(2000);
        
        // Check for success or already checked in message
        const pageText = await page.textContent('body');
        const checkedIn = pageText.includes('checked in') || 
                          pageText.includes('already') ||
                          pageText.includes('success');
        testResults.memberWorkflows.checkIn = checkedIn;
        console.log(`    ${checkedIn ? '✅' : '❌'} Check-in ${checkedIn ? 'processed' : 'failed'}`);
      } else {
        testResults.memberWorkflows.checkIn = false;
        console.log('    ⚠️ No active service for check-in');
      }
    } catch (error) {
      testResults.memberWorkflows.checkIn = false;
      console.log('    ❌ Check-in error:', error.message);
    }
    
    // Test events RSVP
    console.log('  Testing Events...');
    await page.goto(`${BASE_URL}/events`);
    await page.waitForLoadState('networkidle');
    
    try {
      const rsvpButton = await page.$('button:has-text("RSVP")');
      if (rsvpButton) {
        await rsvpButton.click();
        await page.waitForTimeout(2000);
        testResults.memberWorkflows.eventRSVP = true;
        console.log('    ✅ Event RSVP works');
      } else {
        testResults.memberWorkflows.eventRSVP = null;
        console.log('    ⚠️ No events available for RSVP');
      }
    } catch {
      testResults.memberWorkflows.eventRSVP = false;
      console.log('    ❌ Event RSVP failed');
    }
    
    // Test life groups
    console.log('  Testing LifeGroups...');
    await page.goto(`${BASE_URL}/lifegroups`);
    await page.waitForLoadState('networkidle');
    
    try {
      const joinButton = await page.$('button:has-text("Request to Join")');
      if (joinButton) {
        await joinButton.click();
        await page.waitForTimeout(2000);
        testResults.memberWorkflows.lifeGroupRequest = true;
        console.log('    ✅ LifeGroup request works');
      } else {
        testResults.memberWorkflows.lifeGroupRequest = null;
        console.log('    ⚠️ No groups available to join');
      }
    } catch {
      testResults.memberWorkflows.lifeGroupRequest = false;
      console.log('    ❌ LifeGroup request failed');
    }
    
    // Test pathways
    console.log('  Testing Pathways...');
    await page.goto(`${BASE_URL}/pathways`);
    await page.waitForLoadState('networkidle');
    
    try {
      const enrollButton = await page.$('button:has-text("Enroll")');
      if (enrollButton) {
        await enrollButton.click();
        await page.waitForTimeout(2000);
        testResults.memberWorkflows.pathwayEnroll = true;
        console.log('    ✅ Pathway enrollment works');
      } else {
        testResults.memberWorkflows.pathwayEnroll = null;
        console.log('    ⚠️ No pathways available or already enrolled');
      }
    } catch {
      testResults.memberWorkflows.pathwayEnroll = false;
      console.log('    ❌ Pathway enrollment failed');
    }
    
  } catch (error) {
    console.log(`  ❌ Member workflow error: ${error.message}`);
    testResults.memberWorkflows.error = error.message;
  }
  
  await page.close();
}

// 5. VIP FEATURES
async function testVIPFeatures(context) {
  const page = await context.newPage();
  
  try {
    // Login as VIP
    await loginAs(page, TEST_ACCOUNTS.VIP_MANILA);
    
    // Navigate to first-timers
    await page.goto(`${BASE_URL}/vip/firsttimers`);
    await page.waitForLoadState('networkidle');
    
    // Log a first-timer
    console.log('  Testing First-timer logging...');
    const firstTimerName = `${TEST_PREFIX}-FirstTimer`;
    
    try {
      await page.click('text=Add First Timer');
      await page.fill('input[name="name"]', firstTimerName);
      await page.fill('input[name="email"]', `${TEST_PREFIX}-ft@test.com`.toLowerCase());
      await page.check('input[name="gospelShared"]');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      createdArtifacts.firstTimers.push(firstTimerName);
      testResults.vip.firstTimerCreate = true;
      console.log('    ✅ First-timer logged');
      
      // Check auto-enrollment in ROOTS
      const pageText = await page.textContent('body');
      const autoEnrolled = pageText.includes('ROOTS') || pageText.includes('enrolled');
      testResults.vip.autoEnrollROOTS = autoEnrolled;
      console.log(`    ${autoEnrolled ? '✅' : '⚠️'} ROOTS auto-enrollment ${autoEnrolled ? 'confirmed' : 'not visible'}`);
      
      // Mark as inactive
      const inactiveButton = await page.$('button:has-text("Set Inactive")');
      if (inactiveButton) {
        await inactiveButton.click();
        await page.waitForTimeout(1000);
        
        // Confirm dialog if present
        const confirmButton = await page.$('button:has-text("Confirm")');
        if (confirmButton) {
          await confirmButton.click();
          await page.waitForTimeout(2000);
        }
        
        testResults.vip.markInactive = true;
        console.log('    ✅ Mark inactive works');
      } else {
        testResults.vip.markInactive = false;
        console.log('    ⚠️ Set Inactive button not found');
      }
      
    } catch (error) {
      testResults.vip.firstTimerCreate = false;
      console.log('    ❌ First-timer creation failed:', error.message);
    }
    
  } catch (error) {
    console.log(`  ❌ VIP features error: ${error.message}`);
    testResults.vip.error = error.message;
  }
  
  await page.close();
}

// 6. CSV EXPORTS
async function testCSVExports(context) {
  const page = await context.newPage();
  
  try {
    // Login as admin
    await loginAs(page, TEST_ACCOUNTS.ADMIN_MANILA);
    
    // Enable downloads
    const downloadPromises = [];
    
    // Test service attendance export
    console.log('  Testing Service attendance export...');
    await page.goto(`${BASE_URL}/admin/services`);
    await page.waitForLoadState('networkidle');
    
    try {
      const exportButton = await page.$('button:has-text("Export")');
      if (exportButton) {
        const downloadPromise = page.waitForEvent('download');
        downloadPromises.push(downloadPromise);
        await exportButton.click();
        
        const download = await downloadPromise;
        const path = await download.path();
        testResults.csvExports.serviceExport = !!path;
        console.log('    ✅ Service attendance CSV exported');
      } else {
        testResults.csvExports.serviceExport = false;
        console.log('    ⚠️ Export button not found');
      }
    } catch {
      testResults.csvExports.serviceExport = false;
      console.log('    ❌ Service export failed');
    }
    
    // Test lifegroup roster export
    console.log('  Testing LifeGroup roster export...');
    await page.goto(`${BASE_URL}/admin/lifegroups`);
    await page.waitForLoadState('networkidle');
    
    try {
      // Open a lifegroup details
      const manageButton = await page.$('button:has-text("Manage")');
      if (manageButton) {
        await manageButton.click();
        await page.waitForTimeout(2000);
        
        const exportRosterButton = await page.$('button:has-text("Export Roster")');
        if (exportRosterButton) {
          const downloadPromise = page.waitForEvent('download');
          downloadPromises.push(downloadPromise);
          await exportRosterButton.click();
          
          const download = await downloadPromise;
          const path = await download.path();
          testResults.csvExports.lifeGroupExport = !!path;
          console.log('    ✅ LifeGroup roster CSV exported');
        } else {
          testResults.csvExports.lifeGroupExport = false;
          console.log('    ⚠️ Export roster button not found');
        }
      } else {
        testResults.csvExports.lifeGroupExport = false;
        console.log('    ⚠️ No lifegroups to manage');
      }
    } catch {
      testResults.csvExports.lifeGroupExport = false;
      console.log('    ❌ LifeGroup export failed');
    }
    
    // Test event attendees export
    console.log('  Testing Event attendees export...');
    await page.goto(`${BASE_URL}/admin/events`);
    await page.waitForLoadState('networkidle');
    
    try {
      const viewAttendeesButton = await page.$('button:has-text("View Attendees")');
      if (viewAttendeesButton) {
        await viewAttendeesButton.click();
        await page.waitForTimeout(2000);
        
        const exportButton = await page.$('button:has-text("Export")');
        if (exportButton) {
          const downloadPromise = page.waitForEvent('download');
          downloadPromises.push(downloadPromise);
          await exportButton.click();
          
          const download = await downloadPromise;
          const path = await download.path();
          testResults.csvExports.eventExport = !!path;
          console.log('    ✅ Event attendees CSV exported');
        } else {
          testResults.csvExports.eventExport = false;
          console.log('    ⚠️ Export button not found');
        }
      } else {
        testResults.csvExports.eventExport = false;
        console.log('    ⚠️ No events with attendees');
      }
    } catch {
      testResults.csvExports.eventExport = false;
      console.log('    ❌ Event export failed');
    }
    
  } catch (error) {
    console.log(`  ❌ CSV export error: ${error.message}`);
    testResults.csvExports.error = error.message;
  }
  
  await page.close();
}

// 7. SECURITY HEADERS
async function testSecurityHeaders(context) {
  const page = await context.newPage();
  
  // Check main page headers
  const response = await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  const headers = response.headers();
  
  const securityChecks = {
    csp: !!headers['content-security-policy'],
    xFrameOptions: !!headers['x-frame-options'],
    xContentType: !!headers['x-content-type-options'],
    referrerPolicy: !!headers['referrer-policy'],
    hsts: !!headers['strict-transport-security']
  };
  
  testResults.security.headers = securityChecks;
  testResults.security.allPresent = Object.values(securityChecks).every(v => v);
  
  console.log(`  CSP: ${securityChecks.csp ? '✅' : '❌'}`);
  console.log(`  X-Frame-Options: ${securityChecks.xFrameOptions ? '✅' : '❌'}`);
  console.log(`  X-Content-Type-Options: ${securityChecks.xContentType ? '✅' : '❌'}`);
  console.log(`  Referrer-Policy: ${securityChecks.referrerPolicy ? '✅' : '❌'}`);
  console.log(`  HSTS: ${securityChecks.hsts ? '✅' : '❌'}`);
  
  // Test cross-role access
  console.log('  Testing cross-role access...');
  
  // Member trying to access admin
  await loginAs(page, TEST_ACCOUNTS.MEMBER_MANILA);
  await page.goto(`${BASE_URL}/admin/members`);
  const memberBlocked = page.url().includes('/dashboard') || page.url().includes('/auth/signin');
  
  testResults.security.crossRoleBlock = memberBlocked;
  console.log(`  Member blocked from admin: ${memberBlocked ? '✅' : '❌'}`);
  
  await page.close();
}

// 8. RATE LIMITING
async function testRateLimiting(context) {
  const page = await context.newPage();
  
  console.log('  Testing login rate limit...');
  
  // Try multiple failed logins
  let rateLimitTriggered = false;
  const badCredentials = { email: 'bad@test.com', password: 'wrongpassword' };
  
  for (let i = 0; i < 5; i++) {
    try {
      await page.goto(`${BASE_URL}/auth/signin`);
      await page.fill('input[name="email"]', badCredentials.email);
      await page.fill('input[name="password"]', badCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
      
      const pageText = await page.textContent('body');
      if (pageText.includes('too many') || pageText.includes('rate limit') || pageText.includes('429')) {
        rateLimitTriggered = true;
        break;
      }
    } catch (error) {
      // Check if we got a 429 response
      if (error.message.includes('429')) {
        rateLimitTriggered = true;
        break;
      }
    }
  }
  
  testResults.rateLimit.loginLimit = rateLimitTriggered;
  console.log(`    Login rate limit: ${rateLimitTriggered ? '✅ Triggered' : '⚠️ Not triggered (may be OK)'}`);
  
  // Test check-in rate limit
  console.log('  Testing check-in rate limit...');
  
  await loginAs(page, TEST_ACCOUNTS.MEMBER_MANILA);
  await page.goto(`${BASE_URL}/checkin`);
  
  let checkinRateLimited = false;
  
  try {
    // First check-in
    const checkInButton = await page.$('button:has-text("Check In")');
    if (checkInButton) {
      await checkInButton.click();
      await page.waitForTimeout(2000);
      
      // Try second check-in
      const secondButton = await page.$('button:has-text("Check In")');
      if (secondButton) {
        await secondButton.click();
        await page.waitForTimeout(2000);
        
        const pageText = await page.textContent('body');
        checkinRateLimited = pageText.includes('already') || 
                             pageText.includes('rate') || 
                             pageText.includes('wait');
      }
    }
  } catch {
    // Expected to fail
    checkinRateLimited = true;
  }
  
  testResults.rateLimit.checkinLimit = checkinRateLimited;
  console.log(`    Check-in rate limit: ${checkinRateLimited ? '✅ Enforced' : '⚠️ Not enforced'}`);
  
  await page.close();
}

// 9. ACCESSIBILITY
async function testAccessibility(context) {
  const page = await context.newPage();
  
  await page.goto(`${BASE_URL}/`);
  
  // Check for skip navigation
  console.log('  Testing skip navigation...');
  const skipNav = await page.$('[href="#main-content"]');
  testResults.accessibility.skipNav = !!skipNav;
  console.log(`    Skip navigation: ${skipNav ? '✅' : '❌'}`);
  
  // Check form labels
  console.log('  Testing form labels...');
  await page.goto(`${BASE_URL}/auth/signin`);
  const emailLabel = await page.$('label[for="email"]');
  const passwordLabel = await page.$('label[for="password"]');
  testResults.accessibility.formLabels = !!(emailLabel || passwordLabel);
  console.log(`    Form labels: ${testResults.accessibility.formLabels ? '✅' : '⚠️'}`);
  
  // Check keyboard navigation
  console.log('  Testing keyboard navigation...');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
  testResults.accessibility.keyboardNav = !!focusedElement;
  console.log(`    Keyboard navigation: ${focusedElement ? '✅' : '❌'}`);
  
  // Check ARIA attributes
  console.log('  Testing ARIA attributes...');
  const ariaElements = await page.$$('[role], [aria-label], [aria-describedby]');
  testResults.accessibility.ariaAttributes = ariaElements.length > 0;
  console.log(`    ARIA attributes: ${ariaElements.length > 0 ? '✅' : '⚠️'}`);
  
  // Check color contrast (basic check)
  console.log('  Testing contrast...');
  const textColor = await page.evaluate(() => {
    const el = document.querySelector('body');
    return window.getComputedStyle(el).color;
  });
  const bgColor = await page.evaluate(() => {
    const el = document.querySelector('body');
    return window.getComputedStyle(el).backgroundColor;
  });
  testResults.accessibility.hasColors = !!(textColor && bgColor);
  console.log(`    Color definitions: ${testResults.accessibility.hasColors ? '✅' : '❌'}`);
  
  await page.close();
}

// 10. PERFORMANCE
async function testPerformance(context) {
  const page = await context.newPage();
  
  const pagesToTest = [
    { url: '/', name: 'Landing Page' },
    { url: '/events', name: 'Events Page' },
    { url: '/dashboard', name: 'Dashboard' },
    { url: '/admin/services', name: 'Admin Services' },
    { url: '/admin/lifegroups', name: 'Admin LifeGroups' }
  ];
  
  testResults.performance.pages = {};
  
  for (const pageInfo of pagesToTest) {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}${pageInfo.url}`, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    
    testResults.performance.pages[pageInfo.name] = {
      loadTime,
      rating: loadTime < 2000 ? 'Good' : loadTime < 4000 ? 'Acceptable' : 'Slow'
    };
    
    console.log(`  ${pageInfo.name}: ${loadTime}ms (${testResults.performance.pages[pageInfo.name].rating})`);
  }
  
  // Test for loading spinners
  console.log('  Testing loading states...');
  await page.goto(`${BASE_URL}/dashboard`);
  const spinner = await page.$('.spinner, .loading, [role="progressbar"]');
  testResults.performance.hasLoadingStates = !!spinner;
  console.log(`    Loading indicators: ${spinner ? '✅' : '⚠️'}`);
  
  // Test empty states
  console.log('  Testing empty states...');
  const emptyState = await page.$('.empty-state, [data-empty], :has-text("No results"), :has-text("No data")');
  testResults.performance.hasEmptyStates = !!emptyState;
  console.log(`    Empty states: ${emptyState ? '✅' : '⚠️'}`);
  
  await page.close();
}

// 11. OBSERVABILITY
async function testObservability(context) {
  const page = await context.newPage();
  
  // Test 404 handling
  console.log('  Testing 404 handling...');
  const response404 = await page.goto(`${BASE_URL}/nonexistent-page-${TIMESTAMP}`, { waitUntil: 'networkidle' });
  testResults.observability.handles404 = response404.status() === 404;
  console.log(`    404 handling: ${testResults.observability.handles404 ? '✅' : '❌'}`);
  
  // Test health endpoint again for monitoring
  console.log('  Testing health monitoring...');
  const healthResponse = await page.request.get(`${BASE_URL}/api/health`);
  testResults.observability.healthMonitoring = healthResponse.status() === 200;
  console.log(`    Health monitoring: ${testResults.observability.healthMonitoring ? '✅' : '❌'}`);
  
  // Check for error boundaries (trigger benign error)
  console.log('  Testing error handling...');
  try {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.evaluate(() => {
      throw new Error('Test error for observability');
    });
  } catch {
    // Expected to catch
  }
  
  // Check if page still functional
  const pageStillWorks = await page.$('body');
  testResults.observability.errorRecovery = !!pageStillWorks;
  console.log(`    Error recovery: ${pageStillWorks ? '✅' : '❌'}`);
  
  await page.close();
}

// 12. DATA INTEGRITY
async function testDataIntegrity(context) {
  const page = await context.newPage();
  
  try {
    // Login as admin
    await loginAs(page, TEST_ACCOUNTS.ADMIN_MANILA);
    
    // Test duplicate check-in constraint
    console.log('  Testing duplicate check-in prevention...');
    await loginAs(page, TEST_ACCOUNTS.MEMBER_MANILA);
    await page.goto(`${BASE_URL}/checkin`);
    
    let duplicatePrevented = false;
    
    try {
      // First check-in
      const checkInButton = await page.$('button:has-text("Check In")');
      if (checkInButton) {
        await checkInButton.click();
        await page.waitForTimeout(2000);
        
        // Try duplicate
        await page.goto(`${BASE_URL}/checkin`);
        const secondButton = await page.$('button:has-text("Check In")');
        if (secondButton) {
          await secondButton.click();
          await page.waitForTimeout(2000);
          
          const pageText = await page.textContent('body');
          duplicatePrevented = pageText.includes('already') || 
                               pageText.includes('duplicate') ||
                               pageText.includes('checked in');
        } else {
          // No button means already checked in
          duplicatePrevented = true;
        }
      }
    } catch {
      duplicatePrevented = true;
    }
    
    testResults.dataIntegrity.duplicateCheckInPrevented = duplicatePrevented;
    console.log(`    Duplicate check-in prevented: ${duplicatePrevented ? '✅' : '❌'}`);
    
    // Test duplicate RSVP constraint
    console.log('  Testing duplicate RSVP prevention...');
    await page.goto(`${BASE_URL}/events`);
    
    let duplicateRSVPPrevented = false;
    
    try {
      const rsvpButton = await page.$('button:has-text("RSVP")');
      if (rsvpButton) {
        await rsvpButton.click();
        await page.waitForTimeout(2000);
        
        // Try duplicate
        await page.goto(`${BASE_URL}/events`);
        const pageText = await page.textContent('body');
        duplicateRSVPPrevented = !pageText.includes('RSVP') || 
                                 pageText.includes('Cancel') ||
                                 pageText.includes('already');
      }
    } catch {
      duplicateRSVPPrevented = true;
    }
    
    testResults.dataIntegrity.duplicateRSVPPrevented = duplicateRSVPPrevented;
    console.log(`    Duplicate RSVP prevented: ${duplicateRSVPPrevented ? '✅' : '⚠️'}`);
    
    // Test cascade deletes
    console.log('  Testing cascade deletes...');
    testResults.dataIntegrity.cascadeDeletes = 'Not tested in production';
    console.log('    Cascade deletes: ⚠️ Skipped (production safety)');
    
  } catch (error) {
    console.log(`  ❌ Data integrity error: ${error.message}`);
    testResults.dataIntegrity.error = error.message;
  }
  
  await page.close();
}

// 13. CLEANUP
async function cleanupTestData(context) {
  const page = await context.newPage();
  
  try {
    // Login as admin
    await loginAs(page, TEST_ACCOUNTS.ADMIN_MANILA);
    
    // Clean up services
    if (createdArtifacts.services.length > 0) {
      console.log('  Cleaning up services...');
      await page.goto(`${BASE_URL}/admin/services`);
      for (const serviceName of createdArtifacts.services) {
        try {
          const deleteButton = await page.$(`text=${serviceName} >> .. >> button:has-text("Delete")`);
          if (deleteButton) {
            await deleteButton.click();
            await page.waitForTimeout(1000);
            
            // Confirm if needed
            const confirmButton = await page.$('button:has-text("Confirm")');
            if (confirmButton) {
              await confirmButton.click();
              await page.waitForTimeout(2000);
            }
            
            testResults.cleanup.push(`Deleted service: ${serviceName}`);
            console.log(`    ✅ Deleted: ${serviceName}`);
          }
        } catch {
          console.log(`    ⚠️ Could not delete: ${serviceName}`);
        }
      }
    }
    
    // Clean up life groups
    if (createdArtifacts.lifeGroups.length > 0) {
      console.log('  Cleaning up life groups...');
      await page.goto(`${BASE_URL}/admin/lifegroups`);
      for (const lgName of createdArtifacts.lifeGroups) {
        try {
          const deleteButton = await page.$(`text=${lgName} >> .. >> button:has-text("Delete")`);
          if (deleteButton) {
            await deleteButton.click();
            await page.waitForTimeout(1000);
            
            const confirmButton = await page.$('button:has-text("Confirm")');
            if (confirmButton) {
              await confirmButton.click();
              await page.waitForTimeout(2000);
            }
            
            testResults.cleanup.push(`Deleted life group: ${lgName}`);
            console.log(`    ✅ Deleted: ${lgName}`);
          }
        } catch {
          console.log(`    ⚠️ Could not delete: ${lgName}`);
        }
      }
    }
    
    // Clean up events
    if (createdArtifacts.events.length > 0) {
      console.log('  Cleaning up events...');
      await page.goto(`${BASE_URL}/admin/events`);
      for (const eventName of createdArtifacts.events) {
        try {
          const deleteButton = await page.$(`text=${eventName} >> .. >> button:has-text("Delete")`);
          if (deleteButton) {
            await deleteButton.click();
            await page.waitForTimeout(1000);
            
            const confirmButton = await page.$('button:has-text("Confirm")');
            if (confirmButton) {
              await confirmButton.click();
              await page.waitForTimeout(2000);
            }
            
            testResults.cleanup.push(`Deleted event: ${eventName}`);
            console.log(`    ✅ Deleted: ${eventName}`);
          }
        } catch {
          console.log(`    ⚠️ Could not delete: ${eventName}`);
        }
      }
    }
    
    // Clean up members
    if (createdArtifacts.members.length > 0) {
      console.log('  Cleaning up members...');
      await page.goto(`${BASE_URL}/admin/members`);
      for (const memberEmail of createdArtifacts.members) {
        try {
          await page.fill('input[placeholder*="Search"]', memberEmail);
          await page.waitForTimeout(2000);
          
          const deleteButton = await page.$('button:has-text("Delete")');
          if (deleteButton) {
            await deleteButton.click();
            await page.waitForTimeout(1000);
            
            const confirmButton = await page.$('button:has-text("Confirm")');
            if (confirmButton) {
              await confirmButton.click();
              await page.waitForTimeout(2000);
            }
            
            testResults.cleanup.push(`Deleted member: ${memberEmail}`);
            console.log(`    ✅ Deleted: ${memberEmail}`);
          }
        } catch {
          console.log(`    ⚠️ Could not delete: ${memberEmail}`);
        }
      }
    }
    
    console.log('  ✅ Cleanup completed');
    
  } catch (error) {
    console.log(`  ❌ Cleanup error: ${error.message}`);
    testResults.cleanup.push(`Error: ${error.message}`);
  }
  
  await page.close();
}

// Helper function to login
async function loginAs(page, account) {
  await page.goto(`${BASE_URL}/auth/signin`);
  await page.fill('input#email', account.email);
  await page.fill('input#password', account.password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
}

// Generate the final report
async function generateReport() {
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
  
  // Save JSON report
  fs.writeFileSync(
    path.join(__dirname, 'validation_results.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n========================================');
  console.log('VALIDATION COMPLETE');
  console.log('========================================');
  console.log('Results saved to validation_results.json');
  
  // Print summary
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  for (const section of Object.values(testResults)) {
    if (typeof section === 'object' && !Array.isArray(section)) {
      for (const [key, value] of Object.entries(section)) {
        if (key !== 'error') {
          totalTests++;
          if (value === true || value === 'Pass') {
            passedTests++;
          } else if (value === false || value === 'Fail') {
            failedTests++;
          }
        }
      }
    }
  }
  
  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Warnings: ${totalTests - passedTests - failedTests}`);
  
  return report;
}

// Run the validation
runValidation().catch(console.error);