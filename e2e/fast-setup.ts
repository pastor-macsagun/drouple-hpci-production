import { execSync } from 'child_process'

export async function fastSetupTestDatabase() {
  console.log('⚡ Fast E2E test database setup...')
  
  try {
    // Check if database is already seeded by looking for test users
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const testUserExists = await prisma.user.findFirst({
      where: { email: 'superadmin@test.com' }
    })
    
    if (testUserExists) {
      console.log('✅ Test database already seeded, skipping setup')
      await prisma.$disconnect()
      return
    }
    
    await prisma.$disconnect()
    
    // Only seed if needed - don't do full reset
    console.log('🌱 Seeding test database (no reset)...')
    execSync('npm run db:seed', {
      stdio: 'pipe', // Reduce output noise
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
      timeout: 30000, // 30 second timeout
    })
    
    console.log('✅ Fast database setup completed')
    
  } catch (error) {
    console.error('❌ Fast setup failed, falling back to full setup:', error.message)
    
    // Fallback to full setup
    execSync('npm run seed', {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    })
  }
}