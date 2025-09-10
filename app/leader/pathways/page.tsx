export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { hasMinRole } from '@/lib/rbac'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle, User, Calendar } from 'lucide-react'
import { StepVerificationForm } from './step-verification-form'

export default async function LeaderPathwaysPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!user || !hasMinRole(user.role, UserRole.LEADER)) {
    redirect('/')
  }

  // Get all pathway enrollments in the leader's church/tenant
  const enrollments = await prisma.pathwayEnrollment.findMany({
    where: {
      pathway: { tenantId: user.tenantId! },
      status: 'ENROLLED'
    },
    include: {
      user: {
        select: { name: true, email: true, id: true }
      },
      pathway: {
        include: {
          steps: {
            orderBy: { orderIndex: 'asc' },
            include: {
              progress: {
                where: { userId: { in: [] } } // Will be populated below
              }
            }
          }
        }
      }
    },
    orderBy: { enrolledAt: 'desc' }
  })

  // Get progress for all enrolled users
  const userIds = enrollments.map(e => e.userId)
  const allProgress = await prisma.pathwayProgress.findMany({
    where: {
      userId: { in: userIds },
      step: {
        pathway: { tenantId: user.tenantId! }
      }
    },
    include: {
      step: true
    }
  })

  // Organize progress by user and step
  const progressByUserStep = new Map()
  allProgress.forEach(progress => {
    const key = `${progress.userId}-${progress.stepId}`
    progressByUserStep.set(key, progress)
  })

  const enrollmentsWithProgress = enrollments.map(enrollment => {
    const steps = enrollment.pathway.steps.map(step => {
      const key = `${enrollment.userId}-${step.id}`
      const progress = progressByUserStep.get(key)
      return {
        ...step,
        completed: !!progress,
        progress: progress || null
      }
    })

    const completedSteps = steps.filter(s => s.completed).length
    const totalSteps = steps.length
    const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

    return {
      ...enrollment,
      steps,
      completedSteps,
      totalSteps,
      progressPercentage
    }
  })

  return (
    <AppLayout user={user}>
      <div className="page-container">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Pathway Leadership</h1>
            <p className="text-ink-muted mt-1">
              Verify step completion and guide members through their discipleship journey
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-ink-muted">Active Enrollments</p>
            <p className="text-2xl font-bold text-primary">{enrollments.length}</p>
          </div>
        </div>

        <div className="grid gap-6">
          {enrollmentsWithProgress.map((enrollment) => (
            <Card key={enrollment.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{enrollment.user.name || enrollment.user.email}</CardTitle>
                      <CardDescription>{enrollment.pathway.name}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={enrollment.pathway.type === 'ROOTS' ? 'default' : 'secondary'}>
                      {enrollment.pathway.type}
                    </Badge>
                    <p className="text-sm text-ink-muted mt-1">
                      {enrollment.completedSteps}/{enrollment.totalSteps} steps
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{enrollment.progressPercentage}%</span>
                  </div>
                  <Progress value={enrollment.progressPercentage} />
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {enrollment.steps.map((step) => (
                    <div key={step.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {step.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-ink-muted" />
                        )}
                        <div>
                          <p className="font-medium">{step.name}</p>
                          {step.description && (
                            <p className="text-sm text-ink-muted">{step.description}</p>
                          )}
                          {step.completed && step.progress?.completedAt && (
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-3 w-3 text-ink-muted" />
                              <p className="text-xs text-ink-muted">
                                Completed {new Date(step.progress.completedAt).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {step.completed && step.progress?.notes && (
                            <p className="text-xs text-ink-muted mt-1 italic">
                              "{step.progress.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {step.requiresAttendance && (
                          <Badge variant="outline" className="text-xs">
                            Attendance Required
                          </Badge>
                        )}
                        {!step.completed && !step.requiresAttendance && (
                          <StepVerificationForm
                            enrollmentId={enrollment.id}
                            stepId={step.id}
                            stepName={step.name}
                            userName={enrollment.user.name || enrollment.user.email}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {enrollments.length === 0 && (
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle>No Active Enrollments</CardTitle>
              <CardDescription>
                There are currently no members actively enrolled in pathways that require your verification.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}