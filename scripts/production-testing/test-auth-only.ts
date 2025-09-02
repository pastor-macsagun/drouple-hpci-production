#!/usr/bin/env tsx
/**
 * Test Authentication Only
 * Quick test of just the authentication phase with updated logic
 */

import ProductionTestRunner from './prod-test-runner';

async function testAuthenticationOnly(): Promise<void> {
  console.log('🔐 Testing Authentication Only');
  console.log('══════════════════════════════');

  const runner = new ProductionTestRunner();
  
  try {
    await runner.initialize();
    
    // Only run authentication tests for first few accounts
    const testRunner = runner as any; // Access private methods
    
    const { TEST_ACCOUNTS } = await import('./prod-test-config');
    const testAccounts = TEST_ACCOUNTS.slice(0, 3); // Test first 3 accounts
    
    console.log(`🧪 Testing ${testAccounts.length} accounts...\n`);
    
    for (const account of testAccounts) {
      const session = await testRunner.createSession(account);
      const success = await testRunner.authenticateSession(session);
      
      if (success) {
        console.log(`✅ ${account.email} - Authentication successful`);
        // Try to navigate to dashboard
        try {
          await session.page.goto(`https://www.drouple.app${account.expectedDashboard}`);
          await session.page.waitForTimeout(2000);
          const finalUrl = session.page.url();
          console.log(`   Dashboard check: ${finalUrl}`);
        } catch (error) {
          console.log(`   Dashboard error: ${error}`);
        }
      } else {
        console.log(`❌ ${account.email} - Authentication failed`);
      }
      
      await session.context.close();
    }
    
    console.log('\n✅ Authentication testing completed');
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
  } finally {
    await runner.cleanup();
  }
}

if (require.main === module) {
  testAuthenticationOnly().catch(console.error);
}

export default testAuthenticationOnly;