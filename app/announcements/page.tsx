import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, AlertCircle, Info, AlertTriangle, Clock } from 'lucide-react'
import Link from 'next/link'
import { AnnouncementPriority, AnnouncementScope } from '@prisma/client'

async function getAnnouncements(tenantId: string, userRole: string) {
  const now = new Date()
  
  // Determine which scopes the user can see
  const allowedScopes: AnnouncementScope[] = [AnnouncementScope.PUBLIC, AnnouncementScope.MEMBERS]
  if (['LEADER', 'ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(userRole)) {
    allowedScopes.push(AnnouncementScope.LEADERS)
  }
  if (['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(userRole)) {
    allowedScopes.push(AnnouncementScope.ADMINS)
  }

  return prisma.announcement.findMany({
    where: {
      localChurch: {
        church: {
          id: tenantId
        }
      },
      isActive: true,
      scope: { in: allowedScopes },
      OR: [
        { publishedAt: null },
        { publishedAt: { lte: now } }
      ],
      AND: [
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: now } }
          ]
        }
      ]
    },
    include: {
      author: {
        select: { name: true, role: true }
      },
      localChurch: {
        select: { name: true }
      }
    },
    orderBy: [
      { priority: 'desc' },
      { publishedAt: 'desc' },
      { createdAt: 'desc' }
    ]
  })
}

const priorityIcons = {
  [AnnouncementPriority.LOW]: Info,
  [AnnouncementPriority.NORMAL]: Bell,
  [AnnouncementPriority.HIGH]: AlertTriangle,
  [AnnouncementPriority.URGENT]: AlertCircle,
}

const priorityColors = {
  [AnnouncementPriority.LOW]: 'text-blue-600 bg-blue-50',
  [AnnouncementPriority.NORMAL]: 'text-gray-600 bg-gray-50',
  [AnnouncementPriority.HIGH]: 'text-orange-600 bg-orange-50',
  [AnnouncementPriority.URGENT]: 'text-red-600 bg-red-50',
}

// Removed unused scopeIcons

export default async function AnnouncementsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const announcements = await getAnnouncements(session.user.tenantId!, session.user.role)
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
          {announcements.map((announcement) => {
            const Icon = priorityIcons[announcement.priority]
            const colorClass = priorityColors[announcement.priority]
            
            return (
              <Card key={announcement.id} className="overflow-hidden">
                <div className={`h-1 ${announcement.priority === AnnouncementPriority.URGENT ? 'bg-red-500' : announcement.priority === AnnouncementPriority.HIGH ? 'bg-orange-500' : ''}`} />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl">{announcement.title}</CardTitle>
                        <div className="flex items-center gap-4 mt-1 text-sm text-ink-muted">
                          <span>By {announcement.author.name}</span>
                          <span>•</span>
                          <span>{announcement.localChurch.name}</span>
                          <span>•</span>
                          <span>{new Date(announcement.publishedAt || announcement.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${colorClass}`}>
                        {announcement.priority}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-elevated text-ink-muted">
                        {announcement.scope}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{announcement.content}</p>
                  </div>
                  
                  {announcement.expiresAt && (
                    <div className="mt-4 flex items-center text-sm text-ink-muted">
                      <Clock className="h-4 w-4 mr-1" />
                      Expires {new Date(announcement.expiresAt).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}