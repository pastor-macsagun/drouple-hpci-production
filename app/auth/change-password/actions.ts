'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { verifyPassword, hashPassword } from '@/lib/password'
import { MemberStatus } from '@prisma/client'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export async function changePassword(data: z.infer<typeof changePasswordSchema>) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const validated = changePasswordSchema.parse(data)

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        passwordHash: true,
        mustChangePassword: true,
        memberStatus: true
      }
    })

    if (!user || !user.passwordHash) {
      return { success: false, error: 'User not found' }
    }

    // Verify current password
    const isValid = await verifyPassword(validated.currentPassword, user.passwordHash)
    if (!isValid) {
      return { success: false, error: 'Current password is incorrect' }
    }

    // Hash new password
    const newPasswordHash = await hashPassword(validated.newPassword)

    // Update user password and status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
        memberStatus: user.memberStatus === MemberStatus.PENDING ? MemberStatus.ACTIVE : user.memberStatus
      }
    })

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('Change password error:', error)
    return { success: false, error: 'Failed to change password' }
  }
}