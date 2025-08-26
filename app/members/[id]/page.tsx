export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/app/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, Phone, Calendar, MapPin, User as UserIcon, Shield } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ProfileVisibility } from '@prisma/client'
import { AppLayout } from '@/components/layout/app-layout'
import type { User, LifeGroupMembership, LifeGroup, PathwayEnrollment, Pathway } from '@prisma/client'

type MembershipWithGroup = LifeGroupMembership & { lifeGroup: LifeGroup }
type EnrollmentWithPathway = PathwayEnrollment & { pathway: Pathway }
type MemberWithRelations = User & {
  lifeGroupMemberships?: MembershipWithGroup[]
  pathwayEnrollments?: EnrollmentWithPathway[]
}

async function getMemberProfile(memberId: string, viewerId: string, viewerRole: string, viewerTenantId: string) {
  const member = await db.user.findFirst({
    where: {
      id: memberId,
      tenantId: viewerTenantId
    },
    include: {
      lifeGroupMemberships: {
        where: { status: 'ACTIVE' },
        include: {
          lifeGroup: true
        }
      },
      pathwayEnrollments: {
        where: { status: 'ENROLLED' },
        include: {
          pathway: true
        }
      }
    }
  })

  if (!member) return null

  // Check visibility permissions
  const canView = 
    member.id === viewerId || // Own profile
    member.profileVisibility === ProfileVisibility.PUBLIC ||
    (member.profileVisibility === ProfileVisibility.MEMBERS) ||
    (member.profileVisibility === ProfileVisibility.LEADERS && 
      ['LEADER', 'ADMIN', 'PASTOR', 'SUPER_ADMIN'].includes(viewerRole))

  if (!canView) {
    return { ...member, restricted: true }
  }

  return member
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const member = await getMemberProfile(
    resolvedParams.id,
    session.user.id,
    session.user.role,
    session.user.tenantId!
  )

  if (!member) {
    notFound()
  }

  const isOwnProfile = member.id === session.user.id
  const isRestricted = 'restricted' in member && member.restricted

  return (
    <AppLayout user={session.user}>
      <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/members" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Directory
        </Link>
        {isOwnProfile && (
          <Link href="/profile">
            <Button>Edit Profile</Button>
          </Link>
        )}
      </div>

      {isRestricted ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Profile is Private</h3>
            <p className="mt-1 text-sm text-gray-500">
              This member has restricted their profile visibility
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start space-x-4">
                <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                  {member.image ? (
                    <Image src={member.image} alt={member.name || ''} width={80} height={80} className="rounded-full" />
                  ) : (
                    <UserIcon className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl">{member.name || 'Unnamed Member'}</CardTitle>
                  <p className="text-sm text-gray-500 capitalize">{member.role.toLowerCase()}</p>
                  {member.bio && (
                    <p className="mt-2 text-gray-600">{member.bio}</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-semibold">Contact Information</h3>
                  {member.allowContact ? (
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {member.email}
                      </div>
                      {member.phone && (
                        <div className="flex items-center text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {member.phone}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Contact information is private</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Personal Information</h3>
                  <div className="space-y-1 text-sm">
                    {member.dateOfBirth && (
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        Birthday: {new Date(member.dateOfBirth).toLocaleDateString()}
                      </div>
                    )}
                    {(member.city || member.address) && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {[member.address, member.city, member.zipCode].filter(Boolean).join(', ')}
                      </div>
                    )}
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Member since {new Date(member.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {member.emergencyContact && isOwnProfile && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Emergency Contact</h3>
                  <div className="text-sm text-gray-600">
                    <p>{member.emergencyContact}</p>
                    {member.emergencyPhone && <p>{member.emergencyPhone}</p>}
                  </div>
                </div>
              )}

              {'lifeGroupMemberships' in member && member.lifeGroupMemberships && member.lifeGroupMemberships.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Life Groups</h3>
                  <div className="space-y-1">
                    {(member as MemberWithRelations).lifeGroupMemberships!.map((membership) => (
                      <Link
                        key={membership.id}
                        href={`/lifegroups/${membership.lifeGroupId}`}
                        className="text-sm text-blue-600 hover:underline block"
                      >
                        {membership.lifeGroup.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {'pathwayEnrollments' in member && member.pathwayEnrollments && member.pathwayEnrollments.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Pathways</h3>
                  <div className="space-y-1">
                    {(member as MemberWithRelations).pathwayEnrollments!.map((enrollment) => (
                      <div key={enrollment.id} className="text-sm text-gray-600">
                        {enrollment.pathway.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
      </div>
    </AppLayout>
  )
}