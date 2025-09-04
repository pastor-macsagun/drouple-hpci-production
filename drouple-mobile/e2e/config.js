/**
 * Detox E2E Test Configuration
 * End-to-end testing setup for iOS and Android
 */

module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/jest.config.js',

  configurations: {
    'ios.sim.debug': {
      device: 'ios.simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'ios.simulator',
      app: 'ios.release',
    },
    'android.emu.debug': {
      device: 'android.emulator',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'android.emulator',
      app: 'android.release',
    },
  },

  devices: {
    'ios.simulator': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 16',
        os: 'iOS 18.6',
      },
    },
    'android.emulator': {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_33',
      },
    },
  },

  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath:
        'ios/build/Build/Products/Debug-iphonesimulator/DroupleMobile.app',
      build:
        'xcodebuild -workspace ios/DroupleMobile.xcworkspace -scheme DroupleMobile -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath:
        'ios/build/Build/Products/Release-iphonesimulator/DroupleMobile.app',
      build:
        'xcodebuild -workspace ios/DroupleMobile.xcworkspace -scheme DroupleMobile -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
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

  artifacts: {
    rootDir: './e2e/artifacts',
    pathBuilder: './e2e/pathBuilder.js',
    plugins: {
      log: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: false,
      },
      screenshot: {
        enabled: true,
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: false,
        takeWhen: {
          testStart: false,
          testDone: true,
          testFailure: true,
        },
      },
      video: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: false,
        android: {
          bitRate: 4000000,
        },
        simulator: {
          codec: 'mp4v',
        },
      },
      instruments: {
        enabled: process.env.CI_E2E_RECORD_INSTRUMENTS === 'true',
      },
      timeline: {
        enabled: false,
      },
    },
  },

  behavior: {
    init: {
      reinstallApp: true,
      launchApp: true,
      exposeGlobals: false,
    },
    launchApp: 'auto',
    cleanup: {
      shutdownDevice: false,
    },
  },

  logger: {
    level: process.env.CI ? 'info' : 'debug',
    overrideConsole: true,
    options: {
      showLoggerName: true,
      showPid: true,
      showLevel: false,
      showMetadata: false,
      showPrefix: true,
      showTimestamp: true,
    },
  },

  session: {
    server: 'ws://localhost:8099',
    sessionId: 'DroupleApp',
    debugSynchronization: 10000,
  },
};
