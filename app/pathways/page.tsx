export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@/app/lib/db'
import { getUserProgress } from '@/app/lib/pathways/progress'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Circle } from 'lucide-react'
import { PathwayType } from '@prisma/client'

export default async function PathwaysPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/login')
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!user) {
    redirect('/auth/login')
  }

  const progressData = await getUserProgress(user.id)

  const availablePathways = await db.pathway.findMany({
    where: {
      tenantId: user.tenantId!,
      isActive: true,
      type: { not: PathwayType.ROOTS },
    },
  })

  const enrolledPathwayIds = new Set(
    progressData.map(p => p.enrollment.pathwayId)
  )

  const unenrolledPathways = availablePathways.filter(
    p => !enrolledPathwayIds.has(p.id)
  )

  return (
    <AppLayout user={user}>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">My Pathways</h1>

        {progressData.length === 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Welcome to Pathways!</CardTitle>
              <CardDescription>
                Start your spiritual growth journey by enrolling in a pathway below.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="space-y-6">
          {progressData.map(({ enrollment, steps, progressPercentage }) => (
            <Card key={enrollment.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{enrollment.pathway.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {enrollment.pathway.description}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      enrollment.status === 'COMPLETED'
                        ? 'default'
                        : enrollment.status === 'ENROLLED'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {enrollment.status}
                  </Badge>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="mt-0.5">
                        {step.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          Step {index + 1}: {step.name}
                        </div>
                        {step.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {step.description}
                          </p>
                        )}
                        {step.completedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed on {new Date(step.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {unenrolledPathways.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Available Pathways</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {unenrolledPathways.map((pathway) => (
                <Card key={pathway.id}>
                  <CardHeader>
                    <CardTitle>{pathway.name}</CardTitle>
                    <CardDescription>{pathway.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link href={`/pathways/${pathway.id}/enroll`}>
                        Enroll Now
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}