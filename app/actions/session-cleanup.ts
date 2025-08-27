'use server'

import { redirect } from 'next/navigation'
import { clearInvalidSession } from '@/lib/session-cleanup'

/**
 * Server action to clear invalid sessions and redirect to signin
 * This can be called from client components when JWT errors are detected
 */
export async function clearSessionAndRedirect(reason = 'Session expired') {
  try {
    await clearInvalidSession()
    console.log(`[AUTH] Session cleared: ${reason}`)
  } catch (error) {
    console.error('[AUTH] Failed to clear session:', error)
  }
  
  // Always redirect regardless of cleanup success
  redirect('/auth/signin?error=SessionExpired&message=' + encodeURIComponent(reason))
}

/**
 * Server action to validate current session state
 * Returns whether session cleanup is needed
 */
export async function validateSessionState(): Promise<{ needsCleanup: boolean; error?: string }> {
  try {
    // Check if NEXTAUTH_SECRET is properly configured
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret || secret.length < 32) {
      return { 
        needsCleanup: true, 
        error: 'Authentication configuration error' 
      }
    }
    
    return { needsCleanup: false }
  } catch (error) {
    return { 
      needsCleanup: true, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}