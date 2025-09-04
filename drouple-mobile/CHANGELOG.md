# Changelog

All notable changes to Drouple Mobile will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Voice notes for prayer requests
- In-app messaging system
- Calendar integration
- Social sharing enhancements
- Advanced analytics dashboard
- Multi-language support

## [1.0.0] - 2025-01-01

### Added

- **MVP-1 Core Features**
  - Sunday Service Check-In with QR code scanning
  - Events management with RSVP system
  - Push notifications for church announcements
  - Member directory with search and filtering
- **MVP-2 Community Features**
  - Life Groups discovery and join requests
  - Discipleship Pathways with progress tracking
  - Reports and analytics dashboard (Admin/Pastor roles)
- **Technical Foundation**
  - Offline-first architecture with automatic sync
  - Secure authentication with biometric support
  - Role-based access control (Member, VIP, Leader, Admin, Pastor, Super Admin)
  - Material Design 3 UI with dark mode support
  - Comprehensive error handling and crash reporting
  - Performance optimization and accessibility features
- **Security & Privacy**
  - End-to-end encryption for sensitive data
  - Certificate pinning for API communications
  - GDPR/CCPA compliant data handling
  - Privacy-first analytics with user consent
- **Development & Quality**
  - Comprehensive test suite (unit, integration, e2e)
  - CI/CD pipeline with automated testing
  - Performance monitoring and crash reporting
  - Automated security scanning
  - Code coverage > 70%

### Architecture

- **Frontend**: React Native 0.75+ with TypeScript
- **Navigation**: React Navigation 7 with stack and tab routing
- **UI Framework**: React Native Paper (Material Design 3)
- **State Management**: Zustand for global state, TanStack Query for server state
- **Database**: SQLite with automatic sync for offline support
- **Authentication**: JWT-based with refresh tokens and biometric unlock
- **Networking**: Axios with retry logic, request queuing, and certificate pinning

### Platform Support

- **iOS**: 13.0+ (iPhone and iPad)
- **Android**: API 24+ (Android 7.0+)
- **Web**: Progressive Web App support

### Performance

- Bundle size: < 10MB
- App startup time: < 3 seconds
- Memory usage: < 200MB average
- Battery optimization: Background sync with intelligent scheduling

---

## Version Guidelines

### Version Numbering

- **Major** (X.0.0): Breaking changes, major feature additions
- **Minor** (1.X.0): New features, non-breaking changes
- **Patch** (1.0.X): Bug fixes, small improvements

### Release Types

- **Alpha**: Internal testing builds
- **Beta**: External testing with select users
- **RC**: Release candidate for final testing
- **Stable**: Production release

### Branch Strategy

- `main`: Production releases
- `develop`: Integration branch for features
- `feature/*`: Individual feature development
- `hotfix/*`: Critical production fixes

### Build Numbers

- iOS: Incremental build number for each build
- Android: Version code = major _ 10000 + minor _ 100 + patch
