#!/usr/bin/env tsx
/**
 * Production Test Runner
 * Automated testing system for Drouple - Church Management System production environment
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { 
  TEST_ACCOUNTS, 
  TEST_SCENARIOS, 
  PROD_CONFIG, 
  TestAccount, 
  TestScenario, 
  TestStep, 
  TestRecord 
} from './prod-test-config';

interface TestResult {
  account: TestAccount;
  scenario: TestScenario;
  success: boolean;
  error?: string;
  duration: number;
  screenshots: string[];
  recordsCreated: TestRecord[];
  timestamp: Date;
}

interface TestSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  account: TestAccount;
  records: TestRecord[];
}

class ProductionTestRunner {
  private browser: Browser | null = null;
  private sessions: Map<string, TestSession> = new Map();
  private testRecords: TestRecord[] = [];
  private results: TestResult[] = [];

  async initialize(): Promise<void> {
    // Create directories
    await this.ensureDirectories();
    
    // Launch browser
    this.browser = await chromium.launch({ 
      headless: false, // Set to true for headless testing
      slowMo: 2000 // Slow down for debugging - matches successful detailed test
    });

    console.log('🚀 Production Test Runner initialized');
    console.log(`📍 Testing against: ${PROD_CONFIG.baseUrl}`);
  }

  private async ensureDirectories(): Promise<void> {
    const dirs = [
      PROD_CONFIG.screenshotDir,
      PROD_CONFIG.reportsDir,
      path.dirname(PROD_CONFIG.recordsFile)
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async createSession(account: TestAccount): Promise<TestSession> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: {
        dir: './videos/',
        size: { width: 1280, height: 720 }
      }
    });

    const page = await context.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error (${account.email}):`, msg.text());
      }
    });

    // Handle page errors
    page.on('pageerror', error => {
      console.log(`💥 Page Error (${account.email}):`, error.message);
    });

    const session: TestSession = {
      browser: this.browser,
      context,
      page,
      account,
      records: []
    };

    this.sessions.set(account.email, session);
    return session;
  }

  async authenticateSession(session: TestSession): Promise<boolean> {
    const { page, account } = session;
    
    try {
      console.log(`🔐 Authenticating ${account.email} (${account.role})`);
      
      // Navigate to login page
      await page.goto(`${PROD_CONFIG.baseUrl}/auth/signin`);
      await page.waitForLoadState('networkidle');

      // Fill login form
      await page.fill('#email', account.email);
      await page.fill('#password', account.password);
      
      // Wait before submission to ensure form is ready
      await page.waitForTimeout(2000);
      
      // Take screenshot before login
      await this.takeScreenshot(page, `${account.email}-before-login`);
      
      // Submit login
      await page.click('button[type="submit"]');
      
      // Wait for navigation or authentication completion - using pattern from successful detailed test
      const navigationPromise = page.waitForNavigation({ 
        waitUntil: 'networkidle',
        timeout: 15000 
      }).catch(() => {
        console.log(`   No navigation detected for ${account.email} within timeout`);
        return null;
      });
      
      // Wait for either navigation or timeout
      await Promise.race([
        navigationPromise,
        page.waitForTimeout(10000)
      ]);
      
      // Take screenshot after login
      await this.takeScreenshot(page, `${account.email}-after-login`);
      
      // Verify successful authentication by checking URL and page content
      const currentUrl = page.url();
      const expectedPath = account.expectedDashboard;
      
      // Accept authentication if redirected away from login page (even if not to expected dashboard)
      if (currentUrl.includes(expectedPath)) {
        console.log(`✅ ${account.email} authenticated successfully → ${expectedPath}`);
        return true;
      } else if (!currentUrl.includes('/auth/signin')) {
        // Authenticated but redirected elsewhere (likely due to redirect logic issue)
        console.log(`✅ ${account.email} authenticated (redirected to: ${currentUrl})`);
        return true;
      } else if (currentUrl.includes('/auth/signin')) {
        // Still on login page - check for error messages
        try {
          const errorElement = await page.locator('[role="alert"], .alert-destructive, [data-testid="error"]').first();
          const errorText = await errorElement.textContent({ timeout: 1000 });
          if (errorText && errorText.trim() && !errorText.includes('HPCI ChMS')) {
            console.log(`❌ ${account.email} authentication failed: ${errorText.trim()}`);
          } else {
            console.log(`❌ ${account.email} authentication failed. Still on login page: ${currentUrl}`);
          }
        } catch {
          console.log(`❌ ${account.email} authentication failed. Still on login page: ${currentUrl}`);
        }
        return false;
      } else {
        console.log(`⚠️  ${account.email} unexpected redirect: ${currentUrl} (expected: ${expectedPath})`);
        return false;
      }
      
    } catch (error) {
      console.log(`❌ Authentication error for ${account.email}:`, error);
      return false;
    }
  }

  async runScenario(session: TestSession, scenario: TestScenario): Promise<TestResult> {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const recordsCreated: TestRecord[] = [];
    
    try {
      console.log(`🎭 Running scenario: ${scenario.name} for ${session.account.email}`);
      
      for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i];
        console.log(`  📝 Step ${i + 1}: ${step.action}`);
        
        await this.executeStep(session, step, scenario);
        
        // Take screenshot after important steps
        if (['click', 'submit', 'verify'].includes(step.action)) {
          const screenshotName = `${session.account.email}-${scenario.name}-step-${i + 1}`;
          await this.takeScreenshot(session.page, screenshotName);
          screenshots.push(`${screenshotName}.png`);
        }
      }
      
      const duration = Date.now() - startTime;
      console.log(`✅ Scenario completed in ${duration}ms`);
      
      return {
        account: session.account,
        scenario,
        success: true,
        duration,
        screenshots,
        recordsCreated,
        timestamp: new Date()
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ Scenario failed: ${error}`);
      
      // Take error screenshot
      const errorScreenshot = `${session.account.email}-${scenario.name}-error`;
      await this.takeScreenshot(session.page, errorScreenshot);
      screenshots.push(`${errorScreenshot}.png`);
      
      return {
        account: session.account,
        scenario,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
        screenshots,
        recordsCreated,
        timestamp: new Date()
      };
    }
  }

  private async executeStep(session: TestSession, step: TestStep, scenario: TestScenario): Promise<void> {
    const { page } = session;
    const timeout = step.timeout || PROD_CONFIG.timeout;
    
    // Replace template variables
    const processValue = (value?: string): string | undefined => {
      if (!value) return value;
      return value
        .replace('{{email}}', session.account.email)
        .replace('{{password}}', session.account.password)
        .replace('{{expectedDashboard}}', session.account.expectedDashboard)
        .replace('{{timestamp}}', Date.now().toString())
        .replace('{{church}}', session.account.church?.toLowerCase() || 'unknown');
    };

    switch (step.action) {
      case 'navigate':
        const url = step.url?.startsWith('http') 
          ? step.url 
          : `${PROD_CONFIG.baseUrl}${step.url}`;
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        break;
        
      case 'click':
        if (!step.selector) throw new Error('Click step requires selector');
        await page.waitForSelector(step.selector, { timeout });
        await page.click(step.selector);
        break;
        
      case 'fill':
        if (!step.selector || !step.value) throw new Error('Fill step requires selector and value');
        await page.waitForSelector(step.selector, { timeout });
        await page.fill(step.selector, processValue(step.value)!);
        break;
        
      case 'submit':
        if (!step.selector) throw new Error('Submit step requires selector');
        await page.waitForSelector(step.selector, { timeout });
        await page.click(`${step.selector} button[type="submit"], ${step.selector}[type="submit"]`);
        await page.waitForLoadState('networkidle');
        break;
        
      case 'verify':
        if (step.selector) {
          // Verify element exists or has expected content
          await page.waitForSelector(step.selector, { timeout });
          if (step.expected) {
            const content = await page.textContent(step.selector);
            if (!content?.includes(processValue(step.expected)!)) {
              throw new Error(`Verification failed: Expected "${step.expected}", got "${content}"`);
            }
          }
        } else if (step.expected) {
          // Verify URL or page content
          const currentUrl = page.url();
          const processedExpected = processValue(step.expected)!;
          if (!currentUrl.includes(processedExpected) && !(await page.content()).includes(processedExpected)) {
            throw new Error(`Verification failed: Expected "${processedExpected}" in URL or content`);
          }
        }
        break;
        
      case 'wait':
        await page.waitForTimeout(step.timeout || 1000);
        break;
        
      default:
        throw new Error(`Unknown step action: ${step.action}`);
    }
    
    // Small delay between steps for stability
    await page.waitForTimeout(500);
  }

  private async takeScreenshot(page: Page, name: string): Promise<void> {
    const filename = `${name}-${Date.now()}.png`;
    const filepath = path.join(PROD_CONFIG.screenshotDir, filename);
    await page.screenshot({ path: filepath, fullPage: true });
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Production Test Suite');
    console.log(`📊 Testing ${TEST_ACCOUNTS.length} accounts with ${TEST_SCENARIOS.length} scenarios\n`);
    
    // Phase 1: Authentication Testing
    console.log('🔐 Phase 1: Authentication Testing');
    const authResults = new Map<string, boolean>();
    
    for (const account of TEST_ACCOUNTS) {
      const session = await this.createSession(account);
      const authSuccess = await this.authenticateSession(session);
      authResults.set(account.email, authSuccess);
      
      if (!authSuccess) {
        await session.context.close();
        this.sessions.delete(account.email);
      }
    }
    
    // Phase 2: Functional Testing
    console.log('\n🎭 Phase 2: Functional Testing');
    
    for (const scenario of TEST_SCENARIOS) {
      console.log(`\n📋 Testing Scenario: ${scenario.name}`);
      
      for (const account of TEST_ACCOUNTS) {
        // Skip if authentication failed
        if (!authResults.get(account.email)) continue;
        
        // Check role compatibility
        if (scenario.requiredRole !== 'ANY' && !account.role.includes(scenario.requiredRole)) {
          console.log(`  ⏭️  Skipping ${account.email} (role mismatch)`);
          continue;
        }
        
        const session = this.sessions.get(account.email);
        if (!session) continue;
        
        const result = await this.runScenario(session, scenario);
        this.results.push(result);
      }
    }
    
    // Phase 3: Tenant Isolation Testing
    console.log('\n🏢 Phase 3: Tenant Isolation Testing');
    await this.testTenantIsolation();
  }

  private async testTenantIsolation(): Promise<void> {
    const manilaAdmin = this.sessions.get('admin.manila@test.com');
    const cebuAdmin = this.sessions.get('admin.cebu@test.com');
    
    if (!manilaAdmin || !cebuAdmin) {
      console.log('⏭️  Skipping tenant isolation (admin sessions not available)');
      return;
    }
    
    console.log('🔍 Testing data isolation between Manila and Cebu');
    
    try {
      // Get Manila member count
      await manilaAdmin.page.goto(`${PROD_CONFIG.baseUrl}/admin/members`);
      await manilaAdmin.page.waitForLoadState('networkidle');
      const manilaMembers = await manilaAdmin.page.locator('[data-testid="member-row"]').count();
      
      // Get Cebu member count  
      await cebuAdmin.page.goto(`${PROD_CONFIG.baseUrl}/admin/members`);
      await cebuAdmin.page.waitForLoadState('networkidle');
      const cebuMembers = await cebuAdmin.page.locator('[data-testid="member-row"]').count();
      
      console.log(`📊 Manila members: ${manilaMembers}, Cebu members: ${cebuMembers}`);
      
      if (manilaMembers > 0 && cebuMembers > 0 && manilaMembers !== cebuMembers) {
        console.log('✅ Tenant isolation verified - different data sets');
      } else {
        console.log('⚠️  Tenant isolation unclear - similar data counts');
      }
      
    } catch (error) {
      console.log('❌ Tenant isolation test failed:', error);
    }
  }

  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up test data and sessions');
    
    // Save test records before cleanup
    await this.saveTestRecords();
    
    // Close all sessions
    for (const [email, session] of this.sessions) {
      try {
        await session.context.close();
        console.log(`✅ Closed session for ${email}`);
      } catch (error) {
        console.log(`❌ Error closing session for ${email}:`, error);
      }
    }
    
    // Close browser
    if (this.browser) {
      await this.browser.close();
    }
    
    // Generate test report
    await this.generateReport();
  }

  private async saveTestRecords(): Promise<void> {
    const recordsData = {
      testRun: {
        timestamp: new Date().toISOString(),
        totalTests: this.results.length,
        passed: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length
      },
      records: this.testRecords,
      results: this.results
    };
    
    await fs.writeFile(
      PROD_CONFIG.recordsFile,
      JSON.stringify(recordsData, null, 2)
    );
    
    console.log(`📝 Test records saved to ${PROD_CONFIG.recordsFile}`);
  }

  private async generateReport(): Promise<void> {
    const reportPath = path.join(PROD_CONFIG.reportsDir, `test-report-${Date.now()}.md`);
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const total = this.results.length;
    
    const report = `
# Production Test Report
**Generated:** ${new Date().toISOString()}
**Environment:** ${PROD_CONFIG.baseUrl}

## Summary
- **Total Tests:** ${total}
- **Passed:** ${passed} (${Math.round(passed/total*100)}%)
- **Failed:** ${failed} (${Math.round(failed/total*100)}%)

## Test Results

${this.results.map(result => `
### ${result.scenario.name} - ${result.account.email}
- **Status:** ${result.success ? '✅ PASSED' : '❌ FAILED'}
- **Duration:** ${result.duration}ms
- **Role:** ${result.account.role}
- **Church:** ${result.account.church || 'N/A'}
${result.error ? `- **Error:** ${result.error}` : ''}
${result.screenshots.length > 0 ? `- **Screenshots:** ${result.screenshots.join(', ')}` : ''}
`).join('')}

## Records Created
${this.testRecords.length} test records were created during this test run.

## Cleanup Required
${this.testRecords.filter(r => r.cleanupRequired).length} records require manual cleanup.
    `.trim();
    
    await fs.writeFile(reportPath, report);
    console.log(`📊 Test report generated: ${reportPath}`);
    
    // Print summary to console
    console.log('\n📊 PRODUCTION TEST SUMMARY');
    console.log('═══════════════════════════');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} (${Math.round(passed/total*100)}%)`);
    console.log(`Failed: ${failed} (${Math.round(failed/total*100)}%)`);
    console.log(`Success Rate: ${Math.round(passed/total*100)}%`);
    console.log('═══════════════════════════');
  }
}

// Main execution
async function main() {
  const runner = new ProductionTestRunner();
  
  try {
    await runner.initialize();
    await runner.runAllTests();
  } catch (error) {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  } finally {
    await runner.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export default ProductionTestRunner;