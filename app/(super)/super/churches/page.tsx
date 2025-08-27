export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Building2, Plus, Edit, Archive } from 'lucide-react'
import { archiveChurch } from './actions'
import { AppLayout } from '@/components/layout/app-layout'

export default async function SuperChurchesPage() {
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

  const churches = await prisma.church.findMany({
    include: {
      localChurches: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <AppLayout user={user}>
      <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Churches</h1>
          <p className="text-gray-600">Manage church organizations</p>
        </div>
        <Link href="/super/churches/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Church
          </Button>
        </Link>
      </div>

      {churches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No churches found</p>
            <Link href="/super/churches/new">
              <Button className="mt-4">Create First Church</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {churches.map((church) => (
            <Card key={church.id}>
              <CardHeader>
                <CardTitle>{church.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {church.description || 'No description'}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  {church.localChurches.length} local{' '}
                  {church.localChurches.length === 1 ? 'church' : 'churches'}
                </p>
                <div className="flex gap-2">
                  <Link href={`/super/churches/${church.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  <form action={archiveChurch}>
                    <input type="hidden" name="churchId" value={church.id} />
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