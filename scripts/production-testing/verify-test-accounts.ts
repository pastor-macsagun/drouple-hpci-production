#!/usr/bin/env tsx
/**
 * Verify Test Accounts in Production Database
 * Checks if all required test accounts exist and creates missing ones
 */

import { TEST_ACCOUNTS } from './prod-test-config';

interface AccountVerification {
  email: string;
  exists: boolean;
  role?: string;
  church?: string;
  needsCreation: boolean;
  error?: string;
}

async function verifyTestAccounts(): Promise<void> {
  console.log('🔍 Verifying Test Accounts in Production Database');
  console.log('═════════════════════════════════════════════════');

  let prisma: any;
  
  try {
    // Import Prisma from main project
    const { prisma: mainPrisma } = await import('../../lib/prisma');
    prisma = mainPrisma;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }

  const verificationResults: AccountVerification[] = [];

  console.log(`📊 Checking ${TEST_ACCOUNTS.length} test accounts...\n`);

  for (const account of TEST_ACCOUNTS) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: account.email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          tenantId: true
        }
      });

      if (existingUser) {
        console.log(`✅ ${account.email} - EXISTS`);
        console.log(`   Role: ${existingUser.role}, TenantID: ${existingUser.tenantId}`);
        
        verificationResults.push({
          email: account.email,
          exists: true,
          role: existingUser.role,
          church: existingUser.church?.name,
          needsCreation: false
        });
      } else {
        console.log(`❌ ${account.email} - NOT FOUND`);
        verificationResults.push({
          email: account.email,
          exists: false,
          needsCreation: true
        });
      }
    } catch (error) {
      console.log(`❌ ${account.email} - ERROR: ${error}`);
      verificationResults.push({
        email: account.email,
        exists: false,
        needsCreation: true,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Summary
  const existing = verificationResults.filter(r => r.exists).length;
  const missing = verificationResults.filter(r => r.needsCreation).length;

  console.log('\n📊 VERIFICATION SUMMARY');
  console.log('═════════════════════════');
  console.log(`Total Accounts: ${TEST_ACCOUNTS.length}`);
  console.log(`✅ Existing: ${existing}`);
  console.log(`❌ Missing: ${missing}`);
  console.log('═════════════════════════');

  if (missing > 0) {
    console.log('\n🔧 Creating Missing Test Accounts...\n');
    await createMissingAccounts(prisma, verificationResults.filter(r => r.needsCreation));
  } else {
    console.log('\n🎉 All test accounts exist and are ready for testing!');
  }

  await prisma.$disconnect();
}

async function createMissingAccounts(prisma: any, missingAccounts: AccountVerification[]): Promise<void> {
  // First, let's get the church IDs
  const churches = await prisma.church.findMany({
    select: { id: true, name: true }
  });

  const manilaChurch = churches.find((c: any) => c.name.toLowerCase().includes('manila'));
  const cebuChurch = churches.find((c: any) => c.name.toLowerCase().includes('cebu'));

  if (!manilaChurch || !cebuChurch) {
    console.log('❌ Could not find Manila or Cebu churches in database');
    console.log('Available churches:', churches.map((c: any) => c.name));
    console.log('\n💡 Please create churches first or update the account verification logic');
    return;
  }

  console.log(`🏢 Found Manila Church (ID: ${manilaChurch.id}) and Cebu Church (ID: ${cebuChurch.id})`);

  for (const accountResult of missingAccounts) {
    const accountConfig = TEST_ACCOUNTS.find(a => a.email === accountResult.email);
    if (!accountConfig) continue;

    try {
      // Determine tenant ID based on church
      let tenantId: number;
      if (accountConfig.church === 'Manila') {
        tenantId = manilaChurch.id;
      } else if (accountConfig.church === 'Cebu') {
        tenantId = cebuChurch.id;
      } else {
        // Super admin or unspecified - use Manila as default
        tenantId = manilaChurch.id;
      }

      // Generate proper password hash
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash('Hpci!Test2025', 12);
      
      // Create the account
      const newUser = await prisma.user.create({
        data: {
          name: getNameFromEmail(accountConfig.email),
          email: accountConfig.email,
          passwordHash: passwordHash,
          role: accountConfig.role,
          tenantId: tenantId,
          emailVerified: new Date()
        }
      });

      console.log(`✅ Created ${accountConfig.email}`);
      console.log(`   ID: ${newUser.id}, Role: ${newUser.role}, Church: ${accountConfig.church}`);

    } catch (error) {
      console.log(`❌ Failed to create ${accountConfig.email}: ${error}`);
    }
  }
}

function getNameFromEmail(email: string): string {
  if (email.includes('superadmin')) return 'Super Administrator';
  if (email.includes('admin.manila')) return 'Manila Admin';
  if (email.includes('admin.cebu')) return 'Cebu Admin';
  if (email.includes('leader.manila')) return 'Manila Leader';
  if (email.includes('leader.cebu')) return 'Cebu Leader';
  if (email.includes('member1')) return 'Manila Member 1';
  if (email.includes('member2')) return 'Cebu Member 2';
  if (email.includes('member3')) return 'Manila Member 3';
  return 'Test User';
}

// Generate the password hash for reference
async function generatePasswordHash(): Promise<void> {
  const bcrypt = await import('bcryptjs');
  const hash = await bcrypt.hash('Hpci!Test2025', 12);
  console.log('\n🔑 Password Hash for Hpci!Test2025:');
  console.log(hash);
}

if (require.main === module) {
  verifyTestAccounts()
    .then(() => generatePasswordHash())
    .catch(console.error);
}

export default verifyTestAccounts;