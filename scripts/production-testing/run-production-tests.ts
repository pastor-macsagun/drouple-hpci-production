#!/usr/bin/env tsx
/**
 * Production Testing Orchestrator
 * Main entry point for running comprehensive production tests
 */

import ProductionTestRunner from './prod-test-runner';
import TestDataManager from './test-data-manager';
import { PROD_CONFIG, TEST_ACCOUNTS } from './prod-test-config';

interface TestOptions {
  headless?: boolean;
  cleanup?: boolean;
  accounts?: string[];
  scenarios?: string[];
  saveRecords?: boolean;
}

class ProductionTestOrchestrator {
  private testRunner: ProductionTestRunner;
  private dataManager: TestDataManager;
  private options: TestOptions;

  constructor(options: TestOptions = {}) {
    this.options = {
      headless: false,
      cleanup: true,
      saveRecords: true,
      ...options
    };
    
    this.testRunner = new ProductionTestRunner();
    this.dataManager = new TestDataManager();
  }

  async run(): Promise<void> {
    console.log('🚀 Starting Drouple - Church Management System Production Test Suite');
    console.log('═══════════════════════════════════════════');
    console.log(`📍 Target Environment: ${PROD_CONFIG.baseUrl}`);
    console.log(`🔧 Headless Mode: ${this.options.headless ? 'ON' : 'OFF'}`);
    console.log(`🧹 Auto Cleanup: ${this.options.cleanup ? 'ON' : 'OFF'}`);
    console.log(`💾 Save Records: ${this.options.saveRecords ? 'ON' : 'OFF'}`);
    console.log('═══════════════════════════════════════════\n');

    try {
      // Initialize systems
      await this.initialize();

      // Run the test suite
      await this.executeTests();

      // Generate reports
      await this.generateReports();

    } catch (error) {
      console.error('💥 Production test suite failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private async initialize(): Promise<void> {
    console.log('🔧 Initializing test systems...');
    
    await this.dataManager.initialize();
    await this.testRunner.initialize();
    
    console.log('✅ Test systems initialized\n');
  }

  private async executeTests(): Promise<void> {
    console.log('🧪 Executing test suite...');
    console.log(`📊 Testing ${TEST_ACCOUNTS.length} accounts across multiple scenarios\n`);
    
    await this.testRunner.runAllTests();
  }

  private async generateReports(): Promise<void> {
    console.log('\n📊 Generating comprehensive reports...');
    
    // Test data summary
    const summary = await this.dataManager.getTestDataSummary();
    console.log(`📝 Created ${summary.summary.totalRecords} test records`);
    
    // Record types breakdown
    Object.entries(summary.summary.recordsByType).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count} records`);
    });
    
    // Save records if enabled
    if (this.options.saveRecords) {
      await this.dataManager.saveRecords();
    }
  }

  private async cleanup(): Promise<void> {
    console.log('\n🧹 Performing cleanup...');
    
    // Cleanup test data if enabled
    if (this.options.cleanup) {
      await this.dataManager.cleanupTestData();
    } else {
      await this.dataManager.generateCleanupScript();
    }
    
    // Close connections
    await this.dataManager.disconnect();
    await this.testRunner.cleanup();
    
    console.log('✅ Cleanup completed');
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const options: TestOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--headless':
        options.headless = true;
        break;
      case '--no-cleanup':
        options.cleanup = false;
        break;
      case '--no-save':
        options.saveRecords = false;
        break;
      case '--accounts':
        options.accounts = args[++i]?.split(',');
        break;
      case '--scenarios':
        options.scenarios = args[++i]?.split(',');
        break;
      case '--help':
        printHelp();
        return;
    }
  }

  const orchestrator = new ProductionTestOrchestrator(options);
  await orchestrator.run();
}

function printHelp() {
  console.log(`
Drouple - Church Management System Production Testing Suite
═════════════════════════════════

USAGE:
  npx tsx run-production-tests.ts [options]

OPTIONS:
  --headless           Run tests in headless mode (no browser UI)
  --no-cleanup         Skip automatic cleanup of test data
  --no-save           Don't save test records to file
  --accounts <list>    Comma-separated list of account emails to test
  --scenarios <list>   Comma-separated list of scenario names to run
  --help              Show this help message

EXAMPLES:
  # Run full test suite with browser UI
  npx tsx run-production-tests.ts

  # Run headless tests without cleanup
  npx tsx run-production-tests.ts --headless --no-cleanup

  # Test only admin accounts
  npx tsx run-production-tests.ts --accounts "admin.manila@test.com,admin.cebu@test.com"

  # Run specific scenarios
  npx tsx run-production-tests.ts --scenarios "Authentication Flow,Member Management"

TEST ACCOUNTS:
  - Super Admin: superadmin@test.com
  - Manila Admin: admin.manila@test.com  
  - Cebu Admin: admin.cebu@test.com
  - Manila Leader: leader.manila@test.com
  - Cebu Leader: leader.cebu@test.com
  - Members: member1@test.com, member2@test.com, member3@test.com

All accounts use password: Hpci!Test2025

SCENARIOS TESTED:
  - Authentication Flow
  - Member Management  
  - Service Creation
  - Event Management
  - LifeGroup Management
  - Sunday Check-in
  - Event RSVP
  - LifeGroup Join Request
  - Tenant Isolation

OUTPUT:
  - Screenshots saved to: ./screenshots/
  - Video recordings: ./videos/
  - Test reports: ./reports/
  - Test records: ./test-records-[timestamp].json
  - Cleanup scripts: ./cleanup-[timestamp].ts
  `);
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Test orchestrator failed:', error);
    process.exit(1);
  });
}

export default ProductionTestOrchestrator;