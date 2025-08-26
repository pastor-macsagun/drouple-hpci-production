export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/app/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, UserCheck, Calendar,
  Activity, Download, Filter, ChevronUp, ChevronDown 
} from 'lucide-react'
import Link from 'next/link'

async function getDashboardStats(tenantId: string) {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalMembers,
    newMembers,
    activeLifeGroups,
    upcomingEvents,
    recentCheckins,
    pathwayEnrollments,
    weeklyAttendance,
    believerStatusCounts
  ] = await Promise.all([
    // Total members
    db.user.count({
      where: { tenantId, role: 'MEMBER' }
    }),
    
    // New members (last 30 days)
    db.user.count({
      where: {
        tenantId,
        role: 'MEMBER',
        createdAt: { gte: thirtyDaysAgo }
      }
    }),
    
    // Active life groups
    db.lifeGroup.count({
      where: {
        localChurch: { church: { id: tenantId } },
        isActive: true
      }
    }),
    
    // Upcoming events
    db.event.count({
      where: {
        localChurch: { church: { id: tenantId } },
        isActive: true,
        startDateTime: { gte: now }
      }
    }),
    
    // Recent check-ins (last 7 days)
    db.checkin.count({
      where: {
        service: {
          localChurch: { church: { id: tenantId } }
        },
        checkedInAt: { gte: sevenDaysAgo }
      }
    }),
    
    // Active pathway enrollments
    db.pathwayEnrollment.count({
      where: {
        pathway: { tenantId },
        status: 'ENROLLED'
      }
    }),
    
    // Weekly attendance trend
    db.checkin.groupBy({
      by: ['serviceId'],
      where: {
        service: {
          localChurch: { church: { id: tenantId } },
          date: { gte: sevenDaysAgo }
        }
      },
      _count: true
    }),
    
    // Monthly growth
    db.user.groupBy({
      by: ['createdAt'],
      where: {
        tenantId,
        createdAt: { gte: thirtyDaysAgo }
      },
      _count: true
    }),

    // New believer status counts
    db.membership.groupBy({
      by: ['believerStatus'],
      where: {
        localChurch: { church: { id: tenantId } },
        isNewBeliever: true
      },
      _count: true
    })
  ])

  // Calculate trends
  const previousWeekCheckins = await db.checkin.count({
    where: {
      service: {
        localChurch: { church: { id: tenantId } }
      },
      checkedInAt: {
        gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        lt: sevenDaysAgo
      }
    }
  })

  const attendanceChange = previousWeekCheckins > 0
    ? ((recentCheckins - previousWeekCheckins) / previousWeekCheckins * 100).toFixed(1)
    : '0'

  // Process believer status counts
  const believerStats = {
    active: 0,
    inactive: 0,
    completed: 0
  }
  
  believerStatusCounts.forEach((status: any) => {
    const key = status.believerStatus.toLowerCase() as 'active' | 'inactive' | 'completed'
    believerStats[key] = status._count
  })

  return {
    totalMembers,
    newMembers,
    activeLifeGroups,
    upcomingEvents,
    recentCheckins,
    pathwayEnrollments,
    attendanceChange,
    weeklyAttendanceAvg: weeklyAttendance.length > 0 
      ? Math.round(weeklyAttendance.reduce((sum, g) => sum + g._count, 0) / weeklyAttendance.length)
      : 0,
    believerStats
  }
}

async function getDetailedReports(tenantId: string) {
  // Get life group attendance
  const lifeGroupAttendance = await db.lifeGroupAttendance.findMany({
    where: {
      session: {
        lifeGroup: {
          localChurch: { church: { id: tenantId } }
        },
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    },
    include: {
      session: {
        include: {
          lifeGroup: true
        }
      }
    }
  })

  // Get event RSVPs
  const eventRsvps = await db.eventRsvp.findMany({
    where: {
      event: {
        localChurch: { church: { id: tenantId } },
        startDateTime: { gte: new Date() }
      }
    },
    include: {
      event: true
    }
  })

  // Group data for charts
  const lifeGroupStats = lifeGroupAttendance.reduce((acc, attendance) => {
    const groupName = attendance.session.lifeGroup.name
    if (!acc[groupName]) acc[groupName] = 0
    acc[groupName]++
    return acc
  }, {} as Record<string, number>)

  const eventStats = eventRsvps.reduce((acc, rsvp) => {
    const eventName = rsvp.event.name
    if (!acc[eventName]) acc[eventName] = { confirmed: 0, waitlist: 0 }
    if (rsvp.status === 'GOING') acc[eventName].confirmed++
    if (rsvp.status === 'WAITLIST') acc[eventName].waitlist++
    return acc
  }, {} as Record<string, { confirmed: number; waitlist: number }>)

  return { lifeGroupStats, eventStats }
}

export default async function ReportsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/dashboard')
  }

  const stats = await getDashboardStats(session.user.tenantId!)
  const { lifeGroupStats, eventStats } = await getDetailedReports(session.user.tenantId!)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-600">Church performance metrics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.newMembers} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Attendance</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentCheckins}</div>
            <div className="flex items-center text-xs">
              {parseFloat(stats.attendanceChange) > 0 ? (
                <>
                  <ChevronUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">{Math.abs(parseFloat(stats.attendanceChange))}%</span>
                </>
              ) : parseFloat(stats.attendanceChange) < 0 ? (
                <>
                  <ChevronDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">{Math.abs(parseFloat(stats.attendanceChange))}%</span>
                </>
              ) : (
                <span className="text-gray-500">No change</span>
              )}
              <span className="ml-1 text-muted-foreground">vs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Life Groups</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLifeGroups}</div>
            <p className="text-xs text-muted-foreground">
              Avg {stats.weeklyAttendanceAvg} attendees/week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pathwayEnrollments} pathway enrollments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Believers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.believerStats.active + stats.believerStats.inactive + stats.believerStats.completed}
            </div>
            <div className="text-xs space-y-1 mt-1">
              <div className="flex justify-between">
                <span className="text-green-600">Active:</span>
                <span className="font-medium">{stats.believerStats.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Inactive:</span>
                <span className="font-medium">{stats.believerStats.inactive}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">Completed:</span>
                <span className="font-medium">{stats.believerStats.completed}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Life Group Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(lifeGroupStats).slice(0, 5).map(([group, count]) => (
                <div key={group} className="flex items-center justify-between">
                  <span className="text-sm">{group}</span>
                  <span className="text-sm font-medium">{count} sessions</span>
                </div>
              ))}
              {Object.keys(lifeGroupStats).length === 0 && (
                <p className="text-sm text-gray-500">No recent attendance data</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(eventStats).slice(0, 5).map(([event, stats]) => (
                <div key={event} className="flex items-center justify-between">
                  <span className="text-sm">{event}</span>
                  <div className="flex gap-2">
                    <span className="text-sm text-green-600">{stats.confirmed} confirmed</span>
                    {stats.waitlist > 0 && (
                      <span className="text-sm text-orange-600">{stats.waitlist} waitlist</span>
                    )}
                  </div>
                </div>
              ))}
              {Object.keys(eventStats).length === 0 && (
                <p className="text-sm text-gray-500">No upcoming events with registrations</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <Link href="/admin/services">
              <Button variant="outline" className="w-full">
                Sunday Service Report
              </Button>
            </Link>
            <Link href="/admin/lifegroups">
              <Button variant="outline" className="w-full">
                Life Groups Report
              </Button>
            </Link>
            <Link href="/admin/pathways">
              <Button variant="outline" className="w-full">
                Pathways Progress Report
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}