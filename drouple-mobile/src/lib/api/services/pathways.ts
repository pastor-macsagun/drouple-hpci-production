/**
 * Pathways API Service
 * Real backend integration for discipleship pathways
 */

import { apiClient } from '../client';
import type { ApiResponse } from '../contracts';

// Types
export interface Pathway {
  id: string;
  title: string;
  description: string;
  category: 'spiritual_growth' | 'ministry' | 'leadership' | 'service';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: string;
  totalSteps: number;
  completedSteps: number;
  isEnrolled: boolean;
  progress: number;
  tags: string[];
  prerequisites: string[];
  imageUrl?: string;
  churchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface PathwayStep {
  id: string;
  pathwayId: string;
  order: number;
  title: string;
  description: string;
  content?: string;
  estimatedDuration?: string;
  resources?: {
    title: string;
    description?: string;
    type: 'video' | 'document' | 'book' | 'website' | 'audio';
    url?: string;
  }[];
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PathwayEnrollment {
  id: string;
  pathwayId: string;
  userId: string;
  enrolledAt: string;
  completedAt?: string;
  progress: number;
  currentStepId?: string;
  isActive: boolean;
}

export interface CreatePathwayRequest {
  title: string;
  description: string;
  category: Pathway['category'];
  difficulty: Pathway['difficulty'];
  estimatedDuration: string;
  tags?: string[];
  prerequisites?: string[];
  imageUrl?: string;
  steps: {
    title: string;
    description: string;
    content?: string;
    estimatedDuration?: string;
    resources?: PathwayStep['resources'];
  }[];
}

export interface UpdatePathwayRequest
  extends Partial<Omit<CreatePathwayRequest, 'steps'>> {
  isActive?: boolean;
}

export interface CreateStepRequest {
  pathwayId: string;
  title: string;
  description: string;
  content?: string;
  estimatedDuration?: string;
  resources?: PathwayStep['resources'];
  order?: number;
}

export interface UpdateStepRequest
  extends Partial<Omit<CreateStepRequest, 'pathwayId'>> {}

export interface CompleteStepRequest {
  stepId: string;
  notes?: string;
}

export interface PathwaysQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: Pathway['category'];
  difficulty?: Pathway['difficulty'];
  enrolled?: boolean;
  completed?: boolean;
  available?: boolean;
  churchId?: string;
}

// Pathways API Service
export class PathwaysApiService {
  /**
   * Get pathways list with filtering
   */
  async getPathways(query: PathwaysQuery = {}): Promise<
    ApiResponse<{
      pathways: Pathway[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  > {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const endpoint = queryString ? `/pathways?${queryString}` : '/pathways';

    return apiClient.get(endpoint, { cache: true, cacheTTL: 5 * 60 * 1000 });
  }

  /**
   * Get single pathway by ID
   */
  async getPathway(pathwayId: string): Promise<
    ApiResponse<
      Pathway & {
        steps: PathwayStep[];
        enrollment?: PathwayEnrollment;
      }
    >
  > {
    return apiClient.get(`/pathways/${pathwayId}`, {
      cache: true,
      cacheTTL: 2 * 60 * 1000,
    });
  }

  /**
   * Create new pathway (admin/leader only)
   */
  async createPathway(
    request: CreatePathwayRequest
  ): Promise<ApiResponse<Pathway>> {
    return apiClient.post('/pathways', request, {
      idempotencyKey: apiClient.generateIdempotencyKey(),
    });
  }

  /**
   * Update existing pathway (admin/leader only)
   */
  async updatePathway(
    pathwayId: string,
    request: UpdatePathwayRequest
  ): Promise<ApiResponse<Pathway>> {
    return apiClient.put(`/pathways/${pathwayId}`, request);
  }

  /**
   * Delete pathway (admin/leader only)
   */
  async deletePathway(
    pathwayId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/pathways/${pathwayId}`, {
      idempotencyKey: apiClient.generateIdempotencyKey(),
    });
  }

  /**
   * Enroll in pathway
   */
  async enrollInPathway(
    pathwayId: string
  ): Promise<ApiResponse<PathwayEnrollment>> {
    return apiClient.post(`/pathways/${pathwayId}/enroll`, null, {
      idempotencyKey: apiClient.generateIdempotencyKey(),
    });
  }

  /**
   * Unenroll from pathway
   */
  async unenrollFromPathway(
    pathwayId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/pathways/${pathwayId}/enroll`, {
      idempotencyKey: apiClient.generateIdempotencyKey(),
    });
  }

  /**
   * Get pathway steps
   */
  async getPathwaySteps(
    pathwayId: string
  ): Promise<ApiResponse<PathwayStep[]>> {
    return apiClient.get(`/pathways/${pathwayId}/steps`, {
      cache: true,
      cacheTTL: 5 * 60 * 1000,
    });
  }

  /**
   * Create pathway step (admin/leader only)
   */
  async createStep(
    request: CreateStepRequest
  ): Promise<ApiResponse<PathwayStep>> {
    return apiClient.post(`/pathways/${request.pathwayId}/steps`, request, {
      idempotencyKey: apiClient.generateIdempotencyKey(),
    });
  }

  /**
   * Update pathway step (admin/leader only)
   */
  async updateStep(
    pathwayId: string,
    stepId: string,
    request: UpdateStepRequest
  ): Promise<ApiResponse<PathwayStep>> {
    return apiClient.put(`/pathways/${pathwayId}/steps/${stepId}`, request);
  }

  /**
   * Delete pathway step (admin/leader only)
   */
  async deleteStep(
    pathwayId: string,
    stepId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/pathways/${pathwayId}/steps/${stepId}`, {
      idempotencyKey: apiClient.generateIdempotencyKey(),
    });
  }

  /**
   * Reorder pathway steps (admin/leader only)
   */
  async reorderSteps(
    pathwayId: string,
    stepOrders: { stepId: string; order: number }[]
  ): Promise<ApiResponse<PathwayStep[]>> {
    return apiClient.patch(`/pathways/${pathwayId}/steps/reorder`, {
      stepOrders,
    });
  }

  /**
   * Complete pathway step
   */
  async completeStep(
    pathwayId: string,
    request: CompleteStepRequest
  ): Promise<ApiResponse<PathwayStep>> {
    return apiClient.post(
      `/pathways/${pathwayId}/steps/${request.stepId}/complete`,
      {
        notes: request.notes,
      },
      {
        idempotencyKey: apiClient.generateIdempotencyKey(),
      }
    );
  }

  /**
   * Uncomplete pathway step
   */
  async uncompleteStep(
    pathwayId: string,
    stepId: string
  ): Promise<ApiResponse<PathwayStep>> {
    return apiClient.delete(`/pathways/${pathwayId}/steps/${stepId}/complete`, {
      idempotencyKey: apiClient.generateIdempotencyKey(),
    });
  }

  /**
   * Get user's enrolled pathways
   */
  async getEnrolledPathways(): Promise<
    ApiResponse<
      (PathwayEnrollment & {
        pathway: Pathway;
        currentStep?: PathwayStep;
      })[]
    >
  > {
    return apiClient.get('/pathways/enrolled');
  }

  /**
   * Get user's completed pathways
   */
  async getCompletedPathways(): Promise<
    ApiResponse<
      (PathwayEnrollment & {
        pathway: Pathway;
      })[]
    >
  > {
    return apiClient.get('/pathways/completed');
  }

  /**
   * Get available pathways for user
   */
  async getAvailablePathways(limit?: number): Promise<ApiResponse<Pathway[]>> {
    const params = limit ? `?limit=${limit}` : '';
    return apiClient.get(`/pathways/available${params}`, {
      cache: true,
      cacheTTL: 5 * 60 * 1000,
    });
  }

  /**
   * Get pathway enrollments (admin/leader only)
   */
  async getPathwayEnrollments(
    pathwayId: string,
    query?: {
      page?: number;
      limit?: number;
      completed?: boolean;
    }
  ): Promise<
    ApiResponse<{
      enrollments: (PathwayEnrollment & {
        user: {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
        };
      })[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  > {
    const params = new URLSearchParams();

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const endpoint = queryString
      ? `/pathways/${pathwayId}/enrollments?${queryString}`
      : `/pathways/${pathwayId}/enrollments`;

    return apiClient.get(endpoint);
  }

  /**
   * Export pathway data (admin/leader only)
   */
  async exportPathwayData(
    pathwayId: string,
    format: 'csv' | 'json' = 'csv'
  ): Promise<
    ApiResponse<{
      downloadUrl: string;
      fileName: string;
    }>
  > {
    return apiClient.post(
      `/pathways/${pathwayId}/export`,
      { format },
      {
        idempotencyKey: apiClient.generateIdempotencyKey(),
      }
    );
  }

  /**
   * Get pathway statistics (admin/leader only)
   */
  async getPathwayStats(pathwayId: string): Promise<
    ApiResponse<{
      totalEnrollments: number;
      activeEnrollments: number;
      completedEnrollments: number;
      completionRate: number;
      averageProgress: number;
      averageCompletionTime: number;
      stepCompletionRates: {
        stepId: string;
        stepTitle: string;
        completionRate: number;
      }[];
      enrollmentTrends: {
        month: string;
        enrollments: number;
        completions: number;
      }[];
    }>
  > {
    return apiClient.get(`/pathways/${pathwayId}/stats`);
  }

  /**
   * Search pathways
   */
  async searchPathways(
    query: string,
    filters?: {
      category?: Pathway['category'];
      difficulty?: Pathway['difficulty'];
      duration?: 'short' | 'medium' | 'long';
      hasPrerequisites?: boolean;
    }
  ): Promise<ApiResponse<Pathway[]>> {
    const params = new URLSearchParams({ q: query });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    return apiClient.get(`/pathways/search?${params.toString()}`, {
      cache: true,
      cacheTTL: 60 * 1000, // 1 minute cache
    });
  }

  /**
   * Get recommended pathways for user
   */
  async getRecommendedPathways(limit = 5): Promise<ApiResponse<Pathway[]>> {
    return apiClient.get(`/pathways/recommended?limit=${limit}`, {
      cache: true,
      cacheTTL: 10 * 60 * 1000, // 10 minutes cache
    });
  }

  /**
   * Get pathway progress summary
   */
  async getProgressSummary(): Promise<
    ApiResponse<{
      totalEnrolled: number;
      totalCompleted: number;
      inProgress: number;
      totalStepsCompleted: number;
      currentPathway?: Pathway & { progress: number; nextStep?: PathwayStep };
      recentlyCompleted: Pathway[];
    }>
  > {
    return apiClient.get('/pathways/progress-summary');
  }
}

// Create singleton instance
export const pathwaysService = new PathwaysApiService();
