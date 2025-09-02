import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Users, Search, Mail, Phone, Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ProfileVisibility, UserRole } from '@prisma/client'
import { getCurrentUser, CurrentUser } from '@/lib/rbac'

async function searchMembers(query: string, currentUser: NonNullable<CurrentUser>) {
  // For Super Admin, show all users across all churches
  if (currentUser.role === UserRole.SUPER_ADMIN) {
    return prisma.user.findMany({
      where: {
        AND: [
          query ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { city: { contains: query, mode: 'insensitive' } }
            ]
          } : {},
          { profileVisibility: ProfileVisibility.MEMBERS }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        phone: true,
        city: true,
        joinedAt: true,
        bio: true,
        allowContact: true,
        profileVisibility: true
      },
      orderBy: { name: 'asc' },
      take: 50
    })
  }

  // For all other roles, only show users from their local church(es)
  // Get the user's local church memberships
  const userMemberships = currentUser.memberships || []
  const localChurchIds = userMemberships.map((m) => m.localChurchId)

  if (localChurchIds.length === 0) {
    return [] // User is not a member of any local church
  }

  // Find users who are members of the same local church(es)
  return prisma.user.findMany({
    where: {
      AND: [
        {
          memberships: {
            some: {
              localChurchId: { in: localChurchIds }
            }
          }
        },
        query ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } }
          ]
        } : {},
        { profileVisibility: ProfileVisibility.MEMBERS }
      ]
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      phone: true,
      city: true,
      joinedAt: true,
      bio: true,
      allowContact: true,
      profileVisibility: true
    },
    orderBy: { name: 'asc' },
    take: 50
  })
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Get current user with memberships using the proper RBAC function
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect('/auth/signin')
  }

  // Debug session
  console.log('DEBUG Member page:', {
    userId: currentUser.id,
    tenantId: currentUser.tenantId,
    role: currentUser.role,
    memberships: currentUser.memberships?.map(m => ({ 
      localChurchId: m.localChurchId, 
      churchName: m.localChurch.name 
    })),
    query: resolvedSearchParams.q || ''
  })

  const members = await searchMembers(
    resolvedSearchParams.q || '', 
    currentUser
  )

  console.log('DEBUG Found members:', members.length)

  return (
    <AppLayout user={session.user}>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Member Directory</h1>
            <p className="text-ink-muted">Browse and connect with church members</p>
          </div>
          <Link href="/profile">
            <Button>Edit My Profile</Button>
          </Link>
        </div>

        <Card>
        <CardHeader>
          <form className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
              <Input
                name="q"
                placeholder="Search by name, email, or city..."
                defaultValue={resolvedSearchParams.q}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-ink-muted" />
              <h3 className="mt-2 text-sm font-medium text-ink">No members found</h3>
              <p className="mt-1 text-sm text-ink-muted">
                Try adjusting your search criteria
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {members.map((member) => (
                <Card key={member.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 rounded-full bg-elevated flex items-center justify-center">
                        {member.image ? (
                          <Image src={member.image} alt={member.name || ''} width={48} height={48} className="rounded-full" />
                        ) : (
                          <span className="text-lg font-semibold text-ink-muted">
                            {member.name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/members/${member.id}`} className="hover:underline">
                          <h3 className="text-sm font-medium text-ink truncate">
                            {member.name || 'Unnamed Member'}
                          </h3>
                        </Link>
                        <p className="text-xs text-ink-muted capitalize">{member.role.toLowerCase()}</p>
                        
                        {member.bio && (
                          <p className="mt-1 text-sm text-ink-muted line-clamp-2">{member.bio}</p>
                        )}
                        
                        <div className="mt-2 space-y-1">
                          {member.allowContact && member.email && (
                            <div className="flex items-center text-xs text-ink-muted">
                              <Mail className="h-3 w-3 mr-1" />
                              {member.email}
                            </div>
                          )}
                          {member.allowContact && member.phone && (
                            <div className="flex items-center text-xs text-ink-muted">
                              <Phone className="h-3 w-3 mr-1" />
                              {member.phone}
                            </div>
                          )}
                          {member.city && (
                            <div className="flex items-center text-xs text-ink-muted">
                              <MapPin className="h-3 w-3 mr-1" />
                              {member.city}
                            </div>
                          )}
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </AppLayout>
  )
}
