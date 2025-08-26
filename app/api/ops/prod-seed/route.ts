import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const runtime = "nodejs";

// One-time production seed endpoint with lock mechanism
// This endpoint can only be run ONCE in production

export async function POST(req: Request) {
  try {
    // 1. Check token authorization
    const token = req.headers.get('X-Seed-Token');
    const expectedToken = process.env.PROD_QA_SEED_TOKEN;
    
    if (!token || !expectedToken || token !== expectedToken) {
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 }
      );
    }

    // 2. Production-only check
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json(
        { ok: false, error: 'prod only' },
        { status: 403 }
      );
    }

    // 3. Check if seed has already run
    const existingRun = await prisma.keyValue.findUnique({
      where: { key: 'prod-seed-run' }
    }).catch(() => null);

    if (existingRun) {
      return NextResponse.json(
        { ok: false, error: 'already-ran' },
        { status: 409 }
      );
    }

    // 4. Run seed in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Ensure churches exist
      const mainChurch = await tx.church.upsert({
        where: { id: 'clxtest001' },
        update: {},
        create: {
          id: 'clxtest001',
          name: 'HPCI',
          description: 'House of Prayer Christian International'
        }
      });

      const manila = await tx.localChurch.upsert({
        where: { id: 'clxtest002' },
        update: {},
        create: {
          id: 'clxtest002',
          name: 'HPCI Manila',
          city: 'Manila',
          churchId: 'clxtest001'
        }
      });

      const cebu = await tx.localChurch.upsert({
        where: { id: 'clxtest003' },
        update: {},
        create: {
          id: 'clxtest003',
          name: 'HPCI Cebu',
          city: 'Cebu',
          churchId: 'clxtest001'
        }
      });

      // Create QA users
      const users = [];
      const qaAccounts = [
        { 
          email: 'qa.superadmin@hpci',
          password: 'QA!Sup3rAdmin#2025',
          name: 'QA Super Admin',
          role: 'SUPER_ADMIN' as const,
          tenantId: null
        },
        {
          email: 'qa.admin.manila@hpci',
          password: 'QA!AdmMNL#2025',
          name: 'QA Admin Manila',
          role: 'ADMIN' as const,
          tenantId: 'clxtest002'
        },
        {
          email: 'qa.admin.cebu@hpci',
          password: 'QA!AdmCBU#2025',
          name: 'QA Admin Cebu',
          role: 'ADMIN' as const,
          tenantId: 'clxtest003'
        },
        {
          email: 'qa.leader.manila@hpci',
          password: 'QA!LeadMNL#2025',
          name: 'QA Leader Manila',
          role: 'LEADER' as const,
          tenantId: 'clxtest002'
        },
        {
          email: 'qa.member.manila@hpci',
          password: 'QA!MemMNL#2025',
          name: 'QA Member Manila',
          role: 'MEMBER' as const,
          tenantId: 'clxtest002'
        },
        {
          email: 'qa.vip.manila@hpci',
          password: 'QA!VipMNL#2025',
          name: 'QA VIP Manila',
          role: 'VIP' as const,
          tenantId: 'clxtest002'
        }
      ];

      for (const account of qaAccounts) {
        const hashedPassword = await bcrypt.hash(account.password, 10);
        const user = await tx.user.create({
          data: {
            email: account.email,
            passwordHash: hashedPassword,
            name: account.name,
            role: account.role,
            tenantId: account.tenantId,
            memberStatus: 'ACTIVE',
            mustChangePassword: false
          }
        });
        users.push({ id: user.id, email: user.email, role: user.role });
      }

      // Mark as run
      const ranAt = new Date().toISOString();
      await tx.keyValue.create({
        data: {
          key: 'prod-seed-run',
          value: ranAt
        }
      });

      return { users, ranAt };
    });

    return NextResponse.json({
      ok: true,
      users: result.users,
      ranAt: result.ranAt
    });

  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { ok: false, error: 'seed failed' },
      { status: 500 }
    );
  }
}

// GET for debug - check lock state
export async function GET(req: Request) {
  try {
    // Check token authorization
    const token = req.headers.get('X-Seed-Token');
    const expectedToken = process.env.PROD_QA_SEED_TOKEN;
    
    if (!token || !expectedToken || token !== expectedToken) {
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 }
      );
    }

    // Check lock state
    const seedRun = await prisma.keyValue.findUnique({
      where: { key: 'prod-seed-run' }
    }).catch(() => null);

    return NextResponse.json({
      ok: true,
      locked: !!seedRun,
      ranAt: seedRun?.value || null
    });

  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'check failed' },
      { status: 500 }
    );
  }
}