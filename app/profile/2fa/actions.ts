'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  generate2FASecret, 
  generateQRCodeURL, 
  generateQRCodeDataURL, 
  verify2FAToken,
  is2FAEnabled,
  is2FARequired
} from '@/lib/2fa'
import { revalidatePath } from 'next/cache'

export async function setup2FA() {
  try {
    if (!is2FAEnabled()) {
      return { success: false, error: '2FA is not enabled on this server' }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, twoFactorEnabled: true, role: true }
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    if (user.twoFactorEnabled) {
      return { success: false, error: '2FA is already enabled' }
    }

    // Generate secret and QR code
    const secret = generate2FASecret()
    const otpauthURL = generateQRCodeURL(user.email, secret)
    const qrCodeDataURL = await generateQRCodeDataURL(otpauthURL)

    // Store secret temporarily (not enabled yet)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorSecret: secret }
    })

    return {
      success: true,
      data: {
        secret,
        qrCodeDataURL,
        isRequired: is2FARequired(user.role)
      }
    }
  } catch (error) {
    console.error('Setup 2FA error:', error)
    return { success: false, error: 'Failed to setup 2FA' }
  }
}

export async function enable2FA(token: string) {
  try {
    if (!is2FAEnabled()) {
      return { success: false, error: '2FA is not enabled on this server' }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorSecret: true, twoFactorEnabled: true }
    })

    if (!user || !user.twoFactorSecret) {
      return { success: false, error: '2FA setup not completed' }
    }

    if (user.twoFactorEnabled) {
      return { success: false, error: '2FA is already enabled' }
    }

    // Verify token
    if (!verify2FAToken(token, user.twoFactorSecret)) {
      return { success: false, error: 'Invalid verification code' }
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorEnabled: true }
    })

    revalidatePath('/profile')
    return { success: true, message: '2FA has been enabled successfully' }
  } catch (error) {
    console.error('Enable 2FA error:', error)
    return { success: false, error: 'Failed to enable 2FA' }
  }
}

export async function disable2FA(token: string) {
  try {
    if (!is2FAEnabled()) {
      return { success: false, error: '2FA is not enabled on this server' }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorSecret: true, twoFactorEnabled: true, role: true }
    })

    if (!user || !user.twoFactorEnabled) {
      return { success: false, error: '2FA is not enabled' }
    }

    // Verify current token
    if (!user.twoFactorSecret || !verify2FAToken(token, user.twoFactorSecret)) {
      return { success: false, error: 'Invalid verification code' }
    }

    // Check if 2FA is required for this role
    if (is2FARequired(user.role)) {
      return { success: false, error: '2FA is required for your role and cannot be disabled' }
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        twoFactorEnabled: false,
        twoFactorSecret: null
      }
    })

    revalidatePath('/profile')
    return { success: true, message: '2FA has been disabled successfully' }
  } catch (error) {
    console.error('Disable 2FA error:', error)
    return { success: false, error: 'Failed to disable 2FA' }
  }
}

export async function get2FAStatus() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true, role: true }
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    return {
      success: true,
      data: {
        enabled: user.twoFactorEnabled,
        required: is2FARequired(user.role),
        serverEnabled: is2FAEnabled()
      }
    }
  } catch (error) {
    console.error('Get 2FA status error:', error)
    return { success: false, error: 'Failed to get 2FA status' }
  }
}