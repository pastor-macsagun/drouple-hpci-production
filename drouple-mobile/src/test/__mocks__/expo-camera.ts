/**
 * Mock Expo Camera
 */

import { ReactElement } from 'react';

export const CameraType = {
  back: 'back',
  front: 'front',
};

export const FlashMode = {
  on: 'on',
  off: 'off',
  auto: 'auto',
  torch: 'torch',
};

export const Camera = {
  Component: ({ children, onBarCodeScanned }: any) => {
    // Mock QR code scan after 1 second
    setTimeout(() => {
      if (onBarCodeScanned) {
        onBarCodeScanned({
          type: 'qr',
          data: 'mock-qr-data-service-123',
        });
      }
    }, 1000);

    return children;
  },
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', granted: true })
  ),
  getCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', granted: true })
  ),
  Constants: {
    Type: CameraType,
    FlashMode,
  },
};

export { Camera as default };
