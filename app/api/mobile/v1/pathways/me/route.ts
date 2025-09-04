/**
 * Mobile Pathways API
 * GET /api/mobile/v1/pathways/me - Get current user's pathway progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMobileContext } from '@/lib/mobileAuth/context';
import type { PathwayProgress } from '@drouple/contracts';

/**
 * Convert PathwayEnrollment to PathwayProgress
 */
function toPathwayProgress(enrollment: any): PathwayProgress {
  const totalSteps = enrollment.pathway.pathwaySteps?.length || 0;
  const completedSteps = enrollment.pathwayProgress?.filter((p: any) => p.isCompleted) || [];
  
  return {
    id: enrollment.id,
    pathwayId: enrollment.pathwayId,
    pathwayName: enrollment.pathway.title,
    userId: enrollment.userId,
    status: enrollment.status.toLowerCase() as 'enrolled' | 'in_progress' | 'completed' | 'dropped',
    enrolledAt: enrollment.enrolledAt.toISOString(),
    completedAt: enrollment.completedAt?.toISOString(),
    progressPercentage: totalSteps > 0 ? Math.round((completedSteps.length / totalSteps) * 100) : 0,
    currentStepId: enrollment.pathwayProgress?.find((p: any) => !p.isCompleted)?.stepId,
    completedSteps: completedSteps.map((p: any) => p.stepId),
  };
}

/**
 * GET /api/mobile/v1/pathways/me
 * Get current user's pathway progress
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user context
    const context = requireMobileContext(request);

    // Fetch user's pathway enrollments with progress
    const enrollments = await db.pathwayEnrollment.findMany({
      where: {
        userId: context.userId,
        pathway: {
          localChurch: {
            church: {
              tenantId: context.tenantId,
            },
          },
        },
      },
      include: {
        pathway: {
          include: {
            pathwaySteps: {
              orderBy: { order: 'asc' },
            },
            localChurch: {
              include: {
                church: true,
              },
            },
          },
        },
        pathwayProgress: {
          include: {
            step: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    // Convert to PathwayProgress DTOs
    const pathwayProgress = enrollments.map(toPathwayProgress);

    return NextResponse.json(pathwayProgress);

  } catch (error) {
    console.error('Pathways me error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Authentication required')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}