import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// This script creates a single super admin in production
// Run with: npx tsx scripts/create-prod-admin.ts

const prisma = new PrismaClient();

async function createProductionAdmin() {
  try {
    // Check if super admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'superadmin@test.com' }
    });

    if (existingAdmin) {
      console.log('❌ Super admin already exists');
      return;
    }

    // Create super admin
    const hashedPassword = await bcrypt.hash('Hpci!Test2025', 10);
    
    const superAdmin = await prisma.user.create({
      data: {
        id: 'prod-super-admin',
        email: 'superadmin@test.com',
        passwordHash: hashedPassword,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        memberStatus: 'ACTIVE',
        mustChangePassword: false,
      }
    });

    console.log('✅ Created Super Admin:');
    console.log('   Email: superadmin@test.com');
    console.log('   Password: Hpci!Test2025');
    console.log('   Role: SUPER_ADMIN');
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password after first login!');

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createProductionAdmin();