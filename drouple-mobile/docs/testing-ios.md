# iOS Testing Guide - Drouple Mobile

Complete guide for running E2E tests on iOS devices and simulators.

## 📱 Testing Options

### 1. iOS Simulator Testing (Recommended)
- **Pros**: Fast, consistent, no device setup required
- **Cons**: May not catch device-specific issues
- **Best for**: Development, CI/CD pipelines

### 2. Physical iOS Device Testing  
- **Pros**: Real-world conditions, actual hardware
- **Cons**: Requires device setup, provisioning profiles
- **Best for**: Pre-release validation, hardware-specific features

### 3. iPad Testing
- **Pros**: Tests tablet-specific layouts and interactions
- **Cons**: Limited to simulator only (for now)
- **Best for**: Responsive design validation

## 🚀 Quick Start

### Prerequisites
```bash
# 1. Ensure you're on macOS
# 2. Install Xcode from App Store
# 3. Install command line tools
xcode-select --install

# 4. Install Detox CLI globally
npm install -g detox-cli

# 5. Install project dependencies
npm install
```

### Run Tests

**iOS Simulator (Default):**
```bash
# Run all tests on iPhone Simulator
./scripts/test-ios.sh --simulator

# Or use npm script
npm run test:e2e:ios
```

**Physical iOS Device:**
```bash
# Connect iOS device via USB, unlock and trust computer
./scripts/test-ios.sh --device

# Or use npm script  
npm run test:e2e:ios:device
```

**iPad Simulator:**
```bash
# Run tests on iPad Pro simulator
./scripts/test-ios.sh --ipad

# Or use npm script
npm run test:e2e:ios:ipad
```

## 📋 Test Script Options

### Basic Usage
```bash
./scripts/test-ios.sh [OPTIONS] [TEST_PATTERN]
```

### Available Options
- `-s, --simulator` - Run on iOS Simulator (default)
- `-d, --device` - Run on connected physical device
- `-i, --ipad` - Run on iPad Simulator  
- `-b, --build-only` - Only build the app, don't run tests
- `-c, --clean` - Clean build and prebuild iOS
- `-h, --help` - Show help message

### Examples

**Run specific test pattern:**
```bash
# Run only login tests
./scripts/test-ios.sh --simulator "login.*"

# Run check-in related tests
./scripts/test-ios.sh --device "checkin.*"
```

**Build without running tests:**
```bash
# Just build for simulator
./scripts/test-ios.sh --build-only --simulator

# Build for device
./scripts/test-ios.sh --build-only --device
```

**Clean build and test:**
```bash
# Clean rebuild and test
./scripts/test-ios.sh --clean --simulator
```

## 🔧 Configuration Details

### Detox Configurations

| Configuration | Device Type | Build Target |
|---------------|-------------|--------------|
| `ios.sim.debug` | iPhone 16 Simulator | Debug build |
| `ios.device.debug` | Connected physical device | Debug build |
| `ios.ipad.debug` | iPad Pro Simulator | Debug build |
| `ios.sim.release` | iPhone 16 Simulator | Release build |
| `ios.device.release` | Connected physical device | Release build |

### Simulator Settings
- **Default Simulator**: iPhone 16
- **iOS Version**: 18.6
- **Boot Timeout**: 300 seconds
- **Auto-boot**: Script handles simulator booting

## 📱 Physical Device Setup

### 1. Device Preparation
```bash
# 1. Connect iOS device via USB cable
# 2. Unlock device and tap "Trust This Computer"
# 3. Enable Developer Mode in Settings > Privacy & Security
# 4. Verify device is detected:
xcrun xctrace list devices
```

### 2. Developer Account Setup (Required for Device Testing)
- Apple Developer Account (free or paid)
- Automatic signing enabled in Xcode
- Device registered in Apple Developer Portal

### 3. Troubleshooting Device Issues

**Device not detected:**
```bash
# Check if device appears in list
xcrun xctrace list devices

# Reset device trust
# Go to: Settings > General > Transfer or Reset iPhone > Reset > Reset Location & Privacy
```

**Build fails on device:**
```bash
# Clean and rebuild
./scripts/test-ios.sh --clean --device

# Or manually clean Xcode project
rm -rf ios/build ios/Pods
npx expo prebuild --platform ios --clean
```

## 🧪 Test Scenarios Covered

### Core Features
- ✅ **Authentication Flow** - Login/logout, biometric authentication
- ✅ **Role-Based Navigation** - Tab visibility per user role
- ✅ **Dashboard Functionality** - Role-specific content and actions
- ✅ **Check-In System** - QR scanning, manual check-in, offline support
- ✅ **Events & RSVP** - Event listing, RSVP functionality, offline queueing
- ✅ **Member Directory** - Search, contact access, role-based visibility
- ✅ **Push Notifications** - Local and remote notification handling
- ✅ **Offline Functionality** - Data sync, queue management
- ✅ **Accessibility** - VoiceOver support, proper labeling

### iOS-Specific Tests
- ✅ **Face ID / Touch ID** - Biometric authentication flow
- ✅ **iOS Notifications** - Native notification integration
- ✅ **iOS Navigation** - Native navigation patterns
- ✅ **Camera Permissions** - QR code scanner permissions
- ✅ **Background App Refresh** - Offline sync behavior

## 📊 Performance Considerations

### Simulator Performance
- **Boot Time**: ~30-60 seconds for cold start
- **Test Execution**: ~15-25 minutes for full suite
- **Memory Usage**: 2-4GB during testing

### Device Performance  
- **Installation Time**: ~2-3 minutes
- **Test Execution**: ~20-30 minutes for full suite
- **Battery Impact**: Significant during testing

### Optimization Tips
```bash
# Run specific test suites instead of full suite
./scripts/test-ios.sh --simulator "auth.*|checkin.*"

# Use simulator for most tests, device for final validation
npm run test:e2e:ios        # Most tests
npm run test:e2e:ios:device # Final validation
```

## 🐛 Common Issues & Solutions

### Build Issues

**Error: "No simulator found"**
```bash
# Check available simulators
xcrun simctl list devices available

# Install missing simulator through Xcode > Settings > Platforms
```

**Error: "Build failed with exit code 65"**
```bash
# Clean everything and rebuild
rm -rf ios/build ios/Pods node_modules
npm install
npx expo prebuild --platform ios --clean
./scripts/test-ios.sh --clean --simulator
```

### Test Execution Issues

**Tests hang or timeout**
```bash
# Increase timeout in detox config
# Check .detoxrc.js and increase action timeouts
```

**App crashes during tests**
```bash
# Check iOS Simulator Console for crash logs
# Enable debug mode in Expo dev client
```

### Device-Specific Issues

**Provisioning profile errors**
```bash
# In Xcode, select project > Signing & Capabilities
# Enable "Automatically manage signing"
# Select your Apple Developer team
```

**Device app installation fails**
```bash
# Verify device UDID is registered in Apple Developer Portal
# Check that device has sufficient storage space
```

## 📈 CI/CD Integration

### GitHub Actions Example
```yaml
name: iOS E2E Tests
on: [push, pull_request]

jobs:
  ios-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run iOS E2E Tests
        run: ./scripts/test-ios.sh --simulator
      - name: Upload test artifacts
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: ios-test-artifacts
          path: |
            e2e/artifacts/
            ios/build/
```

### Local Development Workflow
```bash
# 1. Development cycle
npm run test:unit              # Fast unit tests
./scripts/test-ios.sh --simulator "critical.*"  # Critical E2E tests

# 2. Pre-commit validation  
npm run test:e2e:ios          # Full simulator test suite

# 3. Pre-release validation
npm run test:e2e:ios:device   # Physical device testing
```

## 🏆 Best Practices

### Test Organization
- ✅ Use descriptive test names with platform context
- ✅ Group related tests in describe blocks
- ✅ Use proper test data cleanup between tests
- ✅ Implement retry logic for flaky network-dependent tests

### Device Management
- ✅ Keep iOS simulators updated to latest versions
- ✅ Test on multiple device types (iPhone, iPad) 
- ✅ Use physical devices for final pre-release validation
- ✅ Document device-specific test requirements

### Performance Optimization
- ✅ Run simulator tests in parallel where possible
- ✅ Use test patterns to run subsets during development
- ✅ Cache built apps to avoid rebuilding unnecessarily
- ✅ Monitor test execution times and optimize slow tests

## 📞 Support & Troubleshooting

### Getting Help
1. Check this documentation for common issues
2. Review Detox iOS troubleshooting guide
3. Check iOS Simulator Console for detailed error logs
4. Verify Xcode and iOS Simulator versions are compatible

### Useful Commands
```bash
# Check iOS development setup
npx @react-native-community/cli doctor

# List all available iOS simulators  
xcrun simctl list devices available

# Reset iOS Simulator
xcrun simctl erase all

# View iOS Simulator logs
xcrun simctl spawn booted log stream --predicate 'process == "DropupleMobile"'
```

---

## 🎯 Summary

The iOS testing infrastructure for Drouple Mobile provides comprehensive coverage across simulators and physical devices. Use simulators for fast development iteration and physical devices for final validation before release.

**Recommended Workflow:**
1. **Development**: Use `./scripts/test-ios.sh --simulator` for quick feedback
2. **Feature Validation**: Use specific test patterns for focused testing
3. **Pre-Release**: Use `./scripts/test-ios.sh --device` for hardware validation
4. **CI/CD**: Automated simulator testing with artifact collection