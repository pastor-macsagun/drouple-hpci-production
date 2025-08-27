'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { UserRole, MemberStatus } from '@prisma/client'
import { z } from 'zod'
import { generateSecurePassword, hashPassword } from '@/lib/password'
import { createTenantWhereClause } from '@/lib/rbac'
import { handleActionError, ApplicationError } from '@/lib/errors'

const createMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(UserRole),
  tenantId: z.string().min(1, 'Church is required')
})

const updateMemberSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(UserRole),
  memberStatus: z.nativeEnum(MemberStatus)
})

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

    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
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
          }
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

export async function createMember(data: z.infer<typeof createMemberSchema>) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new ApplicationError('UNAUTHORIZED', 'Not authenticated')
    }

    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      throw new ApplicationError('FORBIDDEN', 'Insufficient permissions to create members')
    }

    const validated = createMemberSchema.parse(data)

    if (session.user.role !== 'SUPER_ADMIN' && validated.tenantId !== session.user.tenantId) {
      throw new ApplicationError('TENANT_MISMATCH', 'Cannot create member for another church')
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

    const member = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        role: validated.role,
        tenantId: validated.tenantId,
        passwordHash,
        memberStatus: MemberStatus.PENDING,
        mustChangePassword: true,
        emailVerified: new Date()
      }
    })

    await prisma.membership.create({
      data: {
        userId: member.id,
        localChurchId: validated.tenantId
      }
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

    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
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

    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
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

export async function resetPassword(memberId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    const member = await prisma.user.findUnique({
      where: { id: memberId }
    })

    if (!member) {
      return { success: false, error: 'Member not found' }
    }

    if (session.user.role !== 'SUPER_ADMIN' && member.tenantId !== session.user.tenantId) {
      return { success: false, error: 'Cannot reset password for member from another church' }
    }

    // Generate new secure random password
    const password = generateSecurePassword(12)
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
      password // Return the new password for admin to share
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

    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    const whereClause = session.user.role === 'SUPER_ADMIN'
      ? {}
      : { id: session.user.tenantId || undefined }

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

export async function exportMembersCsv({ churchId }: { churchId?: string } = {}) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return new Response('Forbidden', { status: 403 })
    }

    // Apply tenant scoping using repository guard
    const whereClause = await createTenantWhereClause(
      session.user, 
      {}, 
      churchId // church override for super admin filtering
    )

    const members = await prisma.user.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    })

    const csvHeaders = ['Name', 'Email', 'Role', 'Status', 'Tenant ID', 'Created At']
    const csvRows = members.map(member => [
      member.name || '',
      member.email,
      member.role,
      member.memberStatus,
      member.tenantId || '',
      new Date(member.createdAt).toLocaleDateString()
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const churchName = churchId ? 
      (await prisma.localChurch.findUnique({ where: { id: churchId } }))?.name || 'Unknown' :
      'All_Churches'
    
    const filename = `members-${churchName.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.csv`

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Export members CSV error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}