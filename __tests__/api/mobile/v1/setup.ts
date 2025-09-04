/**
 * Test setup utilities for mobile API tests
 */

import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signAccessToken } from '@/lib/mobileAuth/jwt';
import { NextResponse } from 'next/server';

// Test data constants
export const TEST_TENANT_ID = 'test-tenant-mobile';
export const TEST_PASSWORD = 'TestPassword123!';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'MEMBER' | 'LEADER' | 'ADMIN' | 'PASTOR';
  tenantId: string;
  localChurchId?: string;
  accessToken?: string;
}

export interface TestChurch {
  id: string;
  name: string;
  localChurchId: string;
}

// Clean up test data
export async function cleanupTestData() {
  // Delete in dependency order - use specific IDs instead of tenantId for Church model
  await db.mobileIdempotency.deleteMany({ 
    where: { user: { tenantId: TEST_TENANT_ID } } 
  });
  await db.mobileRefreshToken.deleteMany({ 
    where: { user: { tenantId: TEST_TENANT_ID } } 
  });
  await db.eventRsvp.deleteMany({ 
    where: { user: { tenantId: TEST_TENANT_ID } } 
  });
  await db.checkin.deleteMany({ 
    where: { user: { tenantId: TEST_TENANT_ID } } 
  });
  await db.pathwayEnrollment.deleteMany({ 
    where: { user: { tenantId: TEST_TENANT_ID } } 
  });
  await db.membership.deleteMany({ 
    where: { user: { tenantId: TEST_TENANT_ID } } 
  });
  await db.user.deleteMany({ 
    where: { tenantId: TEST_TENANT_ID } 
  });
  
  // Find and delete services/events by church name pattern
  const testChurches = await db.church.findMany({
    where: { name: { contains: 'Test Church' } }
  });
  
  for (const church of testChurches) {
    await db.service.deleteMany({ 
      where: { localChurch: { churchId: church.id } } 
    });
    await db.event.deleteMany({ 
      where: { localChurch: { churchId: church.id } } 
    });
    // Delete pathway related data by tenant - pathways don't have localChurch relations
    await db.pathwayProgress.deleteMany({
      where: { step: { pathway: { tenantId: TEST_TENANT_ID } } }
    });
    await db.pathway.deleteMany({
      where: { tenantId: TEST_TENANT_ID }
    });
    await db.localChurch.deleteMany({ 
      where: { churchId: church.id } 
    });
  }
  
  await db.church.deleteMany({ 
    where: { name: { contains: 'Test Church' } } 
  });
}

// Create test church
export async function createTestChurch(name?: string): Promise<TestChurch> {
  // Generate unique name to avoid conflicts
  const timestamp = Date.now();
  const uniqueName = name || `Test Church ${timestamp}`;
  
  const church = await db.church.create({
    data: {
      name: uniqueName,
    },
  });

  const localChurch = await db.localChurch.create({
    data: {
      name: `${uniqueName} Local`,
      churchId: church.id,
      address: '123 Test St',
      city: 'Test City',
      zipCode: '12345',
      phone: '555-0123',
      email: `local@testchurch${timestamp}.com`,
    },
  });

  return {
    id: church.id,
    name: church.name,
    localChurchId: localChurch.id,
  };
}

// Create test user
export async function createTestUser(
  email: string,
  role: TestUser['role'] = 'MEMBER',
  localChurchId?: string
): Promise<TestUser> {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
  
  const user = await db.user.create({
    data: {
      email,
      name: email.split('@')[0].replace('.', ' ').toUpperCase(),
      role,
      tenantId: TEST_TENANT_ID,
      passwordHash,
      memberStatus: 'ACTIVE',
    },
  });

  // Create membership if localChurchId provided and verify it exists
  if (localChurchId) {
    // First verify the localChurch exists
    const localChurch = await db.localChurch.findUnique({
      where: { id: localChurchId }
    });
    
    if (!localChurch) {
      throw new Error(`LocalChurch with id ${localChurchId} does not exist`);
    }
    
    await db.membership.create({
      data: {
        userId: user.id,
        localChurchId,
        believerStatus: 'ACTIVE',
        joinedAt: new Date(),
      },
    });
  }

  // Generate access token for convenience
  const accessToken = await signAccessToken({
    sub: user.id,
    userId: user.id,
    roles: [role],
    tenantId: TEST_TENANT_ID,
    localChurchId,
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name || '',
    role,
    tenantId: TEST_TENANT_ID,
    localChurchId,
    accessToken,
  };
}

// Create test service
export async function createTestService(localChurchId: string, date: Date = new Date()) {
  return await db.service.create({
    data: {
      localChurchId,
      serviceDate: date,
      serviceType: 'Sunday Service',
    },
  });
}

// Create test event
export async function createTestEvent(
  localChurchId: string, 
  title: string = 'Test Event',
  capacity?: number
) {
  return await db.event.create({
    data: {
      title,
      localChurchId,
      startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      capacity,
    },
  });
}

// Helper function to extract JSON from NextResponse in tests
export async function extractResponseJson(response: NextResponse | Response) {
  // With our enhanced mocks, response.json() should work properly
  return await response.json();
}

// Helper function to get response status
export function getResponseStatus(response: NextResponse | Response): number {
  return response.status;
}