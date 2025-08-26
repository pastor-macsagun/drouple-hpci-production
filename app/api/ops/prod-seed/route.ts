import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Runtime configuration for API route
export const runtime = 'nodejs';

// GET endpoint for debug (token-gated)
export async function GET(request: NextRequest) {
  const token = request.headers.get('X-Seed-Token');
  const expectedToken = process.env.PROD_QA_SEED_TOKEN;
  
  if (!token || !expectedToken || token !== expectedToken) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  
  try {
    // Check if seed has been run
    const seedRun = await prisma.user.findFirst({
      where: { email: '__PROD_SEED_LOCK__' }
    });
    
    return NextResponse.json({ 
      ok: true, 
      locked: !!seedRun,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'database error' }, { status: 500 });
  }
}

// POST endpoint for one-time seeding
export async function POST(request: NextRequest) {
  console.log('[PROD-SEED] POST attempt at:', new Date().toISOString());
  
  // Guard 1: Check token
  const token = request.headers.get('X-Seed-Token');
  const expectedToken = process.env.PROD_QA_SEED_TOKEN;
  
  if (!token || !expectedToken || token !== expectedToken) {
    console.warn('[PROD-SEED] Unauthorized: invalid token');
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  
  // Guard 2: Production only (Vercel always sets NODE_ENV=production)
  if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
    console.warn('[PROD-SEED] Blocked: not production');
    return NextResponse.json({ ok: false, error: 'prod only' }, { status: 403 });
  }
  
  try {
    // Guard 3: Check if already ran
    const existingLock = await prisma.user.findFirst({
      where: { email: '__PROD_SEED_LOCK__' }
    });
    
    if (existingLock) {
      console.warn('[PROD-SEED] Already ran at:', existingLock.createdAt);
      return NextResponse.json({ 
        ok: false, 
        error: 'already-ran',
        ranAt: existingLock.createdAt 
      }, { status: 409 });
    }
    
    console.log('[PROD-SEED] Starting one-time seed...');
    
    // Transaction for atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Create lock record first
      const lock = await tx.user.create({
        data: {
          email: '__PROD_SEED_LOCK__',
          name: 'Seed Lock',
          password: await bcrypt.hash('not-a-real-account', 10),
          role: 'MEMBER',
          tenantId: 'system',
          memberStatus: 'INACTIVE',
          mustChangePassword: false
        }
      });
      
      // Get or verify churches
      let manilaChurch = await tx.church.findFirst({
        where: { id: 'clxtest002' }
      });
      
      if (!manilaChurch) {
        manilaChurch = await tx.church.create({
          data: {
            id: 'clxtest002',
            name: 'HPCI Manila',
            city: 'Manila',
            tenantId: 'hpci'
          }
        });
      }
      
      let cebuChurch = await tx.church.findFirst({
        where: { id: 'clxtest003' }
      });
      
      if (!cebuChurch) {
        cebuChurch = await tx.church.create({
          data: {
            id: 'clxtest003',
            name: 'HPCI Cebu',
            city: 'Cebu',
            tenantId: 'hpci'
          }
        });
      }
      
      // QA Test accounts
      const accounts = [
        {
          email: 'qa.superadmin@hpci',
          name: 'QA Super Admin',
          password: 'QA!Sup3rAdmin#2025',
          role: 'SUPER_ADMIN' as const,
          tenantId: 'hpci',
          churchId: null
        },
        {
          email: 'qa.admin.manila@hpci',
          name: 'QA Admin Manila',
          password: 'QA!AdmMNL#2025',
          role: 'ADMIN' as const,
          tenantId: manilaChurch.id,
          churchId: manilaChurch.id
        },
        {
          email: 'qa.admin.cebu@hpci',
          name: 'QA Admin Cebu',
          password: 'QA!AdmCBU#2025',
          role: 'ADMIN' as const,
          tenantId: cebuChurch.id,
          churchId: cebuChurch.id
        },
        {
          email: 'qa.leader.manila@hpci',
          name: 'QA Leader Manila',
          password: 'QA!LeadMNL#2025',
          role: 'LEADER' as const,
          tenantId: manilaChurch.id,
          churchId: manilaChurch.id
        },
        {
          email: 'qa.member.manila@hpci',
          name: 'QA Member Manila',
          password: 'QA!MemMNL#2025',
          role: 'MEMBER' as const,
          tenantId: manilaChurch.id,
          churchId: manilaChurch.id
        },
        {
          email: 'qa.vip.manila@hpci',
          name: 'QA VIP Manila',
          password: 'QA!VipMNL#2025',
          role: 'VIP' as const,
          tenantId: manilaChurch.id,
          churchId: manilaChurch.id
        }
      ];
      
      const createdUsers = [];
      
      for (const account of accounts) {
        // Check if user already exists
        const existing = await tx.user.findUnique({
          where: { email: account.email }
        });
        
        if (existing) {
          console.log(`[PROD-SEED] User ${account.email} already exists, skipping`);
          continue;
        }
        
        const hashedPassword = await bcrypt.hash(account.password, 10);
        
        const user = await tx.user.create({
          data: {
            email: account.email,
            name: account.name,
            password: hashedPassword,
            role: account.role,
            tenantId: account.tenantId,
            memberStatus: 'ACTIVE',
            mustChangePassword: false
          }
        });
        
        // Create membership for non-super-admin
        if (account.churchId) {
          await tx.membership.create({
            data: {
              userId: user.id,
              churchId: account.churchId,
              membershipDate: new Date(),
              status: 'ACTIVE'
            }
          });
        }
        
        createdUsers.push({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        });
      }
      
      return {
        lockId: lock.id,
        users: createdUsers,
        ranAt: lock.createdAt
      };
    });
    
    console.log('[PROD-SEED] Success! Created users:', result.users.map(u => u.email));
    
    return NextResponse.json({
      ok: true,
      users: result.users,
      ranAt: result.ranAt,
      message: 'QA accounts created successfully'
    });
    
  } catch (error) {
    console.error('[PROD-SEED] Error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'unknown error'
    }, { status: 500 });
  }
}