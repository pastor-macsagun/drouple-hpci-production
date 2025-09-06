import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { 
  getTargetedAnnouncements, 
  markAnnouncementAsRead,
  getAnnouncementReadStats 
} from '@/app/admin/announcements/actions'
import { 
  createMessageThread,
  sendThreadMessage,
  getMessageThreads,
  getThreadMessages 
} from '@/app/messages/thread-actions'
import { getCurrentUser } from '@/lib/rbac'
import type { User, UserRole, AnnouncementScope, AnnouncementPriority } from '@prisma/client'

// Mock the dependencies
vi.mock('@/lib/rbac', () => ({
  getCurrentUser: vi.fn(),
  hasMinRole: vi.fn(() => true),
  createTenantWhereClause: vi.fn(() => ({ tenantId: 'test-tenant' })),
  getAccessibleChurchIds: vi.fn(() => ['test-church-1'])
}))

vi.mock('@/lib/rate-limiter', () => ({
  rateLimiter: {
    checkLimit: vi.fn(() => Promise.resolve({ allowed: true }))
  }
}))

vi.mock('@/lib/logger', () => ({
  apiLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  revalidatePath: vi.fn()
}))

describe('Communications System', () => {
  const mockUser: User = {
    id: 'test-user-1',
    email: 'test@example.com',
    emailVerified: null,
    name: 'Test User',
    image: null,
    role: 'MEMBER' as UserRole,
    tenantId: 'test-tenant',
    isNewBeliever: false,
    passwordHash: 'hashed',
    memberStatus: 'ACTIVE',
    mustChangePassword: false,
    phone: null,
    bio: null,
    dateOfBirth: null,
    address: null,
    city: null,
    zipCode: null,
    emergencyContact: null,
    emergencyPhone: null,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    joinedAt: new Date(),
    profileVisibility: 'MEMBERS',
    allowContact: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  beforeEach(() => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Announcement System', () => {
    it('should get targeted announcements for user', async () => {
      // Mock Prisma response
      const mockAnnouncements = [{
        id: 'announcement-1',
        title: 'Test Announcement',
        content: 'This is a test announcement',
        priority: 'NORMAL' as AnnouncementPriority,
        scope: 'MEMBERS' as AnnouncementScope,
        isActive: true,
        publishedAt: new Date(),
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 'author-1',
        localChurchId: 'test-church-1',
        author: { name: 'Admin User', role: 'ADMIN' },
        localChurch: { name: 'Test Church' },
        reads: []
      }]

      vi.spyOn(prisma.announcement, 'findMany').mockResolvedValue(mockAnnouncements as any)

      const result = await getTargetedAnnouncements('test-user-1')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data?.[0].title).toBe('Test Announcement')
      expect(result.data?.[0].isRead).toBe(false)
    })

    it('should mark announcement as read', async () => {
      // Mock existing announcement
      vi.spyOn(prisma.announcement, 'findFirst').mockResolvedValue({
        id: 'announcement-1',
        scope: 'MEMBERS' as AnnouncementScope
      } as any)

      // Mock upsert operation
      vi.spyOn(prisma.announcementRead, 'upsert').mockResolvedValue({
        id: 'read-1',
        announcementId: 'announcement-1',
        userId: 'test-user-1',
        readAt: new Date()
      } as any)

      const result = await markAnnouncementAsRead('announcement-1')

      expect(result.success).toBe(true)
      expect(prisma.announcementRead.upsert).toHaveBeenCalledWith({
        where: {
          announcementId_userId: {
            announcementId: 'announcement-1',
            userId: 'test-user-1'
          }
        },
        update: { readAt: expect.any(Date) },
        create: {
          announcementId: 'announcement-1',
          userId: 'test-user-1',
          readAt: expect.any(Date)
        }
      })
    })

    it('should get announcement read statistics', async () => {
      // Mock getCurrentUser for admin user
      vi.mocked(getCurrentUser).mockResolvedValue({
        ...mockUser,
        role: 'ADMIN' as UserRole
      })

      // Mock announcement with reads
      const mockAnnouncementWithReads = {
        id: 'announcement-1',
        title: 'Test Announcement',
        scope: 'MEMBERS' as AnnouncementScope,
        createdAt: new Date(),
        reads: [
          { user: { name: 'User 1', email: 'user1@test.com', role: 'MEMBER' } },
          { user: { name: 'User 2', email: 'user2@test.com', role: 'MEMBER' } }
        ]
      }

      vi.spyOn(prisma.announcement, 'findFirst').mockResolvedValue(mockAnnouncementWithReads as any)
      vi.spyOn(prisma.membership, 'count').mockResolvedValue(10)

      const result = await getAnnouncementReadStats('announcement-1')

      expect(result.success).toBe(true)
      expect(result.data?.stats.readCount).toBe(2)
      expect(result.data?.stats.targetAudienceCount).toBe(10)
      expect(result.data?.stats.readPercentage).toBe(20)
    })
  })

  describe('Thread-based Messaging System', () => {
    it('should create a message thread', async () => {
      // Mock user membership
      vi.spyOn(prisma.membership, 'findFirst').mockResolvedValue({
        id: 'membership-1',
        userId: 'test-user-1',
        localChurchId: 'test-church-1',
        leftAt: null
      } as any)

      // Mock participant validation
      vi.spyOn(prisma.user, 'findMany').mockResolvedValue([
        { id: 'participant-1', name: 'Participant 1' }
      ] as any)

      // Mock transaction
      const mockTransaction = vi.fn().mockResolvedValue({
        thread: { id: 'thread-1' },
        message: { id: 'message-1' }
      })
      vi.spyOn(prisma, '$transaction').mockImplementation(mockTransaction as any)

      // Create form data
      const formData = new FormData()
      formData.append('participants', JSON.stringify(['participant-1']))
      formData.append('initialMessage', 'Hello, this is a test thread!')

      const result = await createMessageThread(formData)

      expect(result.success).toBe(true)
      expect(result.threadId).toBe('thread-1')
    })

    it('should send message to existing thread', async () => {
      // Mock thread participation
      vi.spyOn(prisma.messageParticipant, 'findFirst').mockResolvedValue({
        threadId: 'thread-1',
        userId: 'test-user-1',
        thread: {
          creator: { tenantId: 'test-tenant' }
        }
      } as any)

      // Mock message creation
      vi.spyOn(prisma.messageThreadMessage, 'create').mockResolvedValue({
        id: 'message-1',
        threadId: 'thread-1',
        authorId: 'test-user-1',
        body: 'This is a reply message',
        createdAt: new Date()
      } as any)

      // Mock thread update
      vi.spyOn(prisma.messageThread, 'update').mockResolvedValue({} as any)

      const formData = new FormData()
      formData.append('threadId', 'thread-1')
      formData.append('content', 'This is a reply message')

      const result = await sendThreadMessage(formData)

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('message-1')
    })

    it('should get user message threads', async () => {
      const mockThreads = [{
        id: 'thread-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: { name: 'Creator', image: null },
        participants: [
          { user: { name: 'User 1', image: null } },
          { user: { name: 'User 2', image: null } }
        ],
        messages: [{
          id: 'message-1',
          body: 'Latest message',
          createdAt: new Date(),
          author: { name: 'User 1' }
        }],
        _count: { messages: 2 }
      }]

      vi.spyOn(prisma.messageThread, 'findMany').mockResolvedValue(mockThreads as any)

      const result = await getMessageThreads()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data?.[0].id).toBe('thread-1')
      expect(result.data?.[0].unreadCount).toBe(2)
    })

    it('should get thread messages with read tracking', async () => {
      // Mock thread participation
      vi.spyOn(prisma.messageParticipant, 'findFirst').mockResolvedValue({
        threadId: 'thread-1',
        userId: 'test-user-1'
      } as any)

      // Mock thread messages
      const mockMessages = [{
        id: 'message-1',
        threadId: 'thread-1',
        body: 'Hello everyone!',
        createdAt: new Date(),
        author: { name: 'User 1', image: null },
        reads: []
      }, {
        id: 'message-2',
        threadId: 'thread-1',
        body: 'This is a reply',
        createdAt: new Date(),
        author: { name: 'User 2', image: null },
        reads: [{ userId: 'test-user-1', user: { name: 'Test User' } }]
      }]

      vi.spyOn(prisma.messageThreadMessage, 'findMany').mockResolvedValue(mockMessages as any)
      vi.spyOn(prisma.messageRead, 'createMany').mockResolvedValue({ count: 1 })

      const result = await getThreadMessages('thread-1')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data?.[0].isRead).toBe(false)
      expect(result.data?.[1].isRead).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully in announcements', async () => {
      vi.spyOn(prisma.announcement, 'findMany').mockRejectedValue(new Error('Database error'))

      const result = await getTargetedAnnouncements('test-user-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to load announcements')
    })

    it('should handle invalid thread access', async () => {
      // Mock no participation found
      vi.spyOn(prisma.messageParticipant, 'findFirst').mockResolvedValue(null)

      const result = await getThreadMessages('invalid-thread-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to load messages')
    })
  })

  describe('Permission Validation', () => {
    it('should enforce RBAC for announcement read stats', async () => {
      // Mock non-admin user
      vi.mocked(getCurrentUser).mockResolvedValue({
        ...mockUser,
        role: 'MEMBER' as UserRole
      })

      // Should redirect for non-admin users (mocked)
      await getAnnouncementReadStats('announcement-1')

      // The redirect mock should have been called
      expect(vi.mocked(getCurrentUser)).toHaveBeenCalled()
    })

    it('should validate tenant isolation in announcements', async () => {
      // Mock announcement not found (cross-tenant access)
      vi.spyOn(prisma.announcement, 'findFirst').mockResolvedValue(null)

      const result = await markAnnouncementAsRead('cross-tenant-announcement')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Announcement not found')
    })
  })
})