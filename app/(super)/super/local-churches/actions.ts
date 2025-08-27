'use server'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const localChurchSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  churchId: z.string().min(1, 'Church is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
})

export async function createLocalChurch(formData: FormData) {
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
    churchId: formData.get('churchId') as string,
    address: formData.get('address') as string || undefined,
    city: formData.get('city') as string || undefined,
    state: formData.get('state') as string || undefined,
    zipCode: formData.get('zipCode') as string || undefined,
    country: formData.get('country') as string || undefined,
    phone: formData.get('phone') as string || undefined,
    email: formData.get('email') as string || undefined,
  }

  const validated = localChurchSchema.parse(rawData)

  const localChurch = await prisma.localChurch.create({
    data: validated,
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: 'CREATE',
      entity: 'LocalChurch',
      entityId: localChurch.id,
      localChurchId: localChurch.id,
      meta: validated,
    },
  })

  revalidatePath('/super/local-churches')
  redirect('/super/local-churches')
}

export async function updateLocalChurch(localChurchId: string, formData: FormData) {
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
    churchId: formData.get('churchId') as string,
    address: formData.get('address') as string || undefined,
    city: formData.get('city') as string || undefined,
    state: formData.get('state') as string || undefined,
    zipCode: formData.get('zipCode') as string || undefined,
    country: formData.get('country') as string || undefined,
    phone: formData.get('phone') as string || undefined,
    email: formData.get('email') as string || undefined,
  }

  const validated = localChurchSchema.parse(rawData)

  await prisma.localChurch.update({
    where: { id: localChurchId },
    data: validated,
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: 'UPDATE',
      entity: 'LocalChurch',
      entityId: localChurchId,
      localChurchId: localChurchId,
      meta: validated,
    },
  })

  revalidatePath('/super/local-churches')
  redirect('/super/local-churches')
}

export async function archiveLocalChurch(formData: FormData) {
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

  const localChurchId = formData.get('localChurchId') as string

  // For now, we'll delete instead of archive
  // In production, you might want to add an isArchived field
  await prisma.localChurch.delete({
    where: { id: localChurchId },
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: 'ARCHIVE',
      entity: 'LocalChurch',
      entityId: localChurchId,
      localChurchId: localChurchId,
    },
  })

  revalidatePath('/super/local-churches')
}