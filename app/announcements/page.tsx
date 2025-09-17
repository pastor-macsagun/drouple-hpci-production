import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { getTargetedAnnouncements } from '@/app/admin/announcements/actions'
import { AnnouncementCard } from './announcement-card'


export default async function AnnouncementsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Use enhanced server action for targeted announcements
  const result = await getTargetedAnnouncements(session.user.id)
  const announcements = result.success && result.data ? result.data : []
  const isAdmin = ['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)

  // Get full user details for sidebar
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true }
  })

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Announcements"
        description="Stay updated with church news and events"
      >
        {isAdmin && (
          <Link href="/admin/announcements">
            <Button>Manage Announcements</Button>
          </Link>
        )}
      </PageHeader>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-ink-muted" />
            <h3 className="mt-2 text-sm font-medium text-ink">No announcements</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Check back later for updates
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))}
        </div>
      )}
    </AppLayout>
  )
}