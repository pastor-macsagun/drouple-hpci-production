import { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function getSession(req: NextRequest) {
  try {
    // Use same secret resolution logic as auth.ts for consistency
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
    const token = await getToken({ 
      req,
      secret
    })
    return token
  } catch (error) {
    // Log JWT errors for debugging
    if (error instanceof Error) {
      // Check for JWT decryption errors
      if (error.message.includes('no matching decryption secret') || 
          error.message.includes('JWTSessionError')) {
        console.warn('[AUTH] JWT decryption error - clearing invalid session:', {
          error: error.message,
          timestamp: new Date().toISOString(),
          userAgent: req.headers?.get('user-agent') || 'unknown',
          path: req.nextUrl?.pathname || 'unknown'
        })
        
        // For JWT decryption errors, we should clear the invalid session
        // by returning null (which will trigger re-authentication)
        return null
      }
      
      console.error('[AUTH] Unexpected session error:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    }
    return null
  }
}