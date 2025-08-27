export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateLocalChurch } from '../../actions'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'

export default async function EditLocalChurchPage({ params }: { params: Promise<{ id: string }> }) {
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
    include: { church: true },
  })

  if (!localChurch) {
    notFound()
  }

  const churches = await prisma.church.findMany({
    orderBy: { name: 'asc' },
  })

  const updateLocalChurchWithId = updateLocalChurch.bind(null, localChurch.id)

  return (
    <AppLayout user={user}>
      <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Edit Local Church</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Local Church Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateLocalChurchWithId} className="space-y-4">
            <div>
              <Label htmlFor="churchId">Parent Church *</Label>
              <select
                id="churchId"
                name="churchId"
                required
                defaultValue={localChurch.churchId}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                {churches.map((church) => (
                  <option key={church.id} value={church.id}>
                    {church.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={localChurch.name}
                placeholder="e.g., HPCI Manila"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={localChurch.city || ''}
                  placeholder="e.g., Manila"
                />
              </div>

              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  name="state"
                  defaultValue={localChurch.state || ''}
                  placeholder="e.g., NCR"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                defaultValue={localChurch.address || ''}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  defaultValue={localChurch.zipCode || ''}
                  placeholder="e.g., 1000"
                />
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  defaultValue={localChurch.country || ''}
                  placeholder="e.g., Philippines"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={localChurch.phone || ''}
                  placeholder="e.g., +63 2 1234 5678"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={localChurch.email || ''}
                  placeholder="e.g., manila@hpci.org"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit">Update Local Church</Button>
              <Link href="/super/local-churches">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </AppLayout>
  )
}