export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { hasMinRole } from '@/lib/rbac'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  UserCheck, 
  TrendingUp, 
  CheckCircle2,
  ArrowLeft,
  Calendar,
  UserPlus,
  Activity,
  Target
} from 'lucide-react'
import { getVipAnalytics } from '@/app/actions/firsttimers'

export default async function VipReportsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!user || !hasMinRole(user.role, UserRole.ADMIN)) {
    redirect('/admin')
  }

  // Get VIP analytics data
  const analytics = await getVipAnalytics()

  return (
    <AppLayout user={user}>
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/reports">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">VIP Team Analytics</h1>
            <p className="text-ink-muted mt-1">
              Track first-timer engagement and follow-up effectiveness
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total First-Timers</CardTitle>
              <Users className="h-4 w-4 text-ink-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalFirstTimers}</div>
              <p className="text-xs text-ink-muted">
                All-time first-time visitors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gospel Shared</CardTitle>
              <UserCheck className="h-4 w-4 text-ink-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analytics.gospelSharedCount}</div>
              <p className="text-xs text-ink-muted">
                {analytics.gospelSharedRate.toFixed(1)}% completion rate
              </p>
              <Progress value={analytics.gospelSharedRate} className="mt-2 h-1" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROOTS Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-ink-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{analytics.rootsCompletedCount}</div>
              <p className="text-xs text-ink-muted">
                {analytics.rootsCompletionRate.toFixed(1)}% completion rate
              </p>
              <Progress value={analytics.rootsCompletionRate} className="mt-2 h-1" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Follow-up Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-ink-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {analytics.totalFirstTimers > 0 
                  ? ((analytics.gospelSharedCount + analytics.rootsCompletedCount) / (analytics.totalFirstTimers * 2) * 100).toFixed(1)
                  : 0}%
              </div>
              <p className="text-xs text-ink-muted">
                Overall engagement score
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Believer Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Believer Status Breakdown
              </CardTitle>
              <CardDescription>
                Distribution of first-timers by current believer status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.statusBreakdown.map((status) => (
                  <div key={status.believerStatus} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            status.believerStatus === 'COMPLETED' 
                              ? 'default' 
                              : status.believerStatus === 'INACTIVE'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-xs"
                        >
                          {status.believerStatus}
                        </Badge>
                        <span className="font-medium capitalize">
                          {status.believerStatus.toLowerCase()} Members
                        </span>
                      </div>
                      <span className="text-sm font-medium">{status._count.believerStatus}</span>
                    </div>
                    <Progress 
                      value={
                        analytics.totalFirstTimers > 0 
                          ? (status._count.believerStatus / analytics.totalFirstTimers) * 100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
              {analytics.statusBreakdown.length === 0 && (
                <p className="text-center text-ink-muted py-8">
                  No status data available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Assignment Effectiveness */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Assignment Distribution
              </CardTitle>
              <CardDescription>
                VIP team member assignment and follow-up tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Assigned</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {analytics.assignmentBreakdown.assigned}
                        </p>
                      </div>
                      <UserPlus className="h-8 w-8 text-blue-500" />
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      {analytics.totalFirstTimers > 0 
                        ? ((analytics.assignmentBreakdown.assigned / analytics.totalFirstTimers) * 100).toFixed(1)
                        : 0}% of total
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-amber-900">Unassigned</p>
                        <p className="text-2xl font-bold text-amber-600">
                          {analytics.assignmentBreakdown.unassigned}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-amber-500" />
                    </div>
                    <p className="text-xs text-amber-700 mt-2">
                      {analytics.totalFirstTimers > 0 
                        ? ((analytics.assignmentBreakdown.unassigned / analytics.totalFirstTimers) * 100).toFixed(1)
                        : 0}% of total
                    </p>
                  </div>
                </div>
                
                {analytics.assignmentBreakdown.unassigned > 0 && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-800">
                      <strong>Action Required:</strong> {analytics.assignmentBreakdown.unassigned} first-timers 
                      need VIP team assignment for proper follow-up.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights and Recommendations */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>VIP Team Insights & Recommendations</CardTitle>
            <CardDescription>
              Key observations and actionable recommendations for improving first-timer engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">Gospel Sharing Progress</h4>
                <p className="text-sm text-green-700">
                  {analytics.gospelSharedRate > 70
                    ? `Excellent work! ${analytics.gospelSharedRate.toFixed(0)}% gospel sharing rate shows effective VIP outreach.`
                    : analytics.gospelSharedRate > 40
                    ? `Good progress at ${analytics.gospelSharedRate.toFixed(0)}%. Consider training to improve gospel sharing conversations.`
                    : 'Focus needed on gospel sharing. Consider VIP team training and accountability systems.'
                  }
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">ROOTS Completion</h4>
                <p className="text-sm text-blue-700">
                  {analytics.rootsCompletionRate > 60
                    ? `Strong ${analytics.rootsCompletionRate.toFixed(0)}% ROOTS completion rate indicates effective discipleship pathway.`
                    : analytics.rootsCompletionRate > 30
                    ? `${analytics.rootsCompletionRate.toFixed(0)}% completion rate is moderate. Consider follow-up improvements.`
                    : 'Low ROOTS completion. Review pathway barriers and provide additional member support.'
                  }
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <h4 className="font-medium text-amber-900 mb-2">Assignment Strategy</h4>
                <p className="text-sm text-amber-700">
                  {analytics.assignmentBreakdown.unassigned === 0
                    ? 'Perfect! All first-timers are assigned to VIP team members for follow-up.'
                    : `${analytics.assignmentBreakdown.unassigned} unassigned first-timers need immediate VIP team assignment.`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks for VIP team management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/vip/firsttimers">
                  <Users className="h-4 w-4 mr-2" />
                  Manage First-Timers
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link href="/admin/members?filter=vip">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Manage VIP Team
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link href="/admin/reports">
                  <Calendar className="h-4 w-4 mr-2" />
                  All Reports
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}