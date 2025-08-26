import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// One-time production seed endpoint for QA validation
// This endpoint will only run ONCE and then permanently lock itself

export async function POST(request: NextRequest) {
  console.log('[PROD-SEED] Access attempt at:', new Date().toISOString());
  
  try {
    // Guard 1: Check for production deployment (Vercel sets VERCEL env var)
    if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
      console.warn('[PROD-SEED] Blocked: Not in production environment');
      return NextResponse.json(
        { error: 'This endpoint is only available in production' },
        { status: 403 }
      );
    }

    // Guard 2: Check for seed token in environment
    const expectedToken = process.env.PROD_QA_SEED_TOKEN;
    if (!expectedToken) {
      console.error('[PROD-SEED] Blocked: PROD_QA_SEED_TOKEN not configured');
      return NextResponse.json(
        { error: 'Seed endpoint not configured' },
        { status: 503 }
      );
    }

    // Guard 3: Validate request token
    const requestToken = request.headers.get('X-Seed-Token');
    if (!requestToken || requestToken !== expectedToken) {
      console.warn('[PROD-SEED] Blocked: Invalid token');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Guard 4: Check if seed has already been run
    // Using a simple key-value approach with the User table
    const seedMarker = await prisma.user.findFirst({
      where: { email: '__PROD_SEED_RAN__' }
    });

    if (seedMarker) {
      console.warn('[PROD-SEED] Blocked: Seed already ran at', seedMarker.createdAt);
      return NextResponse.json(
        { 
          error: 'Seed has already been executed',
          ranAt: seedMarker.createdAt
        },
        { status: 409 }
      );
    }

    console.log('[PROD-SEED] Starting one-time production seed...');

    // Begin transaction for atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Create seed marker to prevent re-runs
      await tx.user.create({
        data: {
          email: '__PROD_SEED_RAN__',
          name: 'Seed Lock Marker',
          password: await bcrypt.hash('not-a-real-account', 10),
          role: 'MEMBER',
          tenantId: 'system',
          memberStatus: 'INACTIVE'
        }
      });

      // Get or verify tenant IDs
      const manilaChurch = await tx.church.findFirst({
        where: { id: 'clxtest002' }
      });
      
      const cebuChurch = await tx.church.findFirst({
        where: { id: 'clxtest003' }
      });

      if (!manilaChurch || !cebuChurch) {
        throw new Error('Required churches (Manila/Cebu) not found');
      }

      // Test account configurations
      const testAccounts = [
        {
          email: 'qa.superadmin@hpci',
          name: 'QA Super Admin',
          password: 'QA!Sup3rAdmin#2025',
          role: 'SUPER_ADMIN' as const,
          tenantId: 'hpci'
        },
        {
          email: 'qa.admin.manila@hpci',
          name: 'QA Admin Manila',
          password: 'QA!AdmMNL#2025',
          role: 'ADMIN' as const,
          tenantId: manilaChurch.id
        },
        {
          email: 'qa.admin.cebu@hpci',
          name: 'QA Admin Cebu',
          password: 'QA!AdmCBU#2025',
          role: 'ADMIN' as const,
          tenantId: cebuChurch.id
        },
        {
          email: 'qa.leader.manila@hpci',
          name: 'QA Leader Manila',
          password: 'QA!LeadMNL#2025',
          role: 'LEADER' as const,
          tenantId: manilaChurch.id
        },
        {
          email: 'qa.member.manila@hpci',
          name: 'QA Member Manila',
          password: 'QA!MemMNL#2025',
          role: 'MEMBER' as const,
          tenantId: manilaChurch.id
        },
        {
          email: 'qa.vip.manila@hpci',
          name: 'QA VIP Manila',
          password: 'QA!VipMNL#2025',
          role: 'VIP' as const,
          tenantId: manilaChurch.id
        }
      ];

      // Create test users
      const createdUsers = [];
      for (const account of testAccounts) {
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
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            tenantId: true
          }
        });

        // Create membership record for non-super-admin users
        if (account.role !== 'SUPER_ADMIN') {
          await tx.membership.create({
            data: {
              userId: user.id,
              churchId: account.tenantId,
              membershipDate: new Date(),
              status: 'ACTIVE'
            }
          });
        }

        createdUsers.push({
          ...user,
          password: account.password // Return plaintext for testing reference
        });
      }

      return {
        users: createdUsers,
        ranAt: new Date().toISOString()
      };
    });

    console.log('[PROD-SEED] Successfully created test accounts:', result.users.map(u => u.email));

    return NextResponse.json({
      ok: true,
      ...result,
      note: 'Test accounts created. Delete this route after validation tests complete.',
      cleanup: 'Run cleanup script to remove all qa.*@hpci accounts after testing'
    });

  } catch (error) {
    console.error('[PROD-SEED] Error:', error);
    return NextResponse.json(
      { 
        error: 'Seed operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Block all other methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}