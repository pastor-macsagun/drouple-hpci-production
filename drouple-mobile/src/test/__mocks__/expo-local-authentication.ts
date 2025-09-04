/**
 * Mock Expo Local Authentication (Biometrics)
 */

export const AuthenticationType = {
  FINGERPRINT: 1,
  FACIAL_RECOGNITION: 2,
  IRIS: 3,
  OPTIC_ID: 4,
  PASSCODE: 0,
};

export const SecurityLevel = {
  NONE: 0,
  SECRET: 1,
  BIOMETRIC_WEAK: 2,
  BIOMETRIC_STRONG: 3,
};

export const hasHardwareAsync = jest.fn(() => Promise.resolve(true));

export const supportedAuthenticationTypesAsync = jest.fn(() =>
  Promise.resolve([
    AuthenticationType.FINGERPRINT,
    AuthenticationType.FACIAL_RECOGNITION,
  ])
);

export const isEnrolledAsync = jest.fn(() => Promise.resolve(true));

export const getEnrolledLevelAsync = jest.fn(() =>
  Promise.resolve(SecurityLevel.BIOMETRIC_STRONG)
);

export const authenticateAsync = jest.fn((options = {}) => {
  // Simulate successful biometric authentication
  return Promise.resolve({
    success: true,
    error: undefined,
    warning: undefined,
  });
});

export const cancelAuthenticate = jest.fn();

// Mock options for testing different scenarios
export const mockBiometricSuccess = () => {
  (authenticateAsync as jest.Mock).mockResolvedValue({
    success: true,
    error: undefined,
    warning: undefined,
  });
};

export const mockBiometricFailure = () => {
  (authenticateAsync as jest.Mock).mockResolvedValue({
    success: false,
    error: 'user_cancel',
    warning: undefined,
  });
};

export const mockBiometricNotAvailable = () => {
  (hasHardwareAsync as jest.Mock).mockResolvedValue(false);
  (isEnrolledAsync as jest.Mock).mockResolvedValue(false);
};
