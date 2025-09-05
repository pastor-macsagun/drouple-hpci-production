import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { JwtService, createClaims, MobileTokenResponse } from '@/packages/shared/auth'
import { authLogger } from '@/lib/logger'
import { checkRateLimit, recordAttempt } from '@/lib/auth-rate-limit'

const JWT_EXPIRATION_SECONDS = 900 // 15 minutes

export async function POST(req: NextRequest) {
  try {
    // Check rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const ipAddress = Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim()
    
    const { allowed, remainingAttempts } = checkRateLimit(ipAddress, 'token-request')
    
    if (!allowed) {
      authLogger.warn('Token request rate limit exceeded', { 
        ip: ipAddress,
        remainingAttempts: 0
      })
      return NextResponse.json(
        { error: 'Too many token requests. Please try again later.' },
        { status: 429 }
      )
    }

    recordAttempt(ipAddress, 'token-request')

    // Get authenticated session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      authLogger.warn('Token request without valid session', { 
        ip: ipAddress,
        hasSession: !!session,
        hasUser: !!session?.user,
        hasUserId: !!session?.user?.id
      })
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Extract user information from session
    const { id, tenantId, role } = session.user
    
    // Create JWT claims
    const claims = createClaims(
      id,
      tenantId,
      [role], // Convert single role to array
      JWT_EXPIRATION_SECONDS
    )

    // Sign the JWT
    const jwtService = JwtService.getInstance()
    const token = await jwtService.signJwt(claims)

    authLogger.info('Mobile JWT token issued', {
      userId: id,
      tenantId,
      role,
      expiresIn: JWT_EXPIRATION_SECONDS,
      ip: ipAddress
    })

    const response: MobileTokenResponse = {
      token,
      expiresIn: JWT_EXPIRATION_SECONDS
    }

    return NextResponse.json(response)
    
  } catch (error) {
    authLogger.error('Token endpoint error', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}