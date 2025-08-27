'use server'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const churchSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
})

export async function createChurch(formData: FormData) {
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

  const rawData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
  }

  const validated = churchSchema.parse(rawData)

  await prisma.church.create({
    data: validated,
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: 'CREATE',
      entity: 'Church',
      entityId: '',
      meta: validated,
    },
  })

  revalidatePath('/super/churches')
  redirect('/super/churches')
}

export async function updateChurch(churchId: string, formData: FormData) {
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

  const rawData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
  }

  const validated = churchSchema.parse(rawData)

  await prisma.church.update({
    where: { id: churchId },
    data: validated,
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: 'UPDATE',
      entity: 'Church',
      entityId: churchId,
      meta: validated,
    },
  })

  revalidatePath('/super/churches')
  redirect('/super/churches')
}

export async function archiveChurch(formData: FormData) {
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

  const churchId = formData.get('churchId') as string

  // For now, we'll delete instead of archive
  // In production, you might want to add an isArchived field
  await prisma.church.delete({
    where: { id: churchId },
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: 'ARCHIVE',
      entity: 'Church',
      entityId: churchId,
    },
  })

  revalidatePath('/super/churches')
}