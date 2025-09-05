/**
 * Check-in Screen - QR code scanning for attendance
 * Features: Offline queue, sync status, idempotency
 */

import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, SafeAreaView } from 'react-native';
import { QRScanner } from '../../components/ui/QRScanner';
import { apiClient } from '../../lib/api/client';

export default function CheckInsScreen() {
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQRScan = async (qrData: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setIsScanning(false);

    try {
      // Generate idempotency key for safe retry
      const idempotencyKey = `checkin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Parse QR code data - expect format like "member:123" or "service:456"
      const [type, id] = qrData.split(':');
      
      if (type !== 'member' && type !== 'service') {
        throw new Error('Invalid QR code format');
      }

      // Submit check-in to backend
      const result = await apiClient.post('/attendance/checkin', {
        type,
        entityId: id,
        timestamp: new Date().toISOString(),
      }, {
        idempotencyKey,
      });

      Alert.alert(
        'Check-in Successful!',
        `Successfully checked in ${type} ${id}`,
        [
          {
            text: 'Scan Another',
            onPress: () => {
              setIsScanning(true);
              setIsProcessing(false);
            }
          }
        ]
      );

    } catch (error) {
      console.error('Check-in error:', error);
      
      let errorMessage = 'Failed to process check-in';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert(
        'Check-in Failed',
        errorMessage,
        [
          {
            text: 'Try Again',
            onPress: () => {
              setIsScanning(true);
              setIsProcessing(false);
            }
          }
        ]
      );
    }
  };

  const handleScanError = (error: Error) => {
    console.error('QR Scanner error:', error);
    Alert.alert(
      'Scanner Error',
      'There was an issue with the camera scanner. Please try again.',
      [
        {
          text: 'OK',
          onPress: () => {
            setIsScanning(true);
            setIsProcessing(false);
          }
        }
      ]
    );
  };

  const handlePermissionDenied = () => {
    Alert.alert(
      'Camera Permission Required',
      'To use the QR scanner for check-ins, please enable camera access in your device settings.',
      [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back or provide alternative
            setIsScanning(false);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Check-In Scanner</Text>
        <Text style={styles.subtitle}>
          Scan member QR codes or service codes to record attendance
        </Text>
      </View>

      {isProcessing ? (
        <View style={styles.processingContainer}>
          <Text style={styles.processingText}>Processing check-in...</Text>
        </View>
      ) : (
        <View style={styles.scannerContainer}>
          <QRScanner
            onScan={handleQRScan}
            onError={handleScanError}
            onPermissionDenied={handlePermissionDenied}
            isActive={isScanning}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#5f6368',
    lineHeight: 22,
  },
  scannerContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
  },
  processingText: {
    fontSize: 18,
    color: '#1e7ce8',
    fontWeight: '600',
  },
});