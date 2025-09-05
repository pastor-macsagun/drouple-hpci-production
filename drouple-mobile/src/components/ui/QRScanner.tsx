/**
 * QR Scanner Component - Production-ready camera scanner for check-ins
 * Features: Camera permissions, torch toggle, error handling, accessibility
 */

import React, { useState, useEffect } from 'react-native';
import { View, Text, Alert, StyleSheet, Pressable } from 'react-native';
import { CameraView, Camera, BarcodeScanningResult } from 'expo-camera';

export interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: Error) => void;
  onPermissionDenied?: () => void;
  isActive?: boolean;
}

export function QRScanner({ 
  onScan, 
  onError, 
  onPermissionDenied, 
  isActive = true 
}: QRScannerProps) {
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    // Request camera permission on mount
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    if (scanned || !isActive) return;

    setScanned(true);
    
    try {
      onScan(data);
      
      // Reset scan state after a delay to allow for new scans
      setTimeout(() => setScanned(false), 2000);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Scan processing failed'));
      setScanned(false);
    }
  };

  const toggleTorch = () => {
    setTorchOn(prev => !prev);
  };

  const resetScan = () => {
    setScanned(false);
  };

  // Handle permission states
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission is required to scan QR codes</Text>
        <Pressable 
          style={styles.button}
          onPress={requestPermission}
          accessibilityRole="button"
          accessibilityLabel="Grant camera permission"
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
        <Pressable 
          style={styles.linkButton}
          onPress={onPermissionDenied}
          accessibilityRole="button"
          accessibilityLabel="Continue without camera"
        >
          <Text style={styles.linkText}>Continue without camera</Text>
        </Pressable>
      </View>
    );
  }

  if (!isActive) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Scanner is inactive</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torchOn}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* Scanner overlay */}
        <View style={styles.overlay}>
          {/* Top overlay */}
          <View style={styles.overlayTop}>
            <Text style={styles.instruction}>
              Position QR code within the frame
            </Text>
          </View>

          {/* Scanner frame area */}
          <View style={styles.scannerFrame}>
            <View style={styles.frameCornerTopLeft} />
            <View style={styles.frameCornerTopRight} />
            <View style={styles.frameCornerBottomLeft} />
            <View style={styles.frameCornerBottomRight} />
          </View>

          {/* Bottom overlay with controls */}
          <View style={styles.overlayBottom}>
            <View style={styles.controls}>
              <Pressable
                style={[styles.controlButton, torchOn && styles.controlButtonActive]}
                onPress={toggleTorch}
                accessibilityRole="button"
                accessibilityLabel={torchOn ? "Turn off flashlight" : "Turn on flashlight"}
                accessibilityState={{ selected: torchOn }}
              >
                <Text style={styles.controlButtonText}>
                  {torchOn ? '🔦' : '🔦'}
                </Text>
              </Pressable>

              {scanned && (
                <Pressable
                  style={styles.controlButton}
                  onPress={resetScan}
                  accessibilityRole="button"
                  accessibilityLabel="Scan again"
                >
                  <Text style={styles.controlButtonText}>↻</Text>
                </Pressable>
              )}
            </View>

            {scanned && (
              <Text style={styles.scannedMessage}>
                QR code scanned successfully!
              </Text>
            )}
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
  },
  scannerFrame: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    position: 'relative',
  },
  frameCornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#1e7ce8',
  },
  frameCornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#1e7ce8',
  },
  frameCornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#1e7ce8',
  },
  frameCornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#1e7ce8',
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 10,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(30, 124, 232, 0.3)',
    borderColor: '#1e7ce8',
  },
  controlButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  scannedMessage: {
    color: '#4ade80',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    margin: 20,
  },
  button: {
    backgroundColor: '#1e7ce8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  linkButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginHorizontal: 20,
  },
  linkText: {
    color: '#1e7ce8',
    fontSize: 16,
    textAlign: 'center',
  },
});