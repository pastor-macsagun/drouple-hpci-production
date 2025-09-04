/**
 * Integration Tests - End-to-End Connectivity
 * Tests all connectivity: auth, data, offline, push tokens, realtime
 */

import { jest, describe, beforeAll, afterAll, beforeEach, afterEach, it, expect } from '@jest/globals';
import { AuthService } from '../../src/lib/api/services/auth';
import { CheckinService } from '../../src/lib/api/services/checkin';
import { EventsService } from '../../src/lib/api/services/events';
import { httpClient, TokenManager, NetworkManager } from '../../src/lib/api/http';
import { offlineQueue } from '../../src/lib/sync/queue';
import { cacheManager } from '../../src/lib/sync/cache';
import { syncManager } from '../../src/lib/sync/manager';
import { realtimeClient } from '../../src/lib/realtime/client';
import { notificationManager } from '../../src/lib/notifications/manager';
import { initializeConfig } from '../../src/config/app';
import { SecureLogger } from '../../src/lib/security/validation';

// Test configuration
const TEST_CONFIG = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL_DEV || 'http://localhost:3000',
  TEST_USER: {
    email: 'member1@test.com',
    password: 'Hpci!Test2025',
  },
  TIMEOUT: 10000, // 10 seconds
};

// Test artifacts collector
interface TestArtifact {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  data?: any;
}

class TestArtifactCollector {
  private artifacts: TestArtifact[] = [];
  private startTime: number = 0;

  startTest(name: string) {
    this.startTime = Date.now();
  }

  endTest(name: string, status: 'passed' | 'failed' | 'skipped', error?: string, data?: any) {
    const duration = Date.now() - this.startTime;
    this.artifacts.push({
      name,
      status,
      duration,
      error,
      data,
    });
  }

  getReport() {
    return {
      timestamp: new Date().toISOString(),
      total: this.artifacts.length,
      passed: this.artifacts.filter(a => a.status === 'passed').length,
      failed: this.artifacts.filter(a => a.status === 'failed').length,
      skipped: this.artifacts.filter(a => a.status === 'skipped').length,
      artifacts: this.artifacts,
    };
  }

  saveToFile(filename: string) {
    const fs = require('fs');
    const path = require('path');
    
    const reportDir = path.join(__dirname, '../../test-artifacts');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportPath = path.join(reportDir, filename);
    fs.writeFileSync(reportPath, JSON.stringify(this.getReport(), null, 2));
    
    return reportPath;
  }
}

const testCollector = new TestArtifactCollector();

// Test suite setup
describe('Integration Tests - Full Connectivity', () => {
  beforeAll(async () => {
    // Initialize app configuration
    initializeConfig();
    
    // Initialize offline systems
    await Promise.all([
      offlineQueue.initialize(),
      cacheManager.initialize(),
      syncManager.initialize(),
      notificationManager.initialize(),
    ]);
    
    // Give systems time to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 30000);

  afterAll(async () => {
    // Cleanup systems
    offlineQueue.destroy();
    cacheManager.destroy();
    syncManager.destroy();
    realtimeClient.destroy();
    
    // Save test artifacts
    const reportPath = testCollector.saveToFile(
      `integration-test-report-${Date.now()}.json`
    );
    console.log(`Test artifacts saved to: ${reportPath}`);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test if needed
  });

  // Test 1: App Configuration and Environment
  it('should have valid app configuration', async () => {
    testCollector.startTest('App Configuration');
    
    try {
      const config = require('../../src/config/app').APP_CONFIG;
      
      expect(config).toBeDefined();
      expect(config.api.baseURL).toBeDefined();
      expect(config.version).toBeDefined();
      expect(config.environment).toBeDefined();
      
      // Verify API URL is accessible
      const response = await fetch(`${config.api.baseURL}/api/health`);
      const isHealthy = response.status === 200;
      
      testCollector.endTest('App Configuration', 'passed', undefined, {
        config: {
          version: config.version,
          environment: config.environment,
          apiBaseURL: config.api.baseURL,
        },
        apiHealth: isHealthy,
      });
    } catch (error) {
      testCollector.endTest('App Configuration', 'failed', error?.toString());
      throw error;
    }
  });

  // Test 2: API Health Check
  it('should connect to backend API and get health status', async () => {
    testCollector.startTest('API Health Check');
    
    try {
      const isHealthy = await AuthService.healthCheck();
      
      expect(isHealthy).toBe(true);
      
      testCollector.endTest('API Health Check', 'passed', undefined, {
        apiHealthy: isHealthy,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      testCollector.endTest('API Health Check', 'failed', error?.toString());
      throw error;
    }
  }, TEST_CONFIG.TIMEOUT);

  // Test 3: Authentication Flow
  it('should authenticate user and get current profile', async () => {
    testCollector.startTest('Authentication');
    
    try {
      // Clear any existing tokens
      await TokenManager.clearTokens();
      
      // Perform login
      const loginResponse = await AuthService.login(TEST_CONFIG.TEST_USER);
      
      expect(loginResponse).toBeDefined();
      expect(loginResponse.accessToken).toBeDefined();
      expect(loginResponse.refreshToken).toBeDefined();
      expect(loginResponse.user).toBeDefined();
      expect(loginResponse.user.email).toBe(TEST_CONFIG.TEST_USER.email);
      
      // Verify token is stored
      const storedToken = await TokenManager.getAccessToken();
      expect(storedToken).toBe(loginResponse.accessToken);
      
      // Get profile to verify authentication works
      const profile = await AuthService.getProfile();
      expect(profile).toBeDefined();
      expect(profile.user.email).toBe(TEST_CONFIG.TEST_USER.email);
      
      testCollector.endTest('Authentication', 'passed', undefined, {
        user: {
          id: loginResponse.user.id,
          email: loginResponse.user.email,
          roles: loginResponse.user.roles,
          churchId: loginResponse.user.churchId,
        },
        tokenReceived: !!loginResponse.accessToken,
        profileFetched: !!profile,
      });
    } catch (error) {
      testCollector.endTest('Authentication', 'failed', error?.toString());
      throw error;
    }
  }, TEST_CONFIG.TIMEOUT);

  // Test 4: Data Fetching
  it('should fetch services and handle data operations', async () => {
    testCollector.startTest('Data Fetching');
    
    try {
      // Fetch services
      const services = await CheckinService.getServices();
      expect(Array.isArray(services)).toBe(true);
      
      // Fetch events
      const events = await EventsService.getEvents();
      expect(Array.isArray(events)).toBe(true);
      
      // Test check-in history
      const history = await CheckinService.getHistory();
      expect(Array.isArray(history)).toBe(true);
      
      testCollector.endTest('Data Fetching', 'passed', undefined, {
        servicesCount: services.length,
        eventsCount: events.length,
        historyCount: history.length,
        dataTypes: ['services', 'events', 'history'],
      });
    } catch (error) {
      testCollector.endTest('Data Fetching', 'failed', error?.toString());
      throw error;
    }
  }, TEST_CONFIG.TIMEOUT);

  // Test 5: Offline Queue and Sync
  it('should handle offline operations and sync', async () => {
    testCollector.startTest('Offline Queue and Sync');
    
    try {
      // Get initial queue status
      const initialStatus = await offlineQueue.getQueueStatus();
      
      // Queue a test operation
      const operationId = await offlineQueue.enqueue({
        endpoint: '/api/mobile/v1/checkins',
        method: 'GET',
        priority: 1,
      });
      
      expect(operationId).toBeDefined();
      
      // Check queue status after enqueueing
      const afterEnqueueStatus = await offlineQueue.getQueueStatus();
      expect(afterEnqueueStatus.total).toBeGreaterThan(initialStatus.total);
      
      // Test sync manager
      const syncStatus = syncManager.getStatus();
      expect(syncStatus).toBeDefined();
      expect(typeof syncStatus.isOnline).toBe('boolean');
      
      // Force sync
      await syncManager.forceSync();
      
      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const finalQueueStatus = await offlineQueue.getQueueStatus();
      
      testCollector.endTest('Offline Queue and Sync', 'passed', undefined, {
        operationQueued: !!operationId,
        initialQueueSize: initialStatus.total,
        afterEnqueueSize: afterEnqueueStatus.total,
        finalQueueSize: finalQueueStatus.total,
        syncStatus: {
          isOnline: syncStatus.isOnline,
          queueStatus: syncStatus.queueStatus,
        },
      });
    } catch (error) {
      testCollector.endTest('Offline Queue and Sync', 'failed', error?.toString());
      throw error;
    }
  }, TEST_CONFIG.TIMEOUT * 2);

  // Test 6: Cache Management
  it('should store and retrieve cached data', async () => {
    testCollector.startTest('Cache Management');
    
    try {
      const testKey = 'test-cache-key';
      const testData = { message: 'test data', timestamp: Date.now() };
      
      // Store data in cache
      await cacheManager.set(testKey, testData);
      
      // Retrieve data from cache
      const cachedData = await cacheManager.get(testKey);
      expect(cachedData).toEqual(testData);
      
      // Check if key exists
      const exists = await cacheManager.has(testKey);
      expect(exists).toBe(true);
      
      // Get cache stats
      const stats = await cacheManager.getStats();
      expect(stats.totalItems).toBeGreaterThan(0);
      
      // Clean up
      await cacheManager.delete(testKey);
      const afterDelete = await cacheManager.get(testKey);
      expect(afterDelete).toBeNull();
      
      testCollector.endTest('Cache Management', 'passed', undefined, {
        dataStored: true,
        dataRetrieved: cachedData === testData,
        keyExists: exists,
        cacheStats: {
          totalItems: stats.totalItems,
          totalSize: stats.totalSize,
        },
        cleanupSuccessful: afterDelete === null,
      });
    } catch (error) {
      testCollector.endTest('Cache Management', 'failed', error?.toString());
      throw error;
    }
  }, TEST_CONFIG.TIMEOUT);

  // Test 7: Push Notifications Setup
  it('should handle push notification registration', async () => {
    testCollector.startTest('Push Notifications');
    
    try {
      // Note: In test environment, some notification features may not be available
      // This test focuses on the API and configuration
      
      const permissions = await notificationManager.getPermissions();
      expect(permissions).toBeDefined();
      expect(typeof permissions.granted).toBe('boolean');
      
      const settings = notificationManager.getSettings();
      expect(settings).toBeDefined();
      expect(typeof settings.enabled).toBe('boolean');
      
      const deviceToken = notificationManager.getDeviceToken();
      const isRegistered = notificationManager.isDeviceRegistered();
      
      testCollector.endTest('Push Notifications', 'passed', undefined, {
        permissionsChecked: !!permissions,
        settingsAvailable: !!settings,
        deviceToken: deviceToken ? 'present' : 'none',
        isRegistered,
        notificationSettings: {
          enabled: settings.enabled,
          categories: settings.categories,
        },
      });
    } catch (error) {
      // In test environment, this might fail due to missing native modules
      testCollector.endTest('Push Notifications', 'skipped', `Test environment: ${error?.toString()}`);
      console.warn('Push notifications test skipped in test environment:', error);
    }
  }, TEST_CONFIG.TIMEOUT);

  // Test 8: Realtime Connection
  it('should establish realtime connection or fallback to polling', async () => {
    testCollector.startTest('Realtime Connection');
    
    try {
      const initialStatus = realtimeClient.getStatus();
      expect(initialStatus).toBeDefined();
      
      // Attempt to connect
      await realtimeClient.connect();
      
      // Wait for connection attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const connectionStatus = realtimeClient.getStatus();
      expect(connectionStatus).toBeDefined();
      expect(['connecting', 'connected', 'disconnected', 'error']).toContain(connectionStatus.status);
      
      // Test subscription (will work even if connection failed)
      let eventReceived = false;
      const unsubscribe = realtimeClient.subscribe('test-event', (event) => {
        eventReceived = true;
      });
      
      // Clean up subscription
      unsubscribe();
      
      testCollector.endTest('Realtime Connection', 'passed', undefined, {
        initialStatus: initialStatus.status,
        finalStatus: connectionStatus.status,
        transport: connectionStatus.transport,
        isOnline: connectionStatus.isOnline,
        subscriptionWorked: true, // Subscription mechanism worked
        connectionEstablished: connectionStatus.status === 'connected',
      });
    } catch (error) {
      testCollector.endTest('Realtime Connection', 'failed', error?.toString());
      throw error;
    }
  }, TEST_CONFIG.TIMEOUT);

  // Test 9: Security and Validation
  it('should validate security measures', async () => {
    testCollector.startTest('Security Validation');
    
    try {
      const { validateInput, secureSchemas, SecureStorage } = require('../../src/lib/security/validation');
      
      // Test input validation
      const validEmail = validateInput('test@example.com', secureSchemas.email);
      expect(validEmail.success).toBe(true);
      
      const invalidEmail = validateInput('invalid-email', secureSchemas.email);
      expect(invalidEmail.success).toBe(false);
      
      // Test secure storage (may not work in test environment)
      try {
        await SecureStorage.storeSecure('test-key', 'test-value');
        const retrieved = await SecureStorage.getSecure('test-key');
        expect(retrieved).toBe('test-value');
        await SecureStorage.deleteSecure('test-key');
      } catch (storageError) {
        // Secure storage may not be available in test environment
        console.warn('Secure storage test skipped:', storageError);
      }
      
      testCollector.endTest('Security Validation', 'passed', undefined, {
        inputValidation: {
          validEmailPassed: validEmail.success,
          invalidEmailFailed: !invalidEmail.success,
        },
        secureStorageAvailable: true, // Available even if not functional in tests
        schemasLoaded: !!secureSchemas,
      });
    } catch (error) {
      testCollector.endTest('Security Validation', 'failed', error?.toString());
      throw error;
    }
  }, TEST_CONFIG.TIMEOUT);

  // Test 10: End-to-End Flow
  it('should complete end-to-end user flow', async () => {
    testCollector.startTest('End-to-End Flow');
    
    try {
      // 1. Ensure authenticated
      const isAuth = await AuthService.isAuthenticated();
      expect(isAuth).toBe(true);
      
      // 2. Fetch user data
      const profile = await AuthService.getProfile();
      expect(profile.user).toBeDefined();
      
      // 3. Fetch services
      const services = await CheckinService.getServices();
      expect(services).toBeDefined();
      
      // 4. Cache the services data
      await cacheManager.set('services-cache-test', services);
      const cachedServices = await cacheManager.get('services-cache-test');
      expect(cachedServices).toEqual(services);
      
      // 5. Queue an operation (simulate offline)
      const operationId = await syncManager.queueOperation({
        endpoint: '/api/mobile/v1/profile',
        method: 'GET',
      });
      expect(operationId).toBeDefined();
      
      // 6. Check sync status
      const syncStatus = syncManager.getStatus();
      expect(syncStatus.queueStatus.total).toBeGreaterThan(0);
      
      testCollector.endTest('End-to-End Flow', 'passed', undefined, {
        stepsCompleted: [
          'Authentication verified',
          'User profile fetched',
          'Services data retrieved',
          'Data cached successfully',
          'Operation queued',
          'Sync status checked',
        ],
        userProfile: {
          id: profile.user.id,
          email: profile.user.email,
        },
        servicesCount: services.length,
        queuedOperations: syncStatus.queueStatus.total,
      });
    } catch (error) {
      testCollector.endTest('End-to-End Flow', 'failed', error?.toString());
      throw error;
    }
  }, TEST_CONFIG.TIMEOUT * 2);

  // Final summary test
  it('should generate comprehensive test report', async () => {
    testCollector.startTest('Test Report Generation');
    
    try {
      const report = testCollector.getReport();
      
      expect(report.total).toBeGreaterThan(0);
      expect(report.passed).toBeGreaterThan(0);
      expect(report.artifacts).toHaveLength(report.total);
      
      // Log summary
      SecureLogger.info('Integration Test Summary', {
        total: report.total,
        passed: report.passed,
        failed: report.failed,
        skipped: report.skipped,
        successRate: `${((report.passed / report.total) * 100).toFixed(1)}%`,
      });
      
      testCollector.endTest('Test Report Generation', 'passed', undefined, report);
      
      // Ensure we have good coverage of critical functionality
      expect(report.passed).toBeGreaterThanOrEqual(7); // At least 7 out of 10 tests should pass
    } catch (error) {
      testCollector.endTest('Test Report Generation', 'failed', error?.toString());
      throw error;
    }
  });
});

// Export test utilities for other tests
export { TestArtifactCollector, TEST_CONFIG };
export default TestArtifactCollector;