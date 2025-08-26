import { EventForm } from '../event-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { getCurrentUser } from '@/lib/rbac'
import { redirect } from 'next/navigation'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function NewEventPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  if (!([UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN] as UserRole[]).includes(user.role)) {
    redirect('/dashboard')
  }
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
          <CardTitle>Create New Event</CardTitle>
          <CardDescription>
            Create a new event for your church community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm />
        </CardContent>
      </Card>
      </div>
    </AppLayout>
  )
}