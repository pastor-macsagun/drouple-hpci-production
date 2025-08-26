#!/usr/bin/env tsx

import { config } from 'dotenv'
config()

const requiredEnvs = [
  { name: 'DATABASE_URL', description: 'PostgreSQL connection string', sensitive: true },
  { name: 'NEXTAUTH_URL', description: 'NextAuth callback URL', sensitive: false },
  { name: 'NEXTAUTH_SECRET', description: 'NextAuth secret key', sensitive: true },
  { name: 'RESEND_API_KEY', description: 'Resend email service API key', sensitive: true },
  { name: 'RESEND_FROM_EMAIL', description: 'From email address for Resend', sensitive: false },
]

const optionalEnvs = [
  { name: 'APP_ENV', description: 'Application environment (production/staging/development)', sensitive: false },
  { name: 'NODE_ENV', description: 'Node environment', sensitive: false },
]

function maskValue(value: string, sensitive: boolean): string {
  if (!sensitive) return value
  if (value.length <= 8) return '***'
  return value.substring(0, 4) + '***' + value.substring(value.length - 4)
}

console.log('🔍 Environment Variables Sanity Check\n')
console.log('Required Environment Variables:')
console.log('================================')

let missingRequired = 0
for (const env of requiredEnvs) {
  const value = process.env[env.name]
  if (value) {
    console.log(`✅ ${env.name}: ${maskValue(value, env.sensitive)}`)
    console.log(`   ${env.description}`)
  } else {
    console.log(`❌ ${env.name}: NOT SET`)
    console.log(`   ${env.description}`)
    missingRequired++
  }
}

console.log('\nOptional Environment Variables:')
console.log('================================')
for (const env of optionalEnvs) {
  const value = process.env[env.name]
  if (value) {
    console.log(`✅ ${env.name}: ${maskValue(value, env.sensitive)}`)
    console.log(`   ${env.description}`)
  } else {
    console.log(`⚪ ${env.name}: NOT SET`)
    console.log(`   ${env.description}`)
  }
}

console.log('\n📊 Summary:')
console.log('===========')
if (missingRequired === 0) {
  console.log('✅ All required environment variables are set!')
} else {
  console.log(`⚠️  ${missingRequired} required environment variable(s) missing`)
  console.log('   Please check your .env file')
}

process.exit(missingRequired > 0 ? 1 : 0)