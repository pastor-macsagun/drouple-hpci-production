import { encode, decode } from 'next-auth/jwt'
import { JwtClaims } from './claims'

const CLOCK_SKEW_SECONDS = 30

export class JwtService {
  private static instance: JwtService | null = null
  private secret: string

  private constructor() {
    const secretString = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
    if (!secretString) {
      throw new Error('AUTH_SECRET or NEXTAUTH_SECRET environment variable is required')
    }
    this.secret = secretString
  }

  public static getInstance(): JwtService {
    if (!JwtService.instance) {
      JwtService.instance = new JwtService()
    }
    return JwtService.instance
  }

  public static resetInstance(): void {
    JwtService.instance = null
  }

  async signJwt(claims: JwtClaims): Promise<string> {
    try {
      const token = await encode({
        token: {
          sub: claims.sub,
          tenantId: claims.tenantId,
          roles: claims.roles,
          iat: claims.iat,
          exp: claims.exp
        },
        secret: this.secret
      })
      
      if (!token) {
        throw new Error('Failed to encode JWT token')
      }
      
      return token
    } catch (error) {
      throw new Error(`Failed to sign JWT: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async verifyJwt(token: string): Promise<JwtClaims> {
    try {
      const payload = await decode({
        token,
        secret: this.secret
      })

      if (!payload) {
        throw new Error('Invalid token')
      }

      // Validate the payload structure
      if (!payload.sub || typeof payload.sub !== 'string') {
        throw new Error('Invalid subject claim')
      }

      if (!payload.exp || typeof payload.exp !== 'number') {
        throw new Error('Invalid expiration claim')
      }

      if (!payload.iat || typeof payload.iat !== 'number') {
        throw new Error('Invalid issued at claim')
      }

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp <= now) {
        throw new Error('Token expired')
      }

      // Extract custom claims
      const tenantId = payload.tenantId as string | null
      const roles = payload.roles as string[]

      if (!Array.isArray(roles)) {
        throw new Error('Invalid roles claim')
      }

      return {
        sub: payload.sub,
        tenantId,
        roles: roles as any[], // UserRole enum
        iat: payload.iat,
        exp: payload.exp
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('expired')) {
        throw new Error('Token expired')
      }
      throw new Error(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async isTokenExpired(token: string): Promise<boolean> {
    try {
      const payload = await decode({
        token,
        secret: this.secret
      })
      
      if (!payload?.exp) return true
      
      const now = Math.floor(Date.now() / 1000)
      return payload.exp <= (now + CLOCK_SKEW_SECONDS)
    } catch {
      return true
    }
  }

  async getTokenExpirationTime(token: string): Promise<number | null> {
    try {
      const payload = await decode({
        token,
        secret: this.secret
      })
      return payload?.exp || null
    } catch {
      return null
    }
  }
}