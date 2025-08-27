export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import StepsManager from './steps-manager'
import { AppLayout } from '@/components/layout/app-layout'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PathwayStepsPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!user || !([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PASTOR] as UserRole[]).includes(user.role)) {
    redirect('/')
  }

  const pathway = await prisma.pathway.findFirst({
    where: {
      id,
      tenantId: user.tenantId!,
    },
    include: {
      steps: {
        orderBy: { orderIndex: 'asc' },
      },
    },
  })

  if (!pathway) {
    redirect('/admin/pathways')
  }

  return (
    <AppLayout user={user}>
      <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Manage Steps</h1>
      <p className="text-muted-foreground mb-6">{pathway.name}</p>
      <StepsManager pathway={pathway} />
      </div>
    </AppLayout>
  )
}