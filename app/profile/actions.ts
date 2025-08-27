'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { ProfileVisibility } from '@prisma/client'
import { apiLogger } from '@/lib/logger'

const updateProfileSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  bio: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  profileVisibility: z.nativeEnum(ProfileVisibility),
  allowContact: z.boolean()
})

export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const rawData = {
    name: formData.get('name') as string || undefined,
    phone: formData.get('phone') as string || undefined,
    dateOfBirth: formData.get('dateOfBirth') as string || undefined,
    address: formData.get('address') as string || undefined,
    city: formData.get('city') as string || undefined,
    zipCode: formData.get('zipCode') as string || undefined,
    bio: formData.get('bio') as string || undefined,
    emergencyContact: formData.get('emergencyContact') as string || undefined,
    emergencyPhone: formData.get('emergencyPhone') as string || undefined,
    profileVisibility: formData.get('profileVisibility') as ProfileVisibility,
    allowContact: formData.get('allowContact') === 'on'
  }

  const validated = updateProfileSchema.parse(rawData)

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...validated,
        dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : null
      }
    })

    apiLogger.info('Profile updated', { userId: session.user.id })
    
    revalidatePath('/profile')
    revalidatePath('/members')
    revalidatePath(`/members/${session.user.id}`)
    
    redirect('/profile?success=true')
  } catch (error) {
    apiLogger.error('Profile update failed', { error, userId: session.user.id })
    redirect('/profile?error=update_failed')
  }
}