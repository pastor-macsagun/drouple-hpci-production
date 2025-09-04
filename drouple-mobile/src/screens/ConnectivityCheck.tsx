/**
 * Connectivity Check Screen
 * Demonstrates end-to-end connectivity from mobile app to backend
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStatus, useHealthCheck, useLogin } from '../hooks/api/useAuth';
import { useCurrentUser } from '../hooks/api/useAuth';
import { useServices, useQuickCheckin, useCanCheckinToday } from '../hooks/api/useCheckin';
import { useNotifications } from '../hooks/useNotifications';
import { useRealtime } from '../hooks/useRealtime';
import { useSyncManager } from '../lib/sync/manager';
import { APP_CONFIG } from '../config/app';

interface StatusCardProps {
  title: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  onTap?: () => void;
}

const StatusCard: React.FC<StatusCardProps> = ({ title, status, message, details, onTap }) => {
  const statusColors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: statusColors[status] }]}
      onPress={onTap}
      disabled={!onTap}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={[styles.statusDot, { backgroundColor: statusColors[status] }]} />
      </View>
      <Text style={styles.cardMessage}>{message}</Text>
      {details && <Text style={styles.cardDetails}>{details}</Text>}
    </TouchableOpacity>
  );
};

export const ConnectivityCheckScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  // Hooks for connectivity testing
  const { user, isAuthenticated, isAdmin, isLeader } = useAuthStatus();
  const { data: healthCheck, isLoading: healthLoading, refetch: refetchHealth } = useHealthCheck();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: services, isLoading: servicesLoading, refetch: refetchServices } = useServices();
  const { canCheckin } = useCanCheckinToday();
  const quickCheckinMutation = useQuickCheckin();
  const { permissions, isRegistered, deviceToken, requestPermissions } = useNotifications();
  const { status: realtimeStatus, connect: connectRealtime } = useRealtime();
  const { status: syncStatus, forceSync } = useSyncManager();

  const loginMutation = useLogin();

  // Test functions
  const testApiConnectivity = async () => {
    try {
      const result = await refetchHealth();
      setTestResults(prev => ({
        ...prev,
        apiConnectivity: {
          status: result.data ? 'success' : 'error',
          message: result.data ? 'API is reachable' : 'API connectivity failed',
          timestamp: new Date().toISOString(),
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        apiConnectivity: {
          status: 'error',
          message: 'API connectivity test failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        }
      }));
    }
  };

  const testAuthentication = async () => {
    if (!isAuthenticated) {
      // For demo purposes, try login with test credentials
      try {
        await loginMutation.mutateAsync({
          email: 'member1@test.com',
          password: 'Hpci!Test2025',
        });
        setTestResults(prev => ({
          ...prev,
          authentication: {
            status: 'success',
            message: 'Authentication successful',
            timestamp: new Date().toISOString(),
          }
        }));
      } catch (error) {
        setTestResults(prev => ({
          ...prev,
          authentication: {
            status: 'error',
            message: 'Authentication failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          }
        }));
      }
    } else {
      setTestResults(prev => ({
        ...prev,
        authentication: {
          status: 'success',
          message: 'User already authenticated',
          user: user?.firstName || 'Unknown',
          timestamp: new Date().toISOString(),
        }
      }));
    }
  };

  const testDataFetching = async () => {
    try {
      const result = await refetchServices();
      setTestResults(prev => ({
        ...prev,
        dataFetching: {
          status: result.data ? 'success' : 'warning',
          message: result.data 
            ? `Fetched ${result.data.length} services` 
            : 'No services found',
          timestamp: new Date().toISOString(),
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        dataFetching: {
          status: 'error',
          message: 'Data fetching failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        }
      }));
    }
  };

  const testOfflineQueue = async () => {
    if (!isAuthenticated) {
      setTestResults(prev => ({
        ...prev,
        offlineQueue: {
          status: 'warning',
          message: 'Authentication required for offline queue test',
          timestamp: new Date().toISOString(),
        }
      }));
      return;
    }

    if (!canCheckin) {
      setTestResults(prev => ({
        ...prev,
        offlineQueue: {
          status: 'info',
          message: 'Already checked in today - queue test skipped',
          timestamp: new Date().toISOString(),
        }
      }));
      return;
    }

    try {
      const result = await quickCheckinMutation.mutateAsync({ newBeliever: false });
      setTestResults(prev => ({
        ...prev,
        offlineQueue: {
          status: 'success',
          message: 'Check-in completed (online or queued)',
          checkinId: result.id,
          timestamp: new Date().toISOString(),
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        offlineQueue: {
          status: 'error',
          message: 'Offline queue test failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        }
      }));
    }
  };

  const testNotifications = async () => {
    if (!permissions?.granted) {
      try {
        const newPermissions = await requestPermissions();
        setTestResults(prev => ({
          ...prev,
          notifications: {
            status: newPermissions.granted ? 'success' : 'warning',
            message: newPermissions.granted 
              ? 'Push notification permissions granted'
              : 'Push notification permissions denied',
            timestamp: new Date().toISOString(),
          }
        }));
      } catch (error) {
        setTestResults(prev => ({
          ...prev,
          notifications: {
            status: 'error',
            message: 'Failed to request notification permissions',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          }
        }));
      }
    } else {
      setTestResults(prev => ({
        ...prev,
        notifications: {
          status: isRegistered ? 'success' : 'info',
          message: isRegistered 
            ? 'Device registered for push notifications'
            : 'Push notifications available but not registered',
          deviceToken: deviceToken ? deviceToken.slice(0, 20) + '...' : undefined,
          timestamp: new Date().toISOString(),
        }
      }));
    }
  };

  const testRealtime = async () => {
    try {
      await connectRealtime();
      setTestResults(prev => ({
        ...prev,
        realtime: {
          status: realtimeStatus.isOnline ? 'success' : 'warning',
          message: `Realtime connection: ${realtimeStatus.status} (${realtimeStatus.transport})`,
          timestamp: new Date().toISOString(),
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        realtime: {
          status: 'error',
          message: 'Realtime connection failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        }
      }));
    }
  };

  const runAllTests = async () => {
    setRefreshing(true);
    setTestResults({});

    try {
      await Promise.all([
        testApiConnectivity(),
        testAuthentication(),
        testDataFetching(),
        testOfflineQueue(),
        testNotifications(),
        testRealtime(),
      ]);

      // Force sync to test sync manager
      await forceSync();
    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Run tests on mount
  useEffect(() => {
    runAllTests();
  }, []);

  const getOverallStatus = (): 'success' | 'warning' | 'error' => {
    const results = Object.values(testResults);
    if (results.some(r => r.status === 'error')) return 'error';
    if (results.some(r => r.status === 'warning')) return 'warning';
    return 'success';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={runAllTests}
            colors={['#1e7ce8']}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Drouple Mobile</Text>
          <Text style={styles.subtitle}>Backend Connectivity Check</Text>
          
          <StatusCard
            title="Overall Status"
            status={getOverallStatus()}
            message={`${Object.keys(testResults).length} tests completed`}
            details={`API URL: ${APP_CONFIG.api.baseUrl}`}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication & API</Text>
          
          <StatusCard
            title="API Health Check"
            status={testResults.apiConnectivity?.status || 'info'}
            message={testResults.apiConnectivity?.message || 'Checking API connectivity...'}
            details={healthLoading ? 'Loading...' : ''}
            onTap={testApiConnectivity}
          />

          <StatusCard
            title="Authentication"
            status={testResults.authentication?.status || 'info'}
            message={testResults.authentication?.message || 'Checking authentication...'}
            details={isAuthenticated ? `User: ${user?.firstName} (${user?.roles[0]})` : 'Not authenticated'}
            onTap={testAuthentication}
          />

          <StatusCard
            title="Current User Profile"
            status={currentUser ? 'success' : 'warning'}
            message={currentUser ? `Profile loaded: ${currentUser.firstName}` : 'No user profile'}
            details={currentUser ? `Role: ${currentUser.roles[0]} | Church: ${currentUser.churchId}` : ''}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Offline</Text>
          
          <StatusCard
            title="Data Fetching"
            status={testResults.dataFetching?.status || 'info'}
            message={testResults.dataFetching?.message || 'Testing data fetching...'}
            details={servicesLoading ? 'Loading...' : `Services available: ${services?.length || 0}`}
            onTap={testDataFetching}
          />

          <StatusCard
            title="Offline Queue & Sync"
            status={testResults.offlineQueue?.status || 'info'}
            message={testResults.offlineQueue?.message || 'Testing offline functionality...'}
            details={`Queue status: ${syncStatus.queueStatus.pending} pending, ${syncStatus.queueStatus.failed} failed`}
            onTap={testOfflineQueue}
          />

          <StatusCard
            title="Sync Manager"
            status={syncStatus.isOnline ? 'success' : 'warning'}
            message={`Sync: ${syncStatus.isOnline ? 'Online' : 'Offline'} | Cache: ${syncStatus.cacheStats.totalItems} items`}
            details={syncStatus.lastSyncAt ? `Last sync: ${new Date(syncStatus.lastSyncAt).toLocaleTimeString()}` : 'Never synced'}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Realtime & Notifications</Text>
          
          <StatusCard
            title="Push Notifications"
            status={testResults.notifications?.status || 'info'}
            message={testResults.notifications?.message || 'Checking notifications...'}
            details={permissions?.granted ? 'Permissions granted' : 'Permissions required'}
            onTap={testNotifications}
          />

          <StatusCard
            title="Realtime Connection"
            status={testResults.realtime?.status || 'info'}
            message={testResults.realtime?.message || 'Testing realtime connection...'}
            details={`Transport: ${realtimeStatus.transport} | Attempts: ${realtimeStatus.reconnectAttempt}`}
            onTap={testRealtime}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.runTestsButton} onPress={runAllTests}>
            <Text style={styles.runTestsButtonText}>
              {refreshing ? 'Running Tests...' : 'Run All Tests'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.buildInfo}>
            Version: {APP_CONFIG.version} | Environment: {APP_CONFIG.environment}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e7ce8',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cardMessage: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  cardDetails: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  runTestsButton: {
    backgroundColor: '#1e7ce8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  runTestsButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buildInfo: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

export default ConnectivityCheckScreen;