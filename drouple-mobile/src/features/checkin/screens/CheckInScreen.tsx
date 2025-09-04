/**
 * Check-In Screen
 * Complete QR scanning and manual check-in functionality
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Button,
  Surface,
  FAB,
  Portal,
  Modal,
  Snackbar,
} from 'react-native-paper';

import { colors } from '@/theme/colors';
import { useOnlineSync } from '@/hooks/useOnlineSync';
import { parseCheckInQR, QRParseResult } from '@/utils/qrParser';
import { checkInService } from '@/services/checkInService';
import {
  getMemberById,
  getServiceById,
  getActiveServices,
  MockMember,
  MockService,
} from '@/data/mockData';
import QRScanner from '@/components/checkin/QRScanner';
import MemberSearch from '@/components/checkin/MemberSearch';
import ServiceStatusChip from '@/components/checkin/ServiceStatusChip';
import toast from '@/utils/toast';

type CheckInMode = 'home' | 'qr_scanner' | 'manual_search';

interface CheckInState {
  mode: CheckInMode;
  isProcessing: boolean;
  lastCheckIn: {
    member: MockMember;
    service: MockService;
    timestamp: Date;
  } | null;
}

export const CheckInScreen: React.FC = () => {
  const { status: syncStatus } = useOnlineSync();
  const [state, setState] = useState<CheckInState>({
    mode: 'home',
    isProcessing: false,
    lastCheckIn: null,
  });
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (state.mode !== 'home') {
          setState(prev => ({ ...prev, mode: 'home' }));
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [state.mode]);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleQRScanned = async (result: QRParseResult) => {
    if (!result.success || !result.data) {
      toast.error(result.error || 'Invalid QR code');
      return;
    }

    const { memberId, serviceId } = result.data;

    // Find member and service
    const member = getMemberById(memberId);
    const service = getServiceById(serviceId);

    if (!member) {
      toast.error('Member not found');
      return;
    }

    if (!service) {
      toast.error('Service not found');
      return;
    }

    // Process check-in
    await processCheckIn(member, service, false);
  };

  const handleManualCheckIn = async (
    member: MockMember,
    service: MockService,
    isNewBeliever: boolean
  ) => {
    await processCheckIn(member, service, isNewBeliever);
  };

  const processCheckIn = async (
    member: MockMember,
    service: MockService,
    isNewBeliever: boolean
  ) => {
    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      const result = await checkInService.enqueueCheckIn({
        memberId: member.id,
        serviceId: service.id,
        isNewBeliever,
        checkInTime: new Date().toISOString(),
      });

      if (result.success && result.data) {
        // Update state with successful check-in
        setState(prev => ({
          ...prev,
          mode: 'home',
          lastCheckIn: {
            member,
            service,
            timestamp: new Date(),
          },
        }));

        const statusMessage = result.data.wasQueued
          ? 'Check-in queued - will sync when online'
          : 'Check-in successful!';

        showSnackbar(
          `${member.name} checked in successfully${isNewBeliever ? ' (New Believer)' : ''}`
        );

        if (isNewBeliever) {
          // Show special message for new believers
          Alert.alert(
            'Welcome to the Family!',
            `${member.name} has been marked as a new believer. Please ensure they are connected with a VIP team member for follow-up.`,
            [{ text: 'OK' }]
          );
        }
      } else {
        toast.error(result.error || 'Check-in failed');
      }
    } catch (error) {
      console.error('Check-in processing error:', error);
      toast.error('Failed to process check-in');
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleScanQRCode = () => {
    setState(prev => ({ ...prev, mode: 'qr_scanner' }));
  };

  const handleManualMode = () => {
    setState(prev => ({ ...prev, mode: 'manual_search' }));
  };

  const handleCloseModal = () => {
    if (state.isProcessing) return; // Prevent closing while processing
    setState(prev => ({ ...prev, mode: 'home' }));
  };

  const handlePermissionDenied = () => {
    Alert.alert(
      'Camera Permission Required',
      'Drouple needs camera access to scan QR codes. You can enable this in your device settings or use manual check-in instead.',
      [
        { text: 'Use Manual Check-In', onPress: handleManualMode },
        { text: 'OK' },
      ]
    );
    setState(prev => ({ ...prev, mode: 'home' }));
  };

  const activeServices = getActiveServices();

  const renderHomeScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant='headlineMedium' style={styles.title}>
          Check-In
        </Text>

        {/* Sync Status */}
        <View style={styles.syncStatus}>
          <Surface style={styles.syncCard} elevation={1}>
            <Text variant='labelMedium' style={styles.syncLabel}>
              {syncStatus.isOnline ? 'Online' : 'Offline'}
            </Text>
            {syncStatus.queueCount > 0 && (
              <Text variant='bodySmall' style={styles.queueCount}>
                {syncStatus.queueCount} pending
              </Text>
            )}
          </Surface>
        </View>
      </View>

      <View style={styles.content}>
        {/* Active Services */}
        {activeServices.length > 0 && (
          <Surface style={styles.servicesCard} elevation={2}>
            <Text variant='titleMedium' style={styles.cardTitle}>
              Active Services
            </Text>
            <View style={styles.servicesList}>
              {activeServices.slice(0, 3).map(service => (
                <View key={service.id} style={styles.serviceItem}>
                  <View style={styles.serviceInfo}>
                    <Text variant='titleSmall' style={styles.serviceName}>
                      {service.name}
                    </Text>
                    <Text variant='bodySmall' style={styles.serviceTime}>
                      {service.time} • {service.church}
                    </Text>
                  </View>
                  <ServiceStatusChip
                    service={service}
                    compact
                    showAttendeeCount
                  />
                </View>
              ))}
            </View>
          </Surface>
        )}

        {/* Last Check-In */}
        {state.lastCheckIn && (
          <Surface style={styles.lastCheckinCard} elevation={2}>
            <Text variant='titleMedium' style={styles.cardTitle}>
              Recent Check-In
            </Text>
            <View style={styles.lastCheckinContent}>
              <View style={styles.lastCheckinInfo}>
                <Text variant='titleSmall'>
                  {state.lastCheckIn.member.name}
                </Text>
                <Text variant='bodySmall' style={styles.lastCheckinDetails}>
                  {state.lastCheckIn.service.name} •{' '}
                  {state.lastCheckIn.timestamp.toLocaleTimeString()}
                </Text>
              </View>
              <Surface style={styles.successBadge} elevation={0}>
                <Text style={styles.successText}>✓</Text>
              </Surface>
            </View>
          </Surface>
        )}

        {/* Instructions */}
        <Surface style={styles.instructionsCard} elevation={1}>
          <Text variant='titleMedium' style={styles.cardTitle}>
            How to Check In
          </Text>
          <View style={styles.instructionsList}>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>1</Text>
              <Text variant='bodyMedium' style={styles.instructionText}>
                Scan your QR code using the camera
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>2</Text>
              <Text variant='bodyMedium' style={styles.instructionText}>
                Or use manual search if you don't have a QR code
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>3</Text>
              <Text variant='bodyMedium' style={styles.instructionText}>
                Mark as "New Believer" if they just accepted Jesus
              </Text>
            </View>
          </View>
        </Surface>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode='contained'
          icon='qrcode-scan'
          onPress={handleScanQRCode}
          style={styles.primaryButton}
          contentStyle={styles.buttonContent}
        >
          Scan QR Code
        </Button>
        <Button
          mode='outlined'
          icon='magnify'
          onPress={handleManualMode}
          style={styles.secondaryButton}
          contentStyle={styles.buttonContent}
        >
          Manual Search
        </Button>
      </View>
    </SafeAreaView>
  );

  const renderQRScanner = () => (
    <QRScanner
      onQRScanned={handleQRScanned}
      onPermissionDenied={handlePermissionDenied}
      onClose={handleCloseModal}
      isActive={state.mode === 'qr_scanner'}
    />
  );

  const renderManualSearch = () => (
    <Portal>
      <Modal
        visible={state.mode === 'manual_search'}
        onDismiss={handleCloseModal}
        contentContainerStyle={styles.modal}
      >
        <MemberSearch
          onMemberSelect={handleManualCheckIn}
          onClose={handleCloseModal}
          loading={state.isProcessing}
        />
      </Modal>
    </Portal>
  );

  return (
    <>
      {state.mode === 'home' && renderHomeScreen()}
      {state.mode === 'qr_scanner' && renderQRScanner()}
      {state.mode === 'manual_search' && renderManualSearch()}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  syncStatus: {
    alignItems: 'flex-end',
  },
  syncCard: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface.variant,
  },
  syncLabel: {
    color: colors.text.primary,
    textAlign: 'center',
  },
  queueCount: {
    color: colors.text.secondary,
    textAlign: 'center',
    fontSize: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 16,
  },
  servicesCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface.main,
  },
  cardTitle: {
    marginBottom: 16,
    color: colors.text.primary,
    fontWeight: '600',
  },
  servicesList: {
    gap: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    color: colors.text.primary,
  },
  serviceTime: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  lastCheckinCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface.main,
  },
  lastCheckinContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastCheckinInfo: {
    flex: 1,
  },
  lastCheckinDetails: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  successBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    color: colors.success.contrastText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionsCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface.variant,
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary.main,
    color: colors.primary.contrastText,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructionText: {
    flex: 1,
    color: colors.text.primary,
    lineHeight: 20,
  },
  actionButtons: {
    padding: 24,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
  },
  secondaryButton: {
    borderRadius: 12,
  },
  buttonContent: {
    height: 48,
  },
  modal: {
    flex: 1,
    margin: 0,
  },
  snackbar: {
    backgroundColor: colors.success.main,
  },
});

export default CheckInScreen;
