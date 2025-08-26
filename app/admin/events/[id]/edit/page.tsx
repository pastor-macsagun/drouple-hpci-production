export const dynamic = 'force-dynamic'

import { getEventById } from '@/app/events/actions'
import { EventForm } from '../../event-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { AppLayout } from '@/components/layout/app-layout'
import { getCurrentUser } from '@/lib/rbac'
import { redirect } from 'next/navigation'
import { UserRole } from '@prisma/client'

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  if (!([UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN] as UserRole[]).includes(user.role)) {
    redirect('/dashboard')
  }
  const resolvedParams = await params
  const result = await getEventById(resolvedParams.id)
  
  if (!result.success || !result.data) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">
          {result.error || 'Event not found'}
        </div>
      </div>
    )
  }

  // Get local churches for the form
  const localChurches = await prisma.localChurch.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <AppLayout user={user}>
      <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6">
        <Link href="/admin/events">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Event</CardTitle>
          <CardDescription>
            Update event details and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm event={result.data} localChurches={localChurches} />
        </CardContent>
      </Card>
      </div>
    </AppLayout>
  )
}