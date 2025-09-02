import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Clear NextAuth session cookies when JWT decryption fails
 */
export function clearInvalidSessionCookies(request: NextRequest, response: NextResponse) {
  const sessionCookies = [
    // Auth.js v4 cookie names (legacy support)
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.csrf-token',
    '__Host-next-auth.csrf-token',
    '__Secure-next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.callback-url',
    // Auth.js v5 cookie names (current)
    'authjs.session-token',
    '__Secure-authjs.session-token',
    'authjs.csrf-token',
    '__Host-authjs.csrf-token',
    '__Secure-authjs.csrf-token',
    'authjs.callback-url',
    '__Secure-authjs.callback-url'
  ]

  for (const cookieName of sessionCookies) {
    if (request.cookies.has(cookieName)) {
      console.warn(`[Auth] Clearing invalid session cookie: ${cookieName}`)
      response.cookies.delete(cookieName)
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    }
  }

  return response
}

/**
 * Check if error is related to JWT session issues
 */
export function isJWTSessionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  
  const jwtErrorPatterns = [
    'no matching decryption secret',
    'JWTSessionError',
    'invalid jwt',
    'jwt malformed',
    'invalid signature',
    'jwt expired'
  ]
  
  return jwtErrorPatterns.some(pattern => 
    error.message.toLowerCase().includes(pattern.toLowerCase()) ||
    error.name === 'JWTSessionError'
  )
}