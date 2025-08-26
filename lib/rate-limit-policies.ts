/**
 * Endpoint-specific rate limiting policies
 * Provides granular control over rate limiting based on HTTP method and path
 */

import { rateLimiter, InMemoryRateLimiter } from './rate-limit'

export interface EndpointPolicy {
  method: string[]
  limiter: InMemoryRateLimiter | null // null means no rate limiting
  keyStrategy: 'ip' | 'ip-email' | 'ip-path'
}

// Create specific rate limiters with appropriate windows
const limiters = {
  // Auth POST requests: 5/min, 20/hour
  authLoginMinute: rateLimiter({
    requests: 5,
    window: '1m',
    algorithm: 'sliding-window'
  }),
  authLoginHour: rateLimiter({
    requests: 20,
    window: '1h',
    algorithm: 'sliding-window'
  }),
  
  // Registration POST: 3/hour
  registerHour: rateLimiter({
    requests: 3,
    window: '1h',
    algorithm: 'sliding-window'
  }),
  
  // Check-in: 1 per 5 minutes
  checkin: rateLimiter({
    requests: 1,
    window: '5m',
    algorithm: 'sliding-window'
  }),
  
  // General API: 100 per 15 minutes
  api: rateLimiter({
    requests: 100,
    window: '15m',
    algorithm: 'sliding-window'
  }),
  
  // CSV exports: 10 per hour
  export: rateLimiter({
    requests: 10,
    window: '1h',
    algorithm: 'sliding-window'
  })
}

// Define endpoint-specific policies
export const endpointPolicies: Map<string, EndpointPolicy> = new Map([
  // Auth pages - NO rate limiting for GET requests
  ['/auth/signin:GET', { method: ['GET'], limiter: null, keyStrategy: 'ip' }],
  ['/auth/signup:GET', { method: ['GET'], limiter: null, keyStrategy: 'ip' }],
  ['/auth/error:GET', { method: ['GET'], limiter: null, keyStrategy: 'ip' }],
  ['/register:GET', { method: ['GET'], limiter: null, keyStrategy: 'ip' }],
  
  // Auth API endpoints - Rate limited for POST only
  ['/api/auth/callback/credentials:POST', { 
    method: ['POST'], 
    limiter: limiters.authLoginMinute, // Will check both minute and hour limits
    keyStrategy: 'ip-email' 
  }],
  ['/api/auth/signin:POST', { 
    method: ['POST'], 
    limiter: limiters.authLoginMinute,
    keyStrategy: 'ip-email' 
  }],
  ['/api/register:POST', { 
    method: ['POST'], 
    limiter: limiters.registerHour,
    keyStrategy: 'ip-email' 
  }],
  
  // Check-in endpoint
  ['/api/checkin:POST', { 
    method: ['POST'], 
    limiter: limiters.checkin,
    keyStrategy: 'ip' 
  }],
  
  // Export endpoints
  ['/api/export:GET', { 
    method: ['GET'], 
    limiter: limiters.export,
    keyStrategy: 'ip' 
  }],
])

// Get the appropriate policy for a given endpoint
export function getEndpointPolicy(pathname: string, method: string): EndpointPolicy | null {
  // Try exact match first
  const exactKey = `${pathname}:${method}`
  if (endpointPolicies.has(exactKey)) {
    return endpointPolicies.get(exactKey)!
  }
  
  // Check for pattern matches (e.g., /api/export/*)
  for (const [key, policy] of endpointPolicies) {
    const [pathPattern, policyMethod] = key.split(':')
    if (policyMethod === method) {
      if (pathPattern.endsWith('*') && pathname.startsWith(pathPattern.slice(0, -1))) {
        return policy
      }
    }
  }
  
  // Default policies based on path prefixes
  if (method === 'GET' && (pathname.startsWith('/auth') || pathname === '/register')) {
    // No rate limiting for GET requests to auth pages
    return { method: ['GET'], limiter: null, keyStrategy: 'ip' }
  }
  
  if (pathname.startsWith('/api')) {
    // General API rate limiting for all other API endpoints
    return { method: [method], limiter: limiters.api, keyStrategy: 'ip' }
  }
  
  // No rate limiting for other endpoints
  return null
}

// Check rate limits with proper header generation
export async function checkRateLimitWithHeaders(
  pathname: string,
  method: string,
  ip: string,
  email?: string
): Promise<{
  allowed: boolean
  headers: Record<string, string>
  message?: string
}> {
  const policy = getEndpointPolicy(pathname, method)
  
  // No policy or no limiter means no rate limiting
  if (!policy || !policy.limiter) {
    return { allowed: true, headers: {} }
  }
  
  // Build the rate limit key based on strategy
  let key: string
  switch (policy.keyStrategy) {
    case 'ip-email':
      key = policy.limiter.key(['endpoint', pathname, ip, email || 'anonymous'])
      break
    case 'ip-path':
      key = policy.limiter.key(['endpoint', pathname, ip])
      break
    default:
      key = policy.limiter.key(['endpoint', ip])
  }
  
  // Check the primary rate limit
  const result = await policy.limiter.check(key)
  
  // For auth endpoints, also check the hourly limit
  if (pathname.startsWith('/api/auth') && method === 'POST') {
    const hourlyKey = limiters.authLoginHour.key(['endpoint', pathname, ip, email || 'anonymous'])
    const hourlyResult = await limiters.authLoginHour.check(hourlyKey)
    
    // If hourly limit is exceeded, use that result
    if (!hourlyResult.success) {
      const retryAfterSeconds = Math.ceil((hourlyResult.reset.getTime() - Date.now()) / 1000)
      return {
        allowed: false,
        headers: {
          'X-RateLimit-Limit': String(hourlyResult.limit),
          'X-RateLimit-Remaining': String(hourlyResult.remaining),
          'X-RateLimit-Reset': String(Math.floor(hourlyResult.reset.getTime() / 1000)),
          'Retry-After': String(retryAfterSeconds)
        },
        message: `Rate limit exceeded. Please try again in ${retryAfterSeconds} seconds.`
      }
    }
  }
  
  // Generate standard rate limit headers
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.reset.getTime() / 1000))
  }
  
  if (!result.success) {
    const retryAfterSeconds = Math.ceil((result.reset.getTime() - Date.now()) / 1000)
    headers['Retry-After'] = String(retryAfterSeconds)
    
    return {
      allowed: false,
      headers,
      message: `Rate limit exceeded. Please try again in ${retryAfterSeconds} seconds.`
    }
  }
  
  return { allowed: true, headers }
}

// Export the limiters for testing
export { limiters }