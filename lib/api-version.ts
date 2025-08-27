/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * API Versioning Strategy
 * Implements URL-based versioning for API routes
 */

export const API_VERSIONS = {
  v1: '1.0.0',
  v2: '2.0.0'
} as const

export type ApiVersion = keyof typeof API_VERSIONS

export const CURRENT_VERSION: ApiVersion = 'v2'
export const SUPPORTED_VERSIONS: ApiVersion[] = ['v1', 'v2']

/**
 * Middleware to handle API versioning
 */
export function getApiVersion(pathname: string): ApiVersion | null {
  const match = pathname.match(/\/api\/(v\d+)\//)
  if (!match) return null
  
  const version = match[1] as ApiVersion
  return SUPPORTED_VERSIONS.includes(version) ? version : null
}

/**
 * Version-specific response transformers
 */
export const responseTransformers = {
  v1: {
    user: (user: any) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    }),
    
    event: (event: any) => ({
      id: event.id,
      name: event.name,
      description: event.description,
      startDateTime: event.startDateTime,
      location: event.location,
      capacity: event.capacity
    })
  },
  
  // Future v2 transformations
  v2: {
    user: (user: any) => ({
      id: user.id,
      email: user.email,
      profile: {
        name: user.name,
        bio: user.bio,
        phone: user.phone
      },
      role: user.role,
      metadata: {
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }),
    
    event: (event: any) => ({
      id: event.id,
      title: event.name, // Changed field name
      content: event.description, // Changed field name
      schedule: {
        start: event.startDateTime,
        end: event.endDateTime
      },
      venue: event.location, // Changed field name
      capacity: {
        total: event.capacity,
        available: event.capacity - event.currentAttendees
      }
    })
  }
} as const

/**
 * Deprecation headers
 */
export function addDeprecationHeaders(
  headers: Headers,
  version: ApiVersion,
  deprecationDate?: Date
): void {
  if (version === 'v1' && SUPPORTED_VERSIONS.includes('v2' as ApiVersion)) {
    headers.set('Deprecation', 'true')
    headers.set('Sunset', deprecationDate?.toISOString() || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString())
    headers.set('Link', '</api/v2>; rel="successor-version"')
  }
}

/**
 * Version compatibility checker
 */
export function isVersionCompatible(
  requestedVersion: string,
  minimumVersion: string = '1.0.0'
): boolean {
  const requested = requestedVersion.split('.').map(Number)
  const minimum = minimumVersion.split('.').map(Number)
  
  for (let i = 0; i < 3; i++) {
    if (requested[i] > minimum[i]) return true
    if (requested[i] < minimum[i]) return false
  }
  
  return true
}