/**
 * QR Code Scanner Component
 * Camera view with mask, torch/flip controls, and offline support
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Alert,
  Vibration,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { useTokens } from '@/theme';
import { Button } from './Button';
import { Card } from './Card';
import { SyncStatusBadge, OfflineBadge } from '../sync/SyncStatusBadge';

const { width, height } = Dimensions.get('window');
const scanAreaSize = Math.min(width * 0.7, 280);

export interface QRScannerProps {
  onScan: (data: string) => Promise<void>;
  isProcessing?: boolean;
  isOffline?: boolean;
  onClose?: () => void;
  scanMessage?: string;
  style?: any;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  isProcessing = false,
  isOffline = false,
  onClose,
  scanMessage = "Position QR code within the square",
  style,
}) => {
  const tokens = useTokens();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [torchOn, setTorchOn] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);
  
  const scanCooldown = 2000; // 2 seconds between scans

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    const now = Date.now();
    
    // Prevent rapid successive scans
    if (scanned || now - lastScanTime < scanCooldown) {
      return;
    }

    setScanned(true);
    setLastScanTime(now);
    
    // Provide haptic feedback
    Vibration.vibrate(100);

    try {
      await onScan(data);
    } catch (error) {
      console.error('Scan processing error:', error);
      Alert.alert(
        'Scan Error',
        'There was a problem processing the QR code. Please try again.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
      return;
    }

    // Reset scan state after cooldown
    setTimeout(() => {
      setScanned(false);
    }, scanCooldown);
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleTorch = () => {
    setTorchOn(current => !current);
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: tokens.colors.bg.surface }]}>
        <Card style={styles.permissionCard}>
          <MaterialIcons 
            name="camera-alt" 
            size={48} 
            color={tokens.colors.text.tertiary} 
            style={{ alignSelf: 'center', marginBottom: tokens.spacing.md }}
          />
          <Text style={[styles.permissionTitle, { color: tokens.colors.text.primary }]}>
            Camera Access Needed
          </Text>
          <Text style={[styles.permissionMessage, { color: tokens.colors.text.secondary }]}>
            We need camera access to scan QR codes for check-ins.
          </Text>
        </Card>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: tokens.colors.bg.surface }]}>
        <Card style={styles.permissionCard}>
          <MaterialIcons 
            name="camera-alt" 
            size={48} 
            color={tokens.colors.text.tertiary} 
            style={{ alignSelf: 'center', marginBottom: tokens.spacing.md }}
          />
          <Text style={[styles.permissionTitle, { color: tokens.colors.text.primary }]}>
            Camera Permission Required
          </Text>
          <Text style={[styles.permissionMessage, { color: tokens.colors.text.secondary }]}>
            Please allow camera access to scan QR codes for check-ins.
          </Text>
          <Button
            variant="filled"
            onPress={requestPermission}
            style={{ marginTop: tokens.spacing.lg }}
          >
            Grant Camera Access
          </Button>
        </Card>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.bg.surface }, style]}>
      {/* Header with sync status */}
      <View style={[styles.header, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <View style={styles.headerContent}>
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close scanner"
          >
            <MaterialIcons name="close" size={28} color="#fff" />
          </Pressable>
          
          <View style={styles.syncStatus}>
            <OfflineBadge visible={isOffline} />
            {!isOffline && <SyncStatusBadge size="sm" />}
          </View>
        </View>
      </View>

      {/* Camera View */}
      <CameraView
        style={styles.camera}
        facing={facing}
        enableTorch={torchOn}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* Scan Overlay */}
        <View style={styles.overlay}>
          {/* Top overlay */}
          <View style={[styles.overlaySection, styles.overlayTop]} />
          
          {/* Middle section with scan area */}
          <View style={styles.overlayMiddle}>
            <View style={[styles.overlaySection, styles.overlaySide]} />
            
            {/* Scan Area */}
            <View style={[
              styles.scanArea,
              {
                width: scanAreaSize,
                height: scanAreaSize,
                borderColor: scanned 
                  ? tokens.colors.state.success 
                  : tokens.colors.brand.primary,
              }
            ]}>
              {/* Corner indicators */}
              <View style={[styles.corner, styles.cornerTopLeft, { 
                borderColor: scanned 
                  ? tokens.colors.state.success 
                  : tokens.colors.brand.primary 
              }]} />
              <View style={[styles.corner, styles.cornerTopRight, { 
                borderColor: scanned 
                  ? tokens.colors.state.success 
                  : tokens.colors.brand.primary 
              }]} />
              <View style={[styles.corner, styles.cornerBottomLeft, { 
                borderColor: scanned 
                  ? tokens.colors.state.success 
                  : tokens.colors.brand.primary 
              }]} />
              <View style={[styles.corner, styles.cornerBottomRight, { 
                borderColor: scanned 
                  ? tokens.colors.state.success 
                  : tokens.colors.brand.primary 
              }]} />
              
              {/* Scanning animation line */}
              {!scanned && (
                <View style={[styles.scanLine, { 
                  backgroundColor: tokens.colors.brand.primary,
                  shadowColor: tokens.colors.brand.primary,
                }]} />
              )}
              
              {/* Success indicator */}
              {scanned && (
                <View style={styles.scanSuccess}>
                  <MaterialIcons 
                    name="check-circle" 
                    size={48} 
                    color={tokens.colors.state.success} 
                  />
                </View>
              )}
            </View>
            
            <View style={[styles.overlaySection, styles.overlaySide]} />
          </View>
          
          {/* Bottom overlay */}
          <View style={[styles.overlaySection, styles.overlayBottom]} />
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={[styles.instructionText, { color: '#fff' }]}>
            {isProcessing ? 'Processing...' : scanMessage}
          </Text>
          {isOffline && (
            <Text style={[styles.offlineText, { color: tokens.colors.state.warning }]}>
              Offline - Check-ins will sync when connected
            </Text>
          )}
        </View>

        {/* Camera Controls */}
        <View style={styles.controls}>
          <Pressable
            style={[styles.controlButton, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
            onPress={toggleCameraFacing}
            accessibilityRole="button"
            accessibilityLabel="Flip camera"
            disabled={isProcessing}
          >
            <MaterialIcons name="flip-camera-ios" size={28} color="#fff" />
          </Pressable>

          <Pressable
            style={[
              styles.controlButton,
              {
                backgroundColor: torchOn ? tokens.colors.accent.primary : 'rgba(0,0,0,0.6)',
              }
            ]}
            onPress={toggleTorch}
            accessibilityRole="button"
            accessibilityLabel={torchOn ? "Turn off torch" : "Turn on torch"}
            disabled={isProcessing || facing === 'front'}
          >
            <MaterialIcons 
              name={torchOn ? 'flash-on' : 'flash-off'} 
              size={28} 
              color="#fff" 
            />
          </Pressable>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 50, // Account for status bar
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  closeButton: {
    padding: 8,
  },
  syncStatus: {
    flexDirection: 'row',
    gap: 8,
  },
  camera: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlaySection: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  overlayTop: {
    height: (height - scanAreaSize) / 2,
    width: '100%',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: scanAreaSize,
    width: '100%',
  },
  overlaySide: {
    flex: 1,
  },
  overlayBottom: {
    height: (height - scanAreaSize) / 2,
    width: '100%',
  },
  scanArea: {
    borderWidth: 2,
    borderRadius: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 4,
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 20,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 20,
  },
  scanLine: {
    position: 'absolute',
    height: 2,
    width: '80%',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    // Animation would be added with Animated API
  },
  scanSuccess: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    position: 'absolute',
    bottom: 140,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  offlineText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 60,
  },
  controlButton: {
    padding: 16,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionCard: {
    margin: 20,
    padding: 24,
    alignItems: 'center',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
});