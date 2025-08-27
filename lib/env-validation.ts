/**
 * Environment variable validation for critical auth settings
 */

interface EnvValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateAuthEnvironment(): EnvValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Critical validation for NEXTAUTH_SECRET
  const nextAuthSecret = process.env.NEXTAUTH_SECRET
  if (!nextAuthSecret) {
    errors.push('NEXTAUTH_SECRET is not set - authentication will fail')
  } else {
    // Check if it's a secure secret (at least 32 characters, not a default value)
    if (nextAuthSecret.length < 32) {
      warnings.push('NEXTAUTH_SECRET should be at least 32 characters for security')
    }
    
    const defaultSecrets = [
      'your-secret-key-here',
      'test-secret-key',
      'secret',
      'changeme'
    ]
    
    if (defaultSecrets.some(defaultSecret => nextAuthSecret.includes(defaultSecret))) {
      if (process.env.NODE_ENV === 'production') {
        errors.push('NEXTAUTH_SECRET appears to be a default value - change it in production')
      } else {
        warnings.push('NEXTAUTH_SECRET appears to be a default value')
      }
    }
  }

  // Check NEXTAUTH_URL for production
  if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL) {
    warnings.push('NEXTAUTH_URL should be set in production for proper redirects')
  }

  // Check database connection
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is not set - database connection will fail')
  }

  // Check if we're in a serverless environment (Vercel)
  const isVercel = process.env.VERCEL === '1'
  if (isVercel && !process.env.DATABASE_URL?.includes('pgbouncer')) {
    warnings.push('Consider using Neon pgbouncer connection for serverless environments')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

export function logEnvironmentValidation() {
  const result = validateAuthEnvironment()
  
  if (result.errors.length > 0) {
    console.error('[ENV] Critical environment configuration errors:')
    result.errors.forEach(error => console.error(`  ❌ ${error}`))
  }
  
  if (result.warnings.length > 0) {
    console.warn('[ENV] Environment configuration warnings:')
    result.warnings.forEach(warning => console.warn(`  ⚠️  ${warning}`))
  }
  
  if (result.valid && result.warnings.length === 0) {
    console.log('[ENV] ✅ Environment configuration validated successfully')
  }
  
  return result
}