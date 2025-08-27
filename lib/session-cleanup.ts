import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Clear all NextAuth session cookies when JWT decryption fails
 * This forces users to re-authenticate with the current NEXTAUTH_SECRET
 */
export async function clearInvalidSession() {
  try {
    const cookieStore = await cookies()
    
    // Clear all NextAuth related cookies
    const cookieNames = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
      'next-auth.csrf-token',
      '__Secure-next-auth.csrf-token'
    ]
    
    cookieNames.forEach(name => {
      cookieStore.delete({
        name,
        path: '/',
        domain: undefined,
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
      })
    })
    
    console.log('[AUTH] Cleared invalid session cookies')
    return true
  } catch (error) {
    console.error('[AUTH] Failed to clear session cookies:', error)
    return false
  }
}

/**
 * Force signout and redirect to signin page
 * Used when JWT errors occur that can't be recovered
 */
export async function forceSignoutAndRedirect(reason = 'Invalid session') {
  console.log(`[AUTH] Forcing signout: ${reason}`)
  
  await clearInvalidSession()
  
  // Redirect to signin with error message
  redirect('/auth/signin?error=SessionExpired&message=' + encodeURIComponent(reason))
}

/**
 * Check if an error is a JWT/session related error that requires cleanup
 */
export function isJWTError(error: Error): boolean {
  const jwtErrorMessages = [
    'no matching decryption secret',
    'JWTSessionError',
    'JWT malformed',
    'invalid signature',
    'jwt expired',
    'invalid token'
  ]
  
  return jwtErrorMessages.some(msg => 
    error.message.toLowerCase().includes(msg.toLowerCase())
  )
}

/**
 * Validate NEXTAUTH_SECRET is properly configured
 */
export function validateAuthSecret(): boolean {
  const secret = process.env.NEXTAUTH_SECRET
  
  if (!secret) {
    console.error('[AUTH] NEXTAUTH_SECRET is not configured')
    return false
  }
  
  if (secret.length < 32) {
    console.error('[AUTH] NEXTAUTH_SECRET is too short (minimum 32 characters)')
    return false
  }
  
  return true
}