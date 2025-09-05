/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * API Versioning Strategy
 * Implements URL-based versioning for API routes
 */

export const API_VERSIONS = {
  v1: '1.0.0'
} as const

export type ApiVersion = keyof typeof API_VERSIONS

export const CURRENT_VERSION: ApiVersion = 'v1'
export const SUPPORTED_VERSIONS: ApiVersion[] = ['v1']

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
  
} as const

/**
 * Deprecation headers
 */
export function addDeprecationHeaders(
  _headers: Headers,
  _version: ApiVersion,
  _deprecationDate?: Date
): void {
  // No deprecation headers needed with only v1 supported
  // Future versions can implement deprecation logic here
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