'use server'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/app/lib/db'
import { UserRole } from '@prisma/client'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const inviteAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  role: z.enum([UserRole.PASTOR, UserRole.ADMIN]),
})

export async function inviteAdmin(localChurchId: string, formData: FormData) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const actor = await db.user.findUnique({
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
  const localChurch = await db.localChurch.findUnique({
    where: { id: localChurchId },
    include: { church: true },
  })

  if (!localChurch) {
    throw new Error('Local church not found')
  }

  // Check if user already exists
  let user = await db.user.findUnique({
    where: { email: validated.email },
  })

  if (!user) {
    // Create user stub
    user = await db.user.create({
      data: {
        email: validated.email,
        name: validated.name,
        role: validated.role,
        tenantId: localChurch.church.id,
      },
    })

    // Create verification token
    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await db.verificationToken.create({
      data: {
        identifier: validated.email,
        token,
        expires,
      },
    })

    // Send invitation email
    const inviteUrl = `${process.env.NEXTAUTH_URL}/auth/verify-request?token=${token}&email=${encodeURIComponent(validated.email)}`
    
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: validated.email,
      subject: `Invitation to join ${localChurch.name} as ${validated.role}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited!</h2>
          <p>You have been invited to join <strong>${localChurch.name}</strong> as a church ${validated.role.toLowerCase()}.</p>
          <p>Click the link below to accept the invitation and set up your account:</p>
          <p style="margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This invitation link will expire in 24 hours.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            If you did not expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    })
  }

  // Check if membership already exists
  const existingMembership = await db.membership.findUnique({
    where: {
      userId_localChurchId: {
        userId: user.id,
        localChurchId: localChurchId,
      },
    },
  })

  if (!existingMembership) {
    // Create membership
    await db.membership.create({
      data: {
        userId: user.id,
        localChurchId: localChurchId,
        role: validated.role,
      },
    })
  } else {
    // Update role if different
    if (existingMembership.role !== validated.role) {
      await db.membership.update({
        where: { id: existingMembership.id },
        data: { role: validated.role },
      })
    }
  }

  // Create audit log
  await db.auditLog.create({
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
      },
    },
  })

  revalidatePath(`/super/local-churches/${localChurchId}/admins`)
  revalidatePath('/super/local-churches')
}

export async function removeAdmin(formData: FormData) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const actor = await db.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!actor || actor.role !== UserRole.SUPER_ADMIN) {
    redirect('/forbidden')
  }

  const membershipId = formData.get('membershipId') as string

  const membership = await db.membership.findUnique({
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
  await db.membership.delete({
    where: { id: membershipId },
  })

  // Create audit log
  await db.auditLog.create({
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