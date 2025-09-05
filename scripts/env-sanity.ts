#!/usr/bin/env tsx
/**
 * Environment Sanity Check
 * Validates environment variables and configuration
 */

import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { existsSync } from 'fs'
import { join } from 'path'

config() // Load environment variables

interface EnvCheck {
  name: string
  required: boolean
  validator?: (value: string) => { valid: boolean; message?: string }
  description: string
  sensitive?: boolean
}

const ENV_CHECKS: EnvCheck[] = [
  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    sensitive: true,
    validator: (value) => ({
      valid: value.startsWith('postgresql://'),
      message: 'Must be a PostgreSQL connection string'
    }),
    description: 'Primary database connection (pooled)'
  },
  {
    name: 'DATABASE_URL_UNPOOLED',
    required: true,
    sensitive: true,
    validator: (value) => ({
      valid: value.startsWith('postgresql://'),
      message: 'Must be a PostgreSQL connection string'
    }),
    description: 'Direct database connection (migrations)'
  },
  
  // Authentication
  {
    name: 'NEXTAUTH_URL',
    required: true,
    validator: (value) => ({
      valid: value.startsWith('http://') || value.startsWith('https://'),
      message: 'Must be a valid HTTP(S) URL'
    }),
    description: 'Application base URL'
  },
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    sensitive: true,
    validator: (value) => ({
      valid: value.length >= 32,
      message: 'Should be at least 32 characters long'
    }),
    description: 'JWT signing secret'
  },
  
  // Email (at least one method required)
  {
    name: 'EMAIL_FROM',
    required: true,
    validator: (value) => ({
      valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Must be a valid email address'
    }),
    description: 'Default from email address'
  },
  
  // Rate Limiting (all optional)
  {
    name: 'RL_AUTH_MIN_REQUESTS',
    required: false,
    validator: (value) => ({
      valid: parseInt(value, 10) > 0,
      message: 'Must be a positive integer'
    }),
    description: 'Auth rate limit per minute (default: 5)'
  },
  {
    name: 'RATE_LIMIT_ENABLED',
    required: false,
    validator: (value) => ({
      valid: ['true', 'false'].includes(value.toLowerCase()),
      message: 'Must be "true" or "false"'
    }),
    description: 'Enable/disable rate limiting (default: true)'
  }
]

function maskValue(value: string, sensitive = false): string {
  if (!sensitive) return value
  if (value.length <= 8) return '***'
  return value.substring(0, 4) + '***' + value.substring(value.length - 4)
}

async function checkDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    const prisma = new PrismaClient()
    await prisma.$queryRaw`SELECT 1`
    await prisma.$disconnect()
    return { success: true, message: 'Database connection successful' }
  } catch (error) {
    return { 
      success: false, 
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

function checkEmailConfig(): { success: boolean; message: string } {
  const hasGenericSMTP = !!(
    process.env.EMAIL_SERVER_HOST && 
    process.env.EMAIL_SERVER_PORT && 
    process.env.EMAIL_SERVER_USER && 
    process.env.EMAIL_SERVER_PASSWORD
  )
  
  const hasResend = !!process.env.RESEND_API_KEY
  
  if (hasGenericSMTP || hasResend) {
    const method = hasResend ? 'Resend API' : 'Generic SMTP'
    return { success: true, message: `Email configured with ${method}` }
  }
  
  return { 
    success: false, 
    message: 'Email not configured. Set either SMTP variables or RESEND_API_KEY' 
  }
}

async function main() {
  console.log('🔍 Drouple - Church Management System Environment Sanity Check\n')
  
  let hasErrors = false
  let hasWarnings = false
  
  // Check environment variables
  console.log('📋 Environment Variables:')
  for (const check of ENV_CHECKS) {
    const value = process.env[check.name]
    const hasValue = !!value
    const symbol = hasValue ? '✅' : (check.required ? '❌' : '⚠️')
    
    let status = hasValue ? `SET (${maskValue(value || '', check.sensitive)})` : (check.required ? 'MISSING' : 'NOT SET')
    let details = ''
    
    if (hasValue && check.validator) {
      const validation = check.validator(value)
      if (!validation.valid) {
        status = `INVALID (${maskValue(value, check.sensitive)})`
        details = ` - ${validation.message}`
        hasErrors = true
      }
    } else if (!hasValue && check.required) {
      hasErrors = true
    } else if (!hasValue && !check.required) {
      hasWarnings = true
      details = ' (using default)'
    }
    
    console.log(`  ${symbol} ${check.name}: ${status}${details}`)
    console.log(`     ${check.description}`)
  }
  
  console.log()
  
  // Check database connectivity
  console.log('🗄️  Database Connectivity:')
  const dbCheck = await checkDatabase()
  const dbSymbol = dbCheck.success ? '✅' : '❌'
  console.log(`  ${dbSymbol} ${dbCheck.message}`)
  if (!dbCheck.success) hasErrors = true
  
  console.log()
  
  // Check email configuration
  console.log('📧 Email Configuration:')
  const emailCheck = checkEmailConfig()
  const emailSymbol = emailCheck.success ? '✅' : '❌'
  console.log(`  ${emailSymbol} ${emailCheck.message}`)
  if (!emailCheck.success) hasErrors = true
  
  console.log()
  
  // Rate limiting configuration summary
  const rateLimitEnabled = process.env.RATE_LIMIT_ENABLED?.toLowerCase() !== 'false'
  console.log('⚡ Rate Limiting:')
  console.log(`  ${rateLimitEnabled ? '✅' : '⚠️'} Rate limiting ${rateLimitEnabled ? 'ENABLED' : 'DISABLED'}`)
  if (rateLimitEnabled) {
    const authLimit = process.env.RL_AUTH_MIN_REQUESTS || '5'
    const apiLimit = process.env.RL_API_REQUESTS || '100'
    console.log(`     Auth: ${authLimit}/min, API: ${apiLimit}/15min`)
  }
  
  console.log()
  
  // Environment summary
  const env = process.env.NODE_ENV || 'development'
  const appEnv = process.env.APP_ENV || env
  console.log(`🌍 Environment: ${appEnv.toUpperCase()} (NODE_ENV: ${env})`)
  
  console.log()
  
  // Final summary
  if (hasErrors) {
    console.log('❌ Environment check FAILED - Please fix the errors above')
    process.exit(1)
  } else if (hasWarnings) {
    console.log('⚠️  Environment check PASSED with warnings - Review optional settings')
    process.exit(0)
  } else {
    console.log('✅ Environment check PASSED - All systems ready!')
    process.exit(0)
  }
}

main().catch((error) => {
  console.error('💥 Sanity check failed with error:', error)
  process.exit(1)
})