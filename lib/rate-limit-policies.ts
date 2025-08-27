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

// Valid rate limiting window values
type WindowOption = '1m' | '5m' | '15m' | '1h' | '1d' | '24h'

function getWindowValue(envValue: string | undefined, defaultValue: WindowOption): WindowOption {
  const validWindows: WindowOption[] = ['1m', '5m', '15m', '1h', '1d', '24h']
  const value = envValue || defaultValue
  return validWindows.includes(value as WindowOption) ? (value as WindowOption) : defaultValue
}

// Environment-configurable rate limiting values with sensible defaults
const RL_CONFIG = {
  // Auth limits
  AUTH_MIN_REQUESTS: parseInt(process.env.RL_AUTH_MIN_REQUESTS ?? '5', 10),
  AUTH_MIN_WINDOW: getWindowValue(process.env.RL_AUTH_MIN_WINDOW, '1m'),
  AUTH_HOUR_REQUESTS: parseInt(process.env.RL_AUTH_HOUR_REQUESTS ?? '20', 10),
  AUTH_HOUR_WINDOW: getWindowValue(process.env.RL_AUTH_HOUR_WINDOW, '1h'),
  
  // Registration limits
  REGISTER_REQUESTS: parseInt(process.env.RL_REGISTER_REQUESTS ?? '3', 10),
  REGISTER_WINDOW: getWindowValue(process.env.RL_REGISTER_WINDOW, '1h'),
  
  // Check-in limits
  CHECKIN_REQUESTS: parseInt(process.env.RL_CHECKIN_REQUESTS ?? '1', 10),
  CHECKIN_WINDOW: getWindowValue(process.env.RL_CHECKIN_WINDOW, '5m'),
  
  // General API limits
  API_REQUESTS: parseInt(process.env.RL_API_REQUESTS ?? '100', 10),
  API_WINDOW: getWindowValue(process.env.RL_API_WINDOW, '15m'),
  
  // Export limits
  EXPORT_REQUESTS: parseInt(process.env.RL_EXPORT_REQUESTS ?? '10', 10),
  EXPORT_WINDOW: getWindowValue(process.env.RL_EXPORT_WINDOW, '1h')
}

// Create specific rate limiters with environment-configurable values
const limiters = {
  // Auth POST requests: configurable/min and configurable/hour
  authLoginMinute: rateLimiter({
    requests: RL_CONFIG.AUTH_MIN_REQUESTS,
    window: RL_CONFIG.AUTH_MIN_WINDOW,
    algorithm: 'sliding-window'
  }),
  authLoginHour: rateLimiter({
    requests: RL_CONFIG.AUTH_HOUR_REQUESTS,
    window: RL_CONFIG.AUTH_HOUR_WINDOW,
    algorithm: 'sliding-window'
  }),
  
  // Registration POST: configurable/hour
  registerHour: rateLimiter({
    requests: RL_CONFIG.REGISTER_REQUESTS,
    window: RL_CONFIG.REGISTER_WINDOW,
    algorithm: 'sliding-window'
  }),
  
  // Check-in: configurable per configurable window
  checkin: rateLimiter({
    requests: RL_CONFIG.CHECKIN_REQUESTS,
    window: RL_CONFIG.CHECKIN_WINDOW,
    algorithm: 'sliding-window'
  }),
  
  // General API: configurable per configurable window
  api: rateLimiter({
    requests: RL_CONFIG.API_REQUESTS,
    window: RL_CONFIG.API_WINDOW,
    algorithm: 'sliding-window'
  }),
  
  // CSV exports: configurable per hour
  export: rateLimiter({
    requests: RL_CONFIG.EXPORT_REQUESTS,
    window: RL_CONFIG.EXPORT_WINDOW,
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