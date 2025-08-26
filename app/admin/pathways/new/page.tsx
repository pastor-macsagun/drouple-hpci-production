export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/app/lib/db'
import { UserRole } from '@prisma/client'
import PathwayForm from '../pathway-form'
import { AppLayout } from '@/components/layout/app-layout'

export default async function NewPathwayPage() {
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

  return (
    <AppLayout user={user}>
      <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create Pathway</h1>
      <PathwayForm tenantId={user.tenantId!} />
      </div>
    </AppLayout>
  )
}