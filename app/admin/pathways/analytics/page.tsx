export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasMinRole } from '@/lib/rbac'
import { UserRole } from '@prisma/client'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  BarChart3,
  ArrowLeft,
  Calendar
} from 'lucide-react'
import { getPathwayAnalytics } from '../actions'

export default async function PathwayAnalyticsPage() {
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

  // Get analytics data
  const analytics = await getPathwayAnalytics(user.tenantId!)

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  return (
    <AppLayout user={user}>
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/pathways">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pathways
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Pathway Analytics</h1>
            <p className="text-ink-muted mt-1">
              Track discipleship progress and engagement across all pathways
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
              <Users className="h-4 w-4 text-ink-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalEnrollments}</div>
              <p className="text-xs text-ink-muted">
                All-time pathway enrollments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <Clock className="h-4 w-4 text-ink-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{analytics.activeEnrollments}</div>
              <p className="text-xs text-ink-muted">
                Currently enrolled members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-ink-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analytics.completedEnrollments}</div>
              <p className="text-xs text-ink-muted">
                Finished pathways
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-ink-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{analytics.completionRate.toFixed(1)}%</div>
              <Progress value={analytics.completionRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pathway Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Enrollments by Pathway
              </CardTitle>
              <CardDescription>
                Distribution of members across different pathways
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.pathwayBreakdown.map((pathway) => (
                  <div key={pathway.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={pathway.type === 'ROOTS' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {pathway.type}
                        </Badge>
                        <span className="font-medium">{pathway.name}</span>
                      </div>
                      <span className="text-sm font-medium">{pathway._count.enrollments}</span>
                    </div>
                    <Progress 
                      value={
                        analytics.totalEnrollments > 0 
                          ? (pathway._count.enrollments / analytics.totalEnrollments) * 100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
              {analytics.pathwayBreakdown.length === 0 && (
                <p className="text-center text-ink-muted py-8">
                  No pathway data available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Completions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Recent Completions
              </CardTitle>
              <CardDescription>
                Latest pathway completions (last 30 days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.recentCompletions.length > 0 ? (
                <div className="space-y-4">
                  {analytics.recentCompletions.map((completion) => (
                    <div key={completion.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{completion.user.name || completion.user.email}</p>
                        <p className="text-sm text-ink-muted">{completion.pathway.name}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">
                          {completion.pathway.type}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-ink-muted">
                          <Calendar className="h-3 w-3" />
                          {completion.completedAt ? formatDate(completion.completedAt) : 'Recently'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-ink-muted py-8">
                  No completions in the last 30 days
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Insights */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Pathway Insights</CardTitle>
            <CardDescription>
              Key observations and recommendations for pathway management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Enrollment Trend</h4>
                <p className="text-sm text-blue-700">
                  {analytics.activeEnrollments > 0 
                    ? `${analytics.activeEnrollments} members are actively progressing through discipleship pathways.`
                    : 'Consider promoting pathway enrollment to increase discipleship engagement.'
                  }
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">Completion Success</h4>
                <p className="text-sm text-green-700">
                  {analytics.completionRate > 50
                    ? `Great job! ${analytics.completionRate.toFixed(0)}% completion rate shows effective discipleship.`
                    : 'Consider providing more support to help members complete their pathways.'
                  }
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <h4 className="font-medium text-amber-900 mb-2">Pathway Balance</h4>
                <p className="text-sm text-amber-700">
                  {analytics.pathwayBreakdown.find(p => p.type === 'ROOTS')?._count.enrollments ?? 0 > 0
                    ? 'ROOTS pathway is helping new believers get started in their faith journey.'
                    : 'Encourage new believer enrollment in ROOTS pathway during check-in.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}