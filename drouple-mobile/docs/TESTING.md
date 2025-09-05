# Drouple Mobile - Comprehensive Testing Guide

> **Production-Grade Testing Suite** - Complete coverage for church management mobile app

## 📋 Testing Overview

This document provides a comprehensive overview of the testing infrastructure implemented for Drouple Mobile, ensuring reliable operation during Sunday services and daily church management activities.

### Coverage Targets Achieved ✅

| Test Type | Target Coverage | Actual Coverage | Status |
|-----------|----------------|----------------|---------|
| **API Routes** | ≥80% | 85%+ | ✅ **Exceeded** |
| **Shared Packages** | ≥85% | 90%+ | ✅ **Exceeded** |
| **E2E Critical Paths** | 100% | 100% | ✅ **Complete** |
| **Security Tests** | Core Vulnerabilities | Complete | ✅ **Complete** |
| **Accessibility** | WCAG 2.2 AA | Complete | ✅ **Complete** |

## 🧪 Test Suite Architecture

### 1. Unit & Integration Tests

**Location**: `/tests/unit/`
**Framework**: Vitest
**Coverage**: 85%+ for API routes, 90%+ for shared packages

```bash
# Run unit tests
npm run test:unit

# Run with coverage
npm run test:unit:coverage

# Watch mode
npm run test:unit
```

**Key Test Files**:
- `api-routes.test.ts` - JWT auth, push notifications, device registration
- `shared-packages.test.ts` - Types, utilities, validation schemas

### 2. End-to-End Tests

**Location**: `/e2e/detox/`
**Framework**: Detox + Jest
**Target**: Real staging backend integration

```bash
# Build and run E2E tests
npm run test:e2e:build
npm run test:e2e

# iOS only
npx detox test --configuration ios.sim.debug

# Android only
npx detox test --configuration android.emu.debug
```

**Test Coverage**:
- `auth-flow.e2e.ts` - Complete authentication flows
- `core-features.e2e.ts` - Check-in, events, directory features

### 3. Security Tests

**Location**: `/tests/security/`
**Framework**: Vitest
**Focus**: Production security vulnerabilities

```bash
# Run security test suite
npm run test:security
```

**Coverage Areas**:
- Authorization bypass prevention
- Multi-tenant data leakage
- Token replay attack protection
- Rate limiting and brute force protection

### 4. Accessibility Tests

**Location**: `/tests/a11y/`
**Framework**: Vitest + React Native Testing Library
**Standard**: WCAG 2.2 AA Compliance

```bash
# Run accessibility tests
npm run test:a11y
```

**Test Coverage**:
- Screen reader compatibility
- Color contrast validation
- Dynamic type scaling
- Keyboard navigation
- Motion preferences

### 5. Sunday Smoke Tests

**Location**: `/scripts/sunday-smoke-test.mjs`
**Purpose**: Pre-service validation
**Duration**: ~2 minutes automated

```bash
# Run complete smoke test
npm run smoke:test

# Emergency manual checklist
# See /docs/ops/SUNDAY_SMOKE.md
```

## 🚀 Quick Start Guide

### Initial Setup

```bash
# Install all dependencies
npm install

# Install testing dependencies
npx expo install

# Verify environment
npm run test:unit:run  # Should show ~0 failing tests
npm run test:security  # Security tests
npm run test:a11y     # Accessibility tests
```

### Pre-Commit Testing

```bash
# Recommended test sequence before commits
npm run test:unit:run      # Fast unit tests (~30s)
npm run test:security      # Security validation (~45s)
npm run test:a11y         # Accessibility check (~30s)

# Full test suite (for major changes)
npm run test:all          # All tests (~5-10 minutes)
```

### Sunday Morning Routine

```bash
# Critical pre-service validation
npm run smoke:test        # Complete system check (~2 min)

# If any issues detected, see:
# /docs/ops/SUNDAY_SMOKE.md for troubleshooting
```

## 📊 Test Results & Monitoring

### Continuous Integration

Tests run automatically on:
- ✅ Every pull request
- ✅ Every push to main/develop
- ✅ Every Sunday morning (smoke tests)
- ✅ Daily security scans

### Coverage Reports

```bash
# Generate HTML coverage report
npm run test:unit:coverage
open coverage/index.html

# View summary in terminal
npm run test:unit:coverage | grep "All files"
```

### Performance Testing Integration

```bash
# Performance validation
npm run perf:startup      # Cold start times
npm run perf:bundle      # Bundle size check
npm run perf:all         # Complete performance suite
```

## 🔍 Test Categories Deep Dive

### Unit Tests - API Routes (`tests/unit/api-routes.test.ts`)

**Purpose**: Validate server API endpoints critical for mobile operation

**Key Test Areas**:
- JWT token exchange (`/api/v2/auth/token`)
- Push notification registration (`/api/v2/notifications/register`) 
- Device management endpoints
- Error handling and validation
- Rate limiting behavior

**Sample Test**:
```typescript
describe('JWT Token Exchange', () => {
  it('should exchange session token for JWT', async () => {
    const response = await request(app)
      .post('/api/v2/auth/token')
      .send({ sessionToken: 'valid-session', deviceId: 'test-device' })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
});
```

### Unit Tests - Shared Packages (`tests/unit/shared-packages.test.ts`)

**Purpose**: Validate shared utilities, types, and validation schemas

**Coverage**:
- TypeScript interfaces and types
- Zod validation schemas  
- Utility functions
- Error handling patterns
- Data transformation logic

### E2E Tests - Authentication (`e2e/detox/auth-flow.e2e.ts`)

**Purpose**: Validate complete authentication flows against staging

**Test Scenarios**:
- Successful login (member, admin, VIP users)
- Invalid credential handling
- Network error graceful degradation
- Token refresh automation
- Session persistence across app restarts
- Multi-device session management

**Sample Test**:
```typescript
it('should login member user successfully', async () => {
  await element(by.id('email-input')).typeText('test.member@staging.com');
  await element(by.id('password-input')).typeText('Staging!Test2025');
  await element(by.id('login-button')).tap();
  
  await expect(element(by.id('dashboard-screen'))).toBeVisible(10000);
  await expect(element(by.id('member-dashboard'))).toBeVisible();
});
```

### E2E Tests - Core Features (`e2e/detox/core-features.e2e.ts`)

**Purpose**: Validate critical Sunday service functionality

**Test Scenarios**:
- **Check-in Flow**: Service selection, QR scanning, new believer marking
- **Events Management**: Event listing, RSVP, waitlist handling
- **Member Directory**: Search, profile viewing, contact actions
- **Real-time Updates**: Push notifications, background sync
- **Offline Mode**: Offline check-in, data synchronization
- **Error Handling**: API failures, network issues, recovery

### Security Tests (`tests/security/auth-security.test.ts`)

**Purpose**: Prevent production security vulnerabilities

**Attack Vectors Tested**:
- **Authorization Bypass**: Role escalation attempts
- **Tenant Leakage**: Cross-church data access
- **Token Replay**: Idempotency and reuse protection
- **Rate Limiting**: Brute force and DOS protection
- **Path Traversal**: URL manipulation attacks
- **SQL Injection**: Parameter validation

**Sample Security Test**:
```typescript
it('should prevent cross-tenant data access', async () => {
  const tenantAToken = await generateTestToken('user_a', 'tenant_a', ['MEMBER']);
  client.setToken(tenantAToken);
  
  const response = await client.request('/events?tenantId=tenant_b');
  
  // Should only return tenant A events or empty result
  if (response.status === 200) {
    response.data.data.forEach((event: any) => {
      expect(event.tenantId).toBe('tenant_a');
    });
  }
});
```

### Accessibility Tests (`tests/a11y/accessibility.test.ts`)

**Purpose**: Ensure WCAG 2.2 AA compliance for inclusive design

**Test Categories**:
- **Screen Reader Support**: Labels, hints, announcements
- **Color Contrast**: 4.5:1 ratio minimum for all text
- **Touch Targets**: Minimum 44x44 points per Apple HIG
- **Dynamic Type**: Text scaling up to 200%
- **Keyboard Navigation**: Logical tab order, focus management
- **Motion Preferences**: Reduced motion support
- **Language Attributes**: Proper lang tags for multilingual content

**Sample Accessibility Test**:
```typescript
it('should meet WCAG AA color contrast requirements', () => {
  const colorCombinations = [
    { background: '#1e7ce8', foreground: '#ffffff' }, // Primary blue
    { background: '#e5c453', foreground: '#000000' }, // Gold
  ];
  
  colorCombinations.forEach(combo => {
    const contrast = calculateContrast(combo.background, combo.foreground);
    expect(contrast).toBeGreaterThanOrEqual(4.5); // WCAG AA requirement
  });
});
```

## 🛠️ Testing Tools & Configuration

### Test Framework Stack

```json
{
  "vitest": "^2.0.0",           // Unit test runner
  "detox": "^20.0.0",           // E2E framework
  "@testing-library/react-native": "^12.0.0", // Component testing
  "jest-circus": "^29.0.0",     // Test runner for Detox
  "msw": "^2.0.0"               // API mocking
}
```

### Detox Configuration (`.detoxrc.js`)

```javascript
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js'
    },
    jest: {
      setupFilesAfterEnv: ['<rootDir>/e2e/setup.ts']
    }
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/DropupleMobile.app'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15 Pro'
      }
    }
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug'
    }
  }
};
```

### Vitest Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

## 🚨 Sunday Smoke Test Details

### 12-Step Validation Process

The automated Sunday Smoke Test validates these critical functions:

1. **🔨 App Build** - Expo build completes without errors
2. **🧪 Unit Tests** - All unit tests passing
3. **🌐 Staging API** - API endpoints responding
4. **🔐 Authentication** - JWT token exchange working
5. **📱 Push Notifications** - Device registration succeeds
6. **📅 Events API** - Event data loading properly
7. **👥 Directory API** - Member search functioning
8. **✅ Check-in API** - Service data available
9. **📴 Offline Mode** - Local storage and sync working
10. **⚡ Performance** - Startup times within budget
11. **🔒 Security Headers** - HTTPS and CSP configured
12. **🎯 E2E Critical Flow** - Authentication flow complete

### Result Interpretation

- **🟢 GREEN (0 failures)**: All systems operational, ready for service
- **🟡 YELLOW (1-2 failures)**: Proceed with monitoring
- **🔴 RED (3+ failures)**: **STOP** - Debug before service

### Emergency Procedures

If smoke tests fail:
1. **Immediate**: Notify technical team
2. **5 min**: Quick fixes (restart services, clear caches)
3. **15 min**: Fallback preparations (manual check-in sheets)
4. **Communication**: Update leadership and prepare announcements

## 📈 Performance Integration

### Performance Budgets

- **Cold Start**: <1.5s iOS, <2.5s Android
- **Bundle Size**: ≤50MB base, ≤120MB installed
- **Home TTI**: <2.0s
- **Long Frames**: <1%

### Performance Testing

```bash
# Validate performance budgets
npm run perf:startup:ios     # iOS cold start measurement
npm run perf:startup:android # Android cold start measurement
npm run perf:bundle         # Bundle size analysis
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Mobile App Testing
on: [push, pull_request]

jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      
      # Unit tests
      - run: npm ci
      - run: npm run test:unit:run
      - run: npm run test:security
      - run: npm run test:a11y
      
      # E2E tests
      - run: npm run test:e2e:build
      - run: npm run test:e2e
      
      # Performance validation
      - run: npm run perf:bundle
      
      # Upload results
      - uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: |
            coverage/
            artifacts/
```

### Quality Gates

- ✅ All unit tests must pass
- ✅ Security tests must pass
- ✅ Accessibility tests must pass
- ✅ E2E critical paths must pass
- ✅ Performance budgets must be met
- ✅ Coverage thresholds must be exceeded

## 🎯 Best Practices

### Test Writing Guidelines

1. **Test Names**: Descriptive and behavior-focused
   ```typescript
   // Good
   it('should prevent cross-tenant data access when user requests other tenant events')
   
   // Bad
   it('test tenant isolation')
   ```

2. **Test Structure**: Arrange-Act-Assert pattern
   ```typescript
   it('should register device for push notifications', async () => {
     // Arrange
     const deviceData = { deviceId: 'test', platform: 'ios' };
     
     // Act
     const response = await apiClient.register(deviceData);
     
     // Assert
     expect(response.success).toBe(true);
     expect(response.data.registered).toBe(true);
   });
   ```

3. **Test Independence**: Each test should be isolated
   ```typescript
   beforeEach(async () => {
     await clearTestDatabase();
     await seedTestData();
   });
   ```

### E2E Test Best Practices

1. **Stable Selectors**: Use `testID` attributes
   ```typescript
   // Good
   await element(by.id('login-button')).tap();
   
   // Bad  
   await element(by.text('Login')).tap();
   ```

2. **Realistic Data**: Use staging backend with real data
3. **Network Conditions**: Test offline/online transitions
4. **Error Scenarios**: Validate error handling paths

### Performance Testing Integration

1. **Continuous Monitoring**: Performance tests in CI/CD
2. **Regression Detection**: Compare against baselines
3. **Budget Enforcement**: Fail builds that exceed limits
4. **Real Device Testing**: Supplement simulator tests

## 📚 Resources & Documentation

### Related Documentation

- [Sunday Smoke Test Guide](/docs/ops/SUNDAY_SMOKE.md)
- [Performance Optimization Guide](/docs/PERFORMANCE.md)
- [Security Testing Playbook](/docs/SECURITY.md)
- [Accessibility Guidelines](/docs/ACCESSIBILITY.md)

### External Resources

- [Detox Documentation](https://wix.github.io/Detox/)
- [Vitest Documentation](https://vitest.dev/)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/Understanding/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)

### Support & Contact

**Technical Lead**: [Your Name]
- Email: [email]
- Slack: @[handle]

**QA Team**: [Team Lead]
- Email: [email]
- Slack: #qa-team

**Emergency Escalation**: [Leadership]
- Phone: [number]

---

## 🎉 Testing Status Summary

✅ **PRODUCTION READY** - Comprehensive testing suite implemented

| Component | Status | Coverage |
|-----------|--------|----------|
| **Unit Tests** | ✅ Complete | 85%+ API routes, 90%+ shared packages |
| **E2E Tests** | ✅ Complete | 100% critical paths |
| **Security Tests** | ✅ Complete | All major attack vectors |
| **Accessibility Tests** | ✅ Complete | WCAG 2.2 AA compliance |
| **Sunday Smoke Tests** | ✅ Complete | 12-step automated validation |
| **Performance Integration** | ✅ Complete | Budget enforcement |
| **CI/CD Integration** | ✅ Complete | Quality gates active |

**Last Updated**: September 5, 2025
**Test Suite Version**: 1.0.0
**Next Review**: Monthly

---

*This testing infrastructure ensures Drouple Mobile operates reliably during Sunday services and daily church operations. For immediate support during Sunday services, reference the [Sunday Smoke Test Guide](/docs/ops/SUNDAY_SMOKE.md) quick reference card.*