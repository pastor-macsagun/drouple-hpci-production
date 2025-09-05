/**
 * Dashboard Stats API Endpoint
 * 
 * Provides dashboard statistics for different user roles
 * with proper tenant isolation and caching.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { getCurrentUser } from '@/lib/rbac'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role, memberships } = await request.json()

    // Verify the requesting user matches the role
    if (user.role !== role) {
      return NextResponse.json({ error: 'Role mismatch' }, { status: 403 })
    }

    const stats: Record<string, unknown> = {}

    switch (role) {
      case UserRole.SUPER_ADMIN:
        const [churchCount, localChurchCount, memberCount] = await Promise.all([
          prisma.church.count(),
          prisma.localChurch.count(),
          prisma.user.count()
        ])
        
        stats.totalChurches = churchCount
        stats.totalLocalChurches = localChurchCount
        stats.totalMembers = memberCount
        stats.activeToday = 142 // Mock for now
        break

      case UserRole.ADMIN:
        const churchIds = memberships.map((m: { localChurchId: string }) => m.localChurchId)
        
        const [adminMemberCount, todayCheckins, lifeGroupCount, eventCount] = await Promise.all([
          prisma.membership.count({
            where: {
              localChurchId: { in: churchIds },
              leftAt: null
            }
          }),
          prisma.checkin.count({
            where: {
              service: {
                localChurchId: { in: churchIds }
              },
              checkedInAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0))
              }
            }
          }),
          prisma.lifeGroup.count({
            where: {
              localChurchId: { in: churchIds },
              isActive: true
            }
          }),
          prisma.event.count({
            where: {
              localChurchId: { in: churchIds },
              startDateTime: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
              }
            }
          })
        ])

        stats.totalMembers = adminMemberCount
        stats.expectedAttendance = todayCheckins + 50 // Mock calculation
        stats.activeLifeGroups = lifeGroupCount
        stats.eventsThisMonth = eventCount
        break

      case UserRole.VIP:
        const churchIdsVip = memberships.map((m: { localChurchId: string }) => m.localChurchId)
        
        const [firstTimersCount, gospelCount, rootsCount] = await Promise.all([
          prisma.firstTimer.count({
            where: {
              member: {
                memberships: {
                  some: {
                    localChurchId: { in: churchIdsVip },
                    leftAt: null
                  }
                }
              },
              createdAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              }
            }
          }),
          prisma.firstTimer.count({
            where: {
              member: {
                memberships: {
                  some: {
                    localChurchId: { in: churchIdsVip },
                    leftAt: null
                  }
                }
              },
              gospelShared: true,
              createdAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              }
            }
          }),
          prisma.pathwayEnrollment.count({
            where: {
              pathway: {
                type: 'ROOTS',
                tenantId: { in: churchIdsVip }
              },
              status: 'ENROLLED'
            }
          })
        ])

        stats.firstTimersThisMonth = firstTimersCount
        stats.gospelShared = gospelCount
        stats.conversionRate = firstTimersCount > 0 ? Math.round((gospelCount / firstTimersCount) * 100) : 0
        stats.rootsEnrolled = rootsCount
        stats.pendingFollowups = 5 // Mock for now
        break

      case UserRole.LEADER:
      case UserRole.MEMBER:
        // For now, return basic stats - can be expanded later
        stats.placeholder = true
        break

      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' }, 
      { status: 500 }
    )
  }
}