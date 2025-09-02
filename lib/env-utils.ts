/**
 * Environment variable utility functions
 * Handles common issues with environment variables, especially in Vercel deployments
 */

/**
 * Clean environment variable by trimming whitespace and newlines
 * Vercel CLI sometimes adds trailing newlines when pulling environment variables
 */
export function cleanEnvVar(value: string | undefined): string | undefined {
  return value?.trim() || undefined
}

/**
 * Get clean environment variable with fallbacks
 */
export function getCleanEnvVar(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]
    if (value) {
      return cleanEnvVar(value)
    }
  }
  return undefined
}

/**
 * Get NextAuth secret with proper cleaning and fallbacks
 */
export function getNextAuthSecret(): string | undefined {
  return getCleanEnvVar('AUTH_SECRET', 'NEXTAUTH_SECRET')
}

/**
 * Get NextAuth URL with proper cleaning
 */
export function getNextAuthUrl(): string | undefined {
  return getCleanEnvVar('NEXTAUTH_URL')
}