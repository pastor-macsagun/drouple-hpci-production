export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/app/lib/db'
import { UserRole } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Building, Plus, Edit, Archive, Users } from 'lucide-react'
import { archiveLocalChurch } from './actions'
import { AppLayout } from '@/components/layout/app-layout'

export default async function SuperLocalChurchesPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!user || user.role !== UserRole.SUPER_ADMIN) {
    redirect('/forbidden')
  }

  const localChurches = await db.localChurch.findMany({
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
      _count: {
        select: {
          memberships: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <AppLayout user={user}>
      <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Local Churches</h1>
          <p className="text-gray-600">Manage local church locations</p>
        </div>
        <Link href="/super/local-churches/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Local Church
          </Button>
        </Link>
      </div>

      {localChurches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No local churches found</p>
            <Link href="/super/local-churches/new">
              <Button className="mt-4">Create First Local Church</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {localChurches.map((localChurch) => (
            <Card key={localChurch.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{localChurch.name}</span>
                  <span className="text-sm font-normal text-gray-500">
                    {localChurch.church.name}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 mb-4">
                  <p className="text-sm text-gray-600">
                    {localChurch.city && localChurch.state 
                      ? `${localChurch.city}, ${localChurch.state}` 
                      : 'No location specified'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {localChurch._count.memberships} total members
                  </p>
                  
                  {localChurch.memberships.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-1">Leadership:</p>
                      <div className="flex flex-wrap gap-2">
                        {localChurch.memberships.map((membership) => (
                          <span
                            key={membership.id}
                            className="text-xs px-2 py-1 bg-gray-100 rounded"
                          >
                            {membership.user.name} ({membership.role})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Link href={`/super/local-churches/${localChurch.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/super/local-churches/${localChurch.id}/admins`}>
                    <Button variant="outline" size="sm">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Admins
                    </Button>
                  </Link>
                  <form action={archiveLocalChurch}>
                    <input type="hidden" name="localChurchId" value={localChurch.id} />
                    <Button 
                      type="submit" 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700 focus-ring"
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </AppLayout>
  )
}