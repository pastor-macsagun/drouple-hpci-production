'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { MembershipStatus, RequestStatus } from '@prisma/client'

export async function getMyLifeGroups() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const memberships = await prisma.lifeGroupMembership.findMany({
      where: {
        userId: session.user.id,
        status: MembershipStatus.ACTIVE
      },
      include: {
        lifeGroup: {
          include: {
            leader: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
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

    return { success: true, data: memberships }
  } catch (error) {
    console.error('Get my life groups error:', error)
    return { success: false, error: 'Failed to get life groups' }
  }
}

export async function getAvailableLifeGroups() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get life groups user is not a member of
    const lifeGroups = await prisma.lifeGroup.findMany({
      where: {
        localChurchId: session.user.tenantId || undefined,
        isActive: true,
        NOT: {
          memberships: {
            some: {
              userId: session.user.id!,
              status: MembershipStatus.ACTIVE
            }
          }
        }
      },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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

    // Check for pending requests
    const pendingRequests = await prisma.lifeGroupMemberRequest.findMany({
      where: {
        userId: session.user.id!,
        status: RequestStatus.PENDING
      },
      select: {
        lifeGroupId: true
      }
    })

    const pendingGroupIds = new Set(pendingRequests.map(r => r.lifeGroupId))

    const lifeGroupsWithStatus = lifeGroups.map(group => ({
      ...group,
      hasPendingRequest: pendingGroupIds.has(group.id),
      isFull: group._count.memberships >= group.capacity
    }))

    return { success: true, data: lifeGroupsWithStatus }
  } catch (error) {
    console.error('Get available life groups error:', error)
    return { success: false, error: 'Failed to get available life groups' }
  }
}

export async function requestJoinLifeGroup(lifeGroupId: string, message?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if already a member
    const existingMembership = await prisma.lifeGroupMembership.findUnique({
      where: {
        lifeGroupId_userId: {
          lifeGroupId,
          userId: session.user.id
        }
      }
    })

    if (existingMembership?.status === MembershipStatus.ACTIVE) {
      return { success: false, error: 'Already a member of this life group' }
    }

    // Check for existing pending request
    const existingRequest = await prisma.lifeGroupMemberRequest.findFirst({
      where: {
        lifeGroupId,
        userId: session.user.id,
        status: RequestStatus.PENDING
      }
    })

    if (existingRequest) {
      return { success: false, error: 'Request already pending' }
    }

    // Create request
    const request = await prisma.lifeGroupMemberRequest.create({
      data: {
        lifeGroupId,
        userId: session.user.id,
        message
      }
    })

    revalidatePath('/lifegroups')
    return { success: true, data: request }
  } catch (error) {
    console.error('Request join life group error:', error)
    return { success: false, error: 'Failed to submit request' }
  }
}

export async function leaveLifeGroup(lifeGroupId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const membership = await prisma.lifeGroupMembership.update({
      where: {
        lifeGroupId_userId: {
          lifeGroupId,
          userId: session.user.id
        }
      },
      data: {
        status: MembershipStatus.LEFT,
        leftAt: new Date()
      }
    })

    revalidatePath('/lifegroups')
    return { success: true, data: membership }
  } catch (error) {
    console.error('Leave life group error:', error)
    return { success: false, error: 'Failed to leave life group' }
  }
}

export async function getLifeGroupMembers(lifeGroupId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if user is leader or admin
    const lifeGroup = await prisma.lifeGroup.findUnique({
      where: { id: lifeGroupId },
      select: { leaderId: true }
    })

    const isLeader = lifeGroup?.leaderId === session.user.id
    const isAdmin = ['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)

    if (!isLeader && !isAdmin) {
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
    console.error('Get life group members error:', error)
    return { success: false, error: 'Failed to get members' }
  }
}

export async function getLifeGroupRequests(lifeGroupId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if user is leader or admin
    const lifeGroup = await prisma.lifeGroup.findUnique({
      where: { id: lifeGroupId },
      select: { leaderId: true }
    })

    const isLeader = lifeGroup?.leaderId === session.user.id
    const isAdmin = ['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)

    if (!isLeader && !isAdmin) {
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
    console.error('Get life group requests error:', error)
    return { success: false, error: 'Failed to get requests' }
  }
}

export async function approveRequest(requestId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const request = await prisma.lifeGroupMemberRequest.findUnique({
      where: { id: requestId },
      include: {
        lifeGroup: {
          select: {
            leaderId: true,
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

    // Check authorization
    const isLeader = request.lifeGroup.leaderId === session.user.id
    const isAdmin = ['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)

    if (!isLeader && !isAdmin) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check capacity
    if (request.lifeGroup._count.memberships >= request.lifeGroup.capacity) {
      return { success: false, error: 'Life group is full' }
    }

    // Update request and create membership in transaction
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
        update: {
          status: MembershipStatus.ACTIVE,
          leftAt: null
        },
        create: {
          lifeGroupId: request.lifeGroupId,
          userId: request.userId,
          status: MembershipStatus.ACTIVE
        }
      })
    ])

    revalidatePath('/lifegroups')
    return { success: true }
  } catch (error) {
    console.error('Approve request error:', error)
    return { success: false, error: 'Failed to approve request' }
  }
}

export async function rejectRequest(requestId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const request = await prisma.lifeGroupMemberRequest.findUnique({
      where: { id: requestId },
      include: {
        lifeGroup: {
          select: {
            leaderId: true
          }
        }
      }
    })

    if (!request) {
      return { success: false, error: 'Request not found' }
    }

    // Check authorization
    const isLeader = request.lifeGroup.leaderId === session.user.id
    const isAdmin = ['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)

    if (!isLeader && !isAdmin) {
      return { success: false, error: 'Unauthorized' }
    }

    await prisma.lifeGroupMemberRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.REJECTED,
        processedAt: new Date(),
        processedBy: session.user.id
      }
    })

    revalidatePath('/lifegroups')
    return { success: true }
  } catch (error) {
    console.error('Reject request error:', error)
    return { success: false, error: 'Failed to reject request' }
  }
}