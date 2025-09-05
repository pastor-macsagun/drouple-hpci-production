/**
 * Check-in QR Scanner Modal
 * Full-screen QR code scanner for member check-ins
 */

import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { QRScanner } from '@/components/ui/QRScanner';
import { Toast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { attendanceRepository } from '@/data/repos/attendance';
import { backgroundSyncManager } from '@/sync/background';

export default function CheckInQRModal() {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ isOnline: true });
  const [toast, setToast] = useState<{
    visible: boolean;
    variant: 'success' | 'error';
    title: string;
    message: string;
  }>({ visible: false, variant: 'success', title: '', message: '' });

  React.useEffect(() => {
    // Get initial sync status
    backgroundSyncManager.getSyncStatus()
      .then(status => setSyncStatus(status))
      .catch(() => setSyncStatus({ isOnline: false }));
  }, []);

  const handleScan = async (qrData: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);

    try {
      // Parse QR code data
      const scanData = parseQRData(qrData);
      if (!scanData) {
        throw new Error('Invalid QR code format');
      }

      // Check if already checked in today
      const alreadyCheckedIn = await attendanceRepository.isCheckedInToday(
        scanData.memberId,
        scanData.serviceId
      );

      if (alreadyCheckedIn) {
        setToast({
          visible: true,
          variant: 'error',
          title: 'Already Checked In',
          message: 'This member has already checked in today.',
        });
        setIsProcessing(false);
        return;
      }

      // Record check-in (offline-first)
      await attendanceRepository.checkIn(
        {
          memberId: scanData.memberId,
          serviceId: scanData.serviceId,
          notes: 'QR Code scan',
        },
        user?.id || 'unknown'
      );

      // Show success feedback
      setToast({
        visible: true,
        variant: 'success',
        title: 'Check-in Successful',
        message: syncStatus.isOnline 
          ? 'Member checked in successfully!'
          : 'Member checked in offline. Will sync when connected.',
      });

      // Close modal after short delay
      setTimeout(() => {
        router.back();
      }, 2000);

    } catch (error) {
      console.error('Check-in error:', error);
      
      setToast({
        visible: true,
        variant: 'error',
        title: 'Check-in Failed',
        message: error instanceof Error 
          ? error.message 
          : 'Something went wrong. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const parseQRData = (qrData: string): { memberId: string; serviceId?: string } | null => {
    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(qrData);
      if (parsed.memberId) {
        return {
          memberId: parsed.memberId,
          serviceId: parsed.serviceId,
        };
      }
    } catch {
      // Fallback: treat as member ID
      if (qrData && qrData.length > 0) {
        return {
          memberId: qrData,
          serviceId: undefined,
        };
      }
    }
    
    return null;
  };

  const handleClose = () => {
    if (!isProcessing) {
      router.back();
    }
  };

  const showManualEntry = () => {
    Alert.alert(
      'Manual Entry',
      'Would you like to manually enter a member ID for check-in?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enter Manually',
          onPress: () => {
            // Navigate to manual entry screen
            router.push('/checkin-manual');
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar style="light" />
      
      <QRScanner
        onScan={handleScan}
        onClose={handleClose}
        isProcessing={isProcessing}
        isOffline={!syncStatus.isOnline}
        scanMessage="Position member's QR code within the square"
      />

      <Toast
        visible={toast.visible}
        variant={toast.variant}
        title={toast.title}
        message={toast.message}
        onDismiss={() => setToast(prev => ({ ...prev, visible: false }))}
        duration={toast.variant === 'success' ? 3000 : 5000}
        position="top"
        action={toast.variant === 'error' ? {
          label: 'Manual Entry',
          onPress: showManualEntry,
        } : undefined}
      />
    </View>
  );
}