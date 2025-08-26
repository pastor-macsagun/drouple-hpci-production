#!/usr/bin/env node

/**
 * Environment Sanity Check
 * Validates that all required environment variables are set for production
 */

const requiredVars = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL'
]

function maskValue(value) {
  if (!value) return '❌ NOT SET'
  if (value.length <= 8) return '***'
  return value.substring(0, 4) + '***' + value.substring(value.length - 4)
}

console.log('🔒 Environment Sanity Check')
console.log('=' + '='.repeat(50))

let allValid = true

requiredVars.forEach(varName => {
  const value = process.env[varName]
  const isSet = !!value
  const status = isSet ? '✅' : '❌'
  
  if (!isSet) allValid = false
  
  console.log(`${status} ${varName.padEnd(20)} ${maskValue(value)}`)
})

console.log('=' + '='.repeat(50))

// Additional checks
if (process.env.DATABASE_URL) {
  const isPooled = process.env.DATABASE_URL.includes('pgbouncer=true')
  console.log(`${isPooled ? '✅' : '⚠️ '} Database pooling    ${isPooled ? 'Enabled' : 'WARNING: Not enabled'}`)
}

if (process.env.NEXTAUTH_URL) {
  const isHttps = process.env.NEXTAUTH_URL.startsWith('https://')
  console.log(`${isHttps ? '✅' : '⚠️ '} HTTPS enabled       ${isHttps ? 'Yes' : 'WARNING: Not HTTPS'}`)
}

if (process.env.NODE_ENV) {
  const isProd = process.env.NODE_ENV === 'production'
  console.log(`${isProd ? '✅' : '⚠️ '} NODE_ENV            ${process.env.NODE_ENV}`)
}

console.log('=' + '='.repeat(50))
console.log(allValid ? '✅ All required variables are set!' : '❌ Missing required environment variables!')

process.exit(allValid ? 0 : 1)