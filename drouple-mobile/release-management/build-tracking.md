# Build Tracking & Release Management

## Build Commands Quick Reference

### Development & Testing

```bash
# Development builds (local)
eas build -p ios --profile development
eas build -p android --profile development

# Internal testing builds
eas build -p ios --profile internal
eas build -p android --profile internal

# Preview builds for stakeholders
eas build -p ios --profile preview
eas build -p android --profile preview
```

### Production Releases

```bash
# Production builds
eas build -p ios --profile production
eas build -p android --profile production

# Submit to stores
eas submit -p ios --profile production
eas submit -p android --profile production

# Complete release pipeline
npm run release:full
```

## Build Tracking Template

### Release: Version X.X.X

**Target Release Date**: [Date]
**Release Manager**: [Name]
**QA Lead**: [Name]

#### Build Status

- [ ] **iOS Internal Build** - `eas build -p ios --profile internal`
  - Build ID: [EAS Build ID]
  - Status: [Pending/Building/Success/Failed]
  - Download Link: [EAS Build URL]
  - Testing Notes: [Notes from testing]

- [ ] **Android Internal Build** - `eas build -p android --profile internal`
  - Build ID: [EAS Build ID]
  - Status: [Pending/Building/Success/Failed]
  - Download Link: [EAS Build URL]
  - Testing Notes: [Notes from testing]

- [ ] **iOS Preview Build** - `eas build -p ios --profile preview`
  - Build ID: [EAS Build ID]
  - Status: [Pending/Building/Success/Failed]
  - Stakeholder Testing: [Status]

- [ ] **Android Preview Build** - `eas build -p android --profile preview`
  - Build ID: [EAS Build ID]
  - Status: [Pending/Building/Success/Failed]
  - Stakeholder Testing: [Status]

- [ ] **iOS Production Build** - `eas build -p ios --profile production`
  - Build ID: [EAS Build ID]
  - Status: [Pending/Building/Success/Failed]
  - App Store Submission: [Status]

- [ ] **Android Production Build** - `eas build -p android --profile production`
  - Build ID: [EAS Build ID]
  - Status: [Pending/Building/Success/Failed]
  - Play Store Submission: [Status]

#### Testing Phases

- [ ] **Unit Testing**: All tests passing
- [ ] **Integration Testing**: API integration verified
- [ ] **E2E Testing**: Critical user flows tested
- [ ] **Device Testing**: Tested on physical devices (iOS/Android)
- [ ] **Performance Testing**: Load testing completed
- [ ] **Security Testing**: Vulnerability scan passed
- [ ] **Accessibility Testing**: VoiceOver/TalkBack tested

#### Store Submission Status

##### iOS App Store

- [ ] **Build Uploaded**: EAS submission completed
- [ ] **Metadata Updated**: App Store Connect info current
- [ ] **Screenshots Updated**: All device sizes uploaded
- [ ] **Review Submitted**: Submitted for Apple review
- [ ] **Review Status**: [Waiting/In Review/Approved/Rejected]
- [ ] **Release Status**: [Scheduled/Released]

##### Google Play Store

- [ ] **Build Uploaded**: EAS submission completed
- [ ] **Metadata Updated**: Play Console info current
- [ ] **Assets Updated**: Store listing graphics uploaded
- [ ] **Review Submitted**: Submitted for Google review
- [ ] **Review Status**: [Under Review/Approved/Rejected]
- [ ] **Release Status**: [Draft/Staged Rollout/Released]

#### Known Issues & Risks

| Issue               | Severity                 | Status                    | Owner  | Notes                |
| ------------------- | ------------------------ | ------------------------- | ------ | -------------------- |
| [Issue Description] | Critical/High/Medium/Low | Open/In Progress/Resolved | [Name] | [Additional context] |

#### Release Notes

```
Version X.X.X Release Notes:

🆕 New Features
- [Feature 1]
- [Feature 2]

⚡ Improvements
- [Improvement 1]
- [Improvement 2]

🐛 Bug Fixes
- [Bug Fix 1]
- [Bug Fix 2]
```

#### Post-Release Monitoring

- [ ] **App Store Metrics**: Downloads, ratings, reviews tracked
- [ ] **Crash Monitoring**: Sentry dashboards monitored
- [ ] **Performance Metrics**: App performance stable
- [ ] **User Feedback**: Support tickets triaged
- [ ] **Analytics**: User behavior data reviewed

## Build Troubleshooting

### Common Build Failures

#### iOS Build Issues

```bash
# Check iOS credentials
eas credentials -p ios

# Clear iOS build cache
eas build -p ios --profile [profile] --clear-cache

# Check Apple Developer account status
# Verify provisioning profiles in App Store Connect
```

#### Android Build Issues

```bash
# Check Android credentials
eas credentials -p android

# Clear Android build cache
eas build -p android --profile [profile] --clear-cache

# Verify keystore and signing configuration
```

### Performance Monitoring

```bash
# Check build metrics
eas build:list --platform=all --limit=10

# View build logs
eas build:view [BUILD_ID]

# Monitor build queue status
eas build:queue
```

## Release Calendar Template

| Version | Planned Release | RC Date | Release Date | Status         |
| ------- | --------------- | ------- | ------------ | -------------- |
| 1.0.0   | March 1, 2024   | Feb 25  | March 1      | Released ✅    |
| 1.1.0   | April 1, 2024   | Mar 25  | April 1      | Released ✅    |
| 1.2.0   | May 1, 2024     | Apr 25  | TBD          | In Progress 🔄 |
| 1.3.0   | June 1, 2024    | May 25  | TBD          | Planned 📅     |
