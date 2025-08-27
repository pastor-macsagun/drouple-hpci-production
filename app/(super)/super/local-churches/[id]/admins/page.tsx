export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { AdminManagement } from '@/components/super/admin-management'
import { Button } from '@/components/ui/button'

export default async function ManageAdminsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!user || user.role !== UserRole.SUPER_ADMIN) {
    redirect('/forbidden')
  }

  const localChurch = await prisma.localChurch.findUnique({
    where: { id: resolvedParams.id },
    include: {
      church: true,
      memberships: {
        where: {
          role: { in: [UserRole.PASTOR, UserRole.ADMIN] },
        },
        include: {
          user: true,
        },
      },
    },
  })

  if (!localChurch) {
    notFound()
  }

  return (
    <AppLayout user={user}>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{localChurch.name} - Admin Management</h1>
            <p className="text-gray-600">Manage administrators for this local church</p>
          </div>
          <Link href="/super/local-churches">
            <Button variant="outline">Back to Local Churches</Button>
          </Link>
        </div>

        <AdminManagement localChurch={localChurch} />
      </div>
    </AppLayout>
  )
}