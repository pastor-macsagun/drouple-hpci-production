/**
 * Audit Logging for Mobile API
 * Tracks all mutations with actor, entity, action, and changes
 */

import { prisma } from '@/lib/db';

export interface AuditLogEntry {
  actorId: string; // User ID or 'system'
  action: string; // Action performed (e.g., 'checkin_create', 'rsvp_update')
  entity: string; // Entity type (e.g., 'checkin', 'event_rsvp')
  entityId: string; // ID of the affected entity
  changes: Record<string, unknown>; // What changed
  reason: string; // Why the change was made
  tenantId: string; // For multi-tenant isolation
  metadata?: Record<string, unknown>; // Additional context
}

/**
 * Log audit action to database
 */
export async function logAuditAction(entry: AuditLogEntry): Promise<void> {
  try {
    // In a real implementation, this would write to an audit_logs table
    // For now, we'll use console logging with structured format
    const auditEntry = {
      timestamp: new Date().toISOString(),
      actorId: entry.actorId,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      changes: entry.changes,
      reason: entry.reason,
      tenantId: entry.tenantId,
      ...(entry.metadata && { metadata: entry.metadata }),
    };

    // Log to console (in production, this would go to audit database)
    console.log('AUDIT:', JSON.stringify(auditEntry));

    // TODO: Implement actual database storage
    // await prisma.auditLog.create({
    //   data: {
    //     actorId: entry.actorId,
    //     action: entry.action,
    //     entity: entry.entity,
    //     entityId: entry.entityId,
    //     changes: entry.changes,
    //     reason: entry.reason,
    //     tenantId: entry.tenantId,
    //     metadata: entry.metadata,
    //     createdAt: new Date(),
    //   },
    // });
    
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // Don't throw - audit logging failures shouldn't break business logic
  }
}

/**
 * Create diff for audit logging
 */
export function createAuditDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Record<string, { from: unknown; to: unknown }> {
  const diff: Record<string, { from: unknown; to: unknown }> = {};

  // Check for changes in after object
  for (const [key, value] of Object.entries(after)) {
    if (before[key] !== value) {
      diff[key] = {
        from: before[key],
        to: value,
      };
    }
  }

  // Check for deletions (keys in before but not in after)
  for (const [key, value] of Object.entries(before)) {
    if (!(key in after)) {
      diff[key] = {
        from: value,
        to: null,
      };
    }
  }

  return diff;
}

/**
 * Log mobile API access for security monitoring
 */
export async function logMobileApiAccess(
  endpoint: string,
  method: string,
  userId: string,
  tenantId: string,
  userAgent?: string,
  ip?: string
): Promise<void> {
  try {
    const accessEntry = {
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      userId,
      tenantId,
      userAgent,
      ip,
      type: 'mobile_api_access',
    };

    console.log('API_ACCESS:', JSON.stringify(accessEntry));
    
    // TODO: Store in api_access_logs table for security monitoring
    
  } catch (error) {
    console.error('Failed to log API access:', error);
  }
}