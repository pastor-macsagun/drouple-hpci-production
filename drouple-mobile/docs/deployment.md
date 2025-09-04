# Deployment Guide

This guide covers the deployment process for the Drouple Mobile app across different environments.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Build Process](#build-process)
5. [Deployment Workflows](#deployment-workflows)
6. [Store Submissions](#store-submissions)
7. [Troubleshooting](#troubleshooting)

## Overview

The Drouple Mobile app supports three environments:

- **Development**: For local development and testing
- **Staging**: For QA testing and client reviews
- **Production**: For live app store releases

## Prerequisites

### Required Tools

1. **Node.js** (18+)
2. **npm** (8+)
3. **Expo CLI** (`npm install -g @expo/cli`)
4. **EAS CLI** (`npm install -g @expo/eas-cli`)
5. **Git** (for version control)

### Account Setup

1. **Expo Account**: Sign up at [expo.dev](https://expo.dev)
2. **Apple Developer Account**: Required for iOS builds
3. **Google Play Console**: Required for Android builds

### Authentication

```bash
# Login to Expo
expo login

# Login to EAS
eas login

# Verify login
expo whoami
```

## Environment Setup

### Environment Variables

Create environment-specific configuration:

```bash
# Development
APP_VARIANT=development
EXPO_PUBLIC_API_URL=https://api-dev.drouple.com

# Staging
APP_VARIANT=staging
EXPO_PUBLIC_API_URL=https://api-staging.drouple.com

# Production
APP_VARIANT=production
EXPO_PUBLIC_API_URL=https://api.drouple.com
```

### Secrets Configuration

Configure secrets in EAS:

```bash
# Set API keys
eas secret:create --scope project --name SENTRY_DSN --value your_sentry_dsn
eas secret:create --scope project --name AMPLITUDE_API_KEY --value your_amplitude_key
eas secret:create --scope project --name ONE_SIGNAL_APP_ID --value your_onesignal_id
```

## Build Process

### Manual Builds

#### Development Build

```bash
# Build development version
eas build --platform all --profile development

# Or use the convenience script
./scripts/build.sh -e development -p both
```

#### Staging Build

```bash
# Build staging version
eas build --platform all --profile staging

# With script
./scripts/build.sh -e staging -p both
```

#### Production Build

```bash
# Build production version
eas build --platform all --profile production

# With script and upload
./scripts/build.sh -e production -p both --upload
```

### Build Script Options

The `scripts/build.sh` script provides several options:

```bash
# Show help
./scripts/build.sh --help

# Build for specific platform
./scripts/build.sh -e production -p ios
./scripts/build.sh -e production -p android

# Submit to stores
./scripts/build.sh -e production -p both --type submit

# Verbose output
./scripts/build.sh -e production -p both --verbose
```

### Automated Builds (CI/CD)

The project includes GitHub Actions workflows for automated builds:

- **On Push to `develop`**: Triggers staging build
- **On Push to `main`**: Triggers production build
- **On Pull Request**: Runs tests and builds

## Deployment Workflows

### Development Workflow

1. Create feature branch from `develop`
2. Make changes and commit
3. Push to remote branch
4. Create pull request to `develop`
5. CI runs tests and builds
6. Merge after approval
7. Staging build automatically triggered

### Production Workflow

1. Create release branch from `develop`
2. Update version numbers
3. Test staging deployment
4. Create pull request to `main`
5. CI runs full test suite
6. Merge after approval
7. Production build automatically triggered
8. Manual app store submission

### Version Management

Update version numbers in:

1. `package.json`
2. `app.config.js`
3. Platform-specific build numbers

```bash
# Update version
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.1 -> 1.1.0
npm version major  # 1.1.0 -> 2.0.0
```

## Store Submissions

### iOS App Store

#### Prerequisites

1. Apple Developer Account
2. App Store Connect access
3. Provisioning profiles configured

#### Submission Process

```bash
# Build and submit
eas build --platform ios --profile production
eas submit --platform ios --profile production

# Or use script
./scripts/build.sh -e production -p ios --type submit
```

#### App Store Connect Setup

1. Create app record in App Store Connect
2. Upload app metadata and screenshots
3. Configure pricing and availability
4. Submit for review

### Google Play Store

#### Prerequisites

1. Google Play Console account
2. Service account key configured
3. Keystore files configured

#### Submission Process

```bash
# Build and submit
eas build --platform android --profile production
eas submit --platform android --profile production

# Or use script
./scripts/build.sh -e production -p android --type submit
```

#### Play Console Setup

1. Create app in Play Console
2. Upload app bundle
3. Configure store listing
4. Set up release management

## Configuration Files

### `app.config.js`

Main configuration file that adapts based on environment:

```javascript
const getUniqueIdentifier = () => {
  if (IS_DEV) return 'com.drouple.mobile.dev';
  if (IS_STAGING) return 'com.drouple.mobile.staging';
  return 'com.drouple.mobile';
};
```

### `eas.json`

EAS Build configuration:

```json
{
  "build": {
    "development": { ... },
    "staging": { ... },
    "production": { ... }
  },
  "submit": {
    "production": { ... }
  }
}
```

### Environment Config (`src/config/env.ts`)

Runtime environment configuration:

```typescript
const config: Config = {
  environment: getEnvironment(),
  apiUrl: getApiUrl(),
  enableAnalytics: !isDevelopment(),
  // ...
};
```

## Monitoring and Analytics

### Build Monitoring

- **EAS Build Dashboard**: Monitor build status
- **GitHub Actions**: View CI/CD pipeline status
- **Sentry**: Track deployment issues

### App Performance

- **Sentry**: Error tracking and performance monitoring
- **Amplitude**: User analytics and engagement
- **Store Analytics**: Download and usage metrics

## Security Considerations

### Code Signing

- **iOS**: Uses App Store distribution certificates
- **Android**: Uses upload key for Play App Signing

### API Keys

- Store sensitive keys in EAS Secrets
- Never commit secrets to version control
- Use different keys for each environment

### Certificate Pinning

Enabled in production builds for API security:

```typescript
security: {
  certificatePinning: isProduction(),
  jailbreakDetection: isProduction(),
}
```

## Troubleshooting

### Common Build Issues

#### Build Fails with Dependencies

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### iOS Build Certificate Issues

```bash
# Clear iOS credentials
eas credentials:clear-build-cache --platform ios
```

#### Android Build Keystore Issues

```bash
# Generate new keystore
eas credentials:configure-build --platform android
```

### Common Deployment Issues

#### App Store Rejection

1. Check App Store Review Guidelines
2. Update metadata and screenshots
3. Fix any compliance issues
4. Resubmit with explanations

#### Play Store Policy Violations

1. Review Play Console policy messages
2. Update app content if needed
3. Respond to policy violations
4. Appeal if necessary

### Debug Commands

```bash
# View build logs
eas build:list --limit 10

# Check build status
eas build:view [build-id]

# View submission status
eas submission:list --limit 5

# Debug local config
expo config --type public
```

## Best Practices

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Version numbers updated
- [ ] Release notes prepared
- [ ] Staging deployment tested
- [ ] Store metadata updated
- [ ] Screenshots current
- [ ] Legal compliance verified

### Release Management

1. **Feature Freeze**: Stop new features before release
2. **QA Testing**: Thorough testing in staging
3. **Rollback Plan**: Prepare rollback procedure
4. **Communication**: Notify stakeholders of deployment
5. **Monitoring**: Watch for issues post-deployment

### Performance Optimization

1. **Bundle Analysis**: Monitor app size
2. **Image Optimization**: Optimize all assets
3. **Code Splitting**: Implement lazy loading
4. **Caching Strategy**: Optimize network requests

## Support

For deployment issues:

1. Check [Expo Documentation](https://docs.expo.dev)
2. Review build logs in EAS Dashboard
3. Contact development team
4. Submit issue in project repository

---

_This deployment guide is maintained by the Drouple development team. Last updated: January 2025_
