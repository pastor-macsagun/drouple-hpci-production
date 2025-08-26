export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/app/lib/db'
import { enrollUserInPathway } from '@/app/lib/pathways/enrollment'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EnrollPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/login')
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!user || !user.tenantId) {
    redirect('/auth/login')
  }

  try {
    await enrollUserInPathway(user.id, id, user.tenantId)
  } catch (error) {
    console.error('Failed to enroll:', error)
  }

  redirect('/pathways')
}