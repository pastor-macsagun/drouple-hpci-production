/**
 * Check-in API Service
 * Handles service check-ins and history
 */

import { httpClient } from '../http';
import { ENDPOINTS } from '../../../config/endpoints';
import type { CheckInRequest, CheckInResult } from '@drouple/contracts';
import { z } from 'zod';

// Service schema
const ServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.string(),
  time: z.string(),
  location: z.string().optional(),
  capacity: z.number().optional(),
  attendanceCount: z.number().default(0),
});

const CheckInHistorySchema = z.object({
  id: z.string(),
  serviceName: z.string(),
  serviceDate: z.string(),
  checkedInAt: z.string(),
  isNewBeliever: z.boolean().default(false),
});

// Types
export interface Service {
  id: string;
  name: string;
  date: string;
  time: string;
  location?: string;
  capacity?: number;
  attendanceCount: number;
}

export interface CheckInHistory {
  id: string;
  serviceName: string;
  serviceDate: string;
  checkedInAt: string;
  isNewBeliever: boolean;
}

/**
 * Check-in Service Class
 */
export class CheckinService {
  /**
   * Get available services for check-in
   */
  static async getServices(): Promise<Service[]> {
    try {
      const response = await httpClient.get<Service[]>(ENDPOINTS.CHECKIN.SERVICES);

      if (response.success && response.data) {
        // Validate response data
        const services = z.array(ServiceSchema).parse(response.data);
        return services;
      }

      throw new Error(response.error || 'Failed to get services');
    } catch (error) {
      console.error('Get services error:', error);
      throw error;
    }
  }

  /**
   * Check in to a service
   */
  static async checkIn(request: CheckInRequest): Promise<CheckInResult> {
    try {
      const response = await httpClient.post<CheckInResult>(
        ENDPOINTS.CHECKIN.CHECKIN,
        request
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error || 'Check-in failed');
    } catch (error) {
      console.error('Check-in error:', error);
      throw error;
    }
  }

  /**
   * Get user's check-in history
   */
  static async getHistory(): Promise<CheckInHistory[]> {
    try {
      const response = await httpClient.get<CheckInHistory[]>(ENDPOINTS.CHECKIN.HISTORY);

      if (response.success && response.data) {
        // Validate response data
        const history = z.array(CheckInHistorySchema).parse(response.data);
        return history;
      }

      throw new Error(response.error || 'Failed to get check-in history');
    } catch (error) {
      console.error('Get check-in history error:', error);
      throw error;
    }
  }

  /**
   * Quick check-in with automatic service selection
   */
  static async quickCheckIn(
    memberId: string, 
    newBeliever?: boolean
  ): Promise<CheckInResult> {
    try {
      // Get available services
      const services = await this.getServices();
      
      if (services.length === 0) {
        throw new Error('No services available for check-in');
      }

      // Use the most recent service (first in list)
      const service = services[0];

      // Generate client request ID
      const clientRequestId = `checkin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Perform check-in
      return await this.checkIn({
        clientRequestId,
        memberId,
        serviceId: service.id,
        newBeliever,
      });
    } catch (error) {
      console.error('Quick check-in error:', error);
      throw error;
    }
  }
}

export default CheckinService;