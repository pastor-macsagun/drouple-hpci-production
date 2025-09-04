/**
 * QR Parser Tests
 * Tests for check-in QR code parsing functionality
 */

import {
  parseCheckInQR,
  generateCheckInQR,
  isCheckInQR,
  QR_EXAMPLES,
} from '../qrParser';

describe('QR Parser', () => {
  describe('parseCheckInQR', () => {
    test('should parse valid QR code format', () => {
      const qrData = 'member:member_123;service:service_456';
      const result = parseCheckInQR(qrData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        memberId: 'member_123',
        serviceId: 'service_456',
      });
      expect(result.error).toBeUndefined();
    });

    test('should handle QR code with extra whitespace', () => {
      const qrData = '  member:member_123 ; service:service_456  ';
      const result = parseCheckInQR(qrData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        memberId: 'member_123',
        serviceId: 'service_456',
      });
    });

    test('should parse QR code with underscores and hyphens', () => {
      const qrData = 'member:user_123-abc;service:svc-456_xyz';
      const result = parseCheckInQR(qrData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        memberId: 'user_123-abc',
        serviceId: 'svc-456_xyz',
      });
    });

    test('should fail on invalid format without semicolon', () => {
      const qrData = 'member:member_123 service:service_456';
      const result = parseCheckInQR(qrData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid QR code format');
    });

    test('should fail on missing member ID', () => {
      const qrData = 'member:;service:service_456';
      const result = parseCheckInQR(qrData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Member ID not found');
    });

    test('should fail on missing service ID', () => {
      const qrData = 'member:member_123;service:';
      const result = parseCheckInQR(qrData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Service ID not found');
    });

    test('should fail on empty string', () => {
      const result = parseCheckInQR('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid QR code data');
    });

    test('should fail on null/undefined', () => {
      const result1 = parseCheckInQR(null as any);
      const result2 = parseCheckInQR(undefined as any);

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
    });

    test('should fail on wrong format', () => {
      const qrData = 'event:event_123;member:member_456';
      const result = parseCheckInQR(qrData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid QR code format');
    });

    test('should fail on invalid characters in IDs', () => {
      const qrData = 'member:member@123;service:service#456';
      const result = parseCheckInQR(qrData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid member ID format');
    });
  });

  describe('generateCheckInQR', () => {
    test('should generate correct QR format', () => {
      const qrData = generateCheckInQR('member_123', 'service_456');

      expect(qrData).toBe('member:member_123;service:service_456');
    });
  });

  describe('isCheckInQR', () => {
    test('should identify valid check-in QR codes', () => {
      const validQR = 'member:member_123;service:service_456';

      expect(isCheckInQR(validQR)).toBe(true);
    });

    test('should reject invalid QR codes', () => {
      expect(isCheckInQR('event:event_123')).toBe(false);
      expect(isCheckInQR('invalid format')).toBe(false);
      expect(isCheckInQR('')).toBe(false);
      expect(isCheckInQR(null as any)).toBe(false);
    });
  });

  describe('QR_EXAMPLES', () => {
    test('all valid examples should parse successfully', () => {
      QR_EXAMPLES.valid.forEach(qrData => {
        const result = parseCheckInQR(qrData);
        expect(result.success).toBe(true);
      });
    });

    test('all invalid examples should fail to parse', () => {
      QR_EXAMPLES.invalid.forEach(qrData => {
        const result = parseCheckInQR(qrData);
        expect(result.success).toBe(false);
      });
    });
  });
});
