import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { execSync } from 'child_process'

// Override with production database URL
process.env.DATABASE_URL = "postgresql://neondb_owner:npg_GKaWA3zDOZ6n@ep-flat-glade-ad7dfexu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"

async function syncSchemaAndCreateAdmin() {
  console.log('🔄 Syncing database schema...')
  
  try {
    // Sync schema first
    execSync('npx prisma db push --accept-data-loss', { 
      stdio: 'inherit',
      env: { 
        ...process.env, 
        DATABASE_URL: "postgresql://neondb_owner:npg_GKaWA3zDOZ6n@ep-flat-glade-ad7dfexu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true" 
      }
    })
    
    console.log('✅ Schema synced successfully')
    
    // Now create the admin
    const prisma = new PrismaClient()
    
    const email = 'admin@drouple.com'
    const password = 'Drouple!Admin2025'
    const name = 'Drouple Super Admin'
    
    console.log('🔐 Creating production super admin...')
    
    const passwordHash = await bcrypt.hash(password, 12)
    
    // Get or create main church (HPCI)
    let church = await prisma.church.findFirst()
    if (!church) {
      console.log('🏛️ Creating HPCI church...')
      church = await prisma.church.create({
        data: {
          name: 'HPCI',
          description: 'House of Prayer Christian International'
        }
      })
    }
    
    // Check if super admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingAdmin) {
      console.log('⚠️ Super admin already exists with this email')
      console.log('Email:', email)
      await prisma.$disconnect()
      return
    }
    
    const superAdmin = await prisma.user.create({
      data: {
        email,
        name,
        role: UserRole.SUPER_ADMIN,
        emailVerified: new Date(),
        tenantId: church.id,
        passwordHash,
        memberStatus: 'ACTIVE',
        mustChangePassword: false,
        twoFactorEnabled: false
      }
    })
    
    console.log('✅ Production Super Admin created successfully!')
    console.log('\n🔑 LOGIN CREDENTIALS:')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('Role: SUPER_ADMIN')
    console.log('\n⚠️ IMPORTANT: Change password after first login!')
    
    await prisma.$disconnect()
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

syncSchemaAndCreateAdmin()