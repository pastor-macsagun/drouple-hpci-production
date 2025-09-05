#!/usr/bin/env tsx
/**
 * Comprehensive Functional Test Runner
 * Executes all Drouple - Church Management System functionality tests in production
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { 
  TEST_ACCOUNTS, 
  PROD_CONFIG, 
  TestAccount 
} from './prod-test-config';
import { 
  FUNCTIONAL_TEST_SCENARIOS, 
  HIGH_PRIORITY_TESTS,
  FunctionalTestScenario, 
  FunctionalTestStep 
} from './functional-test-scenarios';

interface FunctionalTestResult {
  scenario: FunctionalTestScenario;
  account: TestAccount;
  success: boolean;
  error?: string;
  duration: number;
  screenshots: string[];
  stepResults: StepResult[];
  timestamp: Date;
}

interface StepResult {
  step: FunctionalTestStep;
  success: boolean;
  error?: string;
  duration: number;
  screenshot?: string;
}

interface TestSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  account: TestAccount;
  authenticated: boolean;
}

class FunctionalTestRunner {
  private browser: Browser | null = null;
  private results: FunctionalTestResult[] = [];
  private sessions: Map<string, TestSession> = new Map();

  async initialize(): Promise<void> {
    // Create directories
    await this.ensureDirectories();
    
    // Launch browser with settings optimized for functional testing
    this.browser = await chromium.launch({ 
      headless: false, // Keep visible for debugging
      slowMo: 1000 // Reasonable speed for functional tests
    });

    console.log('🚀 Functional Test Runner initialized');
    console.log(`📍 Testing against: ${PROD_CONFIG.baseUrl}`);
  }

  private async ensureDirectories(): Promise<void> {
    const dirs = [
      PROD_CONFIG.screenshotDir,
      PROD_CONFIG.reportsDir,
      './functional-screenshots'
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async createAuthenticatedSession(account: TestAccount): Promise<TestSession | null> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    const page = await context.newPage();
    
    // Enable error logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error (${account.email}): ${msg.text()}`);
      }
    });

    // Authenticate the session
    try {
      console.log(`🔐 Authenticating ${account.email} (${account.role})...`);
      
      await page.goto(`${PROD_CONFIG.baseUrl}/auth/signin`);
      await page.waitForLoadState('networkidle');

      await page.fill('#email', account.email);
      await page.fill('#password', account.password);
      await page.waitForTimeout(1000);

      const navigationPromise = page.waitForNavigation({ 
        waitUntil: 'networkidle',
        timeout: 15000 
      }).catch(() => null);

      await page.click('button[type="submit"]');
      await Promise.race([navigationPromise, page.waitForTimeout(10000)]);

      const currentUrl = page.url();
      const authenticated = !currentUrl.includes('/auth/signin');

      if (authenticated) {
        console.log(`✅ ${account.email} authenticated successfully`);
        const session: TestSession = {
          browser: this.browser,
          context,
          page,
          account,
          authenticated: true
        };
        
        this.sessions.set(account.email, session);
        return session;
      } else {
        console.log(`❌ ${account.email} authentication failed`);
        await context.close();
        return null;
      }
    } catch (error) {
      console.log(`❌ Authentication error for ${account.email}:`, error);
      await context.close();
      return null;
    }
  }

  async runScenario(session: TestSession, scenario: FunctionalTestScenario): Promise<FunctionalTestResult> {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const stepResults: StepResult[] = [];
    
    try {
      console.log(`\n🎭 Running scenario: ${scenario.name}`);
      console.log(`   Account: ${session.account.email} (${session.account.role})`);
      console.log(`   Priority: ${scenario.priority} | Category: ${scenario.category}`);
      
      for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i];
        const stepStartTime = Date.now();
        
        console.log(`  📝 Step ${i + 1}/${scenario.steps.length}: ${step.description}`);
        
        try {
          await this.executeStep(session, step, scenario, i + 1);
          
          const stepDuration = Date.now() - stepStartTime;
          let stepScreenshot: string | undefined;
          
          // Take screenshot if requested or on verification steps
          if (step.screenshot || step.action === 'verify') {
            stepScreenshot = await this.takeStepScreenshot(session.page, scenario.id, session.account.email, i + 1, step.description);
            screenshots.push(stepScreenshot);
          }
          
          stepResults.push({
            step,
            success: true,
            duration: stepDuration,
            screenshot: stepScreenshot
          });
          
          console.log(`    ✅ Step completed (${stepDuration}ms)`);
          
        } catch (error) {
          const stepDuration = Date.now() - stepStartTime;
          const errorScreenshot = await this.takeStepScreenshot(session.page, scenario.id, session.account.email, i + 1, 'ERROR');
          screenshots.push(errorScreenshot);
          
          stepResults.push({
            step,
            success: false,
            error: error instanceof Error ? error.message : String(error),
            duration: stepDuration,
            screenshot: errorScreenshot
          });
          
          console.log(`    ❌ Step failed: ${error}`);
          throw error; // Fail the entire scenario
        }
      }
      
      const duration = Date.now() - startTime;
      console.log(`✅ Scenario "${scenario.name}" completed successfully (${duration}ms)`);
      
      return {
        scenario,
        account: session.account,
        success: true,
        duration,
        screenshots,
        stepResults,
        timestamp: new Date()
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ Scenario "${scenario.name}" failed: ${error}`);
      
      return {
        scenario,
        account: session.account,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
        screenshots,
        stepResults,
        timestamp: new Date()
      };
    }
  }

  private async executeStep(session: TestSession, step: FunctionalTestStep, scenario: FunctionalTestScenario, stepNumber: number): Promise<void> {
    const { page } = session;
    const timeout = step.timeout || 5000;
    
    // Replace template variables
    const processValue = (value?: string): string | undefined => {
      if (!value) return value;
      return value
        .replace('{{email}}', session.account.email)
        .replace('{{timestamp}}', Date.now().toString())
        .replace('{{church}}', session.account.church?.toLowerCase() || 'unknown');
    };

    switch (step.action) {
      case 'navigate':
        const url = step.url?.startsWith('http') 
          ? step.url 
          : `${PROD_CONFIG.baseUrl}${step.url}`;
        await page.goto(url);
        await page.waitForLoadState('networkidle', { timeout });
        break;
        
      case 'click':
        if (!step.selector) throw new Error('Click step requires selector');
        await page.waitForSelector(step.selector, { timeout });
        await page.click(step.selector);
        await page.waitForTimeout(1000); // Wait for UI response
        break;
        
      case 'fill':
        if (!step.selector || !step.value) throw new Error('Fill step requires selector and value');
        await page.waitForSelector(step.selector, { timeout });
        await page.fill(step.selector, processValue(step.value)!);
        break;
        
      case 'select':
        if (!step.selector || !step.value) throw new Error('Select step requires selector and value');
        await page.waitForSelector(step.selector, { timeout });
        await page.selectOption(step.selector, processValue(step.value)!);
        break;
        
      case 'verify':
        if (step.selector) {
          await page.waitForSelector(step.selector, { timeout });
          if (step.expected) {
            const content = await page.textContent(step.selector);
            const expectedText = processValue(step.expected)!;
            if (!content?.includes(expectedText)) {
              throw new Error(`Verification failed: Expected "${expectedText}", got "${content}"`);
            }
          }
        } else if (step.expected) {
          const expectedText = processValue(step.expected)!;
          const pageContent = await page.content();
          if (!pageContent.includes(expectedText)) {
            throw new Error(`Verification failed: Expected "${expectedText}" in page content`);
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

  private async takeStepScreenshot(page: Page, scenarioId: string, email: string, stepNumber: number, description: string): Promise<string> {
    const sanitizedDescription = description.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50);
    const filename = `${scenarioId}-${email}-step${stepNumber}-${sanitizedDescription}-${Date.now()}.png`;
    const filepath = path.join('./functional-screenshots', filename);
    await page.screenshot({ path: filepath, fullPage: true });
    return filename;
  }

  async runHighPriorityTests(): Promise<void> {
    console.log('🧪 Starting High Priority Functional Tests');
    console.log(`📊 Testing ${HIGH_PRIORITY_TESTS.length} high-priority scenarios\n`);
    
    // Group scenarios by required role for efficient session management
    const scenariosByRole = new Map<string, FunctionalTestScenario[]>();
    
    for (const scenario of HIGH_PRIORITY_TESTS) {
      if (!scenariosByRole.has(scenario.requiredRole)) {
        scenariosByRole.set(scenario.requiredRole, []);
      }
      scenariosByRole.get(scenario.requiredRole)!.push(scenario);
    }

    // Execute tests by role
    for (const [role, scenarios] of scenariosByRole) {
      console.log(`\n👤 Testing ${role} scenarios (${scenarios.length} tests)`);
      
      // Find appropriate test account for this role
      const testAccount = TEST_ACCOUNTS.find(account => 
        account.role === role || 
        (role === 'VIP' && account.role === 'LEADER') // Use LEADER for VIP tests since we don't have VIP accounts
      );
      
      if (!testAccount) {
        console.log(`⚠️  No test account found for role ${role}, skipping...`);
        continue;
      }

      // Create authenticated session
      const session = await this.createAuthenticatedSession(testAccount);
      if (!session) {
        console.log(`❌ Failed to authenticate ${testAccount.email}, skipping ${role} tests`);
        continue;
      }

      // Run all scenarios for this role
      for (const scenario of scenarios) {
        // Skip if church-specific and account doesn't match
        if (scenario.church && scenario.church !== 'ANY' && 
            testAccount.church !== scenario.church) {
          console.log(`⏭️  Skipping ${scenario.name} (church mismatch: need ${scenario.church}, have ${testAccount.church})`);
          continue;
        }

        const result = await this.runScenario(session, scenario);
        this.results.push(result);
      }

      // Close session after all scenarios for this role
      await session.context.close();
      this.sessions.delete(testAccount.email);
    }
  }

  async generateFunctionalTestReport(): Promise<void> {
    const reportPath = path.join(PROD_CONFIG.reportsDir, `functional-test-report-${Date.now()}.md`);
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const total = this.results.length;
    
    const report = `
# Drouple - Church Management System Functional Test Report
**Generated:** ${new Date().toISOString()}
**Environment:** ${PROD_CONFIG.baseUrl}
**Test Type:** Comprehensive Functionality Testing

## Executive Summary
- **Total Functional Tests:** ${total}
- **Passed:** ${passed} (${total > 0 ? Math.round(passed/total*100) : 0}%)
- **Failed:** ${failed} (${total > 0 ? Math.round(failed/total*100) : 0}%)
- **Success Rate:** ${total > 0 ? Math.round(passed/total*100) : 0}%

## Test Categories
${this.generateCategoryBreakdown()}

## Detailed Results

${this.results.map(result => `
### ${result.scenario.name} - ${result.account.email}
- **Status:** ${result.success ? '✅ PASSED' : '❌ FAILED'}
- **Category:** ${result.scenario.category}
- **Priority:** ${result.scenario.priority}
- **Duration:** ${result.duration}ms
- **Role:** ${result.account.role}
- **Church:** ${result.account.church || 'N/A'}
${result.error ? `- **Error:** ${result.error}` : ''}
- **Steps:** ${result.stepResults.length} steps, ${result.stepResults.filter(s => s.success).length} passed
${result.screenshots.length > 0 ? `- **Screenshots:** ${result.screenshots.length} captured` : ''}
`).join('')}

## Feature Coverage Analysis
${this.generateFeatureCoverage()}

## Production Readiness Assessment
${this.generateReadinessAssessment()}
    `.trim();
    
    await fs.writeFile(reportPath, report);
    console.log(`📊 Functional test report generated: ${reportPath}`);
  }

  private generateCategoryBreakdown(): string {
    const categories = ['CORE', 'ADMIN', 'MEMBER', 'VIP'];
    return categories.map(category => {
      const categoryResults = this.results.filter(r => r.scenario.category === category);
      const passed = categoryResults.filter(r => r.success).length;
      const total = categoryResults.length;
      return `- **${category}:** ${passed}/${total} passed (${total > 0 ? Math.round(passed/total*100) : 0}%)`;
    }).join('\n');
  }

  private generateFeatureCoverage(): string {
    const features = [
      'Member Management', 'Service Creation', 'Event Management', 
      'LifeGroup Management', 'Pathway Tracking', 'VIP Dashboard',
      'Tenant Isolation', 'Role-Based Access'
    ];
    
    return features.map(feature => {
      const featureTests = this.results.filter(r => 
        r.scenario.name.toLowerCase().includes(feature.toLowerCase().split(' ')[0])
      );
      const status = featureTests.length > 0 && featureTests.every(t => t.success) ? '✅' : 
                   featureTests.length > 0 ? '⚠️' : '⏭️';
      return `- **${feature}:** ${status} ${featureTests.length} tests`;
    }).join('\n');
  }

  private generateReadinessAssessment(): string {
    const successRate = this.results.length > 0 ? 
      Math.round(this.results.filter(r => r.success).length / this.results.length * 100) : 0;
    
    if (successRate >= 90) return '🟢 **HIGH CONFIDENCE** - Production ready';
    if (successRate >= 75) return '🟡 **MEDIUM CONFIDENCE** - Minor issues to address';
    if (successRate >= 50) return '🟠 **LOW CONFIDENCE** - Significant issues found';
    return '🔴 **NOT READY** - Critical issues must be resolved';
  }

  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up functional test sessions');
    
    for (const [email, session] of this.sessions) {
      try {
        await session.context.close();
        console.log(`✅ Closed session for ${email}`);
      } catch (error) {
        console.log(`❌ Error closing session for ${email}:`, error);
      }
    }
    
    if (this.browser) {
      await this.browser.close();
    }
    
    await this.generateFunctionalTestReport();
    
    // Print summary
    console.log('\n📊 FUNCTIONAL TESTING SUMMARY');
    console.log('═════════════════════════════');
    const passed = this.results.filter(r => r.success).length;
    const total = this.results.length;
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} (${total > 0 ? Math.round(passed/total*100) : 0}%)`);
    console.log(`Failed: ${total - passed} (${total > 0 ? Math.round((total-passed)/total*100) : 0}%)`);
    console.log(`Success Rate: ${total > 0 ? Math.round(passed/total*100) : 0}%`);
    console.log('═════════════════════════════');
  }
}

// Main execution
async function main() {
  const runner = new FunctionalTestRunner();
  
  try {
    await runner.initialize();
    await runner.runHighPriorityTests();
  } catch (error) {
    console.error('💥 Functional test runner failed:', error);
    process.exit(1);
  } finally {
    await runner.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default FunctionalTestRunner;