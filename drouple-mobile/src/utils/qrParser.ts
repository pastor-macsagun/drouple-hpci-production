/**
 * QR Code Parser for Check-In System
 * Parses placeholder format: member:{id};service:{id}
 */

export interface QRParseResult {
  success: boolean;
  data?: {
    memberId: string;
    serviceId: string;
  };
  error?: string;
}

/**
 * Parse QR code data for check-in
 * Expected format: member:{id};service:{id}
 * Example: member:member_123;service:service_456
 */
export const parseCheckInQR = (qrData: string): QRParseResult => {
  try {
    // Validate input
    if (!qrData || typeof qrData !== 'string') {
      return {
        success: false,
        error: 'Invalid QR code data',
      };
    }

    const trimmedData = qrData.trim();

    if (!trimmedData) {
      return {
        success: false,
        error: 'Empty QR code',
      };
    }

    // Check if it contains the expected pattern
    if (!trimmedData.includes('member:') || !trimmedData.includes('service:')) {
      return {
        success: false,
        error: 'Invalid QR code format. Expected check-in QR code.',
      };
    }

    // Split by semicolon
    const parts = trimmedData.split(';');

    if (parts.length !== 2) {
      return {
        success: false,
        error:
          'Invalid QR code format. Expected format: member:{id};service:{id}',
      };
    }

    let memberId = '';
    let serviceId = '';

    // Parse each part
    for (const part of parts) {
      const trimmedPart = part.trim();

      if (trimmedPart.startsWith('member:')) {
        memberId = trimmedPart.substring('member:'.length).trim();
      } else if (trimmedPart.startsWith('service:')) {
        serviceId = trimmedPart.substring('service:'.length).trim();
      } else {
        return {
          success: false,
          error: `Invalid QR code part: ${trimmedPart}`,
        };
      }
    }

    // Validate extracted IDs
    if (!memberId) {
      return {
        success: false,
        error: 'Member ID not found in QR code',
      };
    }

    if (!serviceId) {
      return {
        success: false,
        error: 'Service ID not found in QR code',
      };
    }

    // Basic ID validation (alphanumeric, underscores, hyphens)
    const idPattern = /^[a-zA-Z0-9_-]+$/;

    if (!idPattern.test(memberId)) {
      return {
        success: false,
        error: 'Invalid member ID format',
      };
    }

    if (!idPattern.test(serviceId)) {
      return {
        success: false,
        error: 'Invalid service ID format',
      };
    }

    return {
      success: true,
      data: {
        memberId,
        serviceId,
      },
    };
  } catch (error) {
    console.error('QR Parse Error:', error);
    return {
      success: false,
      error: 'Failed to parse QR code',
    };
  }
};

/**
 * Generate QR code data for testing
 */
export const generateCheckInQR = (
  memberId: string,
  serviceId: string
): string => {
  return `member:${memberId};service:${serviceId}`;
};

/**
 * Validate if a string looks like a check-in QR code
 */
export const isCheckInQR = (qrData: string): boolean => {
  if (!qrData || typeof qrData !== 'string') {
    return false;
  }

  const trimmedData = qrData.trim();
  return trimmedData.includes('member:') && trimmedData.includes('service:');
};

/**
 * QR code examples for testing
 */
export const QR_EXAMPLES = {
  valid: [
    'member:member_1;service:service_1',
    'member:usr_123456;service:svc_789012',
    'member:john_doe;service:sunday_morning',
  ],
  invalid: [
    'invalid format',
    'member:123',
    'service:456',
    'member:;service:123',
    'member:123;service:',
    'event:123;member:456', // Wrong format
    '',
    'random text',
  ],
};

export default parseCheckInQR;
