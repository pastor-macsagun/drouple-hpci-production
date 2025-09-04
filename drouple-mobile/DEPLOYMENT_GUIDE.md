# Drouple Mobile App - Complete Deployment Guide

## 📱 Overview

This document provides the complete deployment and operation guide for the Drouple Mobile MVP, built with Expo, React Native, and TypeScript.

## 🛠️ Tech Stack Summary

- **Framework**: React Native 0.79+ with Expo SDK 53+
- **Language**: TypeScript 5.8+ with strict mode
- **State Management**: Zustand + TanStack Query
- **Database**: SQLite with offline sync
- **Authentication**: Biometric + JWT with role-based access
- **Navigation**: React Navigation 7 with role-based routing
- **UI**: React Native Paper (Material Design 3)
- **Testing**: Jest + React Native Testing Library + Detox
- **Monitoring**: Sentry + Firebase Analytics
- **Build**: EAS Build with CI/CD pipeline

## 🏗️ Architecture Components

### Core Services

1. **Authentication System** (`src/lib/store/authStore.ts`)
   - Secure token storage with biometric authentication
   - Role-based access control (SUPER_ADMIN → ADMIN → VIP → LEADER → MEMBER)
   - Automatic token refresh and session management

2. **Offline Sync Manager** (`src/lib/sync/syncManager.ts`)
   - SQLite-based offline queue for critical actions
   - Automatic network reconnection and sync
   - Retry logic with exponential backoff

3. **QR Code Scanner** (`src/components/scanner/QRCodeScanner.tsx`)
   - Multi-format QR code support (JSON, URL, simple format)
   - Offline action queuing
   - Platform-specific camera permissions

4. **Push Notifications** (`src/lib/notifications/pushNotificationService.ts`)
   - FCM integration with channel-based Android notifications
   - Deep linking support
   - Background notification handling

5. **Monitoring & Analytics** (`src/lib/monitoring/sentryService.ts`)
   - Comprehensive error tracking with business context
   - Performance monitoring
   - Sensitive data filtering

## 🚀 Quick Start

### Prerequisites

```bash
# Required tools
node --version    # v18+
npm --version     # v9+
expo --version    # Latest

# iOS (macOS only)
xcode-select --version  # Xcode 14+

# Android
android --version       # Android SDK 33+
```

### Initial Setup

```bash
# 1. Clone and navigate
git clone <repository-url>
cd drouple-mobile

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your API URLs and keys

# 4. Initialize database
npx expo install expo-sqlite
npx expo prebuild

# 5. Start development server
npm run start
```

### Development Commands

```bash
# Development
npm run start              # Start Expo dev server
npm run dev               # Start with dev client
npm run ios               # Run on iOS simulator
npm run android           # Run on Android emulator

# Code Quality
npm run typecheck         # TypeScript validation
npm run lint              # ESLint check + auto-fix
npm run format            # Prettier formatting

# Testing
npm run test:unit         # Unit tests
npm run test:integration  # Integration tests
npm run test:component    # Component tests
npm run test:e2e          # End-to-end tests
npm run test:all          # Full test suite

# Build & Deploy
npm run build:development # Development build
npm run build:preview     # Preview build
npm run build:production  # Production build
```

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] API endpoints accessible
- [ ] Database migrations applied
- [ ] Push notification certificates installed
- [ ] Sentry DSN configured
- [ ] App store credentials set up

### Code Quality Gates

- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 warnings
- [ ] Test coverage: >80%
- [ ] Unit tests: All passing
- [ ] Integration tests: All passing
- [ ] E2E tests: Critical flows passing

### Security Validation

- [ ] No sensitive data in code
- [ ] API keys in environment variables
- [ ] Biometric authentication tested
- [ ] Role-based access verified
- [ ] Offline data encryption enabled

### Performance Validation

- [ ] Bundle size <200KB per route
- [ ] Cold start time <3 seconds
- [ ] QR scanning response <1 second
- [ ] Sync operations <5 seconds
- [ ] Memory usage <100MB baseline

## 🔧 Configuration Guide

### Environment Variables

```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://api.drouple.com
EXPO_PUBLIC_WS_URL=wss://ws.drouple.com

# Sentry Monitoring
SENTRY_DSN=https://your-dsn@sentry.io/project
SENTRY_AUTH_TOKEN=your-auth-token

# Push Notifications
FCM_SERVER_KEY=your-fcm-server-key
APNS_KEY_ID=your-apns-key-id

# Feature Flags
EXPO_PUBLIC_ENABLE_BIOMETRIC=true
EXPO_PUBLIC_ENABLE_OFFLINE_MODE=true
EXPO_PUBLIC_ENABLE_QR_SCANNER=true
```

### EAS Build Profiles

```json
{
  "development": {
    "developmentClient": true,
    "distribution": "internal"
  },
  "preview": {
    "distribution": "internal"
  },
  "production": {
    "distribution": "store",
    "autoIncrement": true
  }
}
```

## 📱 Build & Release Process

### Development Builds

```bash
# iOS Development
eas build --platform ios --profile development

# Android Development
eas build --platform android --profile development

# Install on device
# iOS: Use TestFlight or direct install
# Android: Install APK directly
```

### Staging Builds

```bash
# Create staging builds
eas build --platform all --profile preview

# Deploy OTA update
eas update --branch staging --message "Staging deployment"
```

### Production Builds

```bash
# Full production build
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

## 🧪 Testing Strategy

### Test Coverage Requirements

- **Unit Tests**: >80% coverage for business logic
- **Integration Tests**: All API interactions and sync flows
- **Component Tests**: All user-facing components
- **E2E Tests**: Critical user journeys (auth, check-in, sync)

### Test Environments

```bash
# Unit Tests (Fast, Isolated)
npm run test:unit -- --watch

# Integration Tests (Medium, Real APIs)
npm run test:integration

# E2E Tests (Slow, Full App)
npm run test:e2e:ios
npm run test:e2e:android
```

### Critical Test Scenarios

1. **Authentication Flow**
   - Email/password login
   - Biometric authentication setup
   - Token refresh
   - Role-based navigation

2. **Offline Functionality**
   - QR code scanning offline
   - Action queuing
   - Sync when reconnected
   - Conflict resolution

3. **Real-time Features**
   - Push notifications
   - WebSocket connections
   - Live data updates
   - Background sync

## 🔍 Monitoring & Troubleshooting

### Sentry Integration

- **Error Tracking**: Automatic crash reporting
- **Performance Monitoring**: Transaction tracking
- **Release Tracking**: Deploy notifications
- **User Context**: Business context with errors

### Common Issues & Solutions

#### Build Issues

```bash
# Clear Expo cache
expo r -c

# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Reset metro cache
npx react-native start --reset-cache
```

#### Testing Issues

```bash
# Clear Jest cache
npm test -- --clearCache

# Rebuild E2E apps
npm run test:e2e:build
```

#### Runtime Issues

```bash
# Check bundle size
npx expo export --source-maps

# Profile performance
npx flipper
```

## 📊 Performance Optimization

### Bundle Optimization

- Tree shaking enabled
- Dynamic imports for large screens
- Image optimization with Expo Image
- Font loading optimization

### Memory Management

- Proper component unmounting
- Image cache management
- SQLite connection pooling
- Background task cleanup

### Network Optimization

- Request deduplication
- Response caching
- Retry with exponential backoff
- Connection status handling

## 🔒 Security Considerations

### Data Protection

- SQLite database encryption
- Secure keychain storage
- No PII in logs
- Certificate pinning ready

### Authentication Security

- JWT token rotation
- Biometric credential encryption
- Session timeout handling
- Multi-device management

### Communication Security

- HTTPS only
- Request/response validation
- Rate limiting compliance
- Error message sanitization

## 📈 Analytics & Metrics

### Key Performance Indicators

- **User Engagement**: Session duration, feature usage
- **Performance**: Cold start time, sync success rate
- **Reliability**: Crash-free sessions, error rates
- **Business**: Check-in completion, event RSVP rates

### Monitoring Dashboards

- **Sentry**: Error rates, performance trends
- **Firebase**: User analytics, retention
- **EAS**: Build success rates, distribution metrics

## 🛠️ Maintenance Tasks

### Daily

- [ ] Check Sentry for new errors
- [ ] Monitor build pipeline status
- [ ] Review user feedback in stores

### Weekly

- [ ] Update dependencies (security patches)
- [ ] Review performance metrics
- [ ] Validate backup processes

### Monthly

- [ ] Dependency audit and updates
- [ ] Performance optimization review
- [ ] Security vulnerability assessment
- [ ] Store listing optimization

## 🆘 Emergency Procedures

### Critical Bug Response

1. **Immediate**: Disable feature via feature flags
2. **Short-term**: Deploy hotfix via OTA update
3. **Long-term**: Full build with comprehensive fix

### Security Incident Response

1. **Assess**: Determine scope and impact
2. **Contain**: Revoke compromised tokens/certificates
3. **Fix**: Deploy security patches
4. **Verify**: Confirm vulnerability resolution

### Store Rejection Response

1. **Analyze**: Review rejection reasons
2. **Fix**: Address all identified issues
3. **Test**: Comprehensive validation
4. **Resubmit**: With detailed changelog

---

## 📞 Support Contacts

- **Technical Issues**: dev-team@drouple.com
- **Build/Deploy Issues**: devops@drouple.com
- **Store Issues**: app-store@drouple.com
- **Security Issues**: security@drouple.com

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Next Review**: March 2025
