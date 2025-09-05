/**
 * Check-in Screen - Camera QR scanner with offline support
 * Critical Sunday service functionality - must work offline
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { attendanceRepo } from '../../data/repos/attendance';
import { membersRepo } from '../../data/repos/members';
import { eventsRepo } from '../../data/repos/events';
import { outboxManager } from '../../sync/outbox';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingCard } from '../../components/ui/LoadingCard';

interface QRData {
  memberId: string;
  eventId?: string;
  timestamp?: string;
}

export default function CheckInScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [torch, setTorch] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState<any[]>([]);
  const [queueStatus, setQueueStatus] = useState({ pending: 0, synced: 0 });

  useEffect(() => {
    loadRecentCheckIns();
    loadQueueStatus();
  }, []);

  const loadRecentCheckIns = async () => {
    try {
      const checkIns = await attendanceRepo.getRecentCheckIns(5);
      setRecentCheckIns(checkIns);
    } catch (error) {
      console.error('Failed to load recent check-ins:', error);
    }
  };

  const loadQueueStatus = async () => {
    try {
      const status = await outboxManager.getQueueStatus();
      setQueueStatus(status);
    } catch (error) {
      console.error('Failed to load queue status:', error);
    }
  };

  const handleQRScanned = async (data: string) => {
    if (scanning) return;
    
    setScanning(true);
    
    try {
      // Parse QR code data
      const qrData: QRData = JSON.parse(data);
      
      if (!qrData.memberId) {
        throw new Error('Invalid QR code - missing member ID');
      }

      // Get member info for confirmation
      const member = await membersRepo.getById(qrData.memberId);
      if (!member) {
        throw new Error('Member not found in local database');
      }

      // Get current event (or use default)
      const events = await eventsRepo.getAll();
      const currentEvent = events.find(e => {
        const eventDate = new Date(e.startDate);
        const now = new Date();
        const diffHours = Math.abs(now.getTime() - eventDate.getTime()) / (1000 * 60 * 60);
        return diffHours < 4; // Event within 4 hours
      });

      if (!currentEvent) {
        throw new Error('No current service found for check-in');
      }

      // Confirm check-in
      Alert.alert(
        'Confirm Check-in',
        `Check in ${member.name} for ${currentEvent.title}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Check In',
            onPress: () => performCheckIn(qrData.memberId, currentEvent.id, member.name),
          },
          {
            text: 'New Believer',
            onPress: () => performCheckIn(qrData.memberId, currentEvent.id, member.name, true),
          },
        ]
      );

    } catch (error) {
      console.error('QR scan error:', error);
      Alert.alert(
        'Scan Error',
        error instanceof Error ? error.message : 'Invalid QR code',
        [{ text: 'Try Again' }]
      );
    } finally {
      setScanning = false;
      // Re-enable scanning after delay
      setTimeout(() => setScanning(false), 2000);
    }
  };

  const performCheckIn = async (
    memberId: string,
    eventId: string,
    memberName: string,
    isNewBeliever: boolean = false
  ) => {
    try {
      const result = await attendanceRepo.checkInLocally({
        memberId,
        eventId,
        deviceId: 'mobile-app', // Would be actual device ID in production
        isNewBeliever,
      });

      if (result.success) {
        Alert.alert(
          'Check-in Successful! ✅',
          `${memberName} has been checked in${isNewBeliever ? ' as a new believer 🎉' : ''}`,
          [{ text: 'Great!' }]
        );

        // Refresh data
        await Promise.all([
          loadRecentCheckIns(),
          loadQueueStatus(),
        ]);

        // Show appropriate message based on sync status
        const queueStatus = await outboxManager.getQueueStatus();
        if (queueStatus.pending > 0) {
          setTimeout(() => {
            Alert.alert(
              'Offline Mode',
              'Check-in saved locally and will sync when online.',
              [{ text: 'OK' }]
            );
          }, 1000);
        }

      } else {
        Alert.alert('Check-in Failed', result.error || 'Unknown error');
      }

    } catch (error) {
      console.error('Check-in error:', error);
      Alert.alert(
        'Check-in Failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  if (!permission) {
    return <LoadingCard />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <EmptyState
          icon="📸"
          title="Camera Permission Required"
          message="We need camera access to scan QR codes for check-in"
          actionText="Grant Permission"
          onAction={requestPermission}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="px-4 py-3 bg-black/80 absolute top-0 left-0 right-0 z-10">
        <Text className="text-white text-lg font-semibold text-center">
          Scan QR Code to Check In
        </Text>
        
        {/* Sync Status */}
        <View className="flex-row justify-center mt-2">
          {queueStatus.pending > 0 ? (
            <View className="px-3 py-1 bg-amber-500/90 rounded-full">
              <Text className="text-white text-sm font-medium">
                📡 {queueStatus.pending} queued for sync
              </Text>
            </View>
          ) : (
            <View className="px-3 py-1 bg-green-500/90 rounded-full">
              <Text className="text-white text-sm font-medium">
                ✅ All synced
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Camera View */}
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={({ data }) => handleQRScanned(data)}
      >
        {/* Scanning Overlay */}
        <View className="flex-1 items-center justify-center">
          <View className="w-64 h-64 border-2 border-white rounded-lg">
            <View className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-blue-400 rounded-tl-lg" />
            <View className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-blue-400 rounded-tr-lg" />
            <View className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-blue-400 rounded-bl-lg" />
            <View className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-blue-400 rounded-br-lg" />
          </View>
          
          <Text className="text-white mt-4 text-center px-8">
            Position the QR code within the frame
          </Text>
        </View>
      </CameraView>

      {/* Bottom Controls */}
      <View className="px-4 py-6 bg-black/80 absolute bottom-0 left-0 right-0">
        <View className="flex-row justify-between items-center">
          {/* Torch Toggle */}
          <Pressable
            onPress={() => setTorch(!torch)}
            className="w-14 h-14 bg-gray-800 rounded-full items-center justify-center"
          >
            <Text className="text-2xl">{torch ? '🔦' : '💡'}</Text>
          </Pressable>

          {/* Recent Check-ins Button */}
          <Pressable
            onPress={() => router.push('/(modals)/recent-checkins')}
            className="flex-1 mx-4 py-3 bg-white/20 rounded-lg items-center"
          >
            <Text className="text-white font-medium">
              Recent Check-ins ({recentCheckIns.length})
            </Text>
          </Pressable>

          {/* Manual Check-in */}
          <Pressable
            onPress={() => router.push('/(modals)/manual-checkin')}
            className="w-14 h-14 bg-blue-600 rounded-full items-center justify-center"
          >
            <Text className="text-2xl">✏️</Text>
          </Pressable>
        </View>

        {/* Instructions */}
        <Text className="text-white/80 text-sm text-center mt-3">
          Tap the pen icon for manual check-in if QR scanning isn't available
        </Text>
      </View>
    </SafeAreaView>
  );
}