export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/app/lib/db'
import { UserRole } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/app-layout'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function PathwaysPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/login')
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!user || !([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PASTOR] as UserRole[]).includes(user.role)) {
    redirect('/')
  }

  const pathways = await db.pathway.findMany({
    where: {
      tenantId: user.tenantId!,
    },
    include: {
      steps: {
        orderBy: { orderIndex: 'asc' },
      },
      _count: {
        select: { enrollments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <AppLayout user={user}>
      <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pathways Management</h1>
        <Button asChild>
          <Link href="/admin/pathways/new">Create Pathway</Link>
        </Button>
      </div>

      <div className="space-y-6">
        {pathways.map((pathway) => (
          <div key={pathway.id} className="border rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{pathway.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {pathway.description}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant={pathway.isActive ? 'default' : 'secondary'}>
                    {pathway.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">{pathway.type}</Badge>
                  <Badge variant="outline">
                    {pathway._count.enrollments} enrolled
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/pathways/${pathway.id}/edit`}>Edit</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/pathways/${pathway.id}/steps`}>
                    Manage Steps
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/pathways/${pathway.id}/enrollments`}>
                    View Enrollments
                  </Link>
                </Button>
              </div>
            </div>

            {pathway.steps.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Steps:</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pathway.steps.map((step) => (
                      <TableRow key={step.id}>
                        <TableCell>{step.orderIndex + 1}</TableCell>
                        <TableCell className="font-medium">{step.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {step.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ))}
      </div>

      {pathways.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No pathways created yet.</p>
        </div>
      )}
      </div>
    </AppLayout>
  )
}