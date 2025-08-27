'use server'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { generateTemporaryPassword } from '@/lib/password-generator'
import bcrypt from 'bcryptjs'

const inviteAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  role: z.enum([UserRole.PASTOR, UserRole.ADMIN]),
})

export async function inviteAdmin(localChurchId: string, formData: FormData): Promise<{
  success: boolean
  credentials?: { email: string; password: string }
  error?: string
}> {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const actor = await prisma.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!actor || actor.role !== UserRole.SUPER_ADMIN) {
    redirect('/forbidden')
  }

  const rawData = {
    email: formData.get('email') as string,
    name: formData.get('name') as string || undefined,
    role: formData.get('role') as UserRole,
  }

  const validated = inviteAdminSchema.parse(rawData)

  // Check if local church exists
  const localChurch = await prisma.localChurch.findUnique({
    where: { id: localChurchId },
    include: { church: true },
  })

  if (!localChurch) {
    throw new Error('Local church not found')
  }

  // Check if user already exists
  let user = await prisma.user.findUnique({
    where: { email: validated.email },
  })

  let generatedPassword: string | null = null

  if (!user) {
    // Generate temporary password
    generatedPassword = generateTemporaryPassword()
    const hashedPassword = await bcrypt.hash(generatedPassword, 12)

    // Create user with password and mustChangePassword flag
    user = await prisma.user.create({
      data: {
        email: validated.email,
        name: validated.name,
        role: validated.role,
        tenantId: localChurch.church.id,
        passwordHash: hashedPassword,
        mustChangePassword: true, // Force password change on first login
      },
    })
  } else {
    // If user exists but needs password reset, generate new password
    if (!user.passwordHash) {
      generatedPassword = generateTemporaryPassword()
      const hashedPassword = await bcrypt.hash(generatedPassword, 12)
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashedPassword,
          mustChangePassword: true,
          role: validated.role, // Update role if needed
          tenantId: localChurch.church.id, // Update tenant if needed
        },
      })
    }
  }

  // Check if membership already exists
  const existingMembership = await prisma.membership.findUnique({
    where: {
      userId_localChurchId: {
        userId: user.id,
        localChurchId: localChurchId,
      },
    },
  })

  if (!existingMembership) {
    // Create membership
    await prisma.membership.create({
      data: {
        userId: user.id,
        localChurchId: localChurchId,
        role: validated.role,
      },
    })
  } else {
    // Update role if different
    if (existingMembership.role !== validated.role) {
      await prisma.membership.update({
        where: { id: existingMembership.id },
        data: { role: validated.role },
      })
    }
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: 'GRANT_ROLE',
      entity: 'Membership',
      entityId: user.id,
      localChurchId: localChurchId,
      meta: {
        email: validated.email,
        role: validated.role,
        localChurchId: localChurchId,
        passwordGenerated: generatedPassword ? true : false,
      },
    },
  })

  revalidatePath(`/super/local-churches/${localChurchId}/admins`)
  revalidatePath('/super/local-churches')

  // Return credentials if password was generated
  if (generatedPassword) {
    return {
      success: true,
      credentials: {
        email: validated.email,
        password: generatedPassword,
      },
    }
  }

  return { success: true }
}

export async function removeAdmin(formData: FormData) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const actor = await prisma.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!actor || actor.role !== UserRole.SUPER_ADMIN) {
    redirect('/forbidden')
  }

  const membershipId = formData.get('membershipId') as string

  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: {
      user: true,
      localChurch: true,
    },
  })

  if (!membership) {
    throw new Error('Membership not found')
  }

  // Delete the membership
  await prisma.membership.delete({
    where: { id: membershipId },
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: 'REVOKE_ROLE',
      entity: 'Membership',
      entityId: membership.userId,
      localChurchId: membership.localChurchId,
      meta: {
        email: membership.user.email,
        role: membership.role,
        localChurchId: membership.localChurchId,
      },
    },
  })

  revalidatePath(`/super/local-churches/${membership.localChurchId}/admins`)
  revalidatePath('/super/local-churches')
}