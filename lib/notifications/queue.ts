/**
 * Push Notification Queue System with Bull/Redis
 * Provides reliable at-least-once delivery with retry logic
 */

import Bull, { Queue, Job, JobOptions } from 'bull';
import Redis from 'redis';
import { prisma } from '@/lib/db';
import { 
  sendNotificationToDevice, 
  sendNotificationToDevices,
  sendNotificationToTopic,
  subscribeToTopic,
  unsubscribeFromTopic 
} from './firebase';
import type { 
  PushNotificationPayload,
  NotificationTopic,
  PushNotificationResult,
  DevicePlatform 
} from '@drouple/contracts';

// Redis client for queue
let redisClient: Redis.RedisClientType | null = null;
let notificationQueue: Queue | null = null;

// Job types for type safety
export interface NotificationJobData {
  type: 'single' | 'multiple' | 'topic' | 'subscribe' | 'unsubscribe';
  payload: PushNotificationPayload;
  tokens?: string[];
  token?: string;
  topic?: NotificationTopic;
  platform?: DevicePlatform;
  userId?: string;
  tenantId?: string;
  retryCount?: number;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

/**
 * Initialize Redis client for Bull queue
 */
function initializeRedis(): Redis.RedisClientType {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || process.env.KV_URL || 'redis://localhost:6379';
  
  redisClient = Redis.createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 10000,
      reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
    },
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Redis client connected');
  });

  redisClient.on('reconnecting', () => {
    console.log('Redis client reconnecting...');
  });

  return redisClient;
}

/**
 * Initialize notification queue with Bull
 */
export async function initializeNotificationQueue(): Promise<Queue> {
  if (notificationQueue) {
    return notificationQueue;
  }

  // Skip initialization in test environment
  if (process.env.NODE_ENV === 'test') {
    console.log('Notification queue initialization skipped in test environment');
    return {} as Queue; // Mock queue for tests
  }

  const redis = initializeRedis();
  
  // Connect Redis client
  if (!redis.isOpen) {
    await redis.connect();
  }

  // Create Bull queue with Redis connection
  notificationQueue = new Bull('push-notifications', {
    redis: {
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
      host: process.env.REDIS_HOST || 'localhost',
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 0,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100, // Keep only last 100 completed jobs
      removeOnFail: 50,      // Keep only last 50 failed jobs
    },
  });

  // Set up job processors
  setupJobProcessors();

  console.log('Notification queue initialized');
  return notificationQueue;
}

/**
 * Set up job processors for different notification types
 */
function setupJobProcessors(): void {
  if (!notificationQueue) return;

  // Process single device notifications
  notificationQueue.process('single-device', 10, async (job: Job<NotificationJobData>) => {
    const { token, payload, platform = 'android', userId } = job.data;
    
    if (!token) {
      throw new Error('Device token required');
    }

    console.log(`Processing single device notification: ${job.id}`);
    
    const result = await sendNotificationToDevice(token, payload, platform);
    
    // Log the result
    await logNotificationResult(result, userId);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to send notification');
    }
    
    return result;
  });

  // Process multiple device notifications
  notificationQueue.process('multiple-devices', 5, async (job: Job<NotificationJobData>) => {
    const { tokens, payload, platform = 'android' } = job.data;
    
    if (!tokens || tokens.length === 0) {
      throw new Error('Device tokens required');
    }

    console.log(`Processing multiple device notification: ${job.id} (${tokens.length} devices)`);
    
    const results = await sendNotificationToDevices(tokens, payload, platform);
    
    // Log results
    await Promise.all(results.map(result => logNotificationResult(result)));
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    if (failureCount > 0) {
      console.warn(`Notification job ${job.id}: ${successCount} succeeded, ${failureCount} failed`);
    }
    
    return { successCount, failureCount, results };
  });

  // Process topic notifications
  notificationQueue.process('topic-notification', 5, async (job: Job<NotificationJobData>) => {
    const { topic, payload } = job.data;
    
    if (!topic) {
      throw new Error('Topic required');
    }

    console.log(`Processing topic notification: ${job.id} (topic: ${topic})`);
    
    const result = await sendNotificationToTopic(topic, payload);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to send topic notification');
    }
    
    return result;
  });

  // Process topic subscriptions
  notificationQueue.process('topic-subscription', 5, async (job: Job<NotificationJobData>) => {
    const { tokens, topic, type } = job.data;
    
    if (!tokens || !topic) {
      throw new Error('Tokens and topic required');
    }

    console.log(`Processing topic ${type}: ${job.id} (${tokens.length} devices, topic: ${topic})`);
    
    const result = type === 'subscribe' 
      ? await subscribeToTopic(tokens, topic)
      : await unsubscribeFromTopic(tokens, topic);
    
    if (result.failureCount > 0) {
      console.warn(`Topic ${type} job ${job.id}: ${result.successCount} succeeded, ${result.failureCount} failed`);
    }
    
    return result;
  });

  // Set up global error handler
  notificationQueue.on('failed', (job, err) => {
    console.error(`Notification job ${job.id} failed:`, err);
  });

  notificationQueue.on('completed', (job) => {
    console.log(`Notification job ${job.id} completed`);
  });

  console.log('Notification job processors configured');
}

/**
 * Queue single device notification
 */
export async function queueSingleNotification(
  token: string,
  payload: PushNotificationPayload,
  platform: DevicePlatform = 'android',
  userId?: string,
  options: JobOptions = {}
): Promise<Job<NotificationJobData>> {
  const queue = await initializeNotificationQueue();
  
  if (process.env.NODE_ENV === 'test') {
    // Return mock job for tests
    return { id: `mock_${Date.now()}` } as Job<NotificationJobData>;
  }
  
  const jobData: NotificationJobData = {
    type: 'single',
    token,
    payload,
    platform,
    userId,
  };

  return queue.add('single-device', jobData, {
    priority: getPriorityFromPayload(payload),
    ...options,
  });
}

/**
 * Queue multiple device notifications
 */
export async function queueMultipleNotifications(
  tokens: string[],
  payload: PushNotificationPayload,
  platform: DevicePlatform = 'android',
  options: JobOptions = {}
): Promise<Job<NotificationJobData>> {
  const queue = await initializeNotificationQueue();
  
  if (process.env.NODE_ENV === 'test') {
    // Return mock job for tests
    return { id: `mock_${Date.now()}` } as Job<NotificationJobData>;
  }
  
  const jobData: NotificationJobData = {
    type: 'multiple',
    tokens,
    payload,
    platform,
  };

  return queue.add('multiple-devices', jobData, {
    priority: getPriorityFromPayload(payload),
    ...options,
  });
}

/**
 * Queue topic notification
 */
export async function queueTopicNotification(
  topic: NotificationTopic,
  payload: PushNotificationPayload,
  options: JobOptions = {}
): Promise<Job<NotificationJobData>> {
  const queue = await initializeNotificationQueue();
  
  if (process.env.NODE_ENV === 'test') {
    // Return mock job for tests
    return { id: `mock_${Date.now()}` } as Job<NotificationJobData>;
  }
  
  const jobData: NotificationJobData = {
    type: 'topic',
    topic,
    payload,
  };

  return queue.add('topic-notification', jobData, {
    priority: getPriorityFromPayload(payload),
    ...options,
  });
}

/**
 * Queue topic subscription
 */
export async function queueTopicSubscription(
  tokens: string[],
  topic: NotificationTopic,
  subscribe: boolean = true,
  options: JobOptions = {}
): Promise<Job<NotificationJobData>> {
  const queue = await initializeNotificationQueue();
  
  if (process.env.NODE_ENV === 'test') {
    // Return mock job for tests
    return { id: `mock_${Date.now()}` } as Job<NotificationJobData>;
  }
  
  const jobData: NotificationJobData = {
    type: subscribe ? 'subscribe' : 'unsubscribe',
    tokens,
    topic,
    payload: {} as PushNotificationPayload, // Not used for subscription
  };

  return queue.add('topic-subscription', jobData, options);
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<QueueStats> {
  const queue = await initializeNotificationQueue();
  
  if (process.env.NODE_ENV === 'test') {
    // Return mock stats for tests
    return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
  }

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaiting(),
    queue.getActive(),
    queue.getCompleted(),
    queue.getFailed(),
    queue.getDelayed(),
  ]);

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    delayed: delayed.length,
  };
}

/**
 * Clean failed jobs older than specified time
 */
export async function cleanFailedJobs(olderThanMs: number = 24 * 60 * 60 * 1000): Promise<number> {
  const queue = await initializeNotificationQueue();
  
  if (process.env.NODE_ENV === 'test') {
    return 0;
  }

  const cleanedCount = await queue.clean(olderThanMs, 'failed');
  console.log(`Cleaned ${cleanedCount} failed notification jobs`);
  
  return cleanedCount;
}

/**
 * Get priority from notification payload
 */
function getPriorityFromPayload(payload: PushNotificationPayload): number {
  switch (payload.priority) {
    case 'HIGH': return 10;
    case 'MEDIUM': return 5;
    case 'LOW': return 1;
    default: return 5;
  }
}

/**
 * Log notification result to database
 */
async function logNotificationResult(
  result: PushNotificationResult, 
  userId?: string
): Promise<void> {
  try {
    // Store basic notification log in key-value store
    const logKey = `notification_log:${result.messageId || Date.now()}:${result.token.slice(-8)}`;
    const logData = {
      success: result.success,
      token: result.token.slice(-8), // Only store last 8 chars for privacy
      userId,
      timestamp: new Date().toISOString(),
      error: result.error,
      errorCode: result.errorCode,
    };

    await prisma.keyValue.upsert({
      where: { key: logKey },
      update: { 
        value: JSON.stringify(logData),
        updatedAt: new Date() 
      },
      create: { 
        key: logKey, 
        value: JSON.stringify(logData) 
      },
    });
  } catch (error) {
    console.error('Failed to log notification result:', error);
  }
}

/**
 * Gracefully shutdown notification queue
 */
export async function shutdownNotificationQueue(): Promise<void> {
  if (notificationQueue) {
    console.log('Shutting down notification queue...');
    await notificationQueue.close();
    notificationQueue = null;
  }

  if (redisClient && redisClient.isOpen) {
    console.log('Disconnecting Redis client...');
    await redisClient.disconnect();
    redisClient = null;
  }
}

/**
 * Health check for notification queue
 */
export async function checkQueueHealth(): Promise<{
  healthy: boolean;
  redis: boolean;
  queue: boolean;
  error?: string;
}> {
  try {
    // Check Redis connection
    const redis = initializeRedis();
    let redisHealthy = false;
    
    try {
      if (!redis.isOpen) {
        await redis.connect();
      }
      await redis.ping();
      redisHealthy = true;
    } catch (error) {
      console.error('Redis health check failed:', error);
    }

    // Check queue
    let queueHealthy = false;
    try {
      const queue = await initializeNotificationQueue();
      await queue.getWaiting(); // Simple operation to test queue
      queueHealthy = true;
    } catch (error) {
      console.error('Queue health check failed:', error);
    }

    const healthy = redisHealthy && queueHealthy;

    return {
      healthy,
      redis: redisHealthy,
      queue: queueHealthy,
      error: healthy ? undefined : 'Queue or Redis connection issues',
    };

  } catch (error) {
    return {
      healthy: false,
      redis: false,
      queue: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}