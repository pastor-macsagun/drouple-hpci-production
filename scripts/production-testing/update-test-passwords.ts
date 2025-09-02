#!/usr/bin/env tsx
/**
 * Update Test Account Passwords
 * Updates all test account passwords to the correct hash
 */

import { TEST_ACCOUNTS } from './prod-test-config';

async function updateTestPasswords(): Promise<void> {
  console.log('🔐 Updating Test Account Passwords');
  console.log('═════════════════════════════════');

  let prisma: any;
  
  try {
    // Import Prisma from main project
    const { prisma: mainPrisma } = await import('../../lib/prisma');
    prisma = mainPrisma;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }

  // Import bcrypt
  const bcrypt = await import('bcryptjs');
  const correctPasswordHash = await bcrypt.hash('Hpci!Test2025', 12);
  
  console.log(`📊 Updating passwords for ${TEST_ACCOUNTS.length} test accounts...\n`);

  let updated = 0;

  for (const account of TEST_ACCOUNTS) {
    try {
      const result = await prisma.user.updateMany({
        where: { email: account.email },
        data: { passwordHash: correctPasswordHash }
      });

      if (result.count > 0) {
        console.log(`✅ Updated password for ${account.email}`);
        updated++;
      } else {
        console.log(`⚠️  Account not found: ${account.email}`);
      }
    } catch (error) {
      console.log(`❌ Failed to update ${account.email}: ${error}`);
    }
  }

  console.log('\n📊 PASSWORD UPDATE SUMMARY');
  console.log('══════════════════════════');
  console.log(`Total Accounts: ${TEST_ACCOUNTS.length}`);
  console.log(`✅ Updated: ${updated}`);
  console.log('══════════════════════════');

  await prisma.$disconnect();
}

if (require.main === module) {
  updateTestPasswords().catch(console.error);
}

export default updateTestPasswords;