/**
 * QR Scanner Component
 * Handles camera permissions and QR code scanning for check-in
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  CameraView,
  CameraType,
  useCameraPermissions,
  BarcodeScanningResult,
} from 'expo-camera';
import {
  Text,
  Button,
  Surface,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';

import { colors } from '@/theme/colors';
import { parseCheckInQR, QRParseResult } from '@/utils/qrParser';

interface QRScannerProps {
  onQRScanned: (result: QRParseResult) => void;
  onPermissionDenied?: () => void;
  onClose?: () => void;
  isActive?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const QRScanner: React.FC<QRScannerProps> = ({
  onQRScanned,
  onPermissionDenied,
  onClose,
  isActive = true,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [lastScannedData, setLastScannedData] = useState<string | null>(null);
  const scanCooldownRef = useRef<NodeJS.Timeout | null>(null);

  // Clear cooldown on unmount
  useEffect(() => {
    return () => {
      if (scanCooldownRef.current) {
        clearTimeout(scanCooldownRef.current);
      }
    };
  }, []);

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    // Prevent duplicate scans
    if (!isScanning || !isActive || data === lastScannedData) {
      return;
    }

    console.log('QR Code scanned:', data);

    // Set scanning cooldown
    setIsScanning(false);
    setLastScannedData(data);

    // Parse the QR code
    const parseResult = parseCheckInQR(data);
    onQRScanned(parseResult);

    // Reset scanning after 3 seconds
    scanCooldownRef.current = setTimeout(() => {
      setIsScanning(true);
      setLastScannedData(null);
    }, 3000);
  };

  const handleRequestPermission = async () => {
    try {
      const result = await requestPermission();
      if (!result.granted && onPermissionDenied) {
        onPermissionDenied();
      }
    } catch (error) {
      console.error('Failed to request camera permission:', error);
      if (onPermissionDenied) {
        onPermissionDenied();
      }
    }
  };

  // Permission loading state
  if (permission === null) {
    return (
      <View style={styles.container}>
        <Surface style={styles.loadingSurface} elevation={2}>
          <ActivityIndicator size='large' color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading camera...</Text>
        </Surface>
      </View>
    );
  }

  // Permission denied state
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Surface style={styles.permissionSurface} elevation={2}>
          <Text variant='headlineSmall' style={styles.permissionTitle}>
            Camera Permission Required
          </Text>
          <Text variant='bodyMedium' style={styles.permissionDescription}>
            Drouple needs camera access to scan QR codes for check-in. Your
            privacy is important to us - the camera is only used for scanning.
          </Text>
          <View style={styles.permissionButtons}>
            <Button
              mode='contained'
              onPress={handleRequestPermission}
              style={styles.permissionButton}
            >
              Allow Camera Access
            </Button>
            {onClose && (
              <Button
                mode='outlined'
                onPress={onClose}
                style={styles.permissionButton}
              >
                Cancel
              </Button>
            )}
          </View>
        </Surface>
      </View>
    );
  }

  // Camera view
  return (
    <View style={styles.container}>
      {/* Header with close button */}
      {onClose && (
        <View style={styles.header}>
          <IconButton
            icon='close'
            size={24}
            iconColor={colors.text.onPrimary}
            style={styles.closeButton}
            onPress={onClose}
          />
        </View>
      )}

      {/* Camera */}
      <CameraView
        style={styles.camera}
        facing='back'
        onBarcodeScanned={isActive ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top overlay */}
          <View style={styles.overlayTop} />

          {/* Middle section with scanning area */}
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanningArea}>
              {/* Corner indicators */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />

              {/* Scanning line animation could go here */}
            </View>
            <View style={styles.overlaySide} />
          </View>

          {/* Bottom overlay with instructions */}
          <View style={styles.overlayBottom}>
            <Text variant='titleMedium' style={styles.instructionTitle}>
              Scan QR Code
            </Text>
            <Text variant='bodyMedium' style={styles.instructionText}>
              {isScanning
                ? 'Position the QR code within the frame'
                : 'Processing scan...'}
            </Text>
            {!isScanning && (
              <ActivityIndicator
                size='small'
                color={colors.primary.contrastText}
                style={styles.scanningIndicator}
              />
            )}
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const overlayColor = 'rgba(0, 0, 0, 0.6)';
const scanAreaSize = 250;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
  },
  closeButton: {
    backgroundColor: overlayColor,
  },
  loadingSurface: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 24,
    padding: 32,
    borderRadius: 16,
  },
  loadingText: {
    marginTop: 16,
    color: colors.text.secondary,
  },
  permissionSurface: {
    flex: 1,
    justifyContent: 'center',
    margin: 24,
    padding: 32,
    borderRadius: 16,
  },
  permissionTitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: colors.primary.main,
  },
  permissionDescription: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  permissionButtons: {
    gap: 12,
  },
  permissionButton: {
    marginVertical: 4,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  overlayTop: {
    flex: (screenHeight - scanAreaSize) / 2 / screenHeight,
    backgroundColor: overlayColor,
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: scanAreaSize,
  },
  overlaySide: {
    flex: (screenWidth - scanAreaSize) / 2 / screenWidth,
    backgroundColor: overlayColor,
  },
  scanningArea: {
    width: scanAreaSize,
    height: scanAreaSize,
    position: 'relative',
  },
  overlayBottom: {
    flex: (screenHeight - scanAreaSize) / 2 / screenHeight,
    backgroundColor: overlayColor,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: colors.primary.main,
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionTitle: {
    color: colors.primary.contrastText,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  instructionText: {
    color: colors.primary.contrastText,
    textAlign: 'center',
    opacity: 0.9,
  },
  scanningIndicator: {
    marginTop: 12,
  },
});

export default QRScanner;
