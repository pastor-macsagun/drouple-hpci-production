'use server'

import { redirect } from 'next/navigation'
import { db } from '@/app/lib/db'
import { UserRole, PathwayType } from '@prisma/client'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { rateLimiters } from '@/lib/rate-limit'
import { headers } from 'next/headers'
import { getClientIp } from '@/lib/rate-limit'
import { apiLogger } from '@/lib/logger'

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
  localChurchId: z.string().min(1, 'Please select a church'),
  isNewBeliever: z.boolean().default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export async function registerMember(formData: FormData) {
  // Rate limiting check
  const headersList = await headers()
  const ip = getClientIp(headersList)
  const email = formData.get('email') as string
  
  // Check rate limit by IP
  const ipLimitKey = rateLimiters.auth.key(['register', 'ip', ip])
  const ipLimit = await rateLimiters.auth.check(ipLimitKey)
  
  if (!ipLimit.success) {
    redirect(`/register?error=rate_limit&retry=${ipLimit.reset.toISOString()}`)
  }
  
  // Check rate limit by email (prevent email enumeration attacks)
  if (email) {
    const emailLimitKey = rateLimiters.email.key(['register', 'email', email])
    const emailLimit = await rateLimiters.email.check(emailLimitKey)
    
    if (!emailLimit.success) {
      redirect(`/register?error=rate_limit&retry=${emailLimit.reset.toISOString()}`)
    }
  }

  const rawData = {
    email,
    name: formData.get('name') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
    localChurchId: formData.get('localChurchId') as string,
    isNewBeliever: formData.get('isNewBeliever') === 'true',
  }

  let validated: z.infer<typeof registerSchema>
  try {
    validated = registerSchema.parse(rawData)
  } catch (error) {
    apiLogger.warn('Registration validation failed', { error, email })
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      const errorMessage = encodeURIComponent(firstError.message)
      redirect(`/register?error=validation&message=${errorMessage}`)
    }
    redirect('/register?error=invalid_data')
  }

  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email: validated.email },
  })

  if (existingUser) {
    apiLogger.info('Registration attempted with existing email', { email: validated.email })
    redirect('/register?error=email_exists')
  }

  // Get local church details
  const localChurch = await db.localChurch.findUnique({
    where: { id: validated.localChurchId },
    include: { church: true },
  })

  if (!localChurch) {
    apiLogger.warn('Registration with invalid church', { localChurchId: validated.localChurchId })
    redirect('/register?error=invalid_church')
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(validated.password, 12)

  // Create user with password
  const user = await db.user.create({
    data: {
      email: validated.email,
      name: validated.name,
      passwordHash,
      role: UserRole.MEMBER,
      tenantId: localChurch.church.id,
      isNewBeliever: validated.isNewBeliever,
      emailVerified: new Date(), // Mark as verified since they're setting a password
    },
  })

  // Create membership
  await db.membership.create({
    data: {
      userId: user.id,
      localChurchId: validated.localChurchId,
      role: UserRole.MEMBER,
      isNewBeliever: validated.isNewBeliever,
    },
  })

  // If new believer, auto-enroll in ROOTS pathway
  if (validated.isNewBeliever) {
    const rootsPathway = await db.pathway.findFirst({
      where: {
        tenantId: localChurch.church.id,
        type: PathwayType.ROOTS,
      },
    })

    if (rootsPathway) {
      await db.pathwayEnrollment.create({
        data: {
          pathwayId: rootsPathway.id,
          userId: user.id,
        },
      })
    }
  }

  apiLogger.info('New member registered', {
    userId: user.id,
    email: validated.email,
    localChurchId: validated.localChurchId,
    isNewBeliever: validated.isNewBeliever
  })

  // Redirect to sign in page with success message
  redirect('/auth/signin?registered=true')
}