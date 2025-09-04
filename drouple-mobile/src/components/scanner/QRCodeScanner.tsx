/**
 * QR Code Scanner Component
 * Provides QR code scanning functionality with offline queue support
 * Handles check-in QR codes and other app-specific QR formats
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  Vibration,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Camera, CameraView, FlashMode } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import {
  IconButton,
  Button,
  Card,
  Surface,
  Portal,
  Modal,
} from 'react-native-paper';

import { colors } from '@/theme/colors';
import { syncManager } from '@/lib/sync/syncManager';
import { NetworkService } from '@/lib/net/networkService';
import { useAuthStore } from '@/lib/store/authStore';

export interface QRScanResult {
  type: 'checkin' | 'event' | 'group' | 'pathway' | 'unknown';
  data: any;
  rawData: string;
}

export interface QRCodeScannerProps {
  onScanSuccess: (result: QRScanResult) => void;
  onScanError?: (error: string) => void;
  onClose: () => void;
  scannerType?: 'checkin' | 'event' | 'all';
  enableFlash?: boolean;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  onScanSuccess,
  onScanError,
  onClose,
  scannerType = 'all',
  enableFlash = true,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [flashMode, setFlashMode] = useState<FlashMode>(FlashMode.off);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const cameraRef = useRef<CameraView>(null);

  const user = useAuthStore(state => state.user);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access to scan QR codes',
          [
            { text: 'Cancel', onPress: onClose },
            {
              text: 'Open Settings',
              onPress: () => {
                // In a real app, you would open the settings
                onClose();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
    }
  };

  const handleBarCodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    // Prevent duplicate scans within 2 seconds
    const now = Date.now();
    if (now - lastScanTime < 2000) {
      return;
    }

    setLastScanTime(now);
    setIsScanning(false);
    setIsProcessing(true);

    try {
      // Provide haptic feedback
      if (Platform.OS === 'ios') {
        Vibration.vibrate([100]);
      } else {
        Vibration.vibrate(100);
      }

      // Parse QR code data
      const scanResult = parseQRCode(data);

      if (scanResult.type === 'unknown') {
        throw new Error('Invalid or unsupported QR code format');
      }

      // Check if scanner type matches scanned type
      if (scannerType !== 'all' && scanResult.type !== scannerType) {
        throw new Error(
          `Expected ${scannerType} QR code, but scanned ${scanResult.type}`
        );
      }

      // Process the scan result
      await processScanResult(scanResult);

      onScanSuccess(scanResult);
    } catch (error) {
      console.error('QR scan processing error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to process QR code';

      if (onScanError) {
        onScanError(errorMessage);
      } else {
        Alert.alert('Scan Error', errorMessage, [
          { text: 'Try Again', onPress: resumeScanning },
          { text: 'Cancel', onPress: onClose },
        ]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const parseQRCode = (data: string): QRScanResult => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(data);

      if (parsed.type && parsed.data) {
        return {
          type: parsed.type,
          data: parsed.data,
          rawData: data,
        };
      }
    } catch (error) {
      // Not JSON, try to parse as URL or simple format
    }

    // Check for URL patterns
    if (data.startsWith('https://') || data.startsWith('http://')) {
      const url = new URL(data);

      // Check for check-in URL pattern
      if (
        url.pathname.includes('/checkin/') ||
        url.searchParams.has('serviceId')
      ) {
        const serviceId =
          url.searchParams.get('serviceId') ||
          url.pathname.split('/checkin/')[1];

        if (serviceId) {
          return {
            type: 'checkin',
            data: { serviceId },
            rawData: data,
          };
        }
      }

      // Check for event URL pattern
      if (
        url.pathname.includes('/events/') ||
        url.searchParams.has('eventId')
      ) {
        const eventId =
          url.searchParams.get('eventId') || url.pathname.split('/events/')[1];

        if (eventId) {
          return {
            type: 'event',
            data: { eventId },
            rawData: data,
          };
        }
      }
    }

    // Check for simple format (e.g., "checkin:service123")
    if (data.includes(':')) {
      const [type, id] = data.split(':');

      switch (type.toLowerCase()) {
        case 'checkin':
          return {
            type: 'checkin',
            data: { serviceId: id },
            rawData: data,
          };

        case 'event':
          return {
            type: 'event',
            data: { eventId: id },
            rawData: data,
          };

        case 'group':
          return {
            type: 'group',
            data: { groupId: id },
            rawData: data,
          };

        case 'pathway':
          return {
            type: 'pathway',
            data: { pathwayId: id },
            rawData: data,
          };
      }
    }

    return {
      type: 'unknown',
      data: { raw: data },
      rawData: data,
    };
  };

  const processScanResult = async (result: QRScanResult): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const isOnline = await NetworkService.isConnected();

    switch (result.type) {
      case 'checkin':
        await processCheckinScan(result.data, isOnline);
        break;

      case 'event':
        await processEventScan(result.data, isOnline);
        break;

      case 'group':
        await processGroupScan(result.data, isOnline);
        break;

      case 'pathway':
        await processPathwayScan(result.data, isOnline);
        break;

      default:
        throw new Error('Unsupported QR code type');
    }
  };

  const processCheckinScan = async (
    data: { serviceId: string },
    isOnline: boolean
  ): Promise<void> => {
    const checkinData = {
      serviceId: data.serviceId,
      userId: user!.id,
      timestamp: new Date().toISOString(),
      location: null, // Could add geolocation if needed
    };

    if (isOnline) {
      // Try immediate check-in
      try {
        // This would be handled by the parent component
        console.log('Processing online check-in:', checkinData);
      } catch (error) {
        // If online check-in fails, queue it
        await syncManager.enqueueAction('CHECKIN', checkinData);
        throw new Error('Check-in queued for when online');
      }
    } else {
      // Queue for offline processing
      await syncManager.enqueueAction('CHECKIN', checkinData);
      throw new Error('Check-in saved offline - will sync when online');
    }
  };

  const processEventScan = async (
    data: { eventId: string },
    isOnline: boolean
  ): Promise<void> => {
    const eventData = {
      eventId: data.eventId,
      userId: user!.id,
      status: 'ATTENDING',
      timestamp: new Date().toISOString(),
    };

    if (!isOnline) {
      await syncManager.enqueueAction('RSVP', eventData);
      throw new Error('Event RSVP saved offline - will sync when online');
    }
  };

  const processGroupScan = async (
    data: { groupId: string },
    isOnline: boolean
  ): Promise<void> => {
    const groupData = {
      groupId: data.groupId,
      userId: user!.id,
      requestType: 'JOIN',
      timestamp: new Date().toISOString(),
    };

    if (!isOnline) {
      await syncManager.enqueueAction('GROUP_REQUEST', groupData);
      throw new Error('Group request saved offline - will sync when online');
    }
  };

  const processPathwayScan = async (
    data: { pathwayId: string },
    isOnline: boolean
  ): Promise<void> => {
    const pathwayData = {
      pathwayId: data.pathwayId,
      stepId: null, // Would need to be determined
      completed: true,
      timestamp: new Date().toISOString(),
    };

    if (!isOnline) {
      await syncManager.enqueueAction('PATHWAY_STEP', pathwayData);
      throw new Error('Pathway progress saved offline - will sync when online');
    }
  };

  const toggleFlash = () => {
    setFlashMode(current =>
      current === FlashMode.off ? FlashMode.on : FlashMode.off
    );
  };

  const resumeScanning = () => {
    setIsScanning(true);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={colors.primary.main} />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Camera access is required to scan QR codes
        </Text>
        <Button mode='contained' onPress={onClose} style={styles.errorButton}>
          Close Scanner
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        barCodeScannerSettings={{
          barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
        }}
        onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
        flash={flashMode}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <IconButton
              icon='close'
              iconColor={colors.surface.main}
              size={24}
              onPress={onClose}
              style={styles.closeButton}
            />
            <Text style={styles.headerText}>Scan QR Code</Text>
            {enableFlash && (
              <IconButton
                icon={flashMode === FlashMode.on ? 'flash' : 'flash-off'}
                iconColor={colors.surface.main}
                size={24}
                onPress={toggleFlash}
                style={styles.flashButton}
              />
            )}
          </View>

          {/* Scanning area */}
          <View style={styles.scanningArea}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Surface style={styles.instructionCard}>
              {isProcessing ? (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size='small' color={colors.primary.main} />
                  <Text style={styles.processingText}>Processing...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.instructionText}>
                    Position the QR code within the frame
                  </Text>
                  {scannerType === 'checkin' && (
                    <Text style={styles.instructionSubText}>
                      Scan the service check-in QR code
                    </Text>
                  )}
                  {!isScanning && (
                    <Button
                      mode='outlined'
                      onPress={resumeScanning}
                      style={styles.resumeButton}
                    >
                      Scan Again
                    </Button>
                  )}
                </>
              )}
            </Surface>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  flashButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerText: {
    color: colors.surface.main,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  scanningArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.primary.main,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructions: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  instructionCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface.main,
    elevation: 4,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  instructionSubText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  processingText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  resumeButton: {
    marginTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.main,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.main,
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 8,
  },
});

export default QRCodeScanner;
