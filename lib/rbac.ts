import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { redirect } from 'next/navigation'

export interface RBACContext {
  localChurchId?: string
}

const roleHierarchy: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 100,
  [UserRole.PASTOR]: 80,
  [UserRole.ADMIN]: 60,
  [UserRole.VIP]: 50,
  [UserRole.LEADER]: 40,
  [UserRole.MEMBER]: 20,
}

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  tenantId: string | null;
  emailVerified?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  memberships: Array<{
    id: string;
    localChurchId: string;
    role: UserRole;
    joinedAt: Date;
    leftAt?: Date | null;
    localChurch: { 
      id: string; 
      name: string; 
      address?: string | null;
      city: string | null;
    };
  }>;
} | null;

/**
 * Retrieves the currently authenticated user with full membership details.
 * Handles static generation contexts and JWT errors gracefully.
 * 
 * @returns Promise resolving to user object with memberships, or null if unauthenticated
 * @throws Error only for unexpected authentication failures
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  try {
    // Handle static generation context - when headers() is not available
    try {
      const session = await auth()
      if (!session?.user?.email) return null

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          memberships: {
            include: {
              localChurch: true,
            },
          },
        },
      })

      return user
    } catch (staticError) {
      // Check if this is a static generation error (headers() not available)
      if (staticError instanceof Error && 
          (staticError.message.includes('headers') || 
           staticError.message.includes('Dynamic server usage') ||
           staticError.message.includes('dynamic function'))) {
        
        console.warn('[Auth] Static generation context detected - getCurrentUser() cannot access request headers:', {
          error: staticError.message,
          timestamp: new Date().toISOString(),
          context: 'static-generation'
        })
        
        // In static generation context, we cannot determine the user
        return null
      }
      
      // Check for JWT-related errors from NextAuth
      if (staticError instanceof Error) {
        if (staticError.message.includes('no matching decryption secret') || 
            staticError.message.includes('JWTSessionError') ||
            staticError.message.includes('Invalid JWT') ||
            staticError.name === 'JWTSessionError') {
          
          console.warn('[Auth] JWT session error - invalid token detected:', {
            error: staticError.message,
            timestamp: new Date().toISOString()
          })
          
          // Return null for invalid JWT tokens - this will trigger re-authentication
          return null
        }
      }
      
      // Re-throw if not a known error type
      throw staticError
    }
  } catch (error: unknown) {
    // Handle any remaining authentication errors gracefully
    if (error instanceof Error) {
      console.warn('[Auth] Authentication error in getCurrentUser - treating as unauthenticated:', {
        message: error.message,
        name: error.name,
        timestamp: new Date().toISOString()
      })
    }
    
    // For any auth error, treat user as not authenticated
    return null
  }
}

/**
 * Enforces role-based access control with optional local church context.
 * Redirects unauthenticated users to signin, unauthorized users to forbidden page.
 * 
 * @param minRole Minimum required role level
 * @param context Optional context requiring specific local church membership
 * @returns Authenticated user if authorized
 */
export async function requireRole(
  minRole: UserRole,
  context?: RBACContext
) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  // Super admin bypasses all checks
  if (user.role === UserRole.SUPER_ADMIN) {
    return user
  }

  // Check role hierarchy
  if (roleHierarchy[user.role] < roleHierarchy[minRole]) {
    redirect('/forbidden')
  }

  // If context requires specific local church, verify membership
  if (context?.localChurchId) {
    const hasMembership = user.memberships.some(
      m => m.localChurchId === context.localChurchId
    )
    
    if (!hasMembership) {
      redirect('/forbidden')
    }
  }

  return user
}

/**
 * Critical tenant isolation guard - prevents cross-tenant data access.
 * Validates that an entity belongs to the same local church as the actor.
 * 
 * @param entityOrId Entity with localChurchId property or direct church ID string
 * @param actorLocalChurchId Local church ID of the user performing the action
 * @throws Error if tenant mismatch detected (security violation)
 */
export async function assertTenant(
  entityOrId: { localChurchId?: string | null } | string,
  actorLocalChurchId: string
) {
  // Extract localChurchId from entity or use as-is if string
  const entityLocalChurchId = typeof entityOrId === 'string' 
    ? entityOrId 
    : entityOrId.localChurchId

  if (!entityLocalChurchId) {
    throw new Error('Entity has no localChurchId')
  }

  if (entityLocalChurchId !== actorLocalChurchId) {
    throw new Error('Access denied: different tenant')
  }
}

export function hasAnyRole(
  userRole: UserRole,
  allowedRoles: UserRole[]
): boolean {
  // Super admin always has access
  if (userRole === UserRole.SUPER_ADMIN) {
    return true
  }

  return allowedRoles.includes(userRole)
}

/**
 * Checks if user role meets minimum required level using role hierarchy.
 * SUPER_ADMIN automatically passes all checks.
 * 
 * @param userRole Current user's role
 * @param minRole Minimum required role level
 * @returns true if user has sufficient role level
 */
export function hasMinRole(
  userRole: UserRole,
  minRole: UserRole
): boolean {
  // Super admin always has access
  if (userRole === UserRole.SUPER_ADMIN) {
    return true
  }

  return roleHierarchy[userRole] >= roleHierarchy[minRole]
}

/**
 * Domain-specific authorization for entity operations.
 * Implements fine-grained permissions based on role and entity type.
 * 
 * @param userRole Current user's role
 * @param entityType Type of entity being accessed
 * @param action CRUD operation being performed
 * @returns true if user is authorized for this operation
 */
export function canManageEntity(
  userRole: UserRole,
  entityType: 'church' | 'localChurch' | 'user' | 'lifeGroup' | 'event' | 'pathway',
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  // Super admin can do everything
  if (userRole === UserRole.SUPER_ADMIN) {
    return true
  }

  const permissions: Record<string, Record<UserRole, string[]>> = {
    church: {
      [UserRole.SUPER_ADMIN]: ['create', 'read', 'update', 'delete'],
      [UserRole.PASTOR]: ['read'],
      [UserRole.ADMIN]: ['read'],
      [UserRole.VIP]: [],
      [UserRole.LEADER]: [],
      [UserRole.MEMBER]: [],
    },
    localChurch: {
      [UserRole.SUPER_ADMIN]: ['create', 'read', 'update', 'delete'],
      [UserRole.PASTOR]: ['read', 'update'],
      [UserRole.ADMIN]: ['read'],
      [UserRole.VIP]: [],
      [UserRole.LEADER]: ['read'],
      [UserRole.MEMBER]: ['read'],
    },
    user: {
      [UserRole.SUPER_ADMIN]: ['create', 'read', 'update', 'delete'],
      [UserRole.PASTOR]: ['create', 'read', 'update'],
      [UserRole.ADMIN]: ['create', 'read', 'update'],
      [UserRole.VIP]: ['read'],
      [UserRole.LEADER]: ['read'],
      [UserRole.MEMBER]: ['read'],
    },
    lifeGroup: {
      [UserRole.SUPER_ADMIN]: ['create', 'read', 'update', 'delete'],
      [UserRole.PASTOR]: ['create', 'read', 'update', 'delete'],
      [UserRole.ADMIN]: ['create', 'read', 'update', 'delete'],
      [UserRole.VIP]: ['read'],
      [UserRole.LEADER]: ['read', 'update'], // Can update own group
      [UserRole.MEMBER]: ['read'],
    },
    event: {
      [UserRole.SUPER_ADMIN]: ['create', 'read', 'update', 'delete'],
      [UserRole.PASTOR]: ['create', 'read', 'update', 'delete'],
      [UserRole.ADMIN]: ['create', 'read', 'update', 'delete'],
      [UserRole.VIP]: ['read'],
      [UserRole.LEADER]: ['read'],
      [UserRole.MEMBER]: ['read'],
    },
    pathway: {
      [UserRole.SUPER_ADMIN]: ['create', 'read', 'update', 'delete'],
      [UserRole.PASTOR]: ['create', 'read', 'update', 'delete'],
      [UserRole.ADMIN]: ['create', 'read', 'update', 'delete'],
      [UserRole.VIP]: ['read'],
      [UserRole.LEADER]: ['read', 'update'], // Can update progress
      [UserRole.MEMBER]: ['read'],
    },
  }

  const entityPermissions = permissions[entityType]
  if (!entityPermissions) {
    return false
  }

  const rolePermissions = entityPermissions[userRole]
  if (!rolePermissions) {
    return false
  }

  return rolePermissions.includes(action)
}

/**
 * Repository Guard: Multi-tenant access control for database queries.
 * Determines which church IDs the user can access based on their role and tenant.
 * 
 * CRITICAL for tenant isolation - prevents cross-church data leaks.
 * 
 * @param user User object with role and tenantId
 * @returns Array of accessible church IDs:
 *   - SUPER_ADMIN: all church IDs
 *   - Other roles: [tenantId] or [] if no tenantId
 * @throws Error if no user provided (security requirement)
 */
export async function getAccessibleChurchIds(
  user?: { role: UserRole; tenantId?: string | null } | null
): Promise<string[]> {
  if (!user) {
    throw new Error('No user provided for tenant scoping')
  }

  // Super admin can access all churches if no specific constraint
  if (user.role === UserRole.SUPER_ADMIN) {
    // For super admin without specific church filter, return all church IDs
    const churches = await prisma.localChurch.findMany({
      select: { id: true }
    })
    return churches.map(c => c.id)
  }

  // All other roles can only access their own church - if no tenantId, return empty
  if (!user.tenantId) {
    return [] // Empty array = zero results
  }

  return [user.tenantId]
}

/**
 * Repository Guard: Builds tenant-isolated WHERE clauses for database queries.
 * Essential security function - ALL queries must use this for multi-tenant isolation.
 * 
 * Prevents data leaks between churches by enforcing tenant boundaries at query level.
 * 
 * @param user User object with role and tenantId
 * @param additionalWhere Additional WHERE conditions to merge
 * @param churchIdOverride Specific church filter (for SUPER_ADMIN)
 * @param fieldName Database field name for tenant ID (tenantId or localChurchId)
 * @returns Prisma WHERE clause with tenant isolation applied
 * @throws Error if churchIdOverride violates user's access permissions
 */
export async function createTenantWhereClause(
  user?: { role: UserRole; tenantId?: string | null } | null,
  additionalWhere: Record<string, unknown> = {},
  churchIdOverride?: string,
  fieldName: 'tenantId' | 'localChurchId' = 'tenantId'
): Promise<Record<string, unknown>> {
  const accessibleChurchIds = await getAccessibleChurchIds(user)
  
  // If specific church override provided (e.g., super admin filtering)
  if (churchIdOverride) {
    if (accessibleChurchIds.length > 0 && !accessibleChurchIds.includes(churchIdOverride)) {
      throw new Error(`Access denied: cannot access church ${churchIdOverride}`)
    }
    return {
      ...additionalWhere,
      [fieldName]: churchIdOverride
    }
  }

  // Empty access = zero results (critical for tenant isolation)
  if (accessibleChurchIds.length === 0) {
    return {
      ...additionalWhere,
      [fieldName]: { in: [] } // This will return zero results
    }
  }

  // Single church access
  if (accessibleChurchIds.length === 1) {
    return {
      ...additionalWhere,
      [fieldName]: accessibleChurchIds[0]
    }
  }

  // Multiple church access (super admin)
  return {
    ...additionalWhere,
    [fieldName]: { in: accessibleChurchIds }
  }
}