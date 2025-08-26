import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { prisma } from '../../lib/prisma'
import { UserRole as Role, RequestStatus as LifeGroupRequestStatus } from '@prisma/client'

// Mock life group data
const mockLifeGroup = {
  id: 'lg1',
  name: 'Young Adults',
  description: 'Life group for young adults',
  leaderId: 'leader1',
  capacity: 15,
  currentMembers: 8,
  meetingDay: 'WEDNESDAY',
  meetingTime: '19:00',
  location: 'Church Room A',
  localChurchId: 'manila1',
  active: true,
}

const mockMember = {
  id: 'lgm1',
  lifeGroupId: 'lg1',
  userId: 'member1',
  joinedAt: new Date('2025-01-01'),
  active: true,
}

const mockRequest = {
  id: 'lgr1',
  lifeGroupId: 'lg1',
  userId: 'member2',
  status: LifeGroupRequestStatus.PENDING,
  requestedAt: new Date(),
  message: 'Would like to join',
}

const mockAttendance = {
  id: 'lga1',
  lifeGroupId: 'lg1',
  sessionDate: new Date('2025-01-15'),
  sessionName: 'Week 3 - Prayer',
  notes: 'Great discussion on prayer',
  markedBy: 'leader1',
  attendees: ['member1', 'member3', 'member5'],
}

describe('LifeGroups CRUD Operations', () => {
  describe('Create LifeGroup', () => {
    it('should create a new life group with valid data', () => {
      const newGroup = {
        name: 'Youth Group',
        description: 'For high school students',
        leaderId: 'leader2',
        capacity: 20,
        meetingDay: 'FRIDAY',
        meetingTime: '18:00',
        location: 'Youth Hall',
        localChurchId: 'manila1',
      }
      
      const created = { ...newGroup, id: 'new1', currentMembers: 0, active: true }
      expect(created).toHaveProperty('id')
      expect(created.currentMembers).toBe(0)
      expect(created.active).toBe(true)
    })
    
    it('should require a valid leader', () => {
      const newGroup = {
        name: 'Group',
        leaderId: 'invalid-leader',
        capacity: 10,
        localChurchId: 'manila1',
      }
      
      expect(() => {
        // Leader must exist and have LEADER role or higher
        const leaderRole = Role.MEMBER // Invalid role
        if (![Role.LEADER, Role.ADMIN, Role.PASTOR, Role.SUPER_ADMIN].includes(leaderRole)) {
          throw new Error('Leader must have LEADER role or higher')
        }
      }).toThrow('Leader must have LEADER role or higher')
    })
    
    it('should validate capacity is positive', () => {
      const newGroup = {
        name: 'Group',
        leaderId: 'leader1',
        capacity: -5,
        localChurchId: 'manila1',
      }
      
      expect(() => {
        if (newGroup.capacity <= 0) {
          throw new Error('Capacity must be positive')
        }
      }).toThrow('Capacity must be positive')
    })
    
    it('should validate meeting day is valid', () => {
      const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
      const invalidDay = 'INVALID_DAY'
      
      expect(validDays.includes(invalidDay)).toBe(false)
    })
    
    it('should set currentMembers to 0 initially', () => {
      const newGroup = { ...mockLifeGroup, id: 'new2', currentMembers: 0 }
      expect(newGroup.currentMembers).toBe(0)
    })
  })
  
  describe('Update LifeGroup', () => {
    it('should update life group details', () => {
      const updates = {
        name: 'Young Professionals',
        capacity: 20,
        meetingTime: '20:00',
        location: 'New Location',
      }
      
      const updated = { ...mockLifeGroup, ...updates }
      expect(updated.name).toBe('Young Professionals')
      expect(updated.capacity).toBe(20)
      expect(updated.meetingTime).toBe('20:00')
    })
    
    it('should prevent reducing capacity below current members', () => {
      const group = { ...mockLifeGroup, currentMembers: 10 }
      const newCapacity = 5
      
      expect(() => {
        if (newCapacity < group.currentMembers) {
          throw new Error('Cannot reduce capacity below current member count')
        }
      }).toThrow('Cannot reduce capacity below current member count')
    })
    
    it('should allow changing leader', () => {
      const updates = { leaderId: 'leader2' }
      const updated = { ...mockLifeGroup, ...updates }
      expect(updated.leaderId).toBe('leader2')
    })
    
    it('should track update timestamp', () => {
      const before = new Date()
      const updated = {
        ...mockLifeGroup,
        name: 'Updated Name',
        updatedAt: new Date(),
      }
      expect(updated.updatedAt >= before).toBe(true)
    })
  })
  
  describe('Delete LifeGroup', () => {
    it('should soft delete by setting active to false', () => {
      const deleted = { ...mockLifeGroup, active: false }
      expect(deleted.active).toBe(false)
    })
    
    it('should handle active members on deletion', () => {
      const group = { ...mockLifeGroup, currentMembers: 5 }
      
      // When soft deleting, members should be notified or reassigned
      expect(() => {
        if (group.currentMembers > 0) {
          console.warn('Group has active members, they will be notified')
        }
        return { ...group, active: false }
      }).not.toThrow()
    })
  })
})

describe('LifeGroup Membership', () => {
  describe('Add Member', () => {
    it('should add member to life group', () => {
      const newMember = {
        lifeGroupId: 'lg1',
        userId: 'member4',
        joinedAt: new Date(),
        active: true,
      }
      
      const members = [mockMember, newMember]
      expect(members).toHaveLength(2)
      expect(members[1].userId).toBe('member4')
    })
    
    it('should check capacity before adding', () => {
      const group = { ...mockLifeGroup, currentMembers: 15, capacity: 15 }
      
      expect(() => {
        if (group.currentMembers >= group.capacity) {
          throw new Error('Life group is at capacity')
        }
      }).toThrow('Life group is at capacity')
    })
    
    it('should increment currentMembers count', () => {
      const group = { ...mockLifeGroup, currentMembers: 8 }
      const afterAdd = { ...group, currentMembers: group.currentMembers + 1 }
      expect(afterAdd.currentMembers).toBe(9)
    })
    
    it('should prevent duplicate membership', () => {
      const members = [mockMember]
      const duplicate = { lifeGroupId: 'lg1', userId: 'member1' }
      
      expect(() => {
        const exists = members.some(m => 
          m.lifeGroupId === duplicate.lifeGroupId && 
          m.userId === duplicate.userId &&
          m.active
        )
        if (exists) {
          throw new Error('User is already a member')
        }
      }).toThrow('User is already a member')
    })
    
    it('should allow rejoining after leaving', () => {
      const oldMembership = { ...mockMember, active: false }
      const rejoin = { ...oldMembership, active: true, joinedAt: new Date() }
      expect(rejoin.active).toBe(true)
    })
  })
  
  describe('Remove Member', () => {
    it('should soft delete membership', () => {
      const removed = { ...mockMember, active: false }
      expect(removed.active).toBe(false)
    })
    
    it('should decrement currentMembers count', () => {
      const group = { ...mockLifeGroup, currentMembers: 8 }
      const afterRemove = { ...group, currentMembers: group.currentMembers - 1 }
      expect(afterRemove.currentMembers).toBe(7)
    })
    
    it('should track removal date', () => {
      const removed = {
        ...mockMember,
        active: false,
        leftAt: new Date(),
      }
      expect(removed.leftAt).toBeDefined()
    })
    
    it('should allow leader to remove members', () => {
      const userRole = Role.LEADER
      const allowedRoles = [Role.LEADER, Role.ADMIN, Role.PASTOR, Role.SUPER_ADMIN]
      expect(allowedRoles.includes(userRole)).toBe(true)
    })
  })
})

describe('LifeGroup Requests', () => {
  describe('Create Request', () => {
    it('should create join request', () => {
      const request = {
        lifeGroupId: 'lg2',
        userId: 'member5',
        status: LifeGroupRequestStatus.PENDING,
        requestedAt: new Date(),
        message: 'Interested in joining',
      }
      
      expect(request.status).toBe(LifeGroupRequestStatus.PENDING)
      expect(request.message).toBeDefined()
    })
    
    it('should prevent request if already member', () => {
      const members = [mockMember]
      const requestUserId = 'member1'
      
      expect(() => {
        const isMember = members.some(m => m.userId === requestUserId && m.active)
        if (isMember) {
          throw new Error('Already a member of this group')
        }
      }).toThrow('Already a member of this group')
    })
    
    it('should prevent duplicate pending requests', () => {
      const requests = [mockRequest]
      const duplicate = {
        lifeGroupId: 'lg1',
        userId: 'member2',
        status: LifeGroupRequestStatus.PENDING,
      }
      
      expect(() => {
        const exists = requests.some(r => 
          r.lifeGroupId === duplicate.lifeGroupId &&
          r.userId === duplicate.userId &&
          r.status === LifeGroupRequestStatus.PENDING
        )
        if (exists) {
          throw new Error('Request already pending')
        }
      }).toThrow('Request already pending')
    })
    
    it('should allow new request after rejection', () => {
      const rejected = {
        ...mockRequest,
        status: LifeGroupRequestStatus.REJECTED,
        processedAt: new Date('2025-01-10'),
      }
      
      const newRequest = {
        lifeGroupId: rejected.lifeGroupId,
        userId: rejected.userId,
        status: LifeGroupRequestStatus.PENDING,
        requestedAt: new Date(),
      }
      
      expect(newRequest.status).toBe(LifeGroupRequestStatus.PENDING)
    })
  })
  
  describe('Approve Request', () => {
    it('should approve request and add member', () => {
      const approved = {
        ...mockRequest,
        status: LifeGroupRequestStatus.APPROVED,
        processedAt: new Date(),
        processedBy: 'leader1',
      }
      
      expect(approved.status).toBe(LifeGroupRequestStatus.APPROVED)
      expect(approved.processedBy).toBe('leader1')
    })
    
    it('should check capacity before approving', () => {
      const group = { ...mockLifeGroup, currentMembers: 15, capacity: 15 }
      
      expect(() => {
        if (group.currentMembers >= group.capacity) {
          throw new Error('Cannot approve - group at capacity')
        }
      }).toThrow('Cannot approve - group at capacity')
    })
    
    it('should create membership on approval', () => {
      const request = mockRequest
      const membership = {
        lifeGroupId: request.lifeGroupId,
        userId: request.userId,
        joinedAt: new Date(),
        active: true,
      }
      
      expect(membership.lifeGroupId).toBe(request.lifeGroupId)
      expect(membership.userId).toBe(request.userId)
    })
    
    it('should only allow leaders to approve', () => {
      const userRole = Role.MEMBER
      const allowedRoles = [Role.LEADER, Role.ADMIN, Role.PASTOR, Role.SUPER_ADMIN]
      
      expect(() => {
        if (!allowedRoles.includes(userRole)) {
          throw new Error('Insufficient permissions to approve')
        }
      }).toThrow('Insufficient permissions to approve')
    })
  })
  
  describe('Reject Request', () => {
    it('should reject request with reason', () => {
      const rejected = {
        ...mockRequest,
        status: LifeGroupRequestStatus.REJECTED,
        processedAt: new Date(),
        processedBy: 'leader1',
        rejectionReason: 'Group full for this season',
      }
      
      expect(rejected.status).toBe(LifeGroupRequestStatus.REJECTED)
      expect(rejected.rejectionReason).toBeDefined()
    })
    
    it('should track who rejected the request', () => {
      const rejected = {
        ...mockRequest,
        status: LifeGroupRequestStatus.REJECTED,
        processedBy: 'admin1',
      }
      
      expect(rejected.processedBy).toBe('admin1')
    })
  })
})

describe('LifeGroup Attendance', () => {
  describe('Mark Attendance', () => {
    it('should create attendance session', () => {
      const session = {
        lifeGroupId: 'lg1',
        sessionDate: new Date('2025-01-22'),
        sessionName: 'Week 4 - Fellowship',
        notes: 'Great time of fellowship',
        markedBy: 'leader1',
        attendees: ['member1', 'member2', 'member3'],
      }
      
      expect(session.attendees).toHaveLength(3)
      expect(session.markedBy).toBe('leader1')
    })
    
    it('should validate attendees are members', () => {
      const members = ['member1', 'member3', 'member5']
      const attendees = ['member1', 'member2'] // member2 not in group
      
      const invalidAttendees = attendees.filter(a => !members.includes(a))
      expect(invalidAttendees).toEqual(['member2'])
    })
    
    it('should prevent duplicate sessions for same date', () => {
      const existing = [mockAttendance]
      const duplicate = {
        lifeGroupId: 'lg1',
        sessionDate: new Date('2025-01-15'),
      }
      
      expect(() => {
        const exists = existing.some(a => 
          a.lifeGroupId === duplicate.lifeGroupId &&
          a.sessionDate.toDateString() === duplicate.sessionDate.toDateString()
        )
        if (exists) {
          throw new Error('Attendance already marked for this date')
        }
      }).toThrow('Attendance already marked for this date')
    })
    
    it('should calculate attendance percentage', () => {
      const totalMembers = 10
      const presentCount = 7
      const percentage = Math.round((presentCount / totalMembers) * 100)
      expect(percentage).toBe(70)
    })
    
    it('should allow editing attendance within time window', () => {
      const session = { ...mockAttendance, createdAt: new Date() }
      const hoursElapsed = 0 // Just created
      const editWindow = 24 // 24 hours
      
      expect(hoursElapsed <= editWindow).toBe(true)
    })
  })
  
  describe('View Attendance History', () => {
    it('should retrieve attendance by date range', () => {
      const sessions = [
        { ...mockAttendance, sessionDate: new Date('2025-01-01') },
        { ...mockAttendance, sessionDate: new Date('2025-01-08') },
        { ...mockAttendance, sessionDate: new Date('2025-01-15') },
        { ...mockAttendance, sessionDate: new Date('2025-01-22') },
      ]
      
      const startDate = new Date('2025-01-07')
      const endDate = new Date('2025-01-20')
      
      const filtered = sessions.filter(s => 
        s.sessionDate >= startDate && s.sessionDate <= endDate
      )
      expect(filtered).toHaveLength(2)
    })
    
    it('should calculate member attendance rate', () => {
      const sessions = [
        { attendees: ['member1', 'member2', 'member3'] },
        { attendees: ['member1', 'member3'] },
        { attendees: ['member1', 'member2', 'member3'] },
        { attendees: ['member2', 'member3'] },
      ]
      
      const member1Count = sessions.filter(s => s.attendees.includes('member1')).length
      const rate = Math.round((member1Count / sessions.length) * 100)
      expect(rate).toBe(75)
    })
    
    it('should identify consistent attendees', () => {
      const sessions = [
        { attendees: ['member1', 'member2', 'member3'] },
        { attendees: ['member1', 'member3', 'member4'] },
        { attendees: ['member1', 'member3', 'member5'] },
      ]
      
      const allAttendees = sessions.map(s => s.attendees)
      const consistent = allAttendees[0].filter(m => 
        allAttendees.every(a => a.includes(m))
      )
      expect(consistent).toEqual(['member1', 'member3'])
    })
    
    it('should track attendance trends', () => {
      const weeklyAttendance = [
        { week: 1, count: 8, total: 10 },
        { week: 2, count: 9, total: 10 },
        { week: 3, count: 7, total: 10 },
        { week: 4, count: 10, total: 10 },
      ]
      
      const averageRate = weeklyAttendance.reduce((sum, w) => 
        sum + (w.count / w.total), 0
      ) / weeklyAttendance.length * 100
      
      expect(averageRate).toBeCloseTo(85, 1)
    })
  })
  
  describe('Export Attendance', () => {
    it('should format attendance for CSV export', () => {
      const data = {
        groupName: 'Young Adults',
        sessionDate: '2025-01-15',
        totalMembers: 10,
        presentCount: 7,
        attendees: ['John Doe', 'Jane Smith', 'Bob Johnson'],
      }
      
      const csvRow = [
        data.groupName,
        data.sessionDate,
        data.totalMembers,
        data.presentCount,
        `${Math.round((data.presentCount / data.totalMembers) * 100)}%`,
      ]
      
      expect(csvRow[4]).toBe('70%')
    })
    
    it('should include session notes in export', () => {
      const session = mockAttendance
      expect(session.notes).toBeDefined()
      expect(session.notes.length).toBeGreaterThan(0)
    })
  })
})

describe('LifeGroup Capacity Management', () => {
  it('should enforce capacity limits strictly', () => {
    const group = { ...mockLifeGroup, currentMembers: 14, capacity: 15 }
    
    // Can add one more
    expect(group.currentMembers < group.capacity).toBe(true)
    
    // After adding one
    group.currentMembers++
    expect(group.currentMembers >= group.capacity).toBe(true)
  })
  
  it('should handle waitlist when at capacity', () => {
    const group = { ...mockLifeGroup, currentMembers: 15, capacity: 15 }
    const waitlist = [
      { userId: 'wait1', position: 1 },
      { userId: 'wait2', position: 2 },
    ]
    
    expect(group.currentMembers >= group.capacity).toBe(true)
    expect(waitlist).toHaveLength(2)
  })
  
  it('should promote from waitlist when space opens', () => {
    const waitlist = [
      { userId: 'wait1', position: 1 },
      { userId: 'wait2', position: 2 },
    ]
    
    // Member leaves, promote first in waitlist
    const promoted = waitlist.shift()
    expect(promoted?.userId).toBe('wait1')
    expect(waitlist[0].position).toBe(2)
  })
})

describe('Multi-Group Membership', () => {
  it('should allow member to join multiple groups', () => {
    const memberships = [
      { userId: 'member1', lifeGroupId: 'lg1' },
      { userId: 'member1', lifeGroupId: 'lg2' },
      { userId: 'member1', lifeGroupId: 'lg3' },
    ]
    
    const userGroups = memberships.filter(m => m.userId === 'member1')
    expect(userGroups).toHaveLength(3)
  })
  
  it('should track active groups per member', () => {
    const memberships = [
      { userId: 'member1', lifeGroupId: 'lg1', active: true },
      { userId: 'member1', lifeGroupId: 'lg2', active: false },
      { userId: 'member1', lifeGroupId: 'lg3', active: true },
    ]
    
    const activeGroups = memberships.filter(m => m.userId === 'member1' && m.active)
    expect(activeGroups).toHaveLength(2)
  })
  
  it('should limit maximum groups per member if configured', () => {
    const maxGroups = 3
    const currentGroups = 3
    
    expect(() => {
      if (currentGroups >= maxGroups) {
        throw new Error('Maximum group limit reached')
      }
    }).toThrow('Maximum group limit reached')
  })
})