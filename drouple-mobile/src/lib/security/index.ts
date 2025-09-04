// Enhanced Security Services
export { biometricService, type BiometricConfig } from './biometrics';
export { secureStore, type StorageOptions } from './storage';
export {
  certificatePinning,
  type CertificatePin,
  type PinningConfig,
} from './certificatePinning';

// Legacy Security Services (if still needed)
export { SecureStorage } from './secureStorage';
export { InputValidator } from './inputValidator';
export { ApiSecurity } from './apiSecurity';
export { PrivacyManager } from './privacyManager';
export { BiometricAuth } from './biometricAuth';
export type { SecurityConfig, PrivacySettings, ValidationRules } from './types';

// Re-export all security utilities
export * from './biometrics';
export * from './storage';
export * from './certificatePinning';
