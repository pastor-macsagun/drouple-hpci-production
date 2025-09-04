/**
 * Check-In Service
 * Handles check-in operations with offline queue integration
 */

import { database } from '@/lib/db/database';
import { syncManager } from '@/lib/net/syncManager';
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/config/endpoints';
import toast from '@/utils/toast';
import {
  mockMembers,
  mockServices,
  mockCheckIns,
  getMemberById,
  getServiceById,
  isCheckedIn,
  MockMember,
  MockService,
  MockCheckIn,
} from '@/data/mockData';

export interface CheckInRequest {
  memberId: string;
  serviceId: string;
  isNewBeliever?: boolean;
  checkInTime?: string;
  clientRequestId?: string;
}

export interface CheckInResult {
  success: boolean;
  data?: {
    checkInId: string;
    member: MockMember;
    service: MockService;
    checkInTime: string;
    isNewBeliever: boolean;
    wasQueued: boolean;
  };
  error?: string;
}

export interface CheckInValidation {
  isValid: boolean;
  member?: MockMember;
  service?: MockService;
  error?: string;
  warnings?: string[];
}

class CheckInService {
  /**
   * Validate check-in request
   */
  async validateCheckIn(
    memberId: string,
    serviceId: string
  ): Promise<CheckInValidation> {
    try {
      // Find member
      const member = getMemberById(memberId);
      if (!member) {
        return {
          isValid: false,
          error: 'Member not found',
        };
      }

      // Find service
      const service = getServiceById(serviceId);
      if (!service) {
        return {
          isValid: false,
          error: 'Service not found',
        };
      }

      // Check if member is active
      if (!member.isActive) {
        return {
          isValid: false,
          member,
          service,
          error: 'Member account is inactive',
        };
      }

      // Check service status
      if (service.status === 'CLOSED') {
        return {
          isValid: false,
          member,
          service,
          error: 'Check-in is closed for this service',
        };
      }

      // Check if already checked in
      if (isCheckedIn(memberId, serviceId)) {
        return {
          isValid: false,
          member,
          service,
          error: 'Member is already checked in for this service',
        };
      }

      const warnings: string[] = [];

      // Check service capacity
      if (service.attendeeCount >= service.capacity) {
        warnings.push('Service is at capacity');
      }

      // Check if service is upcoming (not yet active)
      if (service.status === 'UPCOMING') {
        warnings.push('Service has not started yet');
      }

      const result: CheckInValidation = {
        isValid: true,
        member,
        service,
      };

      if (warnings.length > 0) {
        result.warnings = warnings;
      }

      return result;
    } catch (error) {
      console.error('Check-in validation error:', error);
      return {
        isValid: false,
        error: 'Failed to validate check-in request',
      };
    }
  }

  /**
   * Enqueue check-in (adds to offline queue)
   */
  async enqueueCheckIn(request: CheckInRequest): Promise<CheckInResult> {
    try {
      // Generate unique request ID if not provided
      const clientRequestId =
        request.clientRequestId ||
        `checkin_${Date.now()}_${Math.random().toString(36).substring(2)}`;

      // Validate the check-in
      const validation = await this.validateCheckIn(
        request.memberId,
        request.serviceId
      );

      if (!validation.isValid || !validation.member || !validation.service) {
        return {
          success: false,
          error: validation.error || 'Invalid check-in request',
        };
      }

      // Show warnings but continue
      if (validation.warnings && validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          toast.warning(warning);
        });
      }

      const checkInTime = request.checkInTime || new Date().toISOString();
      const isNewBeliever = request.isNewBeliever || false;

      // Prepare payload for queue
      const payload = {
        memberId: request.memberId,
        serviceId: request.serviceId,
        checkInTime,
        isNewBeliever,
        clientRequestId,
      };

      // Check if we're online and can process immediately
      const syncStatus = syncManager.getStatus();

      if (syncStatus.isOnline) {
        // Try immediate processing
        try {
          const response = await apiClient.post(
            ENDPOINTS.CHECKIN.CHECKIN,
            payload,
            {
              idempotencyKey: clientRequestId,
            }
          );

          if (response.success) {
            // Update local mock data
            const newCheckIn: MockCheckIn = {
              id: `checkin_${Date.now()}`,
              memberId: request.memberId,
              serviceId: request.serviceId,
              checkInTime,
              isNewBeliever,
            };

            mockCheckIns.push(newCheckIn);

            // Update service attendee count
            const service = mockServices.find(s => s.id === request.serviceId);
            if (service) {
              service.attendeeCount += 1;
            }

            toast.success('Check-in successful!');

            return {
              success: true,
              data: {
                checkInId: newCheckIn.id,
                member: validation.member,
                service: validation.service,
                checkInTime,
                isNewBeliever,
                wasQueued: false,
              },
            };
          }
        } catch (error) {
          console.log('Immediate check-in failed, queueing for later:', error);
          // Fall through to queue the action
        }
      }

      // Add to offline queue
      const queueId = await database.enqueue('CHECKIN', payload);

      // Update local mock data optimistically
      const newCheckIn: MockCheckIn = {
        id: `checkin_pending_${queueId}`,
        memberId: request.memberId,
        serviceId: request.serviceId,
        checkInTime,
        isNewBeliever,
      };

      mockCheckIns.push(newCheckIn);

      // Update service attendee count optimistically
      const service = mockServices.find(s => s.id === request.serviceId);
      if (service) {
        service.attendeeCount += 1;
      }

      toast.success('Check-in queued - will sync when online');

      return {
        success: true,
        data: {
          checkInId: newCheckIn.id,
          member: validation.member,
          service: validation.service,
          checkInTime,
          isNewBeliever,
          wasQueued: true,
        },
      };
    } catch (error) {
      console.error('Check-in enqueue error:', error);
      toast.error('Failed to process check-in');

      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to process check-in',
      };
    }
  }

  /**
   * Get check-in history for debugging
   */
  async getCheckInHistory(): Promise<MockCheckIn[]> {
    return [...mockCheckIns];
  }

  /**
   * Get queued check-ins
   */
  async getQueuedCheckIns() {
    try {
      return await database.getQueueByType('CHECKIN');
    } catch (error) {
      console.error('Failed to get queued check-ins:', error);
      return [];
    }
  }

  /**
   * Clear check-in history (for testing)
   */
  async clearHistory(): Promise<void> {
    mockCheckIns.length = 0;
    console.log('Check-in history cleared');
  }

  /**
   * Force sync queued check-ins
   */
  async syncCheckIns() {
    try {
      const result = await syncManager.syncNow();

      if (result.succeeded > 0) {
        toast.success(`Synced ${result.succeeded} check-ins`);
      }

      if (result.failed > 0) {
        toast.warning(`${result.failed} check-ins failed to sync`);
      }

      return result;
    } catch (error) {
      console.error('Failed to sync check-ins:', error);
      toast.error('Failed to sync check-ins');
      throw error;
    }
  }
}

// Create singleton instance
export const checkInService = new CheckInService();

export default checkInService;
