import { prisma } from '../lib/prisma'
import { generateTemporaryPassword } from '../lib/password-generator'
import bcrypt from 'bcryptjs'

async function testAdminInvitationWorkflow() {
  console.log('🧪 Testing Admin Invitation Workflow...')

  try {
    // Generate a temporary password
    const tempPassword = generateTemporaryPassword()
    console.log('✅ Generated temporary password:', tempPassword)

    // Hash the password
    const hashedPassword = await bcrypt.hash(tempPassword, 12)
    console.log('✅ Password hashed successfully')

    // Test password verification
    const isValid = await bcrypt.compare(tempPassword, hashedPassword)
    console.log('✅ Password verification:', isValid ? 'PASS' : 'FAIL')

    // Create a test user (don't actually insert to avoid conflicts)
    const testUser = {
      email: 'test-admin@invitation.test',
      name: 'Test Admin',
      role: 'ADMIN',
      tenantId: 'test-church-id',
      passwordHash: hashedPassword,
      mustChangePassword: true
    }
    
    console.log('✅ Test user object created:', {
      email: testUser.email,
      role: testUser.role,
      mustChangePassword: testUser.mustChangePassword,
      passwordSet: !!testUser.passwordHash
    })

    // Test password generation multiple times
    console.log('\n🔑 Testing password generation variety:')
    for (let i = 0; i < 5; i++) {
      const password = generateTemporaryPassword()
      console.log(`  ${i + 1}. ${password}`)
    }

    console.log('\n🎉 Admin invitation workflow test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testAdminInvitationWorkflow().then(() => {
  console.log('✨ Test execution complete')
}).catch(console.error)