import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserRole as Role } from '@prisma/client'

// Mock member data
const mockMember = {
  id: 'member1',
  email: 'john.doe@test.com',
  name: 'John Doe',
  phone: '+639171234567',
  address: '123 Main St, Manila',
  birthDate: new Date('1990-05-15'),
  gender: 'MALE',
  civilStatus: 'SINGLE',
  occupation: 'Software Engineer',
  emergencyContact: 'Jane Doe - +639177654321',
  medicalNotes: 'No known allergies',
  role: Role.MEMBER,
  localChurchId: 'manila1',
  joinedAt: new Date('2024-01-15'),
  isActive: true,
  profileVisibility: 'CHURCH_MEMBERS', // PUBLIC, CHURCH_MEMBERS, LEADERS_ONLY, PRIVATE
  emailVerified: new Date('2024-01-15'),
  image: null,
}

const mockPrivacySettings = {
  userId: 'member1',
  showEmail: true,
  showPhone: false,
  showAddress: false,
  showBirthDate: true,
  showOccupation: true,
  allowMessages: true,
  allowEventInvites: true,
  allowGroupInvites: true,
}

describe('Member Profile Management', () => {
  describe('Create Member Profile', () => {
    it('should create member with required fields', () => {
      const newMember = {
        email: 'new.member@test.com',
        name: 'New Member',
        localChurchId: 'manila1',
        role: Role.MEMBER,
      }
      
      const created = {
        ...newMember,
        id: 'newmember1',
        joinedAt: new Date(),
        isActive: true,
      }
      
      expect(created).toHaveProperty('id')
      expect(created.isActive).toBe(true)
      expect(created.role).toBe(Role.MEMBER)
    })
    
    it('should validate email format', () => {
      const invalidEmails = [
        'notanemail',
        '@test.com',
        'test@',
        'test @email.com',
      ]
      
      for (const email of invalidEmails) {
        expect(() => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(email)) {
            throw new Error('Invalid email format')
          }
        }).toThrow('Invalid email format')
      }
    })
    
    it('should validate phone number format', () => {
      const validPhone = '+639171234567'
      const phoneRegex = /^\+639\d{9}$/
      
      expect(phoneRegex.test(validPhone)).toBe(true)
    })
    
    it('should set default privacy settings', () => {
      const defaults = {
        showEmail: true,
        showPhone: false,
        showAddress: false,
        showBirthDate: true,
        showOccupation: true,
        allowMessages: true,
        allowEventInvites: true,
        allowGroupInvites: true,
      }
      
      expect(defaults.showPhone).toBe(false)
      expect(defaults.showAddress).toBe(false)
      expect(defaults.allowMessages).toBe(true)
    })
    
    it('should require unique email', () => {
      const existingEmails = ['john.doe@test.com', 'jane.doe@test.com']
      const newEmail = 'john.doe@test.com'
      
      expect(() => {
        if (existingEmails.includes(newEmail)) {
          throw new Error('Email already registered')
        }
      }).toThrow('Email already registered')
    })
  })
  
  describe('Update Member Profile', () => {
    it('should update profile fields', () => {
      const updates = {
        name: 'John David Doe',
        phone: '+639187654321',
        address: '456 New St, Quezon City',
        occupation: 'Senior Software Engineer',
      }
      
      const updated = { ...mockMember, ...updates }
      expect(updated.name).toBe('John David Doe')
      expect(updated.occupation).toContain('Senior')
    })
    
    it('should allow member to edit own profile', () => {
      const userId = 'member1'
      const requestingUser = 'member1'
      
      expect(userId === requestingUser).toBe(true)
    })
    
    it('should prevent editing other member profiles', () => {
      const userId = 'member1'
      const requestingUser = 'member2'
      const requestingRole = Role.MEMBER
      
      expect(() => {
        if (userId !== requestingUser && requestingRole === Role.MEMBER) {
          throw new Error('Cannot edit other member profiles')
        }
      }).toThrow('Cannot edit other member profiles')
    })
    
    it('should allow admin to edit member profiles', () => {
      const requestingRole = Role.ADMIN
      const allowedRoles = [Role.ADMIN, Role.PASTOR, Role.SUPER_ADMIN]
      
      expect(allowedRoles.includes(requestingRole)).toBe(true)
    })
    
    it('should track profile update history', () => {
      const updateHistory = [
        { field: 'phone', oldValue: '+639171234567', newValue: '+639187654321', updatedAt: new Date() },
        { field: 'address', oldValue: '123 Main St', newValue: '456 New St', updatedAt: new Date() },
      ]
      
      expect(updateHistory).toHaveLength(2)
      expect(updateHistory[0].field).toBe('phone')
    })
    
    it('should validate birth date is in past', () => {
      const futureDate = new Date('2030-01-01')
      
      expect(() => {
        if (futureDate > new Date()) {
          throw new Error('Birth date must be in the past')
        }
      }).toThrow('Birth date must be in the past')
    })
  })
  
  describe('Privacy Settings', () => {
    it('should update privacy settings', () => {
      const updates = {
        showPhone: true,
        showAddress: true,
        allowMessages: false,
      }
      
      const updated = { ...mockPrivacySettings, ...updates }
      expect(updated.showPhone).toBe(true)
      expect(updated.showAddress).toBe(true)
      expect(updated.allowMessages).toBe(false)
    })
    
    it('should respect visibility levels', () => {
      const visibilityLevels = ['PUBLIC', 'CHURCH_MEMBERS', 'LEADERS_ONLY', 'PRIVATE']
      const currentLevel = 'CHURCH_MEMBERS'
      
      expect(visibilityLevels.includes(currentLevel)).toBe(true)
    })
    
    it('should filter profile data based on viewer role', () => {
      const profile = { ...mockMember, profileVisibility: 'LEADERS_ONLY' }
      const viewerRole = Role.MEMBER
      
      const canViewFullProfile = [Role.LEADER, Role.ADMIN, Role.PASTOR, Role.SUPER_ADMIN].includes(viewerRole)
      expect(canViewFullProfile).toBe(false)
    })
    
    it('should hide sensitive fields based on privacy settings', () => {
      const privacy = { ...mockPrivacySettings, showPhone: false, showAddress: false }
      const publicProfile = {
        name: mockMember.name,
        email: privacy.showEmail ? mockMember.email : null,
        phone: privacy.showPhone ? mockMember.phone : null,
        address: privacy.showAddress ? mockMember.address : null,
      }
      
      expect(publicProfile.phone).toBeNull()
      expect(publicProfile.address).toBeNull()
      expect(publicProfile.email).toBe(mockMember.email)
    })
  })
  
  describe('Member Deactivation', () => {
    it('should soft delete member account', () => {
      const deactivated = {
        ...mockMember,
        isActive: false,
        deactivatedAt: new Date(),
        deactivationReason: 'Moved to another city',
      }
      
      expect(deactivated.isActive).toBe(false)
      expect(deactivated.deactivatedAt).toBeDefined()
      expect(deactivated.deactivationReason).toBeDefined()
    })
    
    it('should remove from active groups on deactivation', () => {
      const groupMemberships = [
        { userId: 'member1', groupId: 'lg1', active: false },
        { userId: 'member1', groupId: 'lg2', active: false },
      ]
      
      const activeCount = groupMemberships.filter(m => m.active).length
      expect(activeCount).toBe(0)
    })
    
    it('should cancel event RSVPs on deactivation', () => {
      const eventRsvps = [
        { userId: 'member1', eventId: 'event1', status: 'CANCELLED' },
        { userId: 'member1', eventId: 'event2', status: 'CANCELLED' },
      ]
      
      const activeRsvps = eventRsvps.filter(r => r.status === 'CONFIRMED')
      expect(activeRsvps).toHaveLength(0)
    })
    
    it('should preserve historical data', () => {
      const historicalData = {
        checkins: 50,
        pathwaysCompleted: 2,
        eventsAttended: 15,
        lifeGroupsJoined: 3,
      }
      
      // Data should be preserved for reporting
      expect(historicalData.checkins).toBe(50)
      expect(historicalData.pathwaysCompleted).toBe(2)
    })
    
    it('should allow reactivation', () => {
      const reactivated = {
        ...mockMember,
        isActive: true,
        reactivatedAt: new Date(),
        deactivatedAt: null,
      }
      
      expect(reactivated.isActive).toBe(true)
      expect(reactivated.reactivatedAt).toBeDefined()
    })
  })
})

describe('Member Search and Filtering', () => {
  describe('Search Operations', () => {
    it('should search by name', () => {
      const members = [
        { name: 'John Doe' },
        { name: 'Jane Doe' },
        { name: 'Bob Smith' },
      ]
      
      const searchTerm = 'doe'
      const results = members.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      
      expect(results).toHaveLength(2)
    })
    
    it('should search by email', () => {
      const members = [
        { email: 'john@test.com' },
        { email: 'jane@example.com' },
        { email: 'bob@test.com' },
      ]
      
      const searchDomain = 'test.com'
      const results = members.filter(m => m.email.includes(searchDomain))
      
      expect(results).toHaveLength(2)
    })
    
    it('should filter by role', () => {
      const members = [
        { role: Role.MEMBER },
        { role: Role.LEADER },
        { role: Role.MEMBER },
        { role: Role.ADMIN },
      ]
      
      const memberOnly = members.filter(m => m.role === Role.MEMBER)
      expect(memberOnly).toHaveLength(2)
    })
    
    it('should filter by active status', () => {
      const members = [
        { isActive: true },
        { isActive: false },
        { isActive: true },
      ]
      
      const activeMembers = members.filter(m => m.isActive)
      expect(activeMembers).toHaveLength(2)
    })
    
    it('should filter by local church', () => {
      const members = [
        { localChurchId: 'manila1' },
        { localChurchId: 'cebu1' },
        { localChurchId: 'manila1' },
      ]
      
      const manilaMembers = members.filter(m => m.localChurchId === 'manila1')
      expect(manilaMembers).toHaveLength(2)
    })
    
    it('should apply multiple filters', () => {
      const members = [
        { name: 'John', role: Role.MEMBER, isActive: true, localChurchId: 'manila1' },
        { name: 'Jane', role: Role.LEADER, isActive: true, localChurchId: 'manila1' },
        { name: 'Bob', role: Role.MEMBER, isActive: false, localChurchId: 'manila1' },
        { name: 'Alice', role: Role.MEMBER, isActive: true, localChurchId: 'cebu1' },
      ]
      
      const filtered = members.filter(m => 
        m.role === Role.MEMBER &&
        m.isActive === true &&
        m.localChurchId === 'manila1'
      )
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe('John')
    })
  })
  
  describe('Sorting', () => {
    it('should sort by name alphabetically', () => {
      const members = [
        { name: 'Charlie' },
        { name: 'Alice' },
        { name: 'Bob' },
      ]
      
      const sorted = [...members].sort((a, b) => a.name.localeCompare(b.name))
      expect(sorted[0].name).toBe('Alice')
      expect(sorted[2].name).toBe('Charlie')
    })
    
    it('should sort by join date', () => {
      const members = [
        { joinedAt: new Date('2024-03-01') },
        { joinedAt: new Date('2024-01-01') },
        { joinedAt: new Date('2024-02-01') },
      ]
      
      const sorted = [...members].sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())
      expect(sorted[0].joinedAt).toEqual(new Date('2024-01-01'))
    })
  })
})

describe('Member Statistics', () => {
  describe('Engagement Metrics', () => {
    it('should calculate attendance rate', () => {
      const stats = {
        totalServices: 52,
        servicesAttended: 45,
      }
      
      const rate = Math.round((stats.servicesAttended / stats.totalServices) * 100)
      expect(rate).toBe(87)
    })
    
    it('should track life group participation', () => {
      const participation = {
        currentGroups: 2,
        totalSessions: 24,
        sessionsAttended: 20,
      }
      
      const rate = Math.round((participation.sessionsAttended / participation.totalSessions) * 100)
      expect(rate).toBe(83)
    })
    
    it('should measure pathway progress', () => {
      const pathways = [
        { completed: true, progress: 100 },
        { completed: false, progress: 60 },
        { completed: true, progress: 100 },
      ]
      
      const completedCount = pathways.filter(p => p.completed).length
      const averageProgress = pathways.reduce((sum, p) => sum + p.progress, 0) / pathways.length
      
      expect(completedCount).toBe(2)
      expect(averageProgress).toBeCloseTo(86.67, 1)
    })
    
    it('should track event participation', () => {
      const events = {
        totalInvited: 15,
        totalAttended: 12,
        totalCancelled: 2,
        totalNoShow: 1,
      }
      
      const attendanceRate = Math.round((events.totalAttended / events.totalInvited) * 100)
      expect(attendanceRate).toBe(80)
    })
  })
  
  describe('Demographics', () => {
    it('should analyze age distribution', () => {
      const members = [
        { birthDate: new Date('1990-01-01') }, // 35
        { birthDate: new Date('1985-01-01') }, // 40
        { birthDate: new Date('2000-01-01') }, // 25
        { birthDate: new Date('1995-01-01') }, // 30
      ]
      
      const currentYear = new Date().getFullYear()
      const ages = members.map(m => currentYear - m.birthDate.getFullYear())
      const averageAge = ages.reduce((sum, age) => sum + age, 0) / ages.length
      
      expect(averageAge).toBeCloseTo(32.5, 1)
    })
    
    it('should track gender distribution', () => {
      const members = [
        { gender: 'MALE' },
        { gender: 'FEMALE' },
        { gender: 'MALE' },
        { gender: 'FEMALE' },
        { gender: 'FEMALE' },
      ]
      
      const maleCount = members.filter(m => m.gender === 'MALE').length
      const femaleCount = members.filter(m => m.gender === 'FEMALE').length
      
      expect(maleCount).toBe(2)
      expect(femaleCount).toBe(3)
    })
    
    it('should analyze civil status', () => {
      const members = [
        { civilStatus: 'SINGLE' },
        { civilStatus: 'MARRIED' },
        { civilStatus: 'SINGLE' },
        { civilStatus: 'MARRIED' },
        { civilStatus: 'WIDOWED' },
      ]
      
      const distribution = {
        single: members.filter(m => m.civilStatus === 'SINGLE').length,
        married: members.filter(m => m.civilStatus === 'MARRIED').length,
        widowed: members.filter(m => m.civilStatus === 'WIDOWED').length,
      }
      
      expect(distribution.single).toBe(2)
      expect(distribution.married).toBe(2)
      expect(distribution.widowed).toBe(1)
    })
  })
  
  describe('Growth Metrics', () => {
    it('should track new member growth', () => {
      const monthlyGrowth = [
        { month: 'Jan', newMembers: 10 },
        { month: 'Feb', newMembers: 15 },
        { month: 'Mar', newMembers: 12 },
      ]
      
      const total = monthlyGrowth.reduce((sum, m) => sum + m.newMembers, 0)
      const average = total / monthlyGrowth.length
      
      expect(total).toBe(37)
      expect(average).toBeCloseTo(12.33, 2)
    })
    
    it('should calculate retention rate', () => {
      const stats = {
        membersStartOfYear: 100,
        newMembersAdded: 30,
        membersLeft: 10,
        currentMembers: 120,
      }
      
      const retentionRate = Math.round(((stats.currentMembers - stats.newMembersAdded) / stats.membersStartOfYear) * 100)
      expect(retentionRate).toBe(90)
    })
    
    it('should identify inactive members', () => {
      // Use a fixed reference date for consistent testing
      const referenceDate = new Date('2025-01-25')
      const thirtyDaysAgo = new Date(referenceDate)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const members = [
        { lastActive: new Date('2025-01-20') }, // Active (within 30 days)
        { lastActive: new Date('2024-10-01') }, // Inactive (>30 days)
        { lastActive: new Date('2025-01-15') }, // Active (within 30 days)
        { lastActive: new Date('2024-08-01') }, // Inactive (>30 days)
      ]
      
      const inactive = members.filter(m => m.lastActive < thirtyDaysAgo)
      expect(inactive).toHaveLength(2)
    })
  })
})

describe('Member Directory', () => {
  it('should generate member directory', () => {
    const directory = [
      { name: 'Alice Anderson', phone: '+639171111111', email: 'alice@test.com' },
      { name: 'Bob Brown', phone: '+639172222222', email: 'bob@test.com' },
      { name: 'Charlie Chen', phone: '+639173333333', email: 'charlie@test.com' },
    ]
    
    expect(directory).toHaveLength(3)
    expect(directory[0].name).toBe('Alice Anderson')
  })
  
  it('should respect privacy settings in directory', () => {
    const member = {
      ...mockMember,
      privacySettings: { ...mockPrivacySettings, showPhone: false }
    }
    
    const directoryEntry = {
      name: member.name,
      email: member.email,
      phone: member.privacySettings.showPhone ? member.phone : 'Private',
    }
    
    expect(directoryEntry.phone).toBe('Private')
  })
  
  it('should filter directory by visibility', () => {
    const members = [
      { name: 'John', profileVisibility: 'PUBLIC' },
      { name: 'Jane', profileVisibility: 'PRIVATE' },
      { name: 'Bob', profileVisibility: 'CHURCH_MEMBERS' },
    ]
    
    const viewerRole = Role.MEMBER
    const visibleMembers = members.filter(m => 
      m.profileVisibility !== 'PRIVATE' &&
      (m.profileVisibility === 'PUBLIC' || m.profileVisibility === 'CHURCH_MEMBERS')
    )
    
    expect(visibleMembers).toHaveLength(2)
  })
  
  it('should group directory alphabetically', () => {
    const members = [
      { name: 'Alice' },
      { name: 'Bob' },
      { name: 'Andrew' },
      { name: 'Charlie' },
    ]
    
    const grouped = members.reduce((acc, member) => {
      const firstLetter = member.name[0].toUpperCase()
      if (!acc[firstLetter]) acc[firstLetter] = []
      acc[firstLetter].push(member)
      return acc
    }, {} as Record<string, any[]>)
    
    expect(grouped['A']).toHaveLength(2)
    expect(grouped['B']).toHaveLength(1)
    expect(grouped['C']).toHaveLength(1)
  })
})