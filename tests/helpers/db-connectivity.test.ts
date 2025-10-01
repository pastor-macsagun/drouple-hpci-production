import { describe, it, expect } from 'vitest'
import { prisma } from '../../lib/prisma'
import { isDatabaseAvailable } from '../utils/db-availability'

const dbAvailable = await isDatabaseAvailable()
if (!dbAvailable) {
  console.warn('[vitest] Skipping Database Connectivity tests because the Postgres test database is unavailable.')
  await prisma.$disconnect().catch(() => undefined)
}
const describeIfDb = dbAvailable ? describe : describe.skip

describeIfDb('Database Connectivity', () => {
  it('should connect to database successfully', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as connected`
    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
    expect(result[0]).toHaveProperty('connected', 1)
  })

  it.skip('should have required tables', async () => {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `
    
    const tableNames = (tables as any[]).map(t => t.table_name)
    
    // Core tables that must exist (actual Prisma table names)
    const requiredTables = [
      'User',
      'LocalChurch', 
      'Service',
      'Checkin',
      'LifeGroup',
      'LifeGroupMembership',
      'LifeGroupMemberRequest',
      'LifeGroupAttendance',
      'Event',
      'EventRsvp',
      'Pathway',
      'PathwayStep',
      'PathwayEnrollment',
      'PathwayProgress',
      'Message',
      'Announcement'
    ]
    
    for (const table of requiredTables) {
      expect(tableNames).toContain(table)
    }
  })
})
