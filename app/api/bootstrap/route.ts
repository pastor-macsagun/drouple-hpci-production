import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

// EMERGENCY: One-time bootstrap endpoint to create initial admin
// DELETE THIS FILE AFTER USE!

export async function POST(request: Request) {
  try {
    // Security: Only allow if no users exist
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return NextResponse.json(
        { error: 'System already has users. Bootstrap not allowed.' },
        { status: 403 }
      );
    }

    // Additional security: Check for secret header
    const authHeader = request.headers.get('x-bootstrap-secret');
    const expectedSecret = process.env.BOOTSTRAP_SECRET;
    
    if (!expectedSecret || authHeader !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create super admin
    const hashedPassword = await bcrypt.hash('Hpci!Test2025', 10);
    
    const superAdmin = await prisma.user.create({
      data: {
        email: 'superadmin@test.com',
        password: hashedPassword,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        isActive: true,
        mustChangePassword: true, // Force password change on first login
      }
    });

    return NextResponse.json({
      message: 'Bootstrap successful',
      email: superAdmin.email,
      note: 'DELETE THIS ENDPOINT IMMEDIATELY!'
    });

  } catch (error) {
    console.error('Bootstrap error:', error);
    return NextResponse.json(
      { error: 'Bootstrap failed' },
      { status: 500 }
    );
  }
}