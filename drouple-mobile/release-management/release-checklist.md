# Drouple Mobile Release Checklist

## Pre-Release Preparation

### Code Quality & Testing

- [ ] All unit tests passing (`npm test`)
- [ ] All integration tests passing
- [ ] E2E tests completed on physical devices
- [ ] TypeScript compilation successful (`npx tsc --noEmit`)
- [ ] ESLint checks passing (`npm run lint`)
- [ ] Performance profiling completed
- [ ] Memory leak testing completed
- [ ] Accessibility testing completed (iOS VoiceOver, Android TalkBack)

### Version Management

- [ ] Version number updated in `app.config.ts`
- [ ] iOS build number incremented (`buildNumber`)
- [ ] Android version code incremented (`versionCode`)
- [ ] Changelog/release notes prepared
- [ ] App Store metadata updated
- [ ] Google Play metadata updated

### Security & Compliance

- [ ] Security audit completed
- [ ] Dependencies vulnerability scan passed
- [ ] Certificate pinning validated
- [ ] API endpoint security tested
- [ ] Data encryption verified
- [ ] Privacy policy compliance checked
- [ ] COPPA compliance verified (if applicable)

### Platform-Specific Checks

#### iOS Preparation

- [ ] Apple Developer account active
- [ ] App Store Connect app created/updated
- [ ] iOS distribution certificate valid
- [ ] App Store provisioning profile valid
- [ ] TestFlight beta testing completed
- [ ] iOS Human Interface Guidelines compliance
- [ ] App Store Review Guidelines compliance
- [ ] Export compliance configured (`usesNonExemptEncryption: false`)

#### Android Preparation

- [ ] Google Play Console account active
- [ ] App bundle (.aab) build tested
- [ ] Upload key properly configured
- [ ] Google Play signing enabled
- [ ] Internal testing completed
- [ ] Android Design Guidelines compliance
- [ ] Google Play Policy compliance
- [ ] Data Safety form completed

## Release Execution

### Build Process

- [ ] Clean build environment prepared
- [ ] Dependencies installed (`npm ci`)
- [ ] Production environment variables set
- [ ] iOS production build completed (`eas build -p ios --profile production`)
- [ ] Android production build completed (`eas build -p android --profile production`)
- [ ] Build artifacts verified (size, functionality)
- [ ] Crash testing on build artifacts

### Store Submission

#### iOS App Store

- [ ] App uploaded to App Store Connect (`eas submit -p ios --profile production`)
- [ ] App metadata verified (name, description, keywords, screenshots)
- [ ] Age rating configured (4+)
- [ ] Privacy policy URL updated
- [ ] Support URL updated
- [ ] App icons verified (1024x1024)
- [ ] Screenshots uploaded (all required device sizes)
- [ ] App review information completed
- [ ] Submitted for review

#### Google Play Store

- [ ] App uploaded to Google Play Console (`eas submit -p android --profile production`)
- [ ] App metadata verified (title, short/full description)
- [ ] Content rating completed (Everyone)
- [ ] Data safety form completed
- [ ] Store listing assets uploaded (icon, feature graphic, screenshots)
- [ ] Pricing & distribution configured
- [ ] Internal testing track promoted to production
- [ ] Released to production (staged rollout recommended)

## Post-Release Monitoring

### Release Day

- [ ] App Store/Play Store release confirmed live
- [ ] Download links tested
- [ ] App functionality verified on live stores
- [ ] Crash monitoring active (Sentry)
- [ ] Analytics tracking verified
- [ ] User feedback monitoring started
- [ ] Support team notified of release

### Week 1 Monitoring

- [ ] Crash rates acceptable (<0.1%)
- [ ] App performance metrics stable
- [ ] User ratings and reviews monitored
- [ ] Support ticket volume tracked
- [ ] Analytics data reviewed
- [ ] Server load and API performance monitored

### Week 2-4 Monitoring

- [ ] User retention metrics analyzed
- [ ] Feature adoption rates reviewed
- [ ] Performance trends analyzed
- [ ] User feedback categorized and prioritized
- [ ] Bug reports triaged and scheduled
- [ ] Next release planning initiated

## Rollback Procedures

### Emergency Rollback

- [ ] Issue severity assessed (critical/high/medium/low)
- [ ] Rollback decision approved by product owner
- [ ] App Store/Play Store rollback initiated
- [ ] Users notified via in-app messaging (if applicable)
- [ ] Support team updated with rollback status
- [ ] Post-mortem scheduled

### Rollback Steps - iOS

- [ ] Navigate to App Store Connect
- [ ] Select previous version in "App Store" tab
- [ ] Submit for expedited review if needed
- [ ] Monitor rollback completion

### Rollback Steps - Android

- [ ] Navigate to Google Play Console
- [ ] Go to "Release management" > "App releases"
- [ ] Promote previous release from staged rollout
- [ ] Stop rollout of problematic version
- [ ] Monitor rollback completion

## Communication Plan

### Internal Team

- [ ] Development team notified of release status
- [ ] QA team updated on release verification
- [ ] Product team informed of release metrics
- [ ] Support team briefed on new features/changes
- [ ] Executive team provided with release summary

### External Communication

- [ ] User-facing release notes published
- [ ] Social media announcement (if applicable)
- [ ] Newsletter/email announcement (if applicable)
- [ ] Website/blog post updated (if applicable)
- [ ] Press release issued (if major release)

## Documentation Updates

- [ ] Technical documentation updated
- [ ] User guides/help documentation updated
- [ ] API documentation updated (if applicable)
- [ ] Release notes archived
- [ ] Lessons learned documented
- [ ] Release metrics documented
