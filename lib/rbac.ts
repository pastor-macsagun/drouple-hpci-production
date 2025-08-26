import { auth } from '@/lib/auth'
import { db } from '@/app/lib/db'
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

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.email) return null

  const user = await db.user.findUnique({
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
}

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
 * Repository Guard: Get accessible church IDs for the current user
 * Returns:
 * - undefined/null → throws explicit error
 * - [] (empty array) → return query that yields zero results
 * - [churchIds] → return array of accessible church IDs
 */
export async function getAccessibleChurchIds(
  user?: { role: UserRole; tenantId?: string | null } | null
): Promise<string[]> {
  if (!user) {
    throw new Error('No user provided for tenant scoping')
  }

  if (!user.tenantId) {
    throw new Error('User has no tenantId - cannot determine accessible churches')
  }

  // Super admin can access all churches if no specific constraint
  if (user.role === UserRole.SUPER_ADMIN) {
    // For super admin without specific church filter, return all church IDs
    const churches = await db.localChurch.findMany({
      select: { id: true }
    })
    return churches.map(c => c.id)
  }

  // All other roles can only access their own church
  return [user.tenantId]
}

/**
 * Repository Guard: Create tenant-scoped WHERE clause for Prisma queries
 */
export async function createTenantWhereClause(
  user?: { role: UserRole; tenantId?: string | null } | null,
  additionalWhere: Record<string, any> = {},
  churchIdOverride?: string
): Promise<Record<string, any>> {
  const accessibleChurchIds = await getAccessibleChurchIds(user)
  
  // If specific church override provided (e.g., super admin filtering)
  if (churchIdOverride) {
    if (!accessibleChurchIds.includes(churchIdOverride)) {
      throw new Error(`Access denied: cannot access church ${churchIdOverride}`)
    }
    return {
      ...additionalWhere,
      tenantId: churchIdOverride
    }
  }

  // Single church access
  if (accessibleChurchIds.length === 1) {
    return {
      ...additionalWhere,
      tenantId: accessibleChurchIds[0]
    }
  }

  // Multiple church access (super admin)
  return {
    ...additionalWhere,
    tenantId: { in: accessibleChurchIds }
  }
}