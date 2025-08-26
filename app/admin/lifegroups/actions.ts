'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { MembershipStatus, RequestStatus, UserRole } from '@prisma/client'
import { createTenantWhereClause } from '@/lib/rbac'

export async function listLifeGroups({ 
  churchId,
  cursor,
  take = 20 
}: { 
  churchId?: string
  cursor?: string
  take?: number 
} = {}) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    // Apply tenant scoping - note: LifeGroup model uses localChurchId instead of tenantId
    const baseTenantWhere = await createTenantWhereClause(session.user, {}, churchId)
    const whereClause = {
      localChurchId: baseTenantWhere.tenantId
    }

    const lifeGroups = await prisma.lifeGroup.findMany({
      where: whereClause,
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        localChurch: true,
        _count: {
          select: {
            memberships: {
              where: {
                status: MembershipStatus.ACTIVE
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

    const hasMore = lifeGroups.length > take
    const items = lifeGroups.slice(0, take)
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
    console.error('List life groups error:', error)
    return { success: false, error: 'Failed to list life groups' }
  }
}

export async function createLifeGroup({
  name,
  leaderId,
  capacity,
  localChurchId,
  description
}: {
  name: string
  leaderId: string
  capacity: number
  localChurchId: string
  description?: string
}) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    if (session.user.role !== 'SUPER_ADMIN' && localChurchId !== session.user.tenantId) {
      return { success: false, error: 'Cannot create life group for another church' }
    }

    const lifeGroup = await prisma.lifeGroup.create({
      data: {
        name,
        leaderId,
        capacity,
        localChurchId,
        description
      },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        localChurch: true,
        _count: {
          select: {
            memberships: {
              where: {
                status: MembershipStatus.ACTIVE
              }
            }
          }
        }
      }
    })

    await prisma.lifeGroupMembership.create({
      data: {
        lifeGroupId: lifeGroup.id,
        userId: leaderId,
        status: MembershipStatus.ACTIVE
      }
    }).catch(() => {})

    revalidatePath('/admin/lifegroups')
    return { success: true, data: lifeGroup }
  } catch (error) {
    console.error('Create life group error:', error)
    return { success: false, error: 'Failed to create life group' }
  }
}

export async function updateLifeGroup({
  id,
  name,
  leaderId,
  capacity,
  description
}: {
  id: string
  name?: string
  leaderId?: string
  capacity?: number
  description?: string
}) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    const lifeGroup = await prisma.lifeGroup.findUnique({
      where: { id },
      select: { localChurchId: true }
    })

    if (!lifeGroup) {
      return { success: false, error: 'Life group not found' }
    }

    if (session.user.role !== 'SUPER_ADMIN' && lifeGroup.localChurchId !== session.user.tenantId) {
      return { success: false, error: 'Cannot update life group from another church' }
    }

    const updated = await prisma.lifeGroup.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(leaderId && { leaderId }),
        ...(capacity && { capacity }),
        ...(description !== undefined && { description })
      }
    })

    if (leaderId) {
      await prisma.lifeGroupMembership.upsert({
        where: {
          lifeGroupId_userId: {
            lifeGroupId: id,
            userId: leaderId
          }
        },
        create: {
          lifeGroupId: id,
          userId: leaderId,
          status: MembershipStatus.ACTIVE
        },
        update: {
          status: MembershipStatus.ACTIVE
        }
      })
    }

    revalidatePath('/admin/lifegroups')
    return { success: true, data: updated }
  } catch (error) {
    console.error('Update life group error:', error)
    return { success: false, error: 'Failed to update life group' }
  }
}

export async function deleteLifeGroup({ id }: { id: string }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    const lifeGroup = await prisma.lifeGroup.findUnique({
      where: { id },
      select: { localChurchId: true }
    })

    if (!lifeGroup) {
      return { success: false, error: 'Life group not found' }
    }

    if (session.user.role !== 'SUPER_ADMIN' && lifeGroup.localChurchId !== session.user.tenantId) {
      return { success: false, error: 'Cannot delete life group from another church' }
    }

    await prisma.lifeGroup.delete({
      where: { id }
    })

    revalidatePath('/admin/lifegroups')
    return { success: true }
  } catch (error) {
    console.error('Delete life group error:', error)
    return { success: false, error: 'Failed to delete life group' }
  }
}

export async function listMemberships({ lifeGroupId }: { lifeGroupId: string }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    const memberships = await prisma.lifeGroupMembership.findMany({
      where: {
        lifeGroupId,
        status: MembershipStatus.ACTIVE
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        joinedAt: 'asc'
      }
    })

    return { success: true, data: memberships }
  } catch (error) {
    console.error('List memberships error:', error)
    return { success: false, error: 'Failed to list memberships' }
  }
}

export async function listJoinRequests({ lifeGroupId }: { lifeGroupId: string }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    const requests = await prisma.lifeGroupMemberRequest.findMany({
      where: {
        lifeGroupId,
        status: RequestStatus.PENDING
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        requestedAt: 'asc'
      }
    })

    return { success: true, data: requests }
  } catch (error) {
    console.error('List join requests error:', error)
    return { success: false, error: 'Failed to list requests' }
  }
}

export async function approveRequest({ requestId }: { requestId: string }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    const request = await prisma.lifeGroupMemberRequest.findUnique({
      where: { id: requestId },
      include: {
        lifeGroup: {
          select: {
            localChurchId: true,
            capacity: true,
            _count: {
              select: {
                memberships: {
                  where: {
                    status: MembershipStatus.ACTIVE
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!request) {
      return { success: false, error: 'Request not found' }
    }

    if (session.user.role !== 'SUPER_ADMIN' && request.lifeGroup.localChurchId !== session.user.tenantId) {
      return { success: false, error: 'Cannot approve request for another church' }
    }

    if (request.lifeGroup._count.memberships >= request.lifeGroup.capacity) {
      return { success: false, error: 'Life group is at capacity' }
    }

    await prisma.$transaction([
      prisma.lifeGroupMemberRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.APPROVED,
          processedAt: new Date(),
          processedBy: session.user.id
        }
      }),
      prisma.lifeGroupMembership.upsert({
        where: {
          lifeGroupId_userId: {
            lifeGroupId: request.lifeGroupId,
            userId: request.userId
          }
        },
        create: {
          lifeGroupId: request.lifeGroupId,
          userId: request.userId,
          status: MembershipStatus.ACTIVE
        },
        update: {
          status: MembershipStatus.ACTIVE,
          leftAt: null
        }
      })
    ])

    revalidatePath('/admin/lifegroups')
    return { success: true }
  } catch (error) {
    console.error('Approve request error:', error)
    return { success: false, error: 'Failed to approve request' }
  }
}

export async function rejectRequest({ requestId }: { requestId: string }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    const request = await prisma.lifeGroupMemberRequest.findUnique({
      where: { id: requestId },
      include: {
        lifeGroup: {
          select: {
            localChurchId: true
          }
        }
      }
    })

    if (!request) {
      return { success: false, error: 'Request not found' }
    }

    if (session.user.role !== 'SUPER_ADMIN' && request.lifeGroup.localChurchId !== session.user.tenantId) {
      return { success: false, error: 'Cannot reject request for another church' }
    }

    await prisma.lifeGroupMemberRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.REJECTED,
        processedAt: new Date(),
        processedBy: session.user.id
      }
    })

    revalidatePath('/admin/lifegroups')
    return { success: true }
  } catch (error) {
    console.error('Reject request error:', error)
    return { success: false, error: 'Failed to reject request' }
  }
}

export async function removeMember({ lifeGroupId, userId }: { lifeGroupId: string; userId: string }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    await prisma.lifeGroupMembership.update({
      where: {
        lifeGroupId_userId: {
          lifeGroupId,
          userId
        }
      },
      data: {
        status: MembershipStatus.LEFT,
        leftAt: new Date()
      }
    })

    revalidatePath('/admin/lifegroups')
    return { success: true }
  } catch (error) {
    console.error('Remove member error:', error)
    return { success: false, error: 'Failed to remove member' }
  }
}

export async function startAttendanceSession({ 
  lifeGroupId, 
  date 
}: { 
  lifeGroupId: string
  date: Date 
}) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    const attendanceSession = await prisma.lifeGroupAttendanceSession.create({
      data: {
        lifeGroupId,
        date,
        notes: ''
      }
    })

    return { success: true, data: attendanceSession }
  } catch (error) {
    console.error('Start attendance session error:', error)
    return { success: false, error: 'Failed to start attendance session' }
  }
}

export async function markAttendance({ 
  sessionId, 
  memberId, 
  present 
}: { 
  sessionId: string
  memberId: string
  present: boolean 
}) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    if (present) {
      await prisma.lifeGroupAttendance.upsert({
        where: {
          sessionId_userId: {
            sessionId,
            userId: memberId
          }
        },
        create: {
          sessionId,
          userId: memberId,
          present: true
        },
        update: {
          present: true
        }
      })
    } else {
      await prisma.lifeGroupAttendance.deleteMany({
        where: {
          sessionId,
          userId: memberId
        }
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Mark attendance error:', error)
    return { success: false, error: 'Failed to mark attendance' }
  }
}

export async function exportRosterCsv({ lifeGroupId }: { lifeGroupId: string }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new Response('Not authenticated', { status: 401 })
    }

    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return new Response('Unauthorized', { status: 403 })
    }

    const lifeGroup = await prisma.lifeGroup.findUnique({
      where: { id: lifeGroupId },
      include: {
        leader: {
          select: {
            name: true,
            email: true
          }
        },
        localChurch: true,
        memberships: {
          where: {
            status: MembershipStatus.ACTIVE
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          },
          orderBy: {
            joinedAt: 'asc'
          }
        }
      }
    })

    if (!lifeGroup) {
      return new Response('Life group not found', { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && lifeGroup.localChurchId !== session.user.tenantId) {
      return new Response('Cannot export roster for another church', { status: 403 })
    }

    const csv = [
      ['Life Group', 'Leader', 'Church', 'Total Members'],
      [lifeGroup.name, lifeGroup.leader.name || lifeGroup.leader.email, lifeGroup.localChurch.name, lifeGroup.memberships.length.toString()],
      [],
      ['Name', 'Email', 'Phone', 'Joined Date'],
      ...lifeGroup.memberships.map(membership => [
        membership.user.name || '',
        membership.user.email || '',
        membership.user.phone || '',
        membership.joinedAt.toLocaleDateString()
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${lifeGroup.name.replace(/[^a-z0-9]/gi, '_')}_roster.csv"`
      }
    })
  } catch (error) {
    console.error('Export roster CSV error:', error)
    return new Response('Failed to export roster', { status: 500 })
  }
}

export async function exportAttendanceCsv({ lifeGroupId }: { lifeGroupId: string }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new Response('Not authenticated', { status: 401 })
    }

    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return new Response('Unauthorized', { status: 403 })
    }

    const lifeGroup = await prisma.lifeGroup.findUnique({
      where: { id: lifeGroupId },
      include: {
        localChurch: true,
        attendanceSessions: {
          include: {
            attendances: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    })

    if (!lifeGroup) {
      return new Response('Life group not found', { status: 404 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && lifeGroup.localChurchId !== session.user.tenantId) {
      return new Response('Cannot export attendance for another church', { status: 403 })
    }

    const rows: string[][] = [
      ['Life Group', 'Church ID'],
      [lifeGroup.name, lifeGroup.localChurchId],
      [],
      ['Date', 'Total Present', 'Attendees']
    ]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lifeGroup.attendanceSessions.forEach((session: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const attendees = session.attendances.map((a: any) => a.user.name || a.user.email).join(', ')
      rows.push([
        session.date.toLocaleDateString(),
        session.attendances.length.toString(),
        attendees
      ])
    })

    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${lifeGroup.name.replace(/[^a-z0-9]/gi, '_')}_attendance.csv"`
      }
    })
  } catch (error) {
    console.error('Export attendance CSV error:', error)
    return new Response('Failed to export attendance', { status: 500 })
  }
}

export async function getLeaders({ churchId }: { churchId?: string } = {}) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return { success: false, error: 'Unauthorized' }
    }

    // Apply tenant scoping using repository guard
    const whereClause = await createTenantWhereClause(session.user, {}, churchId)

    const leaders = await prisma.user.findMany({
      where: {
        ...whereClause,
        role: {
          in: [UserRole.LEADER, UserRole.PASTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return { success: true, data: leaders }
  } catch (error) {
    console.error('Get leaders error:', error)
    return { success: false, error: 'Failed to get leaders' }
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

    // Apply tenant scoping for local churches
    const accessibleChurchIds = session.user.role === 'SUPER_ADMIN' 
      ? {} 
      : { id: session.user.tenantId! } // Use ! since we verified auth above

    const churches = await prisma.localChurch.findMany({
      where: accessibleChurchIds,
      orderBy: { name: 'asc' }
    })

    return { success: true, data: churches }
  } catch (error) {
    console.error('Get local churches error:', error)
    return { success: false, error: 'Failed to get churches' }
  }
}