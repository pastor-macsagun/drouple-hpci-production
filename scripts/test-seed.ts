#!/usr/bin/env tsx
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

// Use test environment
process.env.NODE_ENV = 'test'

// Copy .env.test to .env temporarily
const envPath = path.join(process.cwd(), '.env')
const envTestPath = path.join(process.cwd(), '.env.test')
const envBackupPath = path.join(process.cwd(), '.env.backup')

// Backup existing .env if it exists
if (fs.existsSync(envPath)) {
  fs.copyFileSync(envPath, envBackupPath)
}

// Copy test env
fs.copyFileSync(envTestPath, envPath)

try {
  // Run seed
  console.log('🌱 Running test seed...')
  execSync('npx prisma db push --force-reset && tsx prisma/seed.ts', {
    stdio: 'inherit',
  })
  console.log('✅ Test seed complete')
} finally {
  // Restore original .env
  if (fs.existsSync(envBackupPath)) {
    fs.copyFileSync(envBackupPath, envPath)
    fs.unlinkSync(envBackupPath)
  }
}