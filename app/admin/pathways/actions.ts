'use server'

import { prisma } from '@/lib/prisma'
import { PathwayType } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function createPathway(data: {
  name: string
  description?: string
  type: PathwayType
  tenantId: string
  isActive?: boolean
}) {
  const pathway = await prisma.pathway.create({
    data: {
      name: data.name,
      description: data.description,
      type: data.type,
      tenantId: data.tenantId,
      isActive: data.isActive ?? true,
    },
  })

  revalidatePath('/admin/pathways')
  return pathway
}

export async function updatePathway(
  id: string,
  data: {
    name?: string
    description?: string
    type?: PathwayType
    isActive?: boolean
  }
) {
  const pathway = await prisma.pathway.update({
    where: { id },
    data,
  })

  revalidatePath('/admin/pathways')
  revalidatePath(`/admin/pathways/${id}`)
  return pathway
}

export async function deletePathway(id: string) {
  await prisma.pathway.delete({
    where: { id },
  })

  revalidatePath('/admin/pathways')
}

export async function createStep(data: {
  pathwayId: string
  name: string
  description?: string
  orderIndex: number
}) {
  const step = await prisma.pathwayStep.create({
    data,
  })

  revalidatePath('/admin/pathways')
  revalidatePath(`/admin/pathways/${data.pathwayId}/steps`)
  return step
}

export async function updateStep(
  id: string,
  data: {
    name?: string
    description?: string
    orderIndex?: number
  }
) {
  const step = await prisma.pathwayStep.update({
    where: { id },
    data,
  })

  revalidatePath('/admin/pathways')
  return step
}

export async function deleteStep(id: string) {
  const step = await prisma.pathwayStep.findUnique({
    where: { id },
    select: { pathwayId: true },
  })

  await prisma.pathwayStep.delete({
    where: { id },
  })

  if (step) {
    revalidatePath('/admin/pathways')
    revalidatePath(`/admin/pathways/${step.pathwayId}/steps`)
  }
}

export async function markStepComplete(
  stepId: string,
  userId: string,
  completedBy: string,
  notes?: string
) {
  const existing = await prisma.pathwayProgress.findFirst({
    where: { stepId, userId },
  })

  if (existing) {
    return existing
  }

  const progress = await prisma.pathwayProgress.create({
    data: {
      stepId,
      userId,
      completedBy,
      notes,
    },
  })

  revalidatePath('/admin/pathways')
  revalidatePath('/pathways')
  return progress
}

export async function enrollUser(
  userId: string,
  pathwayId: string
) {
  const existing = await prisma.pathwayEnrollment.findFirst({
    where: { userId, pathwayId },
  })

  if (existing) {
    return existing
  }

  const enrollment = await prisma.pathwayEnrollment.create({
    data: {
      userId,
      pathwayId,
    },
  })

  revalidatePath('/admin/pathways')
  revalidatePath('/pathways')
  return enrollment
}