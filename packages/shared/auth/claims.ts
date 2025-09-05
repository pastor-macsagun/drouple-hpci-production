import { UserRole } from "@prisma/client"

export interface JwtClaims {
  sub: string // user ID
  tenantId: string | null
  roles: UserRole[]
  iat: number
  exp: number
}

export interface MobileTokenResponse {
  token: string
  expiresIn: number // seconds
}

export function createClaims(userId: string, tenantId: string | null, roles: UserRole[], expiresIn: number = 900): JwtClaims {
  const now = Math.floor(Date.now() / 1000)
  
  return {
    sub: userId,
    tenantId,
    roles,
    iat: now,
    exp: now + expiresIn
  }
}

export function validateClaims(claims: any): claims is JwtClaims {
  return (
    typeof claims === 'object' &&
    claims !== null &&
    typeof claims.sub === 'string' &&
    (typeof claims.tenantId === 'string' || claims.tenantId === null) &&
    Array.isArray(claims.roles) &&
    typeof claims.iat === 'number' &&
    typeof claims.exp === 'number' &&
    claims.exp > Math.floor(Date.now() / 1000) // not expired
  )
}