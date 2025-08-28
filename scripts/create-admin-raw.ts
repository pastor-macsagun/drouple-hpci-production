import { Client } from 'pg'
import bcrypt from 'bcryptjs'

async function createSuperAdmin() {
  const connectionString = "postgresql://neondb_owner:npg_GKaWA3zDOZ6n@ep-flat-glade-ad7dfexu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  
  const client = new Client({
    connectionString
  })
  
  try {
    await client.connect()
    console.log('✅ Connected to production database')
    
    // Admin details
    const email = 'admin@drouple.com'
    const password = 'Drouple!Admin2025'
    const name = 'Drouple Super Admin'
    const passwordHash = await bcrypt.hash(password, 12)
    
    // Check if user already exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email])
    if (existingUser.rows.length > 0) {
      console.log('⚠️ Super admin already exists with this email:', email)
      return
    }
    
    // Get or create church
    let churchResult = await client.query('SELECT id FROM churches LIMIT 1')
    let churchId;
    
    if (churchResult.rows.length === 0) {
      console.log('🏛️ Creating HPCI church...')
      const churchInsert = await client.query(
        'INSERT INTO churches (id, name, description, "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id',
        ['church_hpci', 'HPCI', 'House of Prayer Christian International']
      )
      churchId = churchInsert.rows[0].id
    } else {
      churchId = churchResult.rows[0].id
    }
    
    // Create super admin user (without twoFactorEnabled for older schema)
    const userId = 'user_superadmin_prod'
    await client.query(`
      INSERT INTO users (
        id, email, name, role, "tenantId", "passwordHash", 
        "emailVerified", "memberStatus", "mustChangePassword", 
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, NOW(), NOW())
    `, [
      userId,
      email,
      name,
      'SUPER_ADMIN',
      churchId,
      passwordHash,
      'ACTIVE',
      false
    ])
    
    console.log('✅ Production Super Admin created successfully!')
    console.log('\n🔑 LOGIN CREDENTIALS:')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('Role: SUPER_ADMIN')
    console.log('\n⚠️ IMPORTANT: Change password after first login!')
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error)
  } finally {
    await client.end()
  }
}

createSuperAdmin()