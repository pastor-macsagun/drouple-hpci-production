/**
 * Check-In Service Unit Tests
 * Tests for QR scanning, manual check-in, offline queue, and sync
 */

import { CheckInService } from '../../../services/checkInService';
import { SyncManager } from '../../../lib/net/syncManager';
import { mockServices, mockUsers } from '../../../test/fixtures/mockData';

jest.mock('../../../lib/net/syncManager');
jest.mock('../../../lib/db/database');

describe('CheckInService', () => {
  let checkInService: CheckInService;
  const mockSyncManager = SyncManager as jest.Mocked<typeof SyncManager>;

  beforeEach(() => {
    checkInService = new CheckInService();
    jest.clearAllMocks();
  });

  describe('QR Code Check-In', () => {
    it('should successfully check-in with valid QR code', async () => {
      const qrData = 'drouple://checkin/service-sunday-1';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            id: 'checkin-123',
            serviceId: 'service-sunday-1',
            userId: mockUsers.member.id,
            checkedInAt: new Date().toISOString(),
          },
        }),
      });

      const result = await checkInService.checkInWithQR(
        qrData,
        mockUsers.member.id
      );

      expect(result.success).toBe(true);
      expect(result.data?.serviceId).toBe('service-sunday-1');
    });

    it('should handle invalid QR code format', async () => {
      const invalidQrData = 'invalid-qr-code';

      const result = await checkInService.checkInWithQR(
        invalidQrData,
        mockUsers.member.id
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid QR code');
    });

    it('should queue check-in when offline', async () => {
      const qrData = 'drouple://checkin/service-sunday-1';

      // Mock network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await checkInService.checkInWithQR(
        qrData,
        mockUsers.member.id
      );

      expect(result.success).toBe(true);
      expect(result.data?.queuedForSync).toBe(true);
      expect(mockSyncManager.queueCheckIn).toHaveBeenCalled();
    });
  });

  describe('Manual Check-In', () => {
    it('should allow manual check-in by selecting service', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            id: 'checkin-manual-123',
            serviceId: mockServices[0].id,
            userId: mockUsers.member.id,
            checkedInAt: new Date().toISOString(),
          },
        }),
      });

      const result = await checkInService.manualCheckIn(
        mockServices[0].id,
        mockUsers.member.id
      );

      expect(result.success).toBe(true);
      expect(result.data?.serviceId).toBe(mockServices[0].id);
    });

    it('should prevent duplicate check-ins', async () => {
      // Mock already checked in
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: 'User already checked in to this service',
        }),
      });

      const result = await checkInService.manualCheckIn(
        mockServices[0].id,
        mockUsers.member.id
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('already checked in');
    });
  });

  describe('Offline Sync', () => {
    it('should sync queued check-ins when back online', async () => {
      const queuedCheckIns = [
        {
          id: 'temp-1',
          serviceId: 'service-sunday-1',
          userId: mockUsers.member.id,
          timestamp: Date.now(),
        },
      ];

      mockSyncManager.getQueuedCheckIns.mockResolvedValue(queuedCheckIns);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { synced: 1, failed: 0 },
        }),
      });

      const result = await checkInService.syncQueuedCheckIns();

      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockSyncManager.clearSyncedCheckIns).toHaveBeenCalled();
    });

    it('should handle partial sync failures', async () => {
      const queuedCheckIns = [
        {
          id: 'temp-1',
          serviceId: 'service-sunday-1',
          userId: mockUsers.member.id,
          timestamp: Date.now(),
        },
        {
          id: 'temp-2',
          serviceId: 'invalid-service',
          userId: mockUsers.member.id,
          timestamp: Date.now(),
        },
      ];

      mockSyncManager.getQueuedCheckIns.mockResolvedValue(queuedCheckIns);

      // First request succeeds, second fails
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: jest
            .fn()
            .mockResolvedValue({ success: false, error: 'Service not found' }),
        });

      const result = await checkInService.syncQueuedCheckIns();

      expect(result.synced).toBe(1);
      expect(result.failed).toBe(1);
    });
  });

  describe('Check-In History', () => {
    it('should fetch user check-in history', async () => {
      const mockHistory = [
        {
          id: 'checkin-1',
          serviceName: 'Sunday Service',
          checkedInAt: '2024-01-07T09:15:00Z',
        },
        {
          id: 'checkin-2',
          serviceName: 'Sunday Service 2nd',
          checkedInAt: '2024-01-14T11:10:00Z',
        },
      ];

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: mockHistory,
        }),
      });

      const result = await checkInService.getCheckInHistory(
        mockUsers.member.id
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].serviceName).toBe('Sunday Service');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting for rapid check-in attempts', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: 'Rate limit exceeded',
        }),
      });

      const result = await checkInService.checkInWithQR(
        'drouple://checkin/service-sunday-1',
        mockUsers.member.id
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit');
    });
  });
});
