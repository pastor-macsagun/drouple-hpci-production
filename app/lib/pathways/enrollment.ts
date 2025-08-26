import { db } from '@/app/lib/db'
import { PathwayType, EnrollmentStatus } from '@prisma/client'

export async function enrollUserInPathway(
  userId: string,
  pathwayId: string,
  tenantId: string
) {
  const pathway = await db.pathway.findFirst({
    where: {
      id: pathwayId,
      tenantId,
      isActive: true,
    },
  })

  if (!pathway) {
    throw new Error('Pathway not found')
  }

  const existingEnrollment = await db.pathwayEnrollment.findFirst({
    where: {
      pathwayId,
      userId,
    },
  })

  if (existingEnrollment) {
    return existingEnrollment
  }

  return await db.pathwayEnrollment.create({
    data: {
      pathwayId,
      userId,
      status: EnrollmentStatus.ENROLLED,
    },
  })
}

export async function autoEnrollNewBeliever(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { isNewBeliever: true, tenantId: true },
  })

  if (!user?.isNewBeliever || !user.tenantId) {
    return null
  }

  let rootsPathway = await db.pathway.findFirst({
    where: {
      type: PathwayType.ROOTS,
      tenantId: user.tenantId,
      isActive: true,
    },
  })

  if (!rootsPathway) {
    rootsPathway = await db.pathway.create({
      data: {
        type: PathwayType.ROOTS,
        name: 'ROOTS',
        description: 'Foundation course for new believers',
        tenantId: user.tenantId,
      },
    })
  }

  const existingEnrollment = await db.pathwayEnrollment.findFirst({
    where: {
      pathwayId: rootsPathway.id,
      userId,
    },
  })

  if (existingEnrollment) {
    return existingEnrollment
  }

  return await db.pathwayEnrollment.create({
    data: {
      pathwayId: rootsPathway.id,
      userId,
      status: EnrollmentStatus.ENROLLED,
    },
  })
}

export async function getUserEnrollments(userId: string) {
  return await db.pathwayEnrollment.findMany({
    where: { userId },
    include: {
      pathway: {
        include: {
          steps: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  })
}

export async function completePathway(enrollmentId: string) {
  return await db.pathwayEnrollment.update({
    where: { id: enrollmentId },
    data: {
      status: EnrollmentStatus.COMPLETED,
      completedAt: new Date(),
    },
  })
}

export async function dropPathway(enrollmentId: string) {
  return await db.pathwayEnrollment.update({
    where: { id: enrollmentId },
    data: {
      status: EnrollmentStatus.DROPPED,
      droppedAt: new Date(),
    },
  })
}