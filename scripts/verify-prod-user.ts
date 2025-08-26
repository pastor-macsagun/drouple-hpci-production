import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_GKaWA3zDOZ6n@ep-flat-glade-ad7dfexu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

async function verifyUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'superadmin@test.com' }
    });

    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('✅ User found:');
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   Status:', user.memberStatus);
    console.log('   Has password:', !!user.passwordHash);
    console.log('   Must change password:', user.mustChangePassword);

    // Test password
    const testPassword = 'Hpci!Test2025';
    const isValid = await bcrypt.compare(testPassword, user.passwordHash || '');
    console.log('   Password valid:', isValid);

    if (!isValid && user.passwordHash) {
      // Try rehashing and comparing
      console.log('\n🔍 Debugging password...');
      console.log('   Hash starts with:', user.passwordHash.substring(0, 10));
      console.log('   Hash length:', user.passwordHash.length);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUser();