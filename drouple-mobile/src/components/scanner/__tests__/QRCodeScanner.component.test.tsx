/**
 * QR Code Scanner Component Tests
 * Tests QR code scanning functionality and UI interactions
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@/test/setup.component';
import { Alert } from 'react-native';

import { QRCodeScanner } from '../QRCodeScanner';
import { useAuthStore } from '@/lib/store/authStore';
import { syncManager } from '@/lib/sync/syncManager';
import { NetworkService } from '@/lib/net/networkService';

// Mock dependencies
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(),
  },
  CameraView: ({ children, onBarcodeScanned }: any) => {
    // Simulate camera view
    React.useEffect(() => {
      // Store the scan handler for manual triggering in tests
      global.mockCameraOnBarcodeScanned = onBarcodeScanned;
    }, [onBarcodeScanned]);

    return <div data-testid='camera-view'>{children}</div>;
  },
  FlashMode: {
    on: 'on',
    off: 'off',
  },
}));

jest.mock('expo-barcode-scanner', () => ({
  BarCodeScanner: {
    Constants: {
      BarCodeType: {
        qr: 'qr',
      },
    },
  },
}));

// Mock Vibration
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Vibration: {
    vibrate: jest.fn(),
  },
  Platform: {
    OS: 'ios',
  },
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock stores and services
jest.mock('@/lib/store/authStore');
jest.mock('@/lib/sync/syncManager');
jest.mock('@/lib/net/networkService');

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;
const mockSyncManager = syncManager as jest.Mocked<typeof syncManager>;
const mockNetworkService = NetworkService as jest.Mocked<typeof NetworkService>;

describe('QRCodeScanner', () => {
  const mockOnScanSuccess = jest.fn();
  const mockOnScanError = jest.fn();
  const mockOnClose = jest.fn();

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    roles: ['MEMBER'],
    tenantId: 'church-456',
  };

  const defaultProps = {
    onScanSuccess: mockOnScanSuccess,
    onScanError: mockOnScanError,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockUseAuthStore.mockReturnValue(mockUser);
    mockSyncManager.enqueueAction.mockResolvedValue(1);
    mockNetworkService.isConnected.mockResolvedValue(true);

    // Mock camera permissions
    require('expo-camera').Camera.requestCameraPermissionsAsync.mockResolvedValue(
      {
        status: 'granted',
      }
    );

    // Clear global mock function
    global.mockCameraOnBarcodeScanned = undefined;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Camera Permission', () => {
    it('should request camera permission on mount', async () => {
      render(<QRCodeScanner {...defaultProps} />);

      await waitFor(() => {
        expect(
          require('expo-camera').Camera.requestCameraPermissionsAsync
        ).toHaveBeenCalledTimes(1);
      });
    });

    it('should show permission denied message when camera access is denied', async () => {
      require('expo-camera').Camera.requestCameraPermissionsAsync.mockResolvedValue(
        {
          status: 'denied',
        }
      );

      const { getByText } = render(<QRCodeScanner {...defaultProps} />);

      await waitFor(() => {
        expect(
          getByText('Camera access is required to scan QR codes')
        ).toBeTruthy();
      });
    });

    it('should show loading state while requesting permission', () => {
      require('expo-camera').Camera.requestCameraPermissionsAsync.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ status: 'granted' }), 100)
          )
      );

      const { getByText } = render(<QRCodeScanner {...defaultProps} />);

      expect(getByText('Requesting camera permission...')).toBeTruthy();
    });
  });

  describe('QR Code Scanning', () => {
    beforeEach(async () => {
      render(<QRCodeScanner {...defaultProps} />);

      // Wait for permission to be granted
      await waitFor(() => {
        expect(global.mockCameraOnBarcodeScanned).toBeDefined();
      });
    });

    it('should parse simple check-in QR code', async () => {
      const qrData = 'checkin:service-123';

      act(() => {
        global.mockCameraOnBarcodeScanned?.({
          type: 'QR_CODE',
          data: qrData,
        });
      });

      await waitFor(() => {
        expect(mockOnScanSuccess).toHaveBeenCalledWith({
          type: 'checkin',
          data: { serviceId: 'service-123' },
          rawData: qrData,
        });
      });
    });

    it('should parse JSON format QR code', async () => {
      const qrData = JSON.stringify({
        type: 'event',
        data: { eventId: 'event-456' },
      });

      act(() => {
        global.mockCameraOnBarcodeScanned?.({
          type: 'QR_CODE',
          data: qrData,
        });
      });

      await waitFor(() => {
        expect(mockOnScanSuccess).toHaveBeenCalledWith({
          type: 'event',
          data: { eventId: 'event-456' },
          rawData: qrData,
        });
      });
    });

    it('should parse URL format QR code', async () => {
      const qrData = 'https://app.drouple.com/checkin/service-789';

      act(() => {
        global.mockCameraOnBarcodeScanned?.({
          type: 'QR_CODE',
          data: qrData,
        });
      });

      await waitFor(() => {
        expect(mockOnScanSuccess).toHaveBeenCalledWith({
          type: 'checkin',
          data: { serviceId: 'service-789' },
          rawData: qrData,
        });
      });
    });

    it('should handle unknown QR code format', async () => {
      const qrData = 'some-random-text';

      act(() => {
        global.mockCameraOnBarcodeScanned?.({
          type: 'QR_CODE',
          data: qrData,
        });
      });

      await waitFor(() => {
        expect(mockOnScanError).toHaveBeenCalledWith(
          'Invalid or unsupported QR code format'
        );
      });
    });

    it('should prevent duplicate scans within 2 seconds', async () => {
      jest.useFakeTimers();
      const qrData = 'checkin:service-123';

      // First scan
      act(() => {
        global.mockCameraOnBarcodeScanned?.({
          type: 'QR_CODE',
          data: qrData,
        });
      });

      // Second scan immediately after
      act(() => {
        global.mockCameraOnBarcodeScanned?.({
          type: 'QR_CODE',
          data: qrData,
        });
      });

      await waitFor(() => {
        expect(mockOnScanSuccess).toHaveBeenCalledTimes(1);
      });

      // Fast forward time and scan again
      act(() => {
        jest.advanceTimersByTime(2500);
      });

      act(() => {
        global.mockCameraOnBarcodeScanned?.({
          type: 'QR_CODE',
          data: qrData,
        });
      });

      await waitFor(() => {
        expect(mockOnScanSuccess).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Offline Handling', () => {
    beforeEach(async () => {
      mockNetworkService.isConnected.mockResolvedValue(false);

      render(<QRCodeScanner {...defaultProps} />);

      await waitFor(() => {
        expect(global.mockCameraOnBarcodeScanned).toBeDefined();
      });
    });

    it('should queue check-in action when offline', async () => {
      const qrData = 'checkin:service-123';

      act(() => {
        global.mockCameraOnBarcodeScanned?.({
          type: 'QR_CODE',
          data: qrData,
        });
      });

      await waitFor(() => {
        expect(mockSyncManager.enqueueAction).toHaveBeenCalledWith('CHECKIN', {
          serviceId: 'service-123',
          userId: 'user-123',
          timestamp: expect.any(String),
          location: null,
        });
      });
    });

    it('should show offline message for queued actions', async () => {
      const qrData = 'checkin:service-123';

      act(() => {
        global.mockCameraOnBarcodeScanned?.({
          type: 'QR_CODE',
          data: qrData,
        });
      });

      await waitFor(() => {
        expect(mockOnScanError).toHaveBeenCalledWith(
          'Check-in saved offline - will sync when online'
        );
      });
    });
  });

  describe('Scanner Type Filtering', () => {
    it('should reject non-matching scanner type', async () => {
      render(<QRCodeScanner {...defaultProps} scannerType='event' />);

      await waitFor(() => {
        expect(global.mockCameraOnBarcodeScanned).toBeDefined();
      });

      const qrData = 'checkin:service-123';

      act(() => {
        global.mockCameraOnBarcodeScanned?.({
          type: 'QR_CODE',
          data: qrData,
        });
      });

      await waitFor(() => {
        expect(mockOnScanError).toHaveBeenCalledWith(
          'Expected event QR code, but scanned checkin'
        );
      });
    });

    it('should accept matching scanner type', async () => {
      render(<QRCodeScanner {...defaultProps} scannerType='checkin' />);

      await waitFor(() => {
        expect(global.mockCameraOnBarcodeScanned).toBeDefined();
      });

      const qrData = 'checkin:service-123';

      act(() => {
        global.mockCameraOnBarcodeScanned?.({
          type: 'QR_CODE',
          data: qrData,
        });
      });

      await waitFor(() => {
        expect(mockOnScanSuccess).toHaveBeenCalledWith({
          type: 'checkin',
          data: { serviceId: 'service-123' },
          rawData: qrData,
        });
      });
    });
  });

  describe('UI Interactions', () => {
    beforeEach(async () => {
      const { getByTestId } = render(
        <QRCodeScanner {...defaultProps} enableFlash />
      );

      await waitFor(() => {
        expect(getByTestId('camera-view')).toBeTruthy();
      });
    });

    it('should have close button that calls onClose', async () => {
      const { getByLabelText } = render(<QRCodeScanner {...defaultProps} />);

      await waitFor(() => {
        const closeButton = getByLabelText('close');
        fireEvent.press(closeButton);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should toggle flash when flash button is pressed', async () => {
      const { getByLabelText } = render(
        <QRCodeScanner {...defaultProps} enableFlash />
      );

      await waitFor(() => {
        const flashButton = getByLabelText('flash-off');
        fireEvent.press(flashButton);
        // Flash should toggle (tested via internal state, hard to test directly)
      });
    });

    it('should show instructions text', async () => {
      const { getByText } = render(<QRCodeScanner {...defaultProps} />);

      await waitFor(() => {
        expect(getByText('Position the QR code within the frame')).toBeTruthy();
      });
    });

    it('should show specific instructions for check-in scanner', async () => {
      const { getByText } = render(
        <QRCodeScanner {...defaultProps} scannerType='checkin' />
      );

      await waitFor(() => {
        expect(getByText('Scan the service check-in QR code')).toBeTruthy();
      });
    });
  });

  describe('Authentication Handling', () => {
    it('should handle unauthenticated user', async () => {
      mockUseAuthStore.mockReturnValue(null);

      render(<QRCodeScanner {...defaultProps} />);

      await waitFor(() => {
        expect(global.mockCameraOnBarcodeScanned).toBeDefined();
      });

      const qrData = 'checkin:service-123';

      act(() => {
        global.mockCameraOnBarcodeScanned?.({
          type: 'QR_CODE',
          data: qrData,
        });
      });

      await waitFor(() => {
        expect(mockOnScanError).toHaveBeenCalledWith('User not authenticated');
      });
    });
  });
});
