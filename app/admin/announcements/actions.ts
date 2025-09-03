'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { apiLogger } from '@/lib/logger'
import { UserRole, AnnouncementScope, AnnouncementPriority } from '@prisma/client'
import { getAccessibleChurchIds } from '@/lib/rbac'

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  localChurchId: z.string().min(1, 'Church is required'),
  scope: z.nativeEnum(AnnouncementScope),
  priority: z.nativeEnum(AnnouncementPriority),
  publishedAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().default(true)
})

export async function listAnnouncements(cursor?: string) {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!([UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN] as UserRole[]).includes(session.user.role as UserRole)) {
    redirect('/dashboard')
  }

  try {
    const accessibleChurchIds = await getAccessibleChurchIds(session.user)

    const announcements = await prisma.announcement.findMany({
      where: {
        localChurch: {
          id: { in: accessibleChurchIds }
        },
        ...(cursor ? { id: { lt: cursor } } : {})
      },
      include: {
        author: {
          select: { name: true, role: true }
        },
        localChurch: {
          select: { name: true }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { publishedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 20
    })

    const hasMore = announcements.length === 20
    const nextCursor = hasMore ? announcements[announcements.length - 1].id : null

    return {
      success: true,
      data: {
        items: announcements,
        nextCursor,
        hasMore
      }
    }
  } catch (error) {
    apiLogger.error('Failed to list announcements', { error, userId: session.user.id })
    return {
      success: false,
      error: 'Failed to load announcements'
    }
  }
}

export async function getLocalChurches() {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  try {
    const accessibleChurchIds = await getAccessibleChurchIds(session.user)
    
    const churches = await prisma.localChurch.findMany({
      where: {
        id: { in: accessibleChurchIds }
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })

    return { success: true, data: churches }
  } catch (error) {
    apiLogger.error('Failed to get churches', { error, userId: session.user.id })
    return { success: false, error: 'Failed to load churches' }
  }
}

export async function createAnnouncement(formData: FormData) {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!([UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN] as UserRole[]).includes(session.user.role as UserRole)) {
    redirect('/dashboard')
  }

  const rawData = {
    title: formData.get('title') as string,
    content: formData.get('content') as string,
    localChurchId: formData.get('localChurchId') as string,
    scope: formData.get('scope') as AnnouncementScope,
    priority: formData.get('priority') as AnnouncementPriority,
    publishedAt: formData.get('publishedAt') as string || null,
    expiresAt: formData.get('expiresAt') as string || null,
    isActive: formData.get('isActive') === 'true'
  }

  try {
    const validated = announcementSchema.parse(rawData)

    // Verify church access
    const accessibleChurchIds = await getAccessibleChurchIds(session.user)
    if (!accessibleChurchIds.includes(validated.localChurchId)) {
      redirect('/admin/announcements?error=access_denied')
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: validated.title,
        content: validated.content,
        authorId: session.user.id,
        localChurchId: validated.localChurchId,
        scope: validated.scope,
        priority: validated.priority,
        publishedAt: validated.publishedAt ? new Date(validated.publishedAt) : null,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
        isActive: validated.isActive
      }
    })

    apiLogger.info('Announcement created', {
      announcementId: announcement.id,
      userId: session.user.id,
      title: announcement.title
    })

    revalidatePath('/admin/announcements')
    revalidatePath('/announcements')
    redirect('/admin/announcements')
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => e.message).join(', ')
      redirect(`/admin/announcements?error=${encodeURIComponent(errors)}`)
    }
    
    apiLogger.error('Failed to create announcement', { error, userId: session.user.id })
    redirect('/admin/announcements?error=create_failed')
  }
}

export async function updateAnnouncement(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!([UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN] as UserRole[]).includes(session.user.role as UserRole)) {
    redirect('/dashboard')
  }

  const rawData = {
    title: formData.get('title') as string,
    content: formData.get('content') as string,
    localChurchId: formData.get('localChurchId') as string,
    scope: formData.get('scope') as AnnouncementScope,
    priority: formData.get('priority') as AnnouncementPriority,
    publishedAt: formData.get('publishedAt') as string || null,
    expiresAt: formData.get('expiresAt') as string || null,
    isActive: formData.get('isActive') === 'true'
  }

  try {
    const validated = announcementSchema.parse(rawData)

    // Verify announcement exists and user has access
    const accessibleChurchIds = await getAccessibleChurchIds(session.user)

    const existingAnnouncement = await prisma.announcement.findFirst({
      where: {
        id,
        localChurch: {
          id: { in: accessibleChurchIds }
        }
      }
    })

    if (!existingAnnouncement) {
      redirect('/admin/announcements?error=not_found')
    }

    // Verify new church access
    if (!accessibleChurchIds.includes(validated.localChurchId)) {
      redirect('/admin/announcements?error=access_denied')
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        title: validated.title,
        content: validated.content,
        localChurchId: validated.localChurchId,
        scope: validated.scope,
        priority: validated.priority,
        publishedAt: validated.publishedAt ? new Date(validated.publishedAt) : null,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
        isActive: validated.isActive
      }
    })

    apiLogger.info('Announcement updated', {
      announcementId: announcement.id,
      userId: session.user.id,
      title: announcement.title
    })

    revalidatePath('/admin/announcements')
    revalidatePath('/announcements')
    redirect('/admin/announcements')
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => e.message).join(', ')
      redirect(`/admin/announcements?error=${encodeURIComponent(errors)}`)
    }
    
    apiLogger.error('Failed to update announcement', { error, userId: session.user.id })
    redirect('/admin/announcements?error=update_failed')
  }
}

export async function deleteAnnouncement(id: string) {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!([UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN] as UserRole[]).includes(session.user.role as UserRole)) {
    redirect('/dashboard')
  }

  try {
    // Verify announcement exists and user has access
    const accessibleChurchIds = await getAccessibleChurchIds(session.user)

    const existingAnnouncement = await prisma.announcement.findFirst({
      where: {
        id,
        localChurch: {
          id: { in: accessibleChurchIds }
        }
      }
    })

    if (!existingAnnouncement) {
      redirect('/admin/announcements?error=not_found')
    }

    await prisma.announcement.delete({
      where: { id }
    })

    apiLogger.info('Announcement deleted', {
      announcementId: id,
      userId: session.user.id
    })

    revalidatePath('/admin/announcements')
    revalidatePath('/announcements')
    redirect('/admin/announcements')
  } catch (error) {
    apiLogger.error('Failed to delete announcement', { error, userId: session.user.id })
    redirect('/admin/announcements?error=delete_failed')
  }
}