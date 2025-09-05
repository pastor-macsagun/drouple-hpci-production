export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import NextDynamic from 'next/dynamic'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

// Lazy load pathway form to reduce initial bundle size
const PathwayForm = NextDynamic(() => import('../pathway-form'), {
  loading: () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading form...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

export default async function NewPathwayPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!user || !([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PASTOR] as UserRole[]).includes(user.role)) {
    redirect('/')
  }

  return (
    <AppLayout user={user}>
      <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create Pathway</h1>
      <PathwayForm tenantId={user.tenantId!} />
      </div>
    </AppLayout>
  )
}