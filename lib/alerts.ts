/**
 * Production Monitoring and Alert System
 * Handles critical alerts, notifications, and incident response
 */

import { logger } from './logger';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SystemMetrics {
  timestamp: string;
  errorRate: number;
  averageResponseTime: number;
  memoryUsage: number;
  databaseHealthy: boolean;
  failedRegistrations: number;
  deploymentFailed: boolean;
  requestsPerMinute: number;
  activeUsers: number;
  uptime: number;
  internalToken?: unknown;
  apiKeys?: unknown;
  [key: string]: unknown;
}


export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  category: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: Record<string, unknown>;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: (metric: SystemMetrics) => boolean;
  severity: AlertSeverity;
  cooldownMinutes: number;
  enabled: boolean;
}

export interface NotificationChannel {
  id: string;
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, unknown>;
  enabled: boolean;
  severityFilter: AlertSeverity[];
}

class AlertManager {
  private alerts = new Map<string, Alert>();
  private alertRules = new Map<string, AlertRule>();
  private notificationChannels = new Map<string, NotificationChannel>();
  private lastAlertTimes = new Map<string, number>();

  constructor() {
    this.initializeDefaultRules();
    this.initializeNotificationChannels();
    
    // Start alert processing
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.processMetrics(), 30000); // Every 30 seconds
    }
  }

  /**
   * Initialize default alerting rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        description: 'Error rate exceeds 5% over 5 minutes',
        condition: (metrics) => metrics.errorRate > 0.05,
        severity: 'critical',
        cooldownMinutes: 15,
        enabled: true,
      },
      {
        id: 'database_connection_failure',
        name: 'Database Connection Failure',
        description: 'Database connectivity issues detected',
        condition: (metrics) => !metrics.databaseHealthy,
        severity: 'critical',
        cooldownMinutes: 5,
        enabled: true,
      },
      {
        id: 'slow_response_time',
        name: 'Slow Response Time',
        description: 'Average response time exceeds 2 seconds',
        condition: (metrics) => metrics.averageResponseTime > 2000,
        severity: 'high',
        cooldownMinutes: 10,
        enabled: true,
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        description: 'Memory usage exceeds 90%',
        condition: (metrics) => metrics.memoryUsage > 0.9,
        severity: 'high',
        cooldownMinutes: 15,
        enabled: true,
      },
      {
        id: 'failed_user_registrations',
        name: 'Failed User Registrations',
        description: 'High rate of failed user registrations',
        condition: (metrics) => metrics.failedRegistrations > 10,
        severity: 'medium',
        cooldownMinutes: 30,
        enabled: true,
      },
      {
        id: 'deployment_failure',
        name: 'Deployment Failure',
        description: 'Production deployment failed',
        condition: (metrics) => metrics.deploymentFailed,
        severity: 'critical',
        cooldownMinutes: 1,
        enabled: true,
      },
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });
  }

  /**
   * Initialize notification channels
   */
  private initializeNotificationChannels(): void {
    // Email notifications
    if (process.env.ALERT_EMAIL_TO) {
      this.notificationChannels.set('email_critical', {
        id: 'email_critical',
        type: 'email',
        config: {
          to: process.env.ALERT_EMAIL_TO,
          from: process.env.EMAIL_FROM || 'alerts@hpci-chms.com',
          smtp: {
            host: process.env.EMAIL_SERVER_HOST,
            port: process.env.EMAIL_SERVER_PORT,
            user: process.env.EMAIL_SERVER_USER,
            password: process.env.EMAIL_SERVER_PASSWORD,
          },
        },
        enabled: true,
        severityFilter: ['critical', 'high'],
      });
    }

    // Slack notifications
    if (process.env.SLACK_WEBHOOK_URL) {
      this.notificationChannels.set('slack_all', {
        id: 'slack_all',
        type: 'slack',
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: process.env.SLACK_CHANNEL || '#alerts',
        },
        enabled: true,
        severityFilter: ['critical', 'high', 'medium'],
      });
    }

    // Generic webhook
    if (process.env.ALERT_WEBHOOK_URL) {
      this.notificationChannels.set('webhook_all', {
        id: 'webhook_all',
        type: 'webhook',
        config: {
          url: process.env.ALERT_WEBHOOK_URL,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.ALERT_WEBHOOK_TOKEN || '',
          },
        },
        enabled: true,
        severityFilter: ['critical', 'high', 'medium', 'low'],
      });
    }
  }

  /**
   * Create and process an alert
   */
  async createAlert(
    severity: AlertSeverity,
    title: string,
    message: string,
    category: string = 'system',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const alertId = `${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: Alert = {
      id: alertId,
      severity,
      title,
      message,
      category,
      timestamp: new Date(),
      resolved: false,
      metadata,
    };

    this.alerts.set(alertId, alert);
    
    logger.warn('Alert Created', {
      alertId,
      severity,
      title,
      category,
    });

    // Send notifications
    await this.sendNotifications(alert);

    // Log to monitoring service
    await this.logToMonitoring(alert);
  }

  /**
   * Process metrics and check alert rules
   */
  private async processMetrics(): Promise<void> {
    try {
      // Get current metrics (would integrate with actual metrics collection)
      const metrics = await this.getCurrentMetrics();
      
      // Check each alert rule
      for (const [ruleId, rule] of this.alertRules.entries()) {
        if (!rule.enabled) continue;

        const lastAlertTime = this.lastAlertTimes.get(ruleId) || 0;
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        
        // Check cooldown period
        if (Date.now() - lastAlertTime < cooldownMs) {
          continue;
        }

        // Evaluate condition
        if (rule.condition(metrics)) {
          await this.createAlert(
            rule.severity,
            rule.name,
            rule.description,
            'automated',
            { ruleId, metrics: this.sanitizeMetrics(metrics) }
          );
          
          this.lastAlertTimes.set(ruleId, Date.now());
        }
      }
    } catch (error) {
      logger.error('Failed to process metrics for alerts', { error });
    }
  }

  /**
   * Get current system metrics
   */
  private async getCurrentMetrics(): Promise<SystemMetrics> {
    // In production, this would collect real metrics
    // For now, return mock data that can be extended
    const metrics = {
      timestamp: new Date().toISOString(),
      errorRate: 0.001, // 0.1% error rate
      averageResponseTime: 250, // 250ms
      memoryUsage: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal,
      databaseHealthy: true,
      failedRegistrations: 0,
      deploymentFailed: false,
      requestsPerMinute: 100,
      activeUsers: 50,
      uptime: process.uptime(),
    };

    // Add database health check
    try {
      const { performHealthCheck } = await import('./monitoring');
      const healthResult = await performHealthCheck();
      metrics.databaseHealthy = healthResult.status === 'healthy';
    } catch {
      metrics.databaseHealthy = false;
    }

    return metrics;
  }

  /**
   * Sanitize metrics for logging (remove sensitive data)
   */
  private sanitizeMetrics(metrics: SystemMetrics): SystemMetrics {
    const sanitized = { ...metrics };
    
    // Remove or redact sensitive fields
    delete sanitized.internalToken;
    delete sanitized.apiKeys;
    
    return sanitized;
  }

  /**
   * Send notifications for an alert
   */
  private async sendNotifications(alert: Alert): Promise<void> {
    const promises = Array.from(this.notificationChannels.values())
      .filter(channel => 
        channel.enabled && 
        channel.severityFilter.includes(alert.severity)
      )
      .map(channel => this.sendNotification(channel, alert));

    await Promise.allSettled(promises);
  }

  /**
   * Send notification to a specific channel
   */
  private async sendNotification(
    channel: NotificationChannel, 
    alert: Alert
  ): Promise<void> {
    try {
      switch (channel.type) {
        case 'email':
          await this.sendEmailNotification(channel, alert);
          break;
        case 'slack':
          await this.sendSlackNotification(channel, alert);
          break;
        case 'webhook':
          await this.sendWebhookNotification(channel, alert);
          break;
        case 'sms':
          await this.sendSMSNotification(channel, alert);
          break;
      }
      
      logger.info('Notification sent', {
        channel: channel.id,
        alert: alert.id,
        severity: alert.severity,
      });
    } catch (error) {
      logger.error('Failed to send notification', {
        channel: channel.id,
        alert: alert.id,
        error,
      });
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    channel: NotificationChannel, 
    alert: Alert
  ): Promise<void> {
    // Implementation would use nodemailer or Resend
    const subject = `🚨 HPCI-ChMS Alert: ${alert.title}`;
    const body = `
      Alert Details:
      - Severity: ${alert.severity.toUpperCase()}
      - Title: ${alert.title}
      - Message: ${alert.message}
      - Category: ${alert.category}
      - Timestamp: ${alert.timestamp.toISOString()}
      
      ${alert.metadata ? JSON.stringify(alert.metadata, null, 2) : ''}
    `;

    // For production, implement actual email sending
    console.log('Email notification:', { subject, body });
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(
    channel: NotificationChannel, 
    alert: Alert
  ): Promise<void> {
    const severityEmoji = {
      critical: '🔥',
      high: '⚠️',
      medium: '⚡',
      low: 'ℹ️',
      info: '💡',
    };

    const payload = {
      channel: channel.config.channel,
      username: 'HPCI-ChMS Alerts',
      icon_emoji: ':warning:',
      attachments: [{
        color: alert.severity === 'critical' ? 'danger' : 
               alert.severity === 'high' ? 'warning' : 'good',
        title: `${severityEmoji[alert.severity]} ${alert.title}`,
        text: alert.message,
        fields: [
          { title: 'Severity', value: alert.severity, short: true },
          { title: 'Category', value: alert.category, short: true },
          { title: 'Timestamp', value: alert.timestamp.toISOString(), short: false },
        ],
        timestamp: Math.floor(alert.timestamp.getTime() / 1000),
      }],
    };

    // For production, implement actual Slack webhook call
    console.log('Slack notification:', payload);
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    channel: NotificationChannel, 
    alert: Alert
  ): Promise<void> {
    const payload = {
      alert_id: alert.id,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      category: alert.category,
      timestamp: alert.timestamp.toISOString(),
      metadata: alert.metadata,
      system: 'hpci-chms',
    };

    // For production, implement actual HTTP request
    console.log('Webhook notification:', { url: channel.config.url, payload });
  }

  /**
   * Send SMS notification (for critical alerts)
   */
  private async sendSMSNotification(
    channel: NotificationChannel, 
    alert: Alert
  ): Promise<void> {
    const message = `HPCI-ChMS ${alert.severity.toUpperCase()}: ${alert.title} - ${alert.message}`;
    
    // For production, implement actual SMS sending (Twilio, etc.)
    console.log('SMS notification:', { to: channel.config.phoneNumber, message });
  }

  /**
   * Log alert to monitoring service
   */
  private async logToMonitoring(alert: Alert): Promise<void> {
    try {
      // Log alert details
      logger.info('Alert triggered', {
        severity: alert.severity,
        category: alert.category,
        title: alert.title,
        message: alert.message,
        metadata: alert.metadata
      });
    } catch (error) {
      logger.error('Failed to log alert to monitoring service', { error });
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, resolvedBy?: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      
      logger.info('Alert resolved', { alertId, resolvedBy });
      
      // Send resolution notification for critical alerts
      if (alert.severity === 'critical') {
        await this.createAlert(
          'info',
          `Resolved: ${alert.title}`,
          `Alert has been resolved by ${resolvedBy || 'system'}`,
          'resolution',
          { originalAlert: alertId }
        );
      }
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
  }

  /**
   * Get alert statistics
   */
  getAlertStats(): {
    total: number;
    active: number;
    resolved: number;
    bySeverity: Record<AlertSeverity, number>;
  } {
    const allAlerts = Array.from(this.alerts.values());
    const activeAlerts = allAlerts.filter(a => !a.resolved);
    
    const bySeverity: Record<AlertSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };
    
    activeAlerts.forEach(alert => {
      bySeverity[alert.severity]++;
    });

    return {
      total: allAlerts.length,
      active: activeAlerts.length,
      resolved: allAlerts.filter(a => a.resolved).length,
      bySeverity,
    };
  }
}

// Global alert manager instance
export const alertManager = new AlertManager();

// Convenience functions
export const createAlert = (
  severity: AlertSeverity,
  title: string,
  message: string,
  category?: string,
  metadata?: Record<string, unknown>
) => alertManager.createAlert(severity, title, message, category, metadata);

export const resolveAlert = (alertId: string, resolvedBy?: string) =>
  alertManager.resolveAlert(alertId, resolvedBy);

export const getActiveAlerts = () => alertManager.getActiveAlerts();

export const getAlertStats = () => alertManager.getAlertStats();