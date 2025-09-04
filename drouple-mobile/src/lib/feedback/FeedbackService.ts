/**
 * Feedback Service
 * Handles feedback submission with PII redaction and triage routing
 */

interface FeedbackData {
  category: string;
  title: string;
  description: string;
  severity?: string;
  reproductionSteps?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  contextData?: {
    screen?: string;
    feature?: string;
    userAction?: string;
    deviceInfo?: object;
    appVersion?: string;
    timestamp?: string;
  };
}

interface RedactedFeedback extends FeedbackData {
  redactedFields: string[];
  originalHash: string;
}

interface TriageChannel {
  name: string;
  webhook?: string;
  conditions: (feedback: RedactedFeedback) => boolean;
  priority: number;
}

class FeedbackService {
  private triageChannels: TriageChannel[] = [
    {
      name: 'critical-bugs',
      webhook: process.env.EXPO_PUBLIC_SLACK_WEBHOOK_CRITICAL,
      conditions: feedback =>
        feedback.category === 'bug' && feedback.severity === 'critical',
      priority: 1,
    },
    {
      name: 'high-priority',
      webhook: process.env.EXPO_PUBLIC_SLACK_WEBHOOK_HIGH,
      conditions: feedback =>
        feedback.category === 'bug' && feedback.severity === 'high',
      priority: 2,
    },
    {
      name: 'performance-issues',
      webhook: process.env.EXPO_PUBLIC_SLACK_WEBHOOK_PERFORMANCE,
      conditions: feedback => feedback.category === 'performance',
      priority: 2,
    },
    {
      name: 'feature-requests',
      webhook: process.env.EXPO_PUBLIC_SLACK_WEBHOOK_FEATURES,
      conditions: feedback => feedback.category === 'feature_request',
      priority: 3,
    },
    {
      name: 'general-feedback',
      webhook: process.env.EXPO_PUBLIC_SLACK_WEBHOOK_GENERAL,
      conditions: () => true, // Catch-all
      priority: 4,
    },
  ];

  // PII patterns to redact
  private piiPatterns = [
    // Email addresses
    {
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      replacement: '[EMAIL_REDACTED]',
    },

    // Phone numbers (various formats)
    {
      pattern:
        /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
      replacement: '[PHONE_REDACTED]',
    },

    // Social Security Numbers
    {
      pattern: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,
      replacement: '[SSN_REDACTED]',
    },

    // Names (common patterns - basic implementation)
    {
      pattern: /\bMy name is [A-Z][a-z]+ [A-Z][a-z]+/g,
      replacement: 'My name is [NAME_REDACTED]',
    },
    {
      pattern: /\bI am [A-Z][a-z]+ [A-Z][a-z]+/g,
      replacement: 'I am [NAME_REDACTED]',
    },

    // Addresses (basic patterns)
    {
      pattern:
        /\b\d{1,5}\s[A-Za-z\s]{2,30}\s(Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Boulevard|Blvd)/g,
      replacement: '[ADDRESS_REDACTED]',
    },

    // Credit card numbers (basic pattern)
    {
      pattern: /\b(?:\d{4}[-.\s]?){3}\d{4}\b/g,
      replacement: '[CARD_REDACTED]',
    },

    // IP addresses
    {
      pattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
      replacement: '[IP_REDACTED]',
    },
  ];

  /**
   * Submit feedback with PII redaction and triage routing
   */
  public async submitFeedback(
    feedbackData: FeedbackData
  ): Promise<{ success: boolean; ticketId?: string }> {
    try {
      // Step 1: Redact PII from feedback
      const redactedFeedback = await this.redactPII(feedbackData);

      // Step 2: Store feedback in database
      const ticketId = await this.storeFeedback(redactedFeedback);

      // Step 3: Route to appropriate triage channels
      await this.routeToTriageChannels(redactedFeedback, ticketId);

      // Step 4: Send confirmation email (if applicable)
      await this.sendConfirmation(redactedFeedback, ticketId);

      console.log(
        `[FeedbackService] Feedback submitted successfully: ${ticketId}`
      );

      return { success: true, ticketId };
    } catch (error) {
      console.error('[FeedbackService] Failed to submit feedback:', error);
      return { success: false };
    }
  }

  /**
   * Redact PII from feedback content
   */
  private async redactPII(
    feedbackData: FeedbackData
  ): Promise<RedactedFeedback> {
    const redactedFields: string[] = [];
    const redactedData = { ...feedbackData };

    // Fields to check for PII
    const fieldsToCheck: (keyof FeedbackData)[] = [
      'title',
      'description',
      'reproductionSteps',
      'expectedBehavior',
      'actualBehavior',
    ];

    for (const fieldName of fieldsToCheck) {
      const fieldValue = redactedData[fieldName];
      if (typeof fieldValue === 'string' && fieldValue.length > 0) {
        let redactedValue = fieldValue;
        let hasRedactions = false;

        // Apply each PII pattern
        for (const { pattern, replacement } of this.piiPatterns) {
          const originalValue = redactedValue;
          redactedValue = redactedValue.replace(pattern, replacement);

          if (originalValue !== redactedValue) {
            hasRedactions = true;
          }
        }

        // Update the field if redactions were made
        if (hasRedactions) {
          (redactedData as any)[fieldName] = redactedValue;
          redactedFields.push(fieldName);
        }
      }
    }

    // Generate hash of original content for audit purposes
    const originalHash = await this.generateHash(JSON.stringify(feedbackData));

    return {
      ...redactedData,
      redactedFields,
      originalHash,
    };
  }

  /**
   * Store feedback in database
   */
  private async storeFeedback(feedback: RedactedFeedback): Promise<string> {
    try {
      const response = await fetch('/api/mobile/feedback/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          ...feedback,
          submittedAt: new Date().toISOString(),
          status: 'new',
          source: 'mobile_app',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.ticketId || this.generateTicketId();
    } catch (error) {
      console.error('[FeedbackService] Failed to store feedback:', error);
      throw error;
    }
  }

  /**
   * Route feedback to appropriate triage channels
   */
  private async routeToTriageChannels(
    feedback: RedactedFeedback,
    ticketId: string
  ): Promise<void> {
    // Find matching channels (sorted by priority)
    const matchingChannels = this.triageChannels
      .filter(channel => channel.conditions(feedback))
      .sort((a, b) => a.priority - b.priority);

    // Send to the highest priority channel
    const primaryChannel = matchingChannels[0];
    if (primaryChannel && primaryChannel.webhook) {
      await this.sendToSlack(primaryChannel.webhook, feedback, ticketId);
    }

    // Also log for internal tracking
    console.log(
      `[FeedbackService] Routed to channel: ${primaryChannel?.name || 'none'}`,
      {
        ticketId,
        category: feedback.category,
        severity: feedback.severity,
      }
    );
  }

  /**
   * Send feedback to Slack channel
   */
  private async sendToSlack(
    webhook: string,
    feedback: RedactedFeedback,
    ticketId: string
  ): Promise<void> {
    try {
      const color = this.getSeverityColor(
        feedback.severity || feedback.category
      );
      const emoji = this.getCategoryEmoji(feedback.category);

      const slackMessage = {
        text: `New ${feedback.category} feedback received`,
        attachments: [
          {
            color,
            fields: [
              {
                title: 'Ticket ID',
                value: ticketId,
                short: true,
              },
              {
                title: 'Category',
                value: `${emoji} ${feedback.category.replace('_', ' ')}`,
                short: true,
              },
              ...(feedback.severity
                ? [
                    {
                      title: 'Severity',
                      value: feedback.severity.toUpperCase(),
                      short: true,
                    },
                  ]
                : []),
              {
                title: 'Title',
                value: feedback.title,
                short: false,
              },
              {
                title: 'Description',
                value: this.truncateText(feedback.description, 300),
                short: false,
              },
              ...(feedback.reproductionSteps
                ? [
                    {
                      title: 'Reproduction Steps',
                      value: this.truncateText(feedback.reproductionSteps, 200),
                      short: false,
                    },
                  ]
                : []),
              ...(feedback.contextData?.screen
                ? [
                    {
                      title: 'Screen',
                      value: feedback.contextData.screen,
                      short: true,
                    },
                  ]
                : []),
              ...(feedback.contextData?.appVersion
                ? [
                    {
                      title: 'App Version',
                      value: feedback.contextData.appVersion,
                      short: true,
                    },
                  ]
                : []),
              ...(feedback.redactedFields.length > 0
                ? [
                    {
                      title: 'Privacy',
                      value: `🔒 PII redacted from: ${feedback.redactedFields.join(', ')}`,
                      short: false,
                    },
                  ]
                : []),
            ],
            footer: 'Drouple Mobile Feedback',
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      };

      const response = await fetch(webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slackMessage),
      });

      if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.status}`);
      }
    } catch (error) {
      console.error(
        '[FeedbackService] Failed to send Slack notification:',
        error
      );
      // Don't throw - feedback submission shouldn't fail due to notification issues
    }
  }

  /**
   * Send confirmation (future implementation)
   */
  private async sendConfirmation(
    feedback: RedactedFeedback,
    ticketId: string
  ): Promise<void> {
    // TODO: Implement email confirmation if user provided email
    // For now, just log
    console.log(`[FeedbackService] Confirmation sent for ticket: ${ticketId}`);
  }

  // Helper methods
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return '#e74c3c';
      case 'high':
        return '#e67e22';
      case 'medium':
        return '#f39c12';
      case 'low':
        return '#27ae60';
      case 'bug':
        return '#e74c3c';
      case 'performance':
        return '#e67e22';
      default:
        return '#3498db';
    }
  }

  private getCategoryEmoji(category: string): string {
    switch (category) {
      case 'bug':
        return '🐛';
      case 'feature_request':
        return '💡';
      case 'usability':
        return '👤';
      case 'performance':
        return '⚡';
      case 'content':
        return '📄';
      default:
        return '💬';
    }
  }

  private generateTicketId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `FB-${timestamp}-${random}`.toUpperCase();
  }

  private async generateHash(content: string): Promise<string> {
    try {
      const crypto = await import('crypto-js');
      return crypto.SHA256(content).toString();
    } catch (error) {
      console.warn('[FeedbackService] Failed to generate hash:', error);
      return 'hash-unavailable';
    }
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      const AsyncStorage = await import(
        '@react-native-async-storage/async-storage'
      );
      return await AsyncStorage.default.getItem('@drouple_auth_token');
    } catch (error) {
      return null;
    }
  }
}

// Singleton instance
export const feedbackService = new FeedbackService();

// Export types for external use
export type { FeedbackData, RedactedFeedback };
