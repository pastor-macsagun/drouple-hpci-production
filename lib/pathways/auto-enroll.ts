/**
 * Auto-enrollment utilities for pathway management
 * Handles automatic enrollment of new believers in discipleship pathways
 */

import { prisma } from '@/lib/db';

/**
 * Auto-enrolls a new believer in the ROOTS pathway
 * ROOTS is designed for new believers to complete basic Christian foundations
 * 
 * @param userId - User ID to enroll
 * @param tenantId - Tenant ID for multi-tenancy
 * @returns Promise<boolean> - Success status
 */
export async function autoEnrollInRoots(userId: string, tenantId: string): Promise<boolean> {
  try {
    // Find ROOTS pathway for the tenant
    const rootsPathway = await prisma.pathway.findFirst({
      where: {
        type: 'ROOTS',
        tenantId
      }
    });

    if (rootsPathway) {
      // Auto-enroll in ROOTS pathway
      await prisma.pathwayEnrollment.create({
        data: {
          pathwayId: rootsPathway.id,
          userId
        }
      }).catch(() => {
        // Graceful handling: Ignore duplicate enrollment attempts
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Auto-enroll in ROOTS failed:', error);
    return false;
  }
}