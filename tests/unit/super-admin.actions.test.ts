import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserRole } from '@prisma/client'

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    church: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    localChurch: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    membership: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
    }
  }
}))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ id: 'mock-email-id' })
    }
  }))
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    randomBytes: vi.fn().mockReturnValue({
      toString: vi.fn().mockReturnValue('mock-token-hex')
    })
  }
})

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { createChurch, updateChurch, archiveChurch } from '@/app/(super)/super/churches/actions'
import { inviteAdmin } from '@/app/(super)/super/local-churches/[id]/admins/actions'

describe('SUPER_ADMIN Server Actions Tests', () => {
  const mockSuperAdmin = {
    id: 'super-user-1',
    email: 'super@test.com',
    role: UserRole.SUPER_ADMIN,
  }

  const mockAdmin = {
    id: 'admin-user-1',
    email: 'admin@test.com',
    role: UserRole.ADMIN,
  }

  const mockSession = {
    user: { email: 'super@test.com' }
  }

  const mockNonSuperSession = {
    user: { email: 'admin@test.com' }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 'test-key'
    process.env.EMAIL_FROM = 'test@example.com'
    process.env.NEXTAUTH_URL = 'http://localhost:3000'
  })

  describe('createChurch', () => {
    it('should create church with valid SUPER_ADMIN', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockSuperAdmin)
      vi.mocked(prisma.church.create).mockResolvedValue({
        id: 'church-1',
        name: 'Test Church',
        description: 'Test Description',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const formData = new FormData()
      formData.set('name', 'Test Church')
      formData.set('description', 'Test Description')

      await createChurch(formData)

      expect(prisma.church.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Church',
          description: 'Test Description'
        }
      })

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 'super-user-1',
          action: 'CREATE',
          entity: 'Church',
          entityId: '',
          meta: {
            name: 'Test Church',
            description: 'Test Description'
          }
        }
      })

      expect(redirect).toHaveBeenCalledWith('/super/churches')
    })

    it('should redirect non-SUPER_ADMIN users', async () => {
      vi.mocked(auth).mockResolvedValue(mockNonSuperSession)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdmin)
      vi.mocked(redirect).mockImplementation((path) => {
        throw new Error(`REDIRECT: ${path}`)
      })

      const formData = new FormData()
      formData.set('name', 'Test Church')
      formData.set('description', 'Test Description')

      await expect(createChurch(formData)).rejects.toThrow('REDIRECT: /forbidden')
      expect(redirect).toHaveBeenCalledWith('/forbidden')
    })

    it('should validate church name requirements', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockSuperAdmin)

      const formData = new FormData()
      formData.set('name', '') // Empty name

      await expect(createChurch(formData)).rejects.toThrow()
      expect(prisma.church.create).not.toHaveBeenCalled()
    })
  })

  describe('inviteAdmin', () => {
    const mockLocalChurch = {
      id: 'local-church-1',
      name: 'Manila Church',
      church: { id: 'church-1' }
    }

    it('should create new user and send invitation', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession)
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockSuperAdmin) // Actor lookup
        .mockResolvedValueOnce(null) // User doesn't exist

      vi.mocked(prisma.localChurch.findUnique).mockResolvedValue(mockLocalChurch)
      
      const newUser = {
        id: 'new-user-1',
        email: 'new@test.com',
        name: 'New User',
        role: UserRole.ADMIN,
        tenantId: 'church-1'
      }
      
      vi.mocked(prisma.user.create).mockResolvedValue(newUser)
      vi.mocked(prisma.membership.findUnique).mockResolvedValue(null)

      const formData = new FormData()
      formData.set('email', 'new@test.com')
      formData.set('name', 'New User')
      formData.set('role', UserRole.ADMIN)

      await inviteAdmin('local-church-1', formData)

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@test.com',
          name: 'New User',
          role: UserRole.ADMIN,
          tenantId: 'church-1',
          mustChangePassword: true,
          passwordHash: expect.any(String)
        }
      })

      expect(prisma.membership.create).toHaveBeenCalledWith({
        data: {
          userId: 'new-user-1',
          localChurchId: 'local-church-1',
          role: UserRole.ADMIN
        }
      })
      expect(prisma.auditLog.create).toHaveBeenCalled()

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 'super-user-1',
          action: 'GRANT_ROLE',
          entity: 'Membership',
          entityId: 'new-user-1',
          localChurchId: 'local-church-1',
          meta: {
            email: 'new@test.com',
            role: UserRole.ADMIN,
            localChurchId: 'local-church-1',
            passwordGenerated: true
          }
        }
      })
    })

    it('should enforce role restrictions to PASTOR or ADMIN only', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockSuperAdmin)

      const formData = new FormData()
      formData.set('email', 'test@test.com')
      formData.set('role', UserRole.MEMBER) // Invalid role

      await expect(inviteAdmin('local-church-1', formData)).rejects.toThrow()
      expect(prisma.user.create).not.toHaveBeenCalled()
    })

    it('should prevent non-SUPER_ADMIN from inviting admins', async () => {
      vi.mocked(auth).mockResolvedValue(mockNonSuperSession)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdmin)
      vi.mocked(redirect).mockImplementation((path) => {
        throw new Error(`REDIRECT: ${path}`)
      })

      const formData = new FormData()
      formData.set('email', 'test@test.com')
      formData.set('role', UserRole.ADMIN)

      await expect(inviteAdmin('local-church-1', formData)).rejects.toThrow('REDIRECT: /forbidden')
      expect(redirect).toHaveBeenCalledWith('/forbidden')
    })
  })

  describe('archiveChurch', () => {
    it('should delete church and create audit log', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockSuperAdmin)

      const formData = new FormData()
      formData.set('churchId', 'church-1')

      await archiveChurch(formData)

      expect(prisma.church.delete).toHaveBeenCalledWith({
        where: { id: 'church-1' }
      })

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 'super-user-1',
          action: 'ARCHIVE',
          entity: 'Church',
          entityId: 'church-1'
        }
      })
    })
  })
})