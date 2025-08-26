import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/app/lib/db'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Users, Search, Mail, Phone, Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ProfileVisibility } from '@prisma/client'

async function searchMembers(query: string, tenantId: string, userRole: string) {
  const whereClause = {
    tenantId,
    AND: [
      {
        OR: [
          { profileVisibility: ProfileVisibility.PUBLIC },
          { profileVisibility: ProfileVisibility.MEMBERS },
          ...(userRole === 'LEADER' || userRole === 'ADMIN' || userRole === 'PASTOR' || userRole === 'SUPER_ADMIN' 
            ? [{ profileVisibility: ProfileVisibility.LEADERS }] 
            : [])
        ]
      },
      query ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' as const } },
          { email: { contains: query, mode: 'insensitive' as const } },
          { city: { contains: query, mode: 'insensitive' as const } }
        ]
      } : {}
    ]
  }

  return db.user.findMany({
    where: whereClause,
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

  const members = await searchMembers(
    resolvedSearchParams.q || '', 
    session.user.tenantId!,
    session.user.role
  )

  return (
    <AppLayout user={session.user}>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Member Directory</h1>
            <p className="text-gray-600">Browse and connect with church members</p>
          </div>
          <Link href="/profile">
            <Button>Edit My Profile</Button>
          </Link>
        </div>

        <Card>
        <CardHeader>
          <form className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No members found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search criteria
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {members.map((member) => (
                <Card key={member.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        {member.image ? (
                          <Image src={member.image} alt={member.name || ''} width={48} height={48} className="rounded-full" />
                        ) : (
                          <span className="text-lg font-semibold text-gray-600">
                            {member.name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/members/${member.id}`} className="hover:underline">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {member.name || 'Unnamed Member'}
                          </h3>
                        </Link>
                        <p className="text-xs text-gray-500 capitalize">{member.role.toLowerCase()}</p>
                        
                        {member.bio && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{member.bio}</p>
                        )}
                        
                        <div className="mt-2 space-y-1">
                          {member.allowContact && member.email && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Mail className="h-3 w-3 mr-1" />
                              {member.email}
                            </div>
                          )}
                          {member.allowContact && member.phone && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Phone className="h-3 w-3 mr-1" />
                              {member.phone}
                            </div>
                          )}
                          {member.city && (
                            <div className="flex items-center text-xs text-gray-500">
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