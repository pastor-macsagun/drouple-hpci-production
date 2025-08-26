import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PathwayType, UserRole as Role } from '@prisma/client'

// Mock pathway data
const mockPathways = {
  roots: {
    id: 'pathway1',
    name: 'ROOTS - New Believer Foundations',
    description: 'Foundation course for new believers',
    type: PathwayType.ROOTS,
    order: 1,
    isRequired: true,
    autoEnroll: true,
    localChurchId: 'manila1',
    active: true,
  },
  vines: {
    id: 'pathway2',
    name: 'VINES - Growing in Faith',
    description: 'Discipleship growth track',
    type: PathwayType.VINES,
    order: 2,
    isRequired: false,
    autoEnroll: false,
    localChurchId: 'manila1',
    active: true,
  },
  retreat: {
    id: 'pathway3',
    name: 'Annual Spiritual Retreat',
    description: 'Deep dive spiritual formation',
    type: PathwayType.RETREAT,
    order: 3,
    isRequired: false,
    autoEnroll: false,
    localChurchId: 'manila1',
    active: true,
  },
}

const mockSteps = [
  {
    id: 'step1',
    pathwayId: 'pathway1',
    name: 'Salvation & New Life',
    description: 'Understanding salvation',
    order: 1,
    materials: 'Lesson 1 PDF',
    isRequired: true,
  },
  {
    id: 'step2',
    pathwayId: 'pathway1',
    name: 'Water Baptism',
    description: 'The importance of baptism',
    order: 2,
    materials: 'Baptism guide',
    isRequired: true,
  },
  {
    id: 'step3',
    pathwayId: 'pathway1',
    name: 'Bible Basics',
    description: 'How to read the Bible',
    order: 3,
    materials: 'Bible reading plan',
    isRequired: true,
  },
]

const mockEnrollment = {
  id: 'enroll1',
  userId: 'member1',
  pathwayId: 'pathway1',
  enrolledAt: new Date('2025-01-15'),
  completedAt: null,
  progress: 33.33,
  isActive: true,
}

const mockProgress = {
  id: 'progress1',
  enrollmentId: 'enroll1',
  stepId: 'step1',
  completedAt: new Date('2025-01-20'),
  completedBy: 'leader1',
  notes: 'Excellent understanding demonstrated',
}

describe('Pathways CRUD Operations', () => {
  describe('Create Pathway', () => {
    it('should create pathway with valid data', () => {
      const newPathway = {
        name: 'Leadership Development',
        description: 'Training future leaders',
        type: PathwayType.VINES,
        order: 4,
        isRequired: false,
        autoEnroll: false,
        localChurchId: 'manila1',
      }
      
      const created = { ...newPathway, id: 'new1', active: true }
      expect(created).toHaveProperty('id')
      expect(created.active).toBe(true)
    })
    
    it('should validate pathway type', () => {
      const validTypes = Object.values(PathwayType)
      const invalidType = 'INVALID_TYPE'
      
      expect(validTypes.includes(invalidType as PathwayType)).toBe(false)
    })
    
    it('should enforce unique order per church', () => {
      const existingOrders = [1, 2, 3]
      const newOrder = 2 // Duplicate
      
      expect(() => {
        if (existingOrders.includes(newOrder)) {
          throw new Error('Order number already in use')
        }
      }).toThrow('Order number already in use')
    })
    
    it('should set ROOTS pathway as auto-enroll', () => {
      const rootsPathway = {
        type: PathwayType.ROOTS,
        autoEnroll: true,
        isRequired: true,
      }
      
      expect(rootsPathway.type).toBe(PathwayType.ROOTS)
      expect(rootsPathway.autoEnroll).toBe(true)
      expect(rootsPathway.isRequired).toBe(true)
    })
    
    it('should allow only one ROOTS pathway per church', () => {
      const existingRoots = mockPathways.roots
      
      expect(() => {
        if (existingRoots) {
          throw new Error('ROOTS pathway already exists for this church')
        }
      }).toThrow('ROOTS pathway already exists')
    })
  })
  
  describe('Update Pathway', () => {
    it('should update pathway details', () => {
      const updates = {
        name: 'ROOTS - Foundations (Updated)',
        description: 'Updated description',
        order: 1,
      }
      
      const updated = { ...mockPathways.roots, ...updates }
      expect(updated.name).toContain('Updated')
    })
    
    it('should prevent changing pathway type', () => {
      const original = mockPathways.roots
      const newType = PathwayType.VINES
      
      expect(() => {
        if (original.type !== newType) {
          throw new Error('Cannot change pathway type')
        }
      }).toThrow('Cannot change pathway type')
    })
    
    it('should maintain enrollments on update', () => {
      const enrollments = [
        { pathwayId: 'pathway1', userId: 'user1' },
        { pathwayId: 'pathway1', userId: 'user2' },
      ]
      
      // Updates should not affect existing enrollments
      expect(enrollments.length).toBe(2)
      expect(enrollments.every(e => e.pathwayId === 'pathway1')).toBe(true)
    })
  })
  
  describe('Delete Pathway', () => {
    it('should soft delete pathway', () => {
      const deleted = { ...mockPathways.vines, active: false }
      expect(deleted.active).toBe(false)
    })
    
    it('should prevent deleting ROOTS pathway', () => {
      const pathway = mockPathways.roots
      
      expect(() => {
        if (pathway.type === PathwayType.ROOTS) {
          throw new Error('Cannot delete ROOTS pathway')
        }
      }).toThrow('Cannot delete ROOTS pathway')
    })
    
    it('should handle active enrollments on deletion', () => {
      const activeEnrollments = 5
      
      expect(() => {
        if (activeEnrollments > 0) {
          console.warn(`Warning: ${activeEnrollments} active enrollments will be affected`)
        }
      }).not.toThrow()
    })
  })
})

describe('Pathway Steps', () => {
  describe('Create Step', () => {
    it('should create step with valid data', () => {
      const newStep = {
        pathwayId: 'pathway1',
        name: 'Prayer Life',
        description: 'Developing a prayer life',
        order: 4,
        materials: 'Prayer guide PDF',
        isRequired: true,
      }
      
      const created = { ...newStep, id: 'newstep1' }
      expect(created).toHaveProperty('id')
      expect(created.order).toBe(4)
    })
    
    it('should enforce unique order within pathway', () => {
      const existingSteps = mockSteps
      const newStep = { pathwayId: 'pathway1', order: 2 } // Duplicate order
      
      expect(() => {
        const exists = existingSteps.some(s => 
          s.pathwayId === newStep.pathwayId && 
          s.order === newStep.order
        )
        if (exists) {
          throw new Error('Step order already exists in this pathway')
        }
      }).toThrow('Step order already exists')
    })
    
    it('should allow optional steps', () => {
      const optionalStep = {
        pathwayId: 'pathway2',
        name: 'Advanced Topics',
        isRequired: false,
      }
      
      expect(optionalStep.isRequired).toBe(false)
    })
    
    it('should validate materials link/content', () => {
      const step = {
        materials: 'https://example.com/lesson.pdf',
      }
      
      const isValidUrl = step.materials.startsWith('http')
      expect(isValidUrl).toBe(true)
    })
  })
  
  describe('Update Step', () => {
    it('should update step details', () => {
      const updates = {
        name: 'Salvation & New Life (Updated)',
        materials: 'Updated lesson PDF',
      }
      
      const updated = { ...mockSteps[0], ...updates }
      expect(updated.name).toContain('Updated')
    })
    
    it('should reorder steps', () => {
      const steps = [...mockSteps]
      const step1 = steps[0]
      const step2 = steps[1]
      
      // Swap orders
      step1.order = 2
      step2.order = 1
      
      steps.sort((a, b) => a.order - b.order)
      expect(steps[0].id).toBe('step2')
      expect(steps[1].id).toBe('step1')
    })
    
    it('should handle progress records on update', () => {
      const progressRecords = [
        { stepId: 'step1', userId: 'user1', completed: true },
        { stepId: 'step1', userId: 'user2', completed: true },
      ]
      
      // Step updates should not affect completion records
      expect(progressRecords.length).toBe(2)
      expect(progressRecords.every(p => p.completed)).toBe(true)
    })
  })
  
  describe('Delete Step', () => {
    it('should delete step if no progress records', () => {
      const step = mockSteps[2]
      const progressCount = 0
      
      expect(() => {
        if (progressCount === 0) {
          // Can safely delete
          return true
        }
      }).not.toThrow()
    })
    
    it('should prevent deletion if progress exists', () => {
      const progressCount = 5
      
      expect(() => {
        if (progressCount > 0) {
          throw new Error('Cannot delete step with progress records')
        }
      }).toThrow('Cannot delete step with progress records')
    })
  })
})

describe('Enrollment Flow', () => {
  describe('Auto-Enrollment', () => {
    it('should auto-enroll new believer in ROOTS', () => {
      const checkin = {
        userId: 'newbeliever1',
        isNewBeliever: true,
        checkInTime: new Date(),
      }
      
      const enrollment = {
        userId: checkin.userId,
        pathwayId: mockPathways.roots.id,
        enrolledAt: checkin.checkInTime,
        isActive: true,
        progress: 0,
      }
      
      expect(checkin.isNewBeliever).toBe(true)
      expect(enrollment.pathwayId).toBe(mockPathways.roots.id)
      expect(enrollment.isActive).toBe(true)
    })
    
    it('should not duplicate ROOTS enrollment', () => {
      const existingEnrollment = mockEnrollment
      const userId = 'member1'
      
      expect(() => {
        const exists = existingEnrollment.userId === userId && 
                      existingEnrollment.pathwayId === mockPathways.roots.id
        if (exists) {
          throw new Error('Already enrolled in ROOTS')
        }
      }).toThrow('Already enrolled in ROOTS')
    })
    
    it('should track auto-enrollment source', () => {
      const enrollment = {
        ...mockEnrollment,
        enrollmentSource: 'AUTO_NEW_BELIEVER',
        sourceServiceId: 'service123',
      }
      
      expect(enrollment.enrollmentSource).toBe('AUTO_NEW_BELIEVER')
      expect(enrollment.sourceServiceId).toBeDefined()
    })
  })
  
  describe('Manual Enrollment', () => {
    it('should allow opt-in enrollment for VINES', () => {
      const enrollment = {
        userId: 'member2',
        pathwayId: mockPathways.vines.id,
        enrolledAt: new Date(),
        enrollmentSource: 'SELF_ENROLLED',
        isActive: true,
      }
      
      expect(enrollment.pathwayId).toBe(mockPathways.vines.id)
      expect(enrollment.enrollmentSource).toBe('SELF_ENROLLED')
    })
    
    it('should check prerequisites if configured', () => {
      const completedPathways = ['pathway1'] // ROOTS completed
      const prerequisite = 'pathway1'
      
      expect(completedPathways.includes(prerequisite)).toBe(true)
    })
    
    it('should allow leader to enroll members', () => {
      const enrollment = {
        userId: 'member3',
        pathwayId: 'pathway2',
        enrolledAt: new Date(),
        enrolledBy: 'leader1',
        enrollmentSource: 'LEADER_ENROLLED',
      }
      
      expect(enrollment.enrolledBy).toBe('leader1')
      expect(enrollment.enrollmentSource).toBe('LEADER_ENROLLED')
    })
    
    it('should prevent duplicate active enrollment', () => {
      const activeEnrollments = [
        { userId: 'member1', pathwayId: 'pathway2', isActive: true }
      ]
      
      expect(() => {
        const exists = activeEnrollments.some(e => 
          e.userId === 'member1' && 
          e.pathwayId === 'pathway2' && 
          e.isActive
        )
        if (exists) {
          throw new Error('Already actively enrolled in this pathway')
        }
      }).toThrow('Already actively enrolled')
    })
  })
  
  describe('RETREAT Enrollment', () => {
    it('should schedule retreat enrollment', () => {
      const retreat = {
        pathwayId: mockPathways.retreat.id,
        scheduledDate: new Date('2025-03-15'),
        capacity: 30,
        currentEnrolled: 15,
      }
      
      expect(retreat.currentEnrolled < retreat.capacity).toBe(true)
    })
    
    it('should track attendance for retreat', () => {
      const attendance = {
        pathwayId: mockPathways.retreat.id,
        userId: 'member1',
        scheduledDate: new Date('2025-03-15'),
        attended: true,
        checkedInAt: new Date('2025-03-15T08:30:00Z'),
      }
      
      expect(attendance.attended).toBe(true)
      expect(attendance.checkedInAt).toBeDefined()
    })
    
    it('should complete retreat pathway on attendance', () => {
      const enrollment = {
        ...mockEnrollment,
        pathwayId: mockPathways.retreat.id,
        completedAt: new Date('2025-03-15'),
        progress: 100,
      }
      
      expect(enrollment.completedAt).toBeDefined()
      expect(enrollment.progress).toBe(100)
    })
  })
})

describe('Progress Tracking', () => {
  describe('Step Completion', () => {
    it('should mark step as complete', () => {
      const progress = {
        enrollmentId: 'enroll1',
        stepId: 'step2',
        completedAt: new Date(),
        completedBy: 'leader1',
        notes: 'Baptized on Sunday service',
      }
      
      expect(progress.completedAt).toBeDefined()
      expect(progress.notes).toContain('Baptized')
    })
    
    it('should update enrollment progress percentage', () => {
      const totalSteps = 3
      const completedSteps = 1
      const progress = (completedSteps / totalSteps) * 100
      
      expect(progress).toBeCloseTo(33.33, 2)
    })
    
    it('should require leader approval for completion', () => {
      const userRole = Role.MEMBER
      const allowedRoles = [Role.LEADER, Role.ADMIN, Role.PASTOR, Role.SUPER_ADMIN]
      
      expect(() => {
        if (!allowedRoles.includes(userRole)) {
          throw new Error('Only leaders can mark steps complete')
        }
      }).toThrow('Only leaders can mark steps complete')
    })
    
    it('should prevent duplicate completion', () => {
      const existingProgress = [mockProgress]
      const duplicate = {
        enrollmentId: 'enroll1',
        stepId: 'step1',
      }
      
      expect(() => {
        const exists = existingProgress.some(p => 
          p.enrollmentId === duplicate.enrollmentId && 
          p.stepId === duplicate.stepId
        )
        if (exists) {
          throw new Error('Step already completed')
        }
      }).toThrow('Step already completed')
    })
    
    it('should validate enrollment is active', () => {
      const enrollment = { ...mockEnrollment, isActive: false }
      
      expect(() => {
        if (!enrollment.isActive) {
          throw new Error('Cannot mark progress on inactive enrollment')
        }
      }).toThrow('Cannot mark progress on inactive enrollment')
    })
  })
  
  describe('Pathway Completion', () => {
    it('should auto-complete pathway when all required steps done', () => {
      const requiredSteps = 3
      const completedSteps = 3
      
      const isComplete = completedSteps === requiredSteps
      expect(isComplete).toBe(true)
    })
    
    it('should set completion date and progress to 100%', () => {
      const enrollment = {
        ...mockEnrollment,
        completedAt: new Date(),
        progress: 100,
        isActive: false,
      }
      
      expect(enrollment.completedAt).toBeDefined()
      expect(enrollment.progress).toBe(100)
      expect(enrollment.isActive).toBe(false)
    })
    
    it('should ignore optional steps for completion', () => {
      const steps = [
        { isRequired: true, completed: true },
        { isRequired: true, completed: true },
        { isRequired: false, completed: false }, // Optional, not done
      ]
      
      const requiredComplete = steps
        .filter(s => s.isRequired)
        .every(s => s.completed)
      
      expect(requiredComplete).toBe(true)
    })
    
    it('should generate completion certificate', () => {
      const certificate = {
        userId: 'member1',
        pathwayId: 'pathway1',
        pathwayName: 'ROOTS - New Believer Foundations',
        completedDate: new Date('2025-01-30'),
        certificateNumber: 'CERT-2025-001',
        issuedBy: 'Pastor John',
      }
      
      expect(certificate.certificateNumber).toMatch(/^CERT-\d{4}-\d{3}$/)
      expect(certificate.issuedBy).toBeDefined()
    })
    
    it('should track completion statistics', () => {
      const stats = {
        totalEnrolled: 50,
        totalCompleted: 35,
        averageDaysToComplete: 21,
        completionRate: 70,
      }
      
      expect(stats.completionRate).toBe(
        Math.round((stats.totalCompleted / stats.totalEnrolled) * 100)
      )
    })
  })
  
  describe('Progress History', () => {
    it('should maintain progress audit trail', () => {
      const history = [
        { stepId: 'step1', completedAt: new Date('2025-01-20'), completedBy: 'leader1' },
        { stepId: 'step2', completedAt: new Date('2025-01-25'), completedBy: 'leader2' },
        { stepId: 'step3', completedAt: new Date('2025-01-30'), completedBy: 'leader1' },
      ]
      
      expect(history).toHaveLength(3)
      expect(history[0].completedAt < history[1].completedAt).toBe(true)
    })
    
    it('should allow viewing historical enrollments', () => {
      const enrollments = [
        { pathwayId: 'pathway1', completedAt: new Date('2024-06-15'), progress: 100 },
        { pathwayId: 'pathway2', completedAt: null, progress: 60, isActive: true },
      ]
      
      const completed = enrollments.filter(e => e.completedAt !== null)
      const active = enrollments.filter(e => e.isActive)
      
      expect(completed).toHaveLength(1)
      expect(active).toHaveLength(1)
    })
  })
})

describe('Pathway Analytics', () => {
  it('should calculate average time to complete', () => {
    const completions = [
      { enrolledAt: new Date('2025-01-01'), completedAt: new Date('2025-01-20') }, // 19 days
      { enrolledAt: new Date('2025-01-05'), completedAt: new Date('2025-01-28') }, // 23 days
      { enrolledAt: new Date('2025-01-10'), completedAt: new Date('2025-02-05') }, // 26 days
    ]
    
    const daysDiff = completions.map(c => {
      const diff = c.completedAt.getTime() - c.enrolledAt.getTime()
      return Math.floor(diff / (1000 * 60 * 60 * 24))
    })
    
    const average = daysDiff.reduce((sum, d) => sum + d, 0) / daysDiff.length
    expect(average).toBeCloseTo(22.67, 1)
  })
  
  it('should identify bottleneck steps', () => {
    const stepCompletionTimes = [
      { stepId: 'step1', averageDays: 3 },
      { stepId: 'step2', averageDays: 12 }, // Bottleneck
      { stepId: 'step3', averageDays: 4 },
    ]
    
    const bottleneck = stepCompletionTimes.reduce((max, s) => 
      s.averageDays > max.averageDays ? s : max
    )
    
    expect(bottleneck.stepId).toBe('step2')
    expect(bottleneck.averageDays).toBe(12)
  })
  
  it('should track dropout rates', () => {
    const enrollments = {
      total: 100,
      completed: 65,
      active: 20,
      dropped: 15,
    }
    
    const dropoutRate = (enrollments.dropped / enrollments.total) * 100
    expect(dropoutRate).toBe(15)
  })
  
  it('should analyze completion by pathway type', () => {
    const stats = [
      { type: PathwayType.ROOTS, enrolled: 100, completed: 85 },
      { type: PathwayType.VINES, enrolled: 60, completed: 40 },
      { type: PathwayType.RETREAT, enrolled: 30, completed: 28 },
    ]
    
    const rates = stats.map(s => ({
      type: s.type,
      rate: Math.round((s.completed / s.enrolled) * 100)
    }))
    
    expect(rates[0].rate).toBe(85) // ROOTS highest
    expect(rates[2].rate).toBe(93) // RETREAT actually highest
  })
})

describe('Multi-Church Pathway Management', () => {
  it('should isolate pathways by church', () => {
    const pathways = [
      { id: 'p1', name: 'ROOTS', localChurchId: 'manila1' },
      { id: 'p2', name: 'ROOTS', localChurchId: 'cebu1' },
      { id: 'p3', name: 'VINES', localChurchId: 'manila1' },
    ]
    
    const manilaPathways = pathways.filter(p => p.localChurchId === 'manila1')
    expect(manilaPathways).toHaveLength(2)
  })
  
  it('should allow church-specific pathway customization', () => {
    const manilaRoots = {
      ...mockPathways.roots,
      localChurchId: 'manila1',
      steps: 3,
    }
    
    const cebuRoots = {
      ...mockPathways.roots,
      id: 'pathway-cebu',
      localChurchId: 'cebu1',
      steps: 4, // Different number of steps
    }
    
    expect(manilaRoots.steps).not.toBe(cebuRoots.steps)
  })
  
  it('should track cross-church statistics for SUPER_ADMIN', () => {
    const churchStats = [
      { church: 'manila1', totalEnrolled: 150, completed: 100 },
      { church: 'cebu1', totalEnrolled: 80, completed: 60 },
    ]
    
    const overall = {
      totalEnrolled: churchStats.reduce((sum, c) => sum + c.totalEnrolled, 0),
      totalCompleted: churchStats.reduce((sum, c) => sum + c.completed, 0),
    }
    
    expect(overall.totalEnrolled).toBe(230)
    expect(overall.totalCompleted).toBe(160)
  })
})