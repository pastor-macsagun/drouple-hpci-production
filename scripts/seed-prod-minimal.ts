import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Minimal seed for production - creates churches and super admin
const prisma = new PrismaClient();

async function seedProduction() {
  try {
    console.log('🌱 Starting minimal production seed...');

    // Create main church first
    const hpci = await prisma.church.upsert({
      where: { id: 'clxtest001' },
      update: {},
      create: {
        id: 'clxtest001',
        name: 'HPCI',
        description: 'House of Prayer Christian International',
      }
    });

    console.log('✅ Created main church:', hpci.name);

    // Create local churches
    const manila = await prisma.localChurch.upsert({
      where: { id: 'clxtest002' },
      update: {},
      create: {
        id: 'clxtest002',
        name: 'HPCI Manila',
        city: 'Manila',
        churchId: 'clxtest001',
      }
    });

    const cebu = await prisma.localChurch.upsert({
      where: { id: 'clxtest003' },
      update: {},
      create: {
        id: 'clxtest003',
        name: 'HPCI Cebu',
        city: 'Cebu',
        churchId: 'clxtest001',
      }
    });

    console.log('✅ Created local churches:', { manila: manila.name, cebu: cebu.name });

    // Create or update super admin
    const hashedPassword = await bcrypt.hash('Hpci!Test2025', 10);
    
    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@test.com' },
      update: {
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN',
      },
      create: {
        email: 'superadmin@test.com',
        passwordHash: hashedPassword,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        memberStatus: 'ACTIVE',
        mustChangePassword: false,
      }
    });

    console.log('✅ Super Admin ready:', superAdmin.email);

    // Create admin accounts for each church
    const admins = [
      { email: 'admin.manila@test.com', name: 'Manila Admin', tenantId: 'clxtest002' },
      { email: 'admin.cebu@test.com', name: 'Cebu Admin', tenantId: 'clxtest003' },
    ];

    for (const admin of admins) {
      const user = await prisma.user.upsert({
        where: { email: admin.email },
        update: {
          passwordHash: hashedPassword,
          role: 'ADMIN',
          tenantId: admin.tenantId,
        },
        create: {
          email: admin.email,
          passwordHash: hashedPassword,
          name: admin.name,
          role: 'ADMIN',
          tenantId: admin.tenantId,
          memberStatus: 'ACTIVE',
          mustChangePassword: false,
        }
      });
      console.log(`✅ Created admin: ${user.email}`);
    }

    console.log('\n🎉 Production seeding complete!');
    console.log('\n📋 Login Credentials:');
    console.log('   Super Admin: superadmin@test.com / Hpci!Test2025');
    console.log('   Manila Admin: admin.manila@test.com / Hpci!Test2025');
    console.log('   Cebu Admin: admin.cebu@test.com / Hpci!Test2025');

  } catch (error) {
    console.error('❌ Error seeding production:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedProduction();