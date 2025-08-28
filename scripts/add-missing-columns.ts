import { Client } from 'pg'

async function addMissingColumns() {
  const connectionString = "postgresql://neondb_owner:npg_GKaWA3zDOZ6n@ep-flat-glade-ad7dfexu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  
  const client = new Client({
    connectionString
  })
  
  try {
    await client.connect()
    console.log('✅ Connected to production database')
    
    // Check if twoFactorEnabled column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'twoFactorEnabled'
    `)
    
    if (columnCheck.rows.length === 0) {
      console.log('🔧 Adding missing twoFactorEnabled column...')
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN "twoFactorEnabled" BOOLEAN DEFAULT false NOT NULL
      `)
      console.log('✅ Added twoFactorEnabled column')
    } else {
      console.log('✅ twoFactorEnabled column already exists')
    }
    
    // Check if twoFactorSecret column exists
    const secretCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'twoFactorSecret'
    `)
    
    if (secretCheck.rows.length === 0) {
      console.log('🔧 Adding missing twoFactorSecret column...')
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN "twoFactorSecret" VARCHAR(128)
      `)
      console.log('✅ Added twoFactorSecret column')
    } else {
      console.log('✅ twoFactorSecret column already exists')
    }
    
    console.log('🎉 Database schema updated successfully!')
    console.log('\nYou can now login with:')
    console.log('Email: admin@drouple.com')
    console.log('Password: Drouple!Admin2025')
    
  } catch (error) {
    console.error('❌ Error updating schema:', error)
  } finally {
    await client.end()
  }
}

addMissingColumns()