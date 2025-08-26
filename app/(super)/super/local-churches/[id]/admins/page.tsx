export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/app/lib/db'
import { UserRole } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { inviteAdmin, removeAdmin } from './actions'
import Link from 'next/link'
import { UserPlus, Trash2, Shield } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'

export default async function ManageAdminsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
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

  const localChurch = await db.localChurch.findUnique({
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

  const inviteAdminWithChurchId = inviteAdmin.bind(null, localChurch.id)

  return (
    <AppLayout user={user}>
      <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{localChurch.name} - Admin Management</h1>
        <p className="text-gray-600">Manage administrators for this local church</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Administrators</CardTitle>
          </CardHeader>
          <CardContent>
            {localChurch.memberships.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">No administrators assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {localChurch.memberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{membership.user.name || membership.user.email}</p>
                      <p className="text-sm text-gray-600">{membership.user.email}</p>
                      <p className="text-xs text-gray-500">Role: {membership.role}</p>
                    </div>
                    <form action={removeAdmin}>
                      <input type="hidden" name="membershipId" value={membership.id} />
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 focus-ring"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite New Administrator</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={inviteAdminWithChurchId} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="admin@example.com"
                />
                <p className="text-sm text-gray-600 mt-1">
                  If the user doesn&apos;t exist, they&apos;ll receive an invitation email
                </p>
              </div>

              <div>
                <Label htmlFor="role">Role *</Label>
                <select
                  id="role"
                  name="role"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value={UserRole.ADMIN}>Admin</option>
                  <option value={UserRole.PASTOR}>Pastor</option>
                </select>
              </div>

              <div>
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Doe"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Send Invitation
                </Button>
                <Link href="/super/local-churches">
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      </div>
    </AppLayout>
  )
}