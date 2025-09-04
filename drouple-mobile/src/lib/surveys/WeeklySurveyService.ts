/**
 * Weekly Survey Service
 * Triggers weekly satisfaction survey after first Sunday usage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface SurveyTrigger {
  userId: string;
  firstSundayUsage: string;
  surveysCompleted: string[];
  lastSurveyPrompt: string | null;
  optedOut: boolean;
}

interface WeeklySurveyResponse {
  week: number;
  responses: {
    satisfaction: 1 | 2 | 3 | 4 | 5;
    mostUsedFeature: string;
    leastUsedFeature: string;
    improvementSuggestion?: string;
    wouldRecommend: boolean;
    additionalFeedback?: string;
  };
  completedAt: string;
}

class WeeklySurveyService {
  private storageKey = '@drouple_survey_triggers';
  private surveyBaseUrl = 'https://forms.gle/drouple-mobile-survey'; // Replace with actual survey URL

  /**
   * Track Sunday usage to determine survey eligibility
   */
  public async trackSundayUsage(userId: string): Promise<void> {
    try {
      const today = new Date();
      const isSunday = today.getDay() === 0; // Sunday is day 0

      if (!isSunday) {
        return; // Only track Sunday usage
      }

      const trigger = await this.getSurveyTrigger(userId);

      // Set first Sunday usage if not already set
      if (!trigger.firstSundayUsage) {
        trigger.firstSundayUsage = today.toISOString();
        await this.saveSurveyTrigger(userId, trigger);

        console.log(
          `[WeeklySurveyService] First Sunday usage tracked for user: ${userId}`
        );
      }

      // Check if we should prompt for survey
      await this.checkSurveyEligibility(userId);
    } catch (error) {
      console.error(
        '[WeeklySurveyService] Failed to track Sunday usage:',
        error
      );
    }
  }

  /**
   * Check if user is eligible for weekly survey
   */
  public async checkSurveyEligibility(userId: string): Promise<boolean> {
    try {
      const trigger = await this.getSurveyTrigger(userId);

      // Skip if user opted out
      if (trigger.optedOut) {
        return false;
      }

      // Skip if no first Sunday usage tracked
      if (!trigger.firstSundayUsage) {
        return false;
      }

      const firstSunday = new Date(trigger.firstSundayUsage);
      const now = new Date();
      const daysSinceFirst = Math.floor(
        (now.getTime() - firstSunday.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate which week we're in (every 7 days after first Sunday)
      const currentWeek = Math.floor(daysSinceFirst / 7) + 1;

      // Don't survey before first week or after 4 weeks
      if (currentWeek < 1 || currentWeek > 4) {
        return false;
      }

      // Check if already completed survey for this week
      const weekKey = `week_${currentWeek}`;
      if (trigger.surveysCompleted.includes(weekKey)) {
        return false;
      }

      // Check if we already prompted recently (don't spam)
      if (trigger.lastSurveyPrompt) {
        const lastPrompt = new Date(trigger.lastSurveyPrompt);
        const hoursSincePrompt =
          (now.getTime() - lastPrompt.getTime()) / (1000 * 60 * 60);

        // Don't prompt more than once per 48 hours
        if (hoursSincePrompt < 48) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error(
        '[WeeklySurveyService] Failed to check survey eligibility:',
        error
      );
      return false;
    }
  }

  /**
   * Prompt user to take weekly survey
   */
  public async promptWeeklySurvey(userId: string): Promise<void> {
    try {
      const isEligible = await this.checkSurveyEligibility(userId);

      if (!isEligible) {
        return;
      }

      const trigger = await this.getSurveyTrigger(userId);
      const firstSunday = new Date(trigger.firstSundayUsage);
      const daysSinceFirst = Math.floor(
        (Date.now() - firstSunday.getTime()) / (1000 * 60 * 60 * 24)
      );
      const currentWeek = Math.floor(daysSinceFirst / 7) + 1;

      // Update last prompt time
      trigger.lastSurveyPrompt = new Date().toISOString();
      await this.saveSurveyTrigger(userId, trigger);

      // Show survey prompt
      await this.showSurveyPrompt(currentWeek, userId);
    } catch (error) {
      console.error('[WeeklySurveyService] Failed to prompt survey:', error);
    }
  }

  /**
   * Show survey prompt to user
   */
  private async showSurveyPrompt(week: number, userId: string): Promise<void> {
    try {
      // Import Alert dynamically to avoid import issues
      const { Alert } = await import('react-native');

      const surveyUrl = await this.generateSurveyUrl(week, userId);

      Alert.alert(
        '📝 Quick Survey',
        `Hi! You've been using Drouple Mobile for ${week} week${week > 1 ? 's' : ''}. Would you like to share your feedback in a quick 2-minute survey? Your input helps us improve the app!`,
        [
          {
            text: 'Not Now',
            style: 'cancel',
          },
          {
            text: 'No Thanks',
            onPress: () => this.optOutOfSurveys(userId),
          },
          {
            text: 'Take Survey',
            onPress: () => this.openSurvey(surveyUrl, week, userId),
          },
        ]
      );
    } catch (error) {
      console.error(
        '[WeeklySurveyService] Failed to show survey prompt:',
        error
      );
    }
  }

  /**
   * Generate personalized survey URL
   */
  private async generateSurveyUrl(
    week: number,
    userId: string
  ): Promise<string> {
    const params = new URLSearchParams({
      week: week.toString(),
      user_id: userId,
      app_version: await this.getAppVersion(),
      timestamp: new Date().toISOString(),
    });

    return `${this.surveyBaseUrl}?${params.toString()}`;
  }

  /**
   * Open survey in browser
   */
  private async openSurvey(
    url: string,
    week: number,
    userId: string
  ): Promise<void> {
    try {
      // Import Linking dynamically
      const { Linking } = await import('react-native');

      // Open survey in browser
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);

        // Mark survey as completed for this week
        await this.markSurveyCompleted(userId, week);

        console.log(`[WeeklySurveyService] Survey opened for week ${week}`);
      } else {
        console.error('[WeeklySurveyService] Cannot open survey URL');
      }
    } catch (error) {
      console.error('[WeeklySurveyService] Failed to open survey:', error);
    }
  }

  /**
   * Mark survey as completed for a specific week
   */
  private async markSurveyCompleted(
    userId: string,
    week: number
  ): Promise<void> {
    try {
      const trigger = await this.getSurveyTrigger(userId);
      const weekKey = `week_${week}`;

      if (!trigger.surveysCompleted.includes(weekKey)) {
        trigger.surveysCompleted.push(weekKey);
        await this.saveSurveyTrigger(userId, trigger);

        // Track completion analytics
        this.trackSurveyCompletion(userId, week);
      }
    } catch (error) {
      console.error(
        '[WeeklySurveyService] Failed to mark survey completed:',
        error
      );
    }
  }

  /**
   * Opt user out of all future surveys
   */
  private async optOutOfSurveys(userId: string): Promise<void> {
    try {
      const trigger = await this.getSurveyTrigger(userId);
      trigger.optedOut = true;
      await this.saveSurveyTrigger(userId, trigger);

      console.log(`[WeeklySurveyService] User opted out: ${userId}`);

      // Track opt-out analytics
      this.trackSurveyOptOut(userId);
    } catch (error) {
      console.error('[WeeklySurveyService] Failed to opt out user:', error);
    }
  }

  /**
   * Get survey trigger data for user
   */
  private async getSurveyTrigger(userId: string): Promise<SurveyTrigger> {
    try {
      const stored = await AsyncStorage.getItem(`${this.storageKey}_${userId}`);

      if (stored) {
        return JSON.parse(stored);
      }

      // Return default trigger data
      return {
        userId,
        firstSundayUsage: '',
        surveysCompleted: [],
        lastSurveyPrompt: null,
        optedOut: false,
      };
    } catch (error) {
      console.error(
        '[WeeklySurveyService] Failed to get survey trigger:',
        error
      );
      return {
        userId,
        firstSundayUsage: '',
        surveysCompleted: [],
        lastSurveyPrompt: null,
        optedOut: false,
      };
    }
  }

  /**
   * Save survey trigger data for user
   */
  private async saveSurveyTrigger(
    userId: string,
    trigger: SurveyTrigger
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${this.storageKey}_${userId}`,
        JSON.stringify(trigger)
      );
    } catch (error) {
      console.error(
        '[WeeklySurveyService] Failed to save survey trigger:',
        error
      );
    }
  }

  /**
   * Get app version for survey context
   */
  private async getAppVersion(): Promise<string> {
    try {
      const Constants = await import('expo-constants');
      return Constants.default.expoConfig?.version || '1.0.0';
    } catch (error) {
      return '1.0.0';
    }
  }

  /**
   * Track survey completion for analytics
   */
  private trackSurveyCompletion(userId: string, week: number): void {
    try {
      // Send to analytics service
      fetch('/api/mobile/analytics/survey-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          week,
          timestamp: new Date().toISOString(),
          source: 'mobile_app',
        }),
      }).catch(error => {
        console.warn(
          '[WeeklySurveyService] Failed to track survey completion:',
          error
        );
      });
    } catch (error) {
      console.warn('[WeeklySurveyService] Analytics tracking failed:', error);
    }
  }

  /**
   * Track survey opt-out for analytics
   */
  private trackSurveyOptOut(userId: string): void {
    try {
      // Send to analytics service
      fetch('/api/mobile/analytics/survey-opt-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          timestamp: new Date().toISOString(),
          source: 'mobile_app',
        }),
      }).catch(error => {
        console.warn(
          '[WeeklySurveyService] Failed to track survey opt-out:',
          error
        );
      });
    } catch (error) {
      console.warn('[WeeklySurveyService] Analytics tracking failed:', error);
    }
  }

  /**
   * Get user's survey status for debugging
   */
  public async getUserSurveyStatus(userId: string): Promise<{
    eligible: boolean;
    week: number;
    completedSurveys: string[];
    optedOut: boolean;
    daysSinceFirstSunday: number;
  }> {
    try {
      const trigger = await this.getSurveyTrigger(userId);
      const eligible = await this.checkSurveyEligibility(userId);

      let daysSinceFirstSunday = 0;
      let week = 0;

      if (trigger.firstSundayUsage) {
        const firstSunday = new Date(trigger.firstSundayUsage);
        daysSinceFirstSunday = Math.floor(
          (Date.now() - firstSunday.getTime()) / (1000 * 60 * 60 * 24)
        );
        week = Math.floor(daysSinceFirstSunday / 7) + 1;
      }

      return {
        eligible,
        week,
        completedSurveys: trigger.surveysCompleted,
        optedOut: trigger.optedOut,
        daysSinceFirstSunday,
      };
    } catch (error) {
      console.error(
        '[WeeklySurveyService] Failed to get user survey status:',
        error
      );
      return {
        eligible: false,
        week: 0,
        completedSurveys: [],
        optedOut: false,
        daysSinceFirstSunday: 0,
      };
    }
  }

  /**
   * Reset user's survey data (for testing)
   */
  public async resetUserSurveyData(userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.storageKey}_${userId}`);
      console.log(
        `[WeeklySurveyService] Reset survey data for user: ${userId}`
      );
    } catch (error) {
      console.error(
        '[WeeklySurveyService] Failed to reset survey data:',
        error
      );
    }
  }
}

// Singleton instance
export const weeklySurveyService = new WeeklySurveyService();

// Export types
export type { SurveyTrigger, WeeklySurveyResponse };
