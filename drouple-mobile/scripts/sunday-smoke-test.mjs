#!/usr/bin/env node
/**
 * Sunday Smoke Test Script
 * Automated validation of critical app functionality before Sunday service
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test configuration
const CONFIG = {
  STAGING_API: 'https://staging.drouple.com/api/v2',
  TEST_USER: {
    email: 'test.member@staging.com',
    password: 'Staging!Test2025'
  },
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3
};

// Test results tracking
let results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Utility functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',    // cyan
    success: '\x1b[32m', // green
    warning: '\x1b[33m', // yellow
    error: '\x1b[31m',   // red
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[level]}[${timestamp}] ${message}${colors.reset}`);
}

function recordTest(name, status, error = null) {
  results.tests.push({ name, status, error, timestamp: new Date().toISOString() });
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else results.skipped++;
}

async function retry(fn, attempts = CONFIG.RETRY_ATTEMPTS) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      log(`Attempt ${i + 1} failed, retrying...`, 'warning');
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

async function makeApiRequest(endpoint, options = {}) {
  const response = await fetch(`${CONFIG.STAGING_API}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'SundaySmoke/1.0',
      ...options.headers
    },
    ...options
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

// Test implementations
async function test1_AppBuilds() {
  log('🔨 Test 1: App builds successfully');
  try {
    await retry(async () => {
      execSync('npx expo export --platform ios --output-dir /tmp/smoke-test-build', { 
        cwd: __dirname + '/..', 
        stdio: 'pipe',
        timeout: 60000 
      });
    });
    recordTest('App builds successfully', 'PASS');
    log('✅ App builds without errors', 'success');
  } catch (error) {
    recordTest('App builds successfully', 'FAIL', error.message);
    log(`❌ Build failed: ${error.message}`, 'error');
  }
}

async function test2_UnitTests() {
  log('🧪 Test 2: Unit tests pass');
  try {
    await retry(async () => {
      execSync('npm run test:unit -- --run', { 
        cwd: __dirname + '/..', 
        stdio: 'pipe',
        timeout: 45000 
      });
    });
    recordTest('Unit tests pass', 'PASS');
    log('✅ All unit tests passing', 'success');
  } catch (error) {
    recordTest('Unit tests pass', 'FAIL', error.message);
    log(`❌ Unit tests failed: ${error.message}`, 'error');
  }
}

async function test3_StagingAPI() {
  log('🌐 Test 3: Staging API is accessible');
  try {
    await retry(async () => {
      const response = await fetch(CONFIG.STAGING_API.replace('/api/v2', '/health'), {
        timeout: 10000
      });
      if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
    });
    recordTest('Staging API accessible', 'PASS');
    log('✅ Staging API responding', 'success');
  } catch (error) {
    recordTest('Staging API accessible', 'FAIL', error.message);
    log(`❌ Staging API unreachable: ${error.message}`, 'error');
  }
}

async function test4_Authentication() {
  log('🔐 Test 4: Authentication works');
  try {
    const authResult = await retry(async () => {
      const response = await makeApiRequest('/auth/token', {
        method: 'POST',
        body: JSON.stringify({
          sessionToken: 'mock-session-token',
          deviceId: 'smoke-test-device'
        })
      });
      
      if (!response.success) {
        throw new Error(`Auth failed: ${response.error}`);
      }
      
      return response.data;
    });
    
    recordTest('Authentication works', 'PASS');
    log('✅ Authentication successful', 'success');
    return authResult.token;
  } catch (error) {
    recordTest('Authentication works', 'FAIL', error.message);
    log(`❌ Authentication failed: ${error.message}`, 'error');
    return null;
  }
}

async function test5_PushNotifications(authToken) {
  log('📱 Test 5: Push notification registration');
  if (!authToken) {
    recordTest('Push notification registration', 'SKIP', 'No auth token');
    return;
  }
  
  try {
    await retry(async () => {
      await makeApiRequest('/notifications/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          deviceId: 'smoke-test-device',
          platform: 'ios',
          appVersion: '1.0.0',
          osVersion: '17.0',
          preferences: {
            general: true,
            prayerRequests: true,
            announcements: false
          }
        })
      });
    });
    
    recordTest('Push notification registration', 'PASS');
    log('✅ Push notifications registered', 'success');
  } catch (error) {
    recordTest('Push notification registration', 'FAIL', error.message);
    log(`❌ Push notification registration failed: ${error.message}`, 'error');
  }
}

async function test6_EventsAPI(authToken) {
  log('📅 Test 6: Events API responds');
  if (!authToken) {
    recordTest('Events API responds', 'SKIP', 'No auth token');
    return;
  }
  
  try {
    const events = await retry(async () => {
      return await makeApiRequest('/events', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
    });
    
    recordTest('Events API responds', 'PASS');
    log(`✅ Events API returned ${events.data?.length || 0} events`, 'success');
  } catch (error) {
    recordTest('Events API responds', 'FAIL', error.message);
    log(`❌ Events API failed: ${error.message}`, 'error');
  }
}

async function test7_DirectoryAPI(authToken) {
  log('👥 Test 7: Directory API responds');
  if (!authToken) {
    recordTest('Directory API responds', 'SKIP', 'No auth token');
    return;
  }
  
  try {
    const members = await retry(async () => {
      return await makeApiRequest('/directory/search?q=test', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
    });
    
    recordTest('Directory API responds', 'PASS');
    log(`✅ Directory API returned ${members.data?.length || 0} members`, 'success');
  } catch (error) {
    recordTest('Directory API responds', 'FAIL', error.message);
    log(`❌ Directory API failed: ${error.message}`, 'error');
  }
}

async function test8_CheckinAPI(authToken) {
  log('✅ Test 8: Check-in API responds');
  if (!authToken) {
    recordTest('Check-in API responds', 'SKIP', 'No auth token');
    return;
  }
  
  try {
    const services = await retry(async () => {
      return await makeApiRequest('/services', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
    });
    
    recordTest('Check-in API responds', 'PASS');
    log(`✅ Check-in API returned ${services.data?.length || 0} services`, 'success');
  } catch (error) {
    recordTest('Check-in API responds', 'FAIL', error.message);
    log(`❌ Check-in API failed: ${error.message}`, 'error');
  }
}

async function test9_OfflineMode() {
  log('📴 Test 9: Offline mode functionality');
  try {
    // Check if offline storage utilities exist
    const offlineTestPath = path.join(__dirname, '..', 'lib', 'sync', 'syncManager.ts');
    if (!fs.existsSync(offlineTestPath)) {
      throw new Error('Offline sync manager not found');
    }
    
    // Run offline-specific unit tests
    await retry(async () => {
      execSync('npm run test:unit -- --run --testPathPattern=sync', { 
        cwd: __dirname + '/..', 
        stdio: 'pipe',
        timeout: 30000 
      });
    });
    
    recordTest('Offline mode functionality', 'PASS');
    log('✅ Offline mode tests passing', 'success');
  } catch (error) {
    recordTest('Offline mode functionality', 'FAIL', error.message);
    log(`❌ Offline mode failed: ${error.message}`, 'error');
  }
}

async function test10_PerformanceBudgets() {
  log('⚡ Test 10: Performance within budgets');
  try {
    // Check bundle size
    const measureScript = path.join(__dirname, 'measure-startup.mjs');
    if (!fs.existsSync(measureScript)) {
      throw new Error('Performance measurement script not found');
    }
    
    // Run performance measurement
    await retry(async () => {
      const output = execSync('node scripts/measure-startup.mjs', { 
        cwd: __dirname + '/..', 
        encoding: 'utf8',
        timeout: 45000 
      });
      
      // Parse results and check against budgets
      if (output.includes('BUDGET_EXCEEDED')) {
        throw new Error('Performance budget exceeded');
      }
    });
    
    recordTest('Performance within budgets', 'PASS');
    log('✅ Performance budgets met', 'success');
  } catch (error) {
    recordTest('Performance within budgets', 'FAIL', error.message);
    log(`❌ Performance check failed: ${error.message}`, 'error');
  }
}

async function test11_SecurityHeaders() {
  log('🔒 Test 11: Security headers present');
  try {
    await retry(async () => {
      const response = await fetch(CONFIG.STAGING_API.replace('/api/v2', ''), {
        method: 'HEAD',
        timeout: 10000
      });
      
      const requiredHeaders = [
        'x-frame-options',
        'x-content-type-options', 
        'strict-transport-security'
      ];
      
      const missing = requiredHeaders.filter(header => !response.headers.get(header));
      if (missing.length > 0) {
        throw new Error(`Missing security headers: ${missing.join(', ')}`);
      }
    });
    
    recordTest('Security headers present', 'PASS');
    log('✅ Security headers configured', 'success');
  } catch (error) {
    recordTest('Security headers present', 'FAIL', error.message);
    log(`❌ Security headers check failed: ${error.message}`, 'error');
  }
}

async function test12_E2ECriticalFlow() {
  log('🎯 Test 12: Critical E2E flow');
  try {
    // Run a subset of E2E tests focusing on critical paths
    await retry(async () => {
      execSync('npx detox test e2e/detox/auth-flow.e2e.ts --configuration ios.sim.debug', { 
        cwd: __dirname + '/..', 
        stdio: 'pipe',
        timeout: 120000 
      });
    });
    
    recordTest('Critical E2E flow', 'PASS');
    log('✅ Critical E2E tests passing', 'success');
  } catch (error) {
    recordTest('Critical E2E flow', 'FAIL', error.message);
    log(`❌ E2E tests failed: ${error.message}`, 'error');
  }
}

// Generate test report
function generateReport() {
  const report = {
    summary: {
      total: results.tests.length,
      passed: results.passed,
      failed: results.failed,
      skipped: results.skipped,
      passRate: `${((results.passed / results.tests.length) * 100).toFixed(1)}%`,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    },
    tests: results.tests,
    recommendation: results.failed === 0 ? 
      'GREEN: All systems operational, ready for Sunday service' :
      results.failed <= 2 ? 
        'YELLOW: Minor issues detected, monitor closely' :
        'RED: Critical issues found, investigate before service'
  };
  
  // Save detailed report
  const reportPath = path.join(__dirname, '..', 'artifacts', `smoke-test-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  return report;
}

// Main execution
let startTime;

async function main() {
  startTime = Date.now();
  
  log('🚀 Starting Sunday Smoke Test Suite', 'info');
  log(`📡 Target: ${CONFIG.STAGING_API}`, 'info');
  log('─'.repeat(60), 'info');
  
  // Run all tests
  await test1_AppBuilds();
  await test2_UnitTests();
  await test3_StagingAPI();
  const authToken = await test4_Authentication();
  await test5_PushNotifications(authToken);
  await test6_EventsAPI(authToken);
  await test7_DirectoryAPI(authToken);
  await test8_CheckinAPI(authToken);
  await test9_OfflineMode();
  await test10_PerformanceBudgets();
  await test11_SecurityHeaders();
  await test12_E2ECriticalFlow();
  
  // Generate and display report
  log('─'.repeat(60), 'info');
  const report = generateReport();
  
  log(`📊 FINAL RESULTS`, 'info');
  log(`   Total Tests: ${report.summary.total}`, 'info');
  log(`   Passed: ${report.summary.passed}`, 'success');
  if (report.summary.failed > 0) {
    log(`   Failed: ${report.summary.failed}`, 'error');
  }
  if (report.summary.skipped > 0) {
    log(`   Skipped: ${report.summary.skipped}`, 'warning');
  }
  log(`   Pass Rate: ${report.summary.passRate}`, 'info');
  log(`   Duration: ${(report.summary.duration / 1000).toFixed(1)}s`, 'info');
  log('', 'info');
  log(`🎯 RECOMMENDATION: ${report.recommendation}`, 
    report.recommendation.startsWith('GREEN') ? 'success' : 
    report.recommendation.startsWith('YELLOW') ? 'warning' : 'error');
  
  // Exit with appropriate code
  process.exit(report.summary.failed > 0 ? 1 : 0);
}

// Handle interruption gracefully
process.on('SIGINT', () => {
  log('🛑 Test suite interrupted', 'warning');
  const report = generateReport();
  log(`📊 Partial results: ${report.summary.passed}/${report.summary.total} passed`, 'info');
  process.exit(130);
});

// Run the tests
main().catch(error => {
  log(`💥 Fatal error: ${error.message}`, 'error');
  process.exit(1);
});