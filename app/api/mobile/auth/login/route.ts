import { NextRequest, NextResponse } from 'next/server'
import { signIn } from '@/lib/auth'
import { z } from 'zod'
import { ApplicationError } from '@/lib/errors'
import { checkRateLimit, recordAttempt } from '@/lib/auth-rate-limit'
import { authLogger } from '@/lib/logger'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  deviceInfo: z.object({
    deviceId: z.string().optional(),
    deviceName: z.string().optional(),
    platform: z.enum(['ios', 'android', 'web']).optional(),
    version: z.string().optional(),
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const { email, password, deviceInfo } = loginSchema.parse(body)
    
    // Get client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    
    // Check rate limit
    const { allowed, remainingAttempts } = checkRateLimit(ip, email)
    
    if (!allowed) {
      authLogger.warn('Mobile login rate limit exceeded', { 
        email, 
        ip,
        deviceInfo
      })
      
      return NextResponse.json(
        {
          success: false,
          error: 'Too many login attempts. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      )
    }

    // Record the attempt
    recordAttempt(ip, email)

    try {
      // Use NextAuth signIn for authentication
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (!result || result.error) {
        authLogger.warn('Mobile login failed', { 
          email,
          ip,
          deviceInfo,
          error: result?.error
        })
        
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid email or password',
            code: 'INVALID_CREDENTIALS'
          },
          { status: 401 }
        )
      }

      authLogger.info('Mobile login successful', { 
        email,
        deviceInfo,
        ip
      })

      return NextResponse.json({
        success: true,
        data: {
          message: 'Login successful',
          redirectUrl: result.url || '/dashboard',
        }
      })

    } catch (authError) {
      authLogger.error('Mobile authentication error', {
        error: authError,
        email,
        deviceInfo,
        ip
      })
      
      if (authError instanceof Error && authError.message.includes('rate limit')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Too many login attempts. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED'
          },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication failed',
          code: 'AUTH_FAILED'
        },
        { status: 401 }
      )
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: error.errors
        },
        { status: 400 }
      )
    }

    authLogger.error('Mobile login endpoint error', { error })
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}