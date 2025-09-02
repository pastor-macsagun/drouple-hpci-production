/**
 * Test Data Manager
 * Tracks and manages test data created during production testing
 */

import fs from 'fs/promises';
import path from 'path';

export interface TestRecord {
  id: string;
  type: 'member' | 'service' | 'event' | 'lifegroup' | 'pathway' | 'checkin' | 'rsvp';
  name: string;
  email?: string;
  createdBy: string;
  churchId?: number;
  createdAt: Date;
  data: Record<string, any>;
  cleanupRequired: boolean;
  cleaned?: boolean;
}

export interface TestDataSnapshot {
  timestamp: Date;
  testRunId: string;
  records: TestRecord[];
  summary: {
    totalRecords: number;
    recordsByType: Record<string, number>;
    recordsByChurch: Record<string, number>;
  };
}

class TestDataManager {
  private prisma: any;
  private records: TestRecord[] = [];
  private testRunId: string;

  constructor() {
    this.testRunId = `test-run-${Date.now()}`;
  }

  async initialize(): Promise<void> {
    // Import Prisma client from the main project
    try {
      const { prisma } = await import('../../lib/prisma');
      this.prisma = prisma;
    } catch (error) {
      console.error('❌ Failed to import Prisma client from main project:', error);
      throw new Error('Cannot initialize Prisma client. Make sure the main project has Prisma configured.');
    }
    
    await this.loadExistingRecords();
    console.log(`📋 Test Data Manager initialized (Run ID: ${this.testRunId})`);
  }

  private async loadExistingRecords(): Promise<void> {
    try {
      const recordsFile = './test-records.json';
      const data = await fs.readFile(recordsFile, 'utf-8');
      const parsed = JSON.parse(data);
      this.records = parsed.records || [];
      console.log(`📂 Loaded ${this.records.length} existing test records`);
    } catch (error) {
      console.log('📂 No existing test records found, starting fresh');
      this.records = [];
    }
  }

  async recordTestData(
    type: TestRecord['type'],
    name: string,
    createdBy: string,
    data: Record<string, any>,
    churchId?: number,
    email?: string
  ): Promise<string> {
    const record: TestRecord = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      name,
      email,
      createdBy,
      churchId,
      createdAt: new Date(),
      data,
      cleanupRequired: true,
      cleaned: false
    };

    this.records.push(record);
    console.log(`📝 Recorded test data: ${record.id} (${type}: ${name})`);
    
    return record.id;
  }

  async createTestMember(
    name: string,
    email: string,
    churchId: number,
    createdBy: string,
    role: string = 'MEMBER'
  ): Promise<TestRecord> {
    try {
      // Create member in database
      const member = await this.prisma.user.create({
        data: {
          name,
          email,
          hashedPassword: '$2b$12$dummy.hash.for.testing', // Dummy hash
          role: role as any,
          tenantId: churchId,
          isActive: true,
          emailVerified: new Date(),
        }
      });

      // Record the test data
      const recordId = await this.recordTestData(
        'member',
        name,
        createdBy,
        { 
          userId: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          churchId
        },
        churchId,
        email
      );

      console.log(`✅ Created test member: ${name} (${email}) in church ${churchId}`);
      
      return this.records.find(r => r.id === recordId)!;
    } catch (error) {
      console.error(`❌ Failed to create test member ${name}:`, error);
      throw error;
    }
  }

  async createTestService(
    name: string,
    date: Date,
    churchId: number,
    createdBy: string
  ): Promise<TestRecord> {
    try {
      const service = await this.prisma.service.create({
        data: {
          name,
          date,
          churchId,
          isActive: true
        }
      });

      const recordId = await this.recordTestData(
        'service',
        name,
        createdBy,
        {
          serviceId: service.id,
          name: service.name,
          date: service.date.toISOString(),
          churchId
        },
        churchId
      );

      console.log(`✅ Created test service: ${name} on ${date.toDateString()}`);
      return this.records.find(r => r.id === recordId)!;
    } catch (error) {
      console.error(`❌ Failed to create test service ${name}:`, error);
      throw error;
    }
  }

  async createTestEvent(
    title: string,
    description: string,
    date: Date,
    capacity: number,
    churchId: number,
    createdBy: string
  ): Promise<TestRecord> {
    try {
      const event = await this.prisma.event.create({
        data: {
          title,
          description,
          date,
          capacity,
          churchId,
          visibility: 'LOCAL_CHURCH',
          allowedRoles: ['MEMBER', 'LEADER', 'ADMIN'],
          createdById: 1 // Assume system user
        }
      });

      const recordId = await this.recordTestData(
        'event',
        title,
        createdBy,
        {
          eventId: event.id,
          title: event.title,
          description: event.description,
          date: event.date.toISOString(),
          capacity: event.capacity,
          churchId
        },
        churchId
      );

      console.log(`✅ Created test event: ${title} on ${date.toDateString()}`);
      return this.records.find(r => r.id === recordId)!;
    } catch (error) {
      console.error(`❌ Failed to create test event ${title}:`, error);
      throw error;
    }
  }

  async createTestLifeGroup(
    name: string,
    description: string,
    capacity: number,
    churchId: number,
    leaderId: number,
    createdBy: string
  ): Promise<TestRecord> {
    try {
      const lifegroup = await this.prisma.lifeGroup.create({
        data: {
          name,
          description,
          capacity,
          churchId,
          leaderId,
          isActive: true
        }
      });

      const recordId = await this.recordTestData(
        'lifegroup',
        name,
        createdBy,
        {
          lifegroupId: lifegroup.id,
          name: lifegroup.name,
          description: lifegroup.description,
          capacity: lifegroup.capacity,
          churchId,
          leaderId
        },
        churchId
      );

      console.log(`✅ Created test LifeGroup: ${name} (capacity: ${capacity})`);
      return this.records.find(r => r.id === recordId)!;
    } catch (error) {
      console.error(`❌ Failed to create test LifeGroup ${name}:`, error);
      throw error;
    }
  }

  async getTestDataSummary(): Promise<TestDataSnapshot> {
    const summary = {
      totalRecords: this.records.length,
      recordsByType: {} as Record<string, number>,
      recordsByChurch: {} as Record<string, number>
    };

    // Count by type
    for (const record of this.records) {
      summary.recordsByType[record.type] = (summary.recordsByType[record.type] || 0) + 1;
    }

    // Count by church
    for (const record of this.records) {
      const church = record.churchId?.toString() || 'unknown';
      summary.recordsByChurch[church] = (summary.recordsByChurch[church] || 0) + 1;
    }

    return {
      timestamp: new Date(),
      testRunId: this.testRunId,
      records: this.records,
      summary
    };
  }

  async cleanupTestData(recordId?: string): Promise<void> {
    const recordsToClean = recordId 
      ? this.records.filter(r => r.id === recordId)
      : this.records.filter(r => r.cleanupRequired && !r.cleaned);

    console.log(`🧹 Cleaning up ${recordsToClean.length} test records...`);

    for (const record of recordsToClean) {
      try {
        await this.cleanupRecord(record);
        record.cleaned = true;
        console.log(`✅ Cleaned up ${record.type}: ${record.name}`);
      } catch (error) {
        console.error(`❌ Failed to cleanup ${record.type} ${record.name}:`, error);
      }
    }

    await this.saveRecords();
  }

  private async cleanupRecord(record: TestRecord): Promise<void> {
    switch (record.type) {
      case 'member':
        if (record.data.userId) {
          await this.prisma.user.delete({
            where: { id: record.data.userId }
          });
        }
        break;

      case 'service':
        if (record.data.serviceId) {
          // First delete related checkins
          await this.prisma.checkin.deleteMany({
            where: { serviceId: record.data.serviceId }
          });
          // Then delete the service
          await this.prisma.service.delete({
            where: { id: record.data.serviceId }
          });
        }
        break;

      case 'event':
        if (record.data.eventId) {
          // First delete related RSVPs
          await this.prisma.eventRSVP.deleteMany({
            where: { eventId: record.data.eventId }
          });
          // Then delete the event
          await this.prisma.event.delete({
            where: { id: record.data.eventId }
          });
        }
        break;

      case 'lifegroup':
        if (record.data.lifegroupId) {
          // Delete related memberships and attendance
          await this.prisma.lifeGroupMembership.deleteMany({
            where: { lifeGroupId: record.data.lifegroupId }
          });
          await this.prisma.lifeGroupAttendance.deleteMany({
            where: { lifeGroupId: record.data.lifegroupId }
          });
          // Then delete the LifeGroup
          await this.prisma.lifeGroup.delete({
            where: { id: record.data.lifegroupId }
          });
        }
        break;

      case 'checkin':
        if (record.data.checkinId) {
          await this.prisma.checkin.delete({
            where: { id: record.data.checkinId }
          });
        }
        break;

      case 'rsvp':
        if (record.data.rsvpId) {
          await this.prisma.eventRSVP.delete({
            where: { id: record.data.rsvpId }
          });
        }
        break;
    }
  }

  async saveRecords(): Promise<void> {
    const snapshot = await this.getTestDataSummary();
    const filename = `test-records-${this.testRunId}.json`;
    
    await fs.writeFile(
      filename,
      JSON.stringify(snapshot, null, 2)
    );

    console.log(`💾 Test records saved to ${filename}`);
  }

  async generateCleanupScript(): Promise<void> {
    const uncleanedRecords = this.records.filter(r => r.cleanupRequired && !r.cleaned);
    
    if (uncleanedRecords.length === 0) {
      console.log('✨ No cleanup required - all test data cleaned');
      return;
    }

    const script = `#!/usr/bin/env tsx
/**
 * Automated Test Data Cleanup Script
 * Generated: ${new Date().toISOString()}
 * Test Run ID: ${this.testRunId}
 */

const { prisma } = require('../../lib/prisma');

async function cleanup() {
  console.log('🧹 Starting automated cleanup...');
  
  const recordsToClean = ${JSON.stringify(uncleanedRecords, null, 2)};
  
  for (const record of recordsToClean) {
    try {
      switch (record.type) {
        case 'member':
          await prisma.user.delete({ where: { id: record.data.userId } });
          break;
        case 'service':
          await prisma.checkin.deleteMany({ where: { serviceId: record.data.serviceId } });
          await prisma.service.delete({ where: { id: record.data.serviceId } });
          break;
        case 'event':
          await prisma.eventRSVP.deleteMany({ where: { eventId: record.data.eventId } });
          await prisma.event.delete({ where: { id: record.data.eventId } });
          break;
        case 'lifegroup':
          await prisma.lifeGroupMembership.deleteMany({ where: { lifeGroupId: record.data.lifegroupId } });
          await prisma.lifeGroupAttendance.deleteMany({ where: { lifeGroupId: record.data.lifegroupId } });
          await prisma.lifeGroup.delete({ where: { id: record.data.lifegroupId } });
          break;
      }
      console.log(\`✅ Cleaned: \${record.type} - \${record.name}\`);
    } catch (error) {
      console.error(\`❌ Failed to clean \${record.type} - \${record.name}:\`, error);
    }
  }
  
  console.log('🎉 Cleanup completed');
}

cleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
`;

    const scriptPath = `cleanup-${this.testRunId}.ts`;
    await fs.writeFile(scriptPath, script);
    
    console.log(`🔧 Generated cleanup script: ${scriptPath}`);
    console.log(`💡 Run with: npx tsx ${scriptPath}`);
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export default TestDataManager;