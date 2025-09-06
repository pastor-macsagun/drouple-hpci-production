import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createTenantWhereClause, hasMinRole } from '@/lib/rbac'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    if (!hasMinRole(session.user.role, UserRole.ADMIN)) {
      return new Response('Forbidden', { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const churchId = searchParams.get('churchId')

    // Apply tenant scoping using repository guard
    const whereClause = await createTenantWhereClause(
      session.user, 
      {}, 
      churchId || undefined // church override for super admin filtering
    )

    const members = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        memberStatus: true,
        tenantId: true,
        phone: true,
        createdAt: true,
        joinedAt: true,
        memberships: {
          select: {
            localChurch: {
              select: {
                name: true
              }
            },
            role: true,
            joinedAt: true
          },
          take: 1 // Primary membership
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // CSV Headers
    const csvHeaders = [
      'Name',
      'Email', 
      'Role',
      'Status',
      'Church',
      'Phone',
      'Member Since',
      'Created At'
    ]

    // CSV Rows
    const csvRows = members.map(member => [
      member.name || '',
      member.email,
      member.role,
      member.memberStatus,
      member.memberships[0]?.localChurch?.name || 'No Church',
      member.phone || '',
      new Date(member.joinedAt).toLocaleDateString(),
      new Date(member.createdAt).toLocaleDateString()
    ])

    // Generate CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Determine filename
    const churchName = churchId ? 
      (await prisma.localChurch.findUnique({ 
        where: { id: churchId },
        select: { name: true }
      }))?.name || 'Unknown' :
      session.user.role === 'SUPER_ADMIN' ? 'All_Churches' : 'Church'
    
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