/**
 * Detox Configuration
 * E2E testing configuration for iOS and Android
 */

module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupFilesAfterEnv: ['<rootDir>/e2e/setup.ts'],
    },
  },
  apps: {
    // iOS Apps
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/DroupleMobile.app',
      build: 'xcodebuild -workspace ios/DroupleMobile.xcworkspace -scheme DroupleMobile -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/DroupleMobile.app',
      build: 'xcodebuild -workspace ios/DroupleMobile.xcworkspace -scheme DroupleMobile -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
    // Android Apps  
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build:
        'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081],
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build:
        'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
    },
  },
  devices: {
    // iOS Simulators
    'ios.simulator': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 16',
        os: 'iOS 18.6'
      },
    },
    'ios.simulator.ipad': {
      type: 'ios.simulator', 
      device: {
        type: 'iPad Pro (12.9-inch) (6th generation)',
        os: 'iOS 18.6'
      },
    },
    // Physical iOS Device
    'ios.device': {
      type: 'ios.device',
      device: {
        udid: 'auto', // Will auto-detect connected device
      },
    },
    // Android Devices
    simulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_3a_API_34',
      },
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*',
      },
    },
    genycloud: {
      type: 'android.genycloud',
      device: {
        recipeUUID: 'a50a71d6-da90-4c67-bdfa-5b602b0bbbf6',
      },
    },
  },
  configurations: {
    // iOS Configurations
    'ios.sim.debug': {
      device: 'ios.simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'ios.simulator', 
      app: 'ios.release',
    },
    'ios.device.debug': {
      device: 'ios.device',
      app: 'ios.debug',
    },
    'ios.device.release': {
      device: 'ios.device',
      app: 'ios.release', 
    },
    'ios.ipad.debug': {
      device: 'ios.simulator.ipad',
      app: 'ios.debug',
    },
    // Android Configurations
    'android.debug': {
      device: 'simulator',
      app: 'android.debug',
    },
    'android.release': {
      device: 'simulator',
      app: 'android.release',
    },
    'android.attached.debug': {
      device: 'attached',
      app: 'android.debug',
    },
    'android.attached.release': {
      device: 'attached',
      app: 'android.release',
    },
  },
};
