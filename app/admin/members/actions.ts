'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { UserRole, MemberStatus } from '@prisma/client'
import { z } from 'zod'
import { generateSecurePassword, hashPassword } from '@/lib/password'
import { generateAndSendPasswordReset } from '@/lib/email'
import { createTenantWhereClause, hasMinRole } from '@/lib/rbac'
import { handleActionError, ApplicationError } from '@/lib/errors'

const createMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  systemRoles: z.array(z.nativeEnum(UserRole)).min(1, 'At least one system role is required'),
  churchMemberships: z.array(z.object({
    churchId: z.string().min(1, 'Church ID is required'),
    role: z.nativeEnum(UserRole)
  })).min(1, 'At least one church membership is required')
})

const updateMemberSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(UserRole),
  memberStatus: z.nativeEnum(MemberStatus)
})

/**
 * Lists members with pagination, search, and multi-tenant filtering.
 * Enforces tenant isolation using repository guards.
 * 
 * @param search Optional search term for name/email filtering
 * @param cursor Pagination cursor for infinite scroll
 * @param take Number of records to return (default 20)
 * @param churchId Optional church filter for SUPER_ADMIN role
 * @returns Paginated member list with tenant isolation applied
 */
export async function listMembers({
  search,
  cursor,
  take = 20,
  churchId
}: {
  search?: string
  cursor?: string
  take?: number
  churchId?: string
} = {}) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!hasMinRole(session.user.role, UserRole.ADMIN)) {
      return { success: false, error: 'Unauthorized' }
    }

    // Build search conditions
    const searchWhere = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    } : {}

    // Apply tenant scoping using repository guard
    const whereClause = await createTenantWhereClause(
      session.user, 
      searchWhere, 
      churchId // church override for super admin filtering
    )

    const members = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        memberStatus: true,
        mustChangePassword: true,
        joinedAt: true,
        createdAt: true,
        memberships: {
          select: {
            localChurch: {
              select: {
                id: true,
                name: true
              }
            }
          },
          take: 1 // Optimize: only need one membership for display
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: take + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1
      })
    })

    const hasMore = members.length > take
    const items = members.slice(0, take)
    const nextCursor = hasMore ? items[items.length - 1].id : null

    return {
      success: true,
      data: {
        items,
        nextCursor,
        hasMore
      }
    }
  } catch (error) {
    console.error('List members error:', error)
    return { success: false, error: 'Failed to list members' }
  }
}

/**
 * Creates a new member with multi-role and multi-church support.
 * Implements complex business logic for role hierarchy and tenant assignment.
 * 
 * @param data Validated member creation data with system roles and church memberships
 * @returns Created member with generated password, or error details
 */
export async function createMember(data: z.infer<typeof createMemberSchema>) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new ApplicationError('UNAUTHORIZED', 'Not authenticated')
    }

    if (!hasMinRole(session.user.role, UserRole.ADMIN)) {
      throw new ApplicationError('FORBIDDEN', 'Insufficient permissions to create members')
    }

    const validated = createMemberSchema.parse(data)

    // Validate tenant access for each church membership
    if (session.user.role !== 'SUPER_ADMIN') {
      for (const membership of validated.churchMemberships) {
        if (membership.churchId !== session.user.tenantId) {
          throw new ApplicationError('TENANT_MISMATCH', 'Cannot create member for another church')
        }
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email }
    })

    if (existingUser) {
      throw new ApplicationError('EMAIL_EXISTS', 'This email address is already registered')
    }

    // Generate secure random password
    const password = generateSecurePassword(12)
    const passwordHash = await hashPassword(password)

    // Role hierarchy resolution: Select highest priority role from multiple selections
    // Business rule: Primary system role determines base permissions across all churches
    const roleHierarchy: UserRole[] = [
      UserRole.SUPER_ADMIN,
      UserRole.PASTOR, 
      UserRole.ADMIN,
      UserRole.VIP,
      UserRole.LEADER,
      UserRole.MEMBER
    ]
    
    const primarySystemRole = roleHierarchy.find(role => 
      validated.systemRoles.includes(role)
    ) || validated.systemRoles[0]

    // Create user with highest priority system role and primary tenant (first church)
    const primaryChurch = validated.churchMemberships[0]
    const member = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        role: primarySystemRole,
        tenantId: primaryChurch.churchId, // Primary tenant for RBAC
        passwordHash,
        memberStatus: MemberStatus.PENDING,
        mustChangePassword: false, // Changed to false to prevent redirect
        emailVerified: new Date()
      }
    })

    // Create memberships for each selected church
    await prisma.membership.createMany({
      data: validated.churchMemberships.map(membership => ({
        userId: member.id,
        localChurchId: membership.churchId,
        role: membership.role
      }))
    })

    revalidatePath('/admin/members')
    return { 
      success: true, 
      data: member,
      password // Return the raw password for admin to copy
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const appError = handleActionError(
        new ApplicationError('VALIDATION_ERROR', error.errors[0].message)
      )
      return { success: false, error: appError.message, code: appError.code }
    }
    
    const appError = handleActionError(error)
    return { success: false, error: appError.message, code: appError.code }
  }
}

export async function updateMember(data: z.infer<typeof updateMemberSchema>) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!hasMinRole(session.user.role, UserRole.ADMIN)) {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = updateMemberSchema.parse(data)

    const existingMember = await prisma.user.findUnique({
      where: { id: validated.id }
    })

    if (!existingMember) {
      return { success: false, error: 'Member not found' }
    }

    if (session.user.role !== 'SUPER_ADMIN' && existingMember.tenantId !== session.user.tenantId) {
      return { success: false, error: 'Cannot update member from another church' }
    }

    if (validated.email !== existingMember.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: validated.email }
      })
      if (emailTaken) {
        return { success: false, error: 'Email already in use' }
      }
    }

    const member = await prisma.user.update({
      where: { id: validated.id },
      data: {
        name: validated.name,
        email: validated.email,
        role: validated.role,
        memberStatus: validated.memberStatus
      }
    })

    revalidatePath('/admin/members')
    return { success: true, data: member }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('Update member error:', error)
    return { success: false, error: 'Failed to update member' }
  }
}

export async function deactivateMember(memberId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!hasMinRole(session.user.role, UserRole.ADMIN)) {
      return { success: false, error: 'Unauthorized' }
    }

    const member = await prisma.user.findUnique({
      where: { id: memberId }
    })

    if (!member) {
      return { success: false, error: 'Member not found' }
    }

    if (session.user.role !== 'SUPER_ADMIN' && member.tenantId !== session.user.tenantId) {
      return { success: false, error: 'Cannot deactivate member from another church' }
    }

    await prisma.user.update({
      where: { id: memberId },
      data: {
        memberStatus: MemberStatus.INACTIVE
      }
    })

    revalidatePath('/admin/members')
    return { success: true }
  } catch (error) {
    console.error('Deactivate member error:', error)
    return { success: false, error: 'Failed to deactivate member' }
  }
}

export async function resetPassword(memberId: string, sendEmail: boolean = true) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!hasMinRole(session.user.role, UserRole.ADMIN)) {
      return { success: false, error: 'Unauthorized' }
    }

    const member = await prisma.user.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        email: true,
        tenantId: true
      }
    })

    if (!member) {
      return { success: false, error: 'Member not found' }
    }

    if (session.user.role !== 'SUPER_ADMIN' && member.tenantId !== session.user.tenantId) {
      return { success: false, error: 'Cannot reset password for member from another church' }
    }

    let password: string
    let emailSent = false

    if (sendEmail && member.email) {
      // Generate password and send email
      const emailResult = await generateAndSendPasswordReset(
        member.email,
        member.name || 'Member'
      )
      
      if (emailResult.success && emailResult.newPassword) {
        password = emailResult.newPassword
        emailSent = true
      } else {
        // Fall back to manual password generation if email fails
        password = generateSecurePassword(12)
      }
    } else {
      // Manual password generation (no email)
      password = generateSecurePassword(12)
    }

    const passwordHash = await hashPassword(password)

    await prisma.user.update({
      where: { id: memberId },
      data: {
        passwordHash,
        mustChangePassword: true,
        memberStatus: MemberStatus.PENDING
      }
    })

    revalidatePath('/admin/members')
    return { 
      success: true,
      password: emailSent ? undefined : password, // Only return password if email wasn't sent
      emailSent,
      memberEmail: member.email
    }
  } catch (error) {
    console.error('Reset password error:', error)
    return { success: false, error: 'Failed to reset password' }
  }
}

export async function getLocalChurches() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!hasMinRole(session.user.role, UserRole.ADMIN)) {
      return { success: false, error: 'Unauthorized' }
    }

    const whereClause = session.user.role === 'SUPER_ADMIN'
      ? {}
      : { churchId: session.user.tenantId || undefined }

    const churches = await prisma.localChurch.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return { success: true, data: churches }
  } catch (error) {
    console.error('Get local churches error:', error)
    return { success: false, error: 'Failed to get churches' }
  }
}

// Bulk operations for member status management
export async function bulkSetMemberStatus(memberIds: string[], status: MemberStatus) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!hasMinRole(session.user.role, UserRole.ADMIN)) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate all members belong to the user's tenant (except SUPER_ADMIN)
    if (session.user.role !== 'SUPER_ADMIN') {
      const members = await prisma.user.findMany({
        where: { 
          id: { in: memberIds },
          tenantId: session.user.tenantId
        },
        select: { id: true }
      })

      if (members.length !== memberIds.length) {
        return { success: false, error: 'Cannot modify members from another church' }
      }
    }

    // Perform bulk update within transaction
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: { 
          id: { in: memberIds },
          ...(session.user.role !== 'SUPER_ADMIN' && { tenantId: session.user.tenantId })
        },
        data: { memberStatus: status }
      })

      // Create audit log entries for each member
      await tx.auditLog.createMany({
        data: memberIds.map(memberId => ({
          actorId: session.user.id,
          action: 'MEMBER_STATUS_CHANGE',
          entity: 'User',
          entityId: memberId,
          localChurchId: session.user.tenantId,
          meta: {
            previousStatus: 'UNKNOWN', // We could query this first if needed
            newStatus: status,
            bulkOperation: true
          }
        }))
      })

      return updated
    })

    revalidatePath('/admin/members')
    return { 
      success: true, 
      data: { 
        updatedCount: result.count,
        status 
      } 
    }
  } catch (error) {
    console.error('Bulk set member status error:', error)
    return { success: false, error: 'Failed to update member status' }
  }
}

// Church transfer for SUPER_ADMIN only
export async function transferMemberChurch(
  userId: string, 
  fromChurchId: string, 
  toChurchId: string
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Only SUPER_ADMIN can transfer members between churches' }
    }

    // Validate churches exist
    const [fromChurch, toChurch, member] = await Promise.all([
      prisma.localChurch.findUnique({ where: { id: fromChurchId } }),
      prisma.localChurch.findUnique({ where: { id: toChurchId } }),
      prisma.user.findUnique({ 
        where: { id: userId },
        include: { memberships: true }
      })
    ])

    if (!fromChurch || !toChurch) {
      return { success: false, error: 'Invalid church IDs' }
    }

    if (!member) {
      return { success: false, error: 'Member not found' }
    }

    // Perform transfer within transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user's primary tenant
      await tx.user.update({
        where: { id: userId },
        data: { tenantId: toChurchId }
      })

      // Remove old membership
      await tx.membership.deleteMany({
        where: {
          userId: userId,
          localChurchId: fromChurchId
        }
      })

      // Create new membership
      const newMembership = await tx.membership.create({
        data: {
          userId: userId,
          localChurchId: toChurchId,
          role: member.role,
          isNewBeliever: member.isNewBeliever
        }
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: 'MEMBER_CHURCH_TRANSFER',
          entity: 'User',
          entityId: userId,
          localChurchId: toChurchId,
          meta: {
            fromChurchId,
            toChurchId,
            fromChurchName: fromChurch.name,
            toChurchName: toChurch.name,
            memberName: member.name
          }
        }
      })

      return newMembership
    })

    revalidatePath('/admin/members')
    revalidatePath(`/(super)/super/local-churches/${fromChurchId}`)
    revalidatePath(`/(super)/super/local-churches/${toChurchId}`)

    return { success: true, data: result }
  } catch (error) {
    console.error('Transfer member church error:', error)
    return { success: false, error: 'Failed to transfer member' }
  }
}