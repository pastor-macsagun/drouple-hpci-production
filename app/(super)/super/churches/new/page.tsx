export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/app/lib/db'
import { UserRole } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createChurch } from '../actions'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'

export default async function NewChurchPage() {
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

  return (
    <AppLayout user={user}>
      <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create Church</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Church Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createChurch} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="e.g., House of Prayer Christian International"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Brief description of the church organization"
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit">Create Church</Button>
              <Link href="/super/churches">
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