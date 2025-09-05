/**
 * Pathways Service
 * Handles pathway progress tracking, step completion, and milestone notifications
 */

import { QueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { database } from '@/lib/db/database';
import { ENDPOINTS } from '@/config/endpoints';
import { 
  MockPathway, 
  PathwayStep, 
  getPathwayById,
  MOCK_PATHWAYS 
} from '@/data/mockPathways';
import { NotificationService } from '@/lib/notifications/notificationService';
import { SentryService } from '@/lib/monitoring/sentryService';
import toast from '@/utils/toast';

const PATHWAYS_CACHE_KEY = 'cached_pathways';
const ACHIEVEMENTS_CACHE_KEY = 'cached_achievements';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export interface StepCompletionAction {
  clientRequestId: string;
  pathwayId: string;
  stepId: string;
  notes?: string;
  timestamp: string;
}

export interface PathwayMilestone {
  pathwayId: string;
  pathwayName: string;
  percentage: number;
  stepName?: string;
  stepNumber?: number;
  totalSteps?: number;
  completedSteps?: number;
}

export interface UserAchievement {
  id: string;
  pathwayId: string;
  pathwayName: string;
  badgeType: 'pathway_started' | 'milestone_25' | 'milestone_50' | 'milestone_75' | 'pathway_completed';
  earnedAt: string;
  description: string;
  iconName: string;
  color: string;
}

class PathwaysService {
  private queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Complete a pathway step with offline support
   */
  async completeStep(
    pathwayId: string, 
    stepId: string, 
    notes?: string
  ): Promise<boolean> {
    const clientRequestId = this.generateRequestId();
    
    const stepCompletion: StepCompletionAction = {
      clientRequestId,
      pathwayId,
      stepId,
      notes,
      timestamp: new Date().toISOString(),
    };

    try {
      // Try online submission first
      await this.submitStepCompletion(stepCompletion);
      
      // Update local state optimistically
      await this.updateLocalStepCompletion(stepCompletion);
      
      // Check for milestones and send notifications
      await this.checkAndNotifyMilestones(pathwayId);
      
      toast.success('Step completed!');
      
      // Invalidate queries to refetch
      this.queryClient.invalidateQueries({ queryKey: ['pathways'] });
      
      return true;
    } catch (error) {
      console.log('Online step completion failed, queuing for offline sync:', error);
      SentryService.captureError(error as Error, {
        feature: 'pathways',
        action: 'complete_step',
        context: { pathwayId, stepId },
      });
      
      // Queue for offline sync
      await database.enqueue('STEP_COMPLETION', stepCompletion);
      
      // Update local state optimistically
      await this.updateLocalStepCompletion(stepCompletion);
      
      toast.info('Step completion queued - will sync when online');
      
      // Invalidate queries to show updated state
      this.queryClient.invalidateQueries({ queryKey: ['pathways'] });
      
      return false; // Indicate it was queued, not completed online
    }
  }

  /**
   * Submit step completion to API
   */
  private async submitStepCompletion(completion: StepCompletionAction): Promise<void> {
    const payload = {
      clientRequestId: completion.clientRequestId,
      pathwayId: completion.pathwayId,
      stepId: completion.stepId,
      notes: completion.notes,
      completedAt: completion.timestamp,
    };

    const response = await apiClient.post(
      ENDPOINTS.PATHWAYS.COMPLETE_STEP(completion.pathwayId),
      payload
    );

    if (!response.success) {
      throw new Error(response.error || 'Step completion failed');
    }
  }

  /**
   * Update local step completion optimistically
   */
  private async updateLocalStepCompletion(completion: StepCompletionAction): Promise<void> {
    try {
      const cachedPathways = await this.getCachedPathways();
      
      const updatedPathways = cachedPathways.map(pathway => {
        if (pathway.id === completion.pathwayId) {
          const updatedPathway = { ...pathway };
          
          // Update the specific step
          updatedPathway.steps = pathway.steps.map(step => {
            if (step.id === completion.stepId && !step.isCompleted) {
              return {
                ...step,
                isCompleted: true,
                completedAt: completion.timestamp,
                notes: completion.notes,
              };
            }
            return step;
          });
          
          // Recalculate progress
          updatedPathway.completedSteps = updatedPathway.steps.filter(s => s.isCompleted).length;
          updatedPathway.progress = (updatedPathway.completedSteps / updatedPathway.totalSteps) * 100;
          
          // Check if pathway is completed
          if (updatedPathway.progress >= 100 && !updatedPathway.completedAt) {
            updatedPathway.completedAt = completion.timestamp;
          }
          
          return updatedPathway;
        }
        return pathway;
      });
      
      // Save updated pathways to cache
      await this.cachePathways(updatedPathways);
    } catch (error) {
      console.error('Failed to update local step completion:', error);
      SentryService.captureError(error as Error, {
        feature: 'pathways',
        action: 'update_local_step',
        context: { pathwayId: completion.pathwayId, stepId: completion.stepId },
      });
    }
  }

  /**
   * Check for milestones and send notifications
   */
  private async checkAndNotifyMilestones(pathwayId: string): Promise<void> {
    try {
      const pathway = await this.getPathway(pathwayId);
      if (!pathway) return;

      const percentage = Math.round(pathway.progress);
      const milestones = [25, 50, 75, 100];
      
      // Check if we just crossed a milestone
      const previousProgress = pathway.completedSteps > 0 
        ? Math.round(((pathway.completedSteps - 1) / pathway.totalSteps) * 100)
        : 0;

      for (const milestone of milestones) {
        if (percentage >= milestone && previousProgress < milestone) {
          await this.notifyMilestone({
            pathwayId: pathway.id,
            pathwayName: pathway.title,
            percentage: milestone,
            stepNumber: pathway.completedSteps,
            totalSteps: pathway.totalSteps,
            completedSteps: pathway.completedSteps,
          });
          
          // Award achievement badge
          await this.awardAchievement(pathway, milestone);
          break; // Only notify the highest milestone reached
        }
      }
    } catch (error) {
      console.error('Failed to check milestones:', error);
      // Don't throw - this is not critical to step completion
    }
  }

  /**
   * Send milestone notification
   */
  private async notifyMilestone(milestone: PathwayMilestone): Promise<void> {
    try {
      await NotificationService.sendPathwayMilestone({
        pathwayId: milestone.pathwayId,
        pathwayName: milestone.pathwayName,
        stepName: '',
        stepNumber: milestone.stepNumber || 0,
        totalSteps: milestone.totalSteps || 0,
        percentage: milestone.percentage,
      });
    } catch (error) {
      console.log('Failed to send milestone notification:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Award achievement badge for milestone
   */
  private async awardAchievement(pathway: MockPathway, percentage: number): Promise<void> {
    try {
      const achievements = await this.getCachedAchievements();
      
      let badgeType: UserAchievement['badgeType'];
      let description: string;
      let iconName: string;
      let color: string;

      switch (percentage) {
        case 25:
          badgeType = 'milestone_25';
          description = '25% Progress in ' + pathway.title;
          iconName = 'progress-check';
          color = '#ff9800';
          break;
        case 50:
          badgeType = 'milestone_50';
          description = 'Halfway Through ' + pathway.title;
          iconName = 'progress-star';
          color = '#2196f3';
          break;
        case 75:
          badgeType = 'milestone_75';
          description = '75% Progress in ' + pathway.title;
          iconName = 'progress-upload';
          color = '#9c27b0';
          break;
        case 100:
          badgeType = 'pathway_completed';
          description = 'Completed ' + pathway.title;
          iconName = 'trophy';
          color = '#4caf50';
          break;
        default:
          return;
      }

      const newAchievement: UserAchievement = {
        id: `${pathway.id}-${badgeType}-${Date.now()}`,
        pathwayId: pathway.id,
        pathwayName: pathway.title,
        badgeType,
        earnedAt: new Date().toISOString(),
        description,
        iconName,
        color,
      };

      // Check if achievement already exists
      const existingAchievement = achievements.find(
        a => a.pathwayId === pathway.id && a.badgeType === badgeType
      );

      if (!existingAchievement) {
        achievements.push(newAchievement);
        await this.cacheAchievements(achievements);
        
        // Show achievement toast
        toast.success(`🏆 Achievement Unlocked: ${description}!`);
      }
    } catch (error) {
      console.error('Failed to award achievement:', error);
    }
  }

  /**
   * Get user's pathway achievements
   */
  async getAchievements(): Promise<UserAchievement[]> {
    try {
      return await this.getCachedAchievements();
    } catch (error) {
      console.error('Failed to get achievements:', error);
      return [];
    }
  }

  /**
   * Enroll user in pathway
   */
  async enrollInPathway(pathwayId: string): Promise<boolean> {
    try {
      // Try API call first
      // const response = await apiClient.post(ENDPOINTS.PATHWAYS.ENROLL(pathwayId), {});
      
      // For now, update local data
      const cachedPathways = await this.getCachedPathways();
      const updatedPathways = cachedPathways.map(pathway => {
        if (pathway.id === pathwayId) {
          return {
            ...pathway,
            isEnrolled: true,
            enrolledAt: new Date().toISOString(),
          };
        }
        return pathway;
      });
      
      await this.cachePathways(updatedPathways);
      
      // Award enrollment achievement
      const pathway = updatedPathways.find(p => p.id === pathwayId);
      if (pathway) {
        await this.awardEnrollmentAchievement(pathway);
      }
      
      toast.success('Enrolled successfully!');
      this.queryClient.invalidateQueries({ queryKey: ['pathways'] });
      
      return true;
    } catch (error) {
      console.error('Failed to enroll in pathway:', error);
      SentryService.captureError(error as Error, {
        feature: 'pathways',
        action: 'enroll',
        context: { pathwayId },
      });
      
      toast.error('Failed to enroll in pathway');
      return false;
    }
  }

  /**
   * Award enrollment achievement
   */
  private async awardEnrollmentAchievement(pathway: MockPathway): Promise<void> {
    try {
      const achievements = await this.getCachedAchievements();
      
      const enrollmentAchievement: UserAchievement = {
        id: `${pathway.id}-pathway_started-${Date.now()}`,
        pathwayId: pathway.id,
        pathwayName: pathway.title,
        badgeType: 'pathway_started',
        earnedAt: new Date().toISOString(),
        description: 'Started ' + pathway.title + ' Pathway',
        iconName: 'rocket-launch',
        color: '#1e7ce8',
      };

      // Check if achievement already exists
      const existingAchievement = achievements.find(
        a => a.pathwayId === pathway.id && a.badgeType === 'pathway_started'
      );

      if (!existingAchievement) {
        achievements.push(enrollmentAchievement);
        await this.cacheAchievements(achievements);
      }
    } catch (error) {
      console.error('Failed to award enrollment achievement:', error);
    }
  }

  /**
   * Get single pathway by ID
   */
  async getPathway(pathwayId: string): Promise<MockPathway | null> {
    try {
      const cachedPathways = await this.getCachedPathways();
      return cachedPathways.find(p => p.id === pathwayId) || null;
    } catch (error) {
      console.error('Failed to get pathway:', error);
      return getPathwayById(pathwayId) || null;
    }
  }

  /**
   * Get all user's pathways
   */
  async getUserPathways(): Promise<MockPathway[]> {
    try {
      return await this.getCachedPathways();
    } catch (error) {
      console.error('Failed to get pathways:', error);
      return MOCK_PATHWAYS;
    }
  }

  /**
   * Sync offline pathway progress
   */
  async syncProgress(): Promise<void> {
    try {
      // Get queued step completions
      const queuedItems = await database.getQueue('STEP_COMPLETION');
      
      for (const item of queuedItems) {
        try {
          await this.submitStepCompletion(item.data as StepCompletionAction);
          await database.removeFromQueue(item.id);
        } catch (error) {
          console.log('Failed to sync step completion:', error);
          // Keep in queue for retry
        }
      }
      
      console.log(`Synced ${queuedItems.length} pathway progress items`);
    } catch (error) {
      console.error('Failed to sync pathway progress:', error);
      SentryService.captureError(error as Error, {
        feature: 'pathways',
        action: 'sync_progress',
      });
    }
  }

  /**
   * Cache pathways in key-value store
   */
  private async cachePathways(pathways: MockPathway[]): Promise<void> {
    const cacheData = {
      pathways,
      timestamp: Date.now(),
    };
    await database.setKV(PATHWAYS_CACHE_KEY, cacheData);
  }

  /**
   * Get cached pathways
   */
  private async getCachedPathways(): Promise<MockPathway[]> {
    try {
      const cached = await database.getKVJson<{
        pathways: MockPathway[];
        timestamp: number;
      }>(PATHWAYS_CACHE_KEY);

      if (!cached) {
        // Initialize with mock data
        await this.cachePathways(MOCK_PATHWAYS);
        return MOCK_PATHWAYS;
      }

      // Check if cache is still valid
      const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
      if (isExpired) {
        console.log('Pathways cache expired');
        return MOCK_PATHWAYS;
      }

      return cached.pathways || MOCK_PATHWAYS;
    } catch (error) {
      console.error('Failed to get cached pathways:', error);
      return MOCK_PATHWAYS;
    }
  }

  /**
   * Cache achievements in key-value store
   */
  private async cacheAchievements(achievements: UserAchievement[]): Promise<void> {
    const cacheData = {
      achievements,
      timestamp: Date.now(),
    };
    await database.setKV(ACHIEVEMENTS_CACHE_KEY, cacheData);
  }

  /**
   * Get cached achievements
   */
  private async getCachedAchievements(): Promise<UserAchievement[]> {
    try {
      const cached = await database.getKVJson<{
        achievements: UserAchievement[];
        timestamp: number;
      }>(ACHIEVEMENTS_CACHE_KEY);

      if (!cached) {
        return [];
      }

      return cached.achievements || [];
    } catch (error) {
      console.error('Failed to get cached achievements:', error);
      return [];
    }
  }

  /**
   * Clear pathways cache
   */
  async clearCache(): Promise<void> {
    await database.deleteKV(PATHWAYS_CACHE_KEY);
    await database.deleteKV(ACHIEVEMENTS_CACHE_KEY);
    this.queryClient.removeQueries({ queryKey: ['pathways'] });
  }

  /**
   * Generate unique request ID for idempotency
   */
  private generateRequestId(): string {
    return `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate accurate progress for pathway
   */
  static calculateProgress(pathway: MockPathway): number {
    if (!pathway.steps || pathway.steps.length === 0) {
      return 0;
    }

    const completedSteps = pathway.steps.filter(step => step.isCompleted).length;
    return Math.round((completedSteps / pathway.steps.length) * 100);
  }

  /**
   * Get next incomplete step for pathway
   */
  static getNextStep(pathway: MockPathway): PathwayStep | null {
    if (!pathway.steps || pathway.steps.length === 0) {
      return null;
    }

    const sortedSteps = [...pathway.steps].sort((a, b) => a.order - b.order);
    return sortedSteps.find(step => !step.isCompleted) || null;
  }
}

// Export singleton instance (will be initialized with queryClient)
export let pathwaysService: PathwaysService;

export const initializePathwaysService = (queryClient: QueryClient) => {
  pathwaysService = new PathwaysService(queryClient);
  return pathwaysService;
};

export default PathwaysService;