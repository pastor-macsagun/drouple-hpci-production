export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { 
  NativeCard, 
  NativeCardContent, 
  NativeCardHeader, 
  NativeCardTitle,
  NativeButton
} from '@/components/ui/native'
import { 
  Users, UserCheck, Calendar,
  Activity, Download 
} from 'lucide-react'
import Link from 'next/link'

export default async function ReportsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!['ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/dashboard')
  }

  return (
    <AppLayout user={session.user}>
      <PageHeader
        title="Reports & Analytics"
        description="Church performance metrics and insights"
      />
      
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <NativeCard>
            <NativeCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <NativeCardTitle className="text-sm font-medium">
                Total Members
              </NativeCardTitle>
              <Users className="h-4 w-4 text-ink-muted" />
            </NativeCardHeader>
            <NativeCardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-ink-muted">Loading...</p>
            </NativeCardContent>
          </NativeCard>

          <NativeCard>
            <NativeCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <NativeCardTitle className="text-sm font-medium">
                Recent Check-ins
              </NativeCardTitle>
              <UserCheck className="h-4 w-4 text-ink-muted" />
            </NativeCardHeader>
            <NativeCardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-ink-muted">Loading...</p>
            </NativeCardContent>
          </NativeCard>

          <NativeCard>
            <NativeCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <NativeCardTitle className="text-sm font-medium">
                Upcoming Events
              </NativeCardTitle>
              <Calendar className="h-4 w-4 text-ink-muted" />
            </NativeCardHeader>
            <NativeCardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-ink-muted">Loading...</p>
            </NativeCardContent>
          </NativeCard>

          <NativeCard>
            <NativeCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <NativeCardTitle className="text-sm font-medium">
                Active LifeGroups
              </NativeCardTitle>
              <Activity className="h-4 w-4 text-ink-muted" />
            </NativeCardHeader>
            <NativeCardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-ink-muted">Loading...</p>
            </NativeCardContent>
          </NativeCard>
        </div>

        {/* Quick Actions */}
        <NativeCard>
          <NativeCardHeader>
            <NativeCardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Reports
            </NativeCardTitle>
          </NativeCardHeader>
          <NativeCardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <NativeButton asChild variant="secondary" className="w-full">
                <Link href="/admin/services">
                  Sunday Service Report
                </Link>
              </NativeButton>
              <NativeButton asChild variant="secondary" className="w-full">
                <Link href="/admin/lifegroups">
                  Life Groups Report
                </Link>
              </NativeButton>
              <NativeButton asChild variant="secondary" className="w-full">
                <Link href="/admin/pathways">
                  Pathways Progress Report
                </Link>
              </NativeButton>
            </div>
          </NativeCardContent>
        </NativeCard>
      </div>
    </AppLayout>
  )
}