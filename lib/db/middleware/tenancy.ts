/* eslint-disable @typescript-eslint/no-explicit-any */
// Entities that should be scoped by localChurchId (for documentation purposes)
// const TENANT_SCOPED_MODELS = [
//   'Service',
//   'LifeGroup',
//   'Event', // Can be scoped or whole-church
//   'AuditLog',
// ]

// Repository pattern for tenant-scoped queries
export class TenantRepository {
  constructor(
    private db: any,
    private userLocalChurchIds: string[]
  ) {}

  // Helper to add tenant filter to where clause
  private addTenantFilter(where: any = {}) {
    // If user has no local church access, return impossible condition
    if (this.userLocalChurchIds.length === 0) {
      return {
        ...where,
        localChurchId: 'no-access' // This will match no records
      }
    }

    return {
      ...where,
      localChurchId: {
        in: this.userLocalChurchIds
      }
    }
  }

  // Service methods
  async findServices(where: any = {}) {
    return this.db.service.findMany({
      where: this.addTenantFilter(where)
    })
  }

  async findService(id: string) {
    return this.db.service.findFirst({
      where: {
        id,
        ...this.addTenantFilter()
      }
    })
  }

  async createService(data: any) {
    if (!this.userLocalChurchIds.includes(data.localChurchId)) {
      throw new Error('Cannot create service for different tenant')
    }
    return this.db.service.create({ data })
  }

  async updateService(id: string, data: any) {
    const service = await this.findService(id)
    if (!service) {
      throw new Error('Service not found or access denied')
    }
    return this.db.service.update({
      where: { id },
      data
    })
  }

  async deleteService(id: string) {
    const service = await this.findService(id)
    if (!service) {
      throw new Error('Service not found or access denied')
    }
    return this.db.service.delete({
      where: { id }
    })
  }

  // LifeGroup methods
  async findLifeGroups(where: any = {}) {
    return this.db.lifeGroup.findMany({
      where: this.addTenantFilter(where)
    })
  }

  async findLifeGroup(id: string) {
    return this.db.lifeGroup.findFirst({
      where: {
        id,
        ...this.addTenantFilter()
      }
    })
  }

  async createLifeGroup(data: any) {
    if (!this.userLocalChurchIds.includes(data.localChurchId)) {
      throw new Error('Cannot create life group for different tenant')
    }
    return this.db.lifeGroup.create({ data })
  }

  async updateLifeGroup(id: string, data: any) {
    const lifeGroup = await this.findLifeGroup(id)
    if (!lifeGroup) {
      throw new Error('Life group not found or access denied')
    }
    return this.db.lifeGroup.update({
      where: { id },
      data
    })
  }

  async deleteLifeGroup(id: string) {
    const lifeGroup = await this.findLifeGroup(id)
    if (!lifeGroup) {
      throw new Error('Life group not found or access denied')
    }
    return this.db.lifeGroup.delete({
      where: { id }
    })
  }

  // Event methods - special handling for scope
  async findEvents(where: any = {}) {
    // If user has no local church access, return empty
    if (this.userLocalChurchIds.length === 0) {
      return []
    }
    
    return this.db.event.findMany({
      where: {
        ...where,
        OR: [
          { scope: 'WHOLE_CHURCH' },
          {
            scope: 'LOCAL_CHURCH',
            localChurchId: {
              in: this.userLocalChurchIds
            }
          }
        ]
      }
    })
  }

  async findEvent(id: string) {
    // If user has no local church access, return null
    if (this.userLocalChurchIds.length === 0) {
      return null
    }
    
    return this.db.event.findFirst({
      where: {
        id,
        OR: [
          { scope: 'WHOLE_CHURCH' },
          {
            scope: 'LOCAL_CHURCH',
            localChurchId: {
              in: this.userLocalChurchIds
            }
          }
        ]
      }
    })
  }

  async createEvent(data: any) {
    if (data.scope === 'LOCAL_CHURCH' && 
        !this.userLocalChurchIds.includes(data.localChurchId)) {
      throw new Error('Cannot create event for different tenant')
    }
    return this.db.event.create({ data })
  }

  async updateEvent(id: string, data: any) {
    const event = await this.findEvent(id)
    if (!event) {
      throw new Error('Event not found or access denied')
    }
    return this.db.event.update({
      where: { id },
      data
    })
  }

  async deleteEvent(id: string) {
    const event = await this.findEvent(id)
    if (!event) {
      throw new Error('Event not found or access denied')
    }
    return this.db.event.delete({
      where: { id }
    })
  }

  // Membership methods
  async findMemberships(where: any = {}) {
    return this.db.membership.findMany({
      where: {
        ...where,
        localChurchId: {
          in: this.userLocalChurchIds
        }
      }
    })
  }

  async createMembership(data: any) {
    if (!this.userLocalChurchIds.includes(data.localChurchId)) {
      throw new Error('Cannot create membership for different tenant')
    }
    return this.db.membership.create({ data })
  }

  async updateMembership(id: string, data: any) {
    const membership = await this.db.membership.findFirst({
      where: {
        id,
        localChurchId: {
          in: this.userLocalChurchIds
        }
      }
    })
    if (!membership) {
      throw new Error('Membership not found or access denied')
    }
    return this.db.membership.update({
      where: { id },
      data
    })
  }
}

// Factory function to create tenant repository
export async function createTenantRepository(db: any, userEmail?: string | null) {
  if (!userEmail) {
    return new TenantRepository(db, [])
  }

  const user = await db.user.findUnique({
    where: { email: userEmail },
    include: {
      memberships: true
    }
  })

  if (!user) {
    return new TenantRepository(db, [])
  }

  // Super admin has access to all tenants
  if (user.role === 'SUPER_ADMIN') {
    const allLocalChurches = await db.localChurch.findMany({
      select: { id: true }
    })
    return new TenantRepository(
      db, 
      allLocalChurches.map((lc: any) => lc.id)
    )
  }

  // Regular users only have access to their local churches
  const localChurchIds = user.memberships.map((m: any) => m.localChurchId)
  return new TenantRepository(db, localChurchIds)
}