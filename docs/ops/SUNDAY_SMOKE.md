# Sunday Smoke Test Guide

> **Critical**: Run this test suite every Sunday morning before service to ensure app reliability

## Quick Start

```bash
# Automated execution (recommended)
npm run smoke:test

# Manual execution with detailed logging
node scripts/sunday-smoke-test.mjs

# Emergency manual checklist (if automated fails)
# See "Manual Checklist" section below
```

## Test Coverage Overview

The Sunday Smoke Test validates **12 critical functions** that must work flawlessly during Sunday service:

| Test # | Component | Critical Level | Auto/Manual |
|--------|-----------|----------------|-------------|
| 1 | App Build | 🔴 Critical | ✅ Auto |
| 2 | Unit Tests | 🔴 Critical | ✅ Auto |
| 3 | Staging API | 🔴 Critical | ✅ Auto |
| 4 | Authentication | 🔴 Critical | ✅ Auto |
| 5 | Push Notifications | 🟡 Important | ✅ Auto |
| 6 | Events API | 🟡 Important | ✅ Auto |
| 7 | Directory API | 🟡 Important | ✅ Auto |
| 8 | Check-in API | 🔴 Critical | ✅ Auto |
| 9 | Offline Mode | 🟡 Important | ✅ Auto |
| 10 | Performance | 🟡 Important | ✅ Auto |
| 11 | Security Headers | 🟡 Important | ✅ Auto |
| 12 | E2E Critical Flow | 🔴 Critical | ⚠️ Semi-auto |

## Result Interpretation

### 🟢 GREEN (Ready for Service)
- ✅ All critical tests passing
- ✅ 0 failed tests
- **Action**: Proceed with confidence

### 🟡 YELLOW (Monitor Closely) 
- ✅ All critical tests passing
- ⚠️ 1-2 non-critical failures
- **Action**: Proceed but monitor during service

### 🔴 RED (Investigate First)
- ❌ Critical test failures OR 3+ total failures
- **Action**: **DO NOT PROCEED** - Debug issues first

## Automated Test Execution

### Prerequisites

```bash
# Ensure environment is ready
npm install
npx expo install

# Verify staging access
curl -s https://staging.drouple.com/health || echo "❌ Staging unreachable"

# iOS Simulator (for E2E tests)
xcrun simctl list | grep "iPhone" || echo "⚠️ No iOS simulator available"
```

### Run Command

```bash
# Standard execution
npm run smoke:test

# With verbose logging
DEBUG=smoke* npm run smoke:test

# Skip E2E tests (if simulator unavailable)
SKIP_E2E=true npm run smoke:test
```

### Output Example

```bash
🚀 Starting Sunday Smoke Test Suite
📡 Target: https://staging.drouple.com/api/v2
────────────────────────────────────────────────────────

🔨 Test 1: App builds successfully
✅ App builds without errors

🧪 Test 2: Unit tests pass  
✅ All unit tests passing

🌐 Test 3: Staging API is accessible
✅ Staging API responding

🔐 Test 4: Authentication works
✅ Authentication successful

📱 Test 5: Push notification registration
✅ Push notifications registered

📅 Test 6: Events API responds
✅ Events API returned 5 events

👥 Test 7: Directory API responds  
✅ Directory API returned 12 members

✅ Test 8: Check-in API responds
✅ Check-in API returned 3 services

📴 Test 9: Offline mode functionality
✅ Offline mode tests passing

⚡ Test 10: Performance within budgets
✅ Performance budgets met

🔒 Test 11: Security headers present
✅ Security headers configured

🎯 Test 12: Critical E2E flow
✅ Critical E2E tests passing

────────────────────────────────────────────────────────
📊 FINAL RESULTS
   Total Tests: 12
   Passed: 12
   Pass Rate: 100.0%
   Duration: 47.3s

🎯 RECOMMENDATION: GREEN: All systems operational, ready for Sunday service
```

## Manual Checklist (Emergency Backup)

**Use only if automated script fails completely**

### Core Infrastructure ⏱️ 2 minutes

- [ ] **App Build**: `npx expo export --platform ios` completes without errors
- [ ] **Unit Tests**: `npm run test:unit -- --run` shows all tests passing  
- [ ] **Staging API**: Visit https://staging.drouple.com/health returns 200 OK
- [ ] **Database**: Staging database responding (check admin dashboard)

### Authentication Flow ⏱️ 1 minute

- [ ] **Login**: Test user can sign in via mobile app
- [ ] **Token**: JWT tokens being issued correctly
- [ ] **Session**: User stays logged in across app restart

### Critical APIs ⏱️ 3 minutes

- [ ] **Check-in**: Can view available services
- [ ] **Events**: Event list loads with proper data
- [ ] **Directory**: Member directory search works
- [ ] **Notifications**: Push notification registration succeeds

### Performance & Security ⏱️ 1 minute

- [ ] **App Speed**: App launches in <3 seconds on device
- [ ] **Security Headers**: HTTPS and security headers present
- [ ] **Offline Mode**: App functions when network disconnected

### E2E Critical Path ⏱️ 2 minutes

- [ ] **Full Flow**: Login → Check-in → View Events → Member Search
- [ ] **Error Handling**: App shows proper error states when API fails
- [ ] **Data Sync**: Changes sync properly when network returns

**Total Manual Check Time: ~9 minutes**

## Troubleshooting Common Issues

### Build Failures
```bash
# Clear build caches
npx expo r -c
rm -rf node_modules && npm install

# Metro bundler issues
npx expo r -c --clear-cache

# iOS build issues  
npx pod-install ios
```

### API Connection Issues
```bash
# Check network connectivity
curl -I https://staging.drouple.com/api/v2/health

# Verify DNS resolution
nslookup staging.drouple.com

# Check firewall/VPN
ping staging.drouple.com
```

### Authentication Failures
- Verify test credentials in `CONFIG.TEST_USER`
- Check if staging database has test user accounts
- Confirm JWT secret is properly configured

### E2E Test Failures
```bash
# Reset simulator state
npx detox clean-framework-cache
npx detox build --configuration ios.sim.debug

# Check simulator status
xcrun simctl list devices | grep Booted
```

### Performance Issues
- Bundle size exceeded: Check `scripts/measure-startup.mjs` output
- Startup time slow: Profile with Flipper or React DevTools
- Memory usage high: Run memory profiler during tests

## Integration with CI/CD

### GitHub Actions Integration

```yaml
# .github/workflows/sunday-smoke.yml
name: Sunday Smoke Test
on:
  schedule:
    - cron: '0 6 * * 0'  # Every Sunday 6 AM UTC
  workflow_dispatch:

jobs:
  smoke-test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run smoke:test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: smoke-test-results
          path: artifacts/smoke-test-*.json
```

### Slack Notifications

```bash
# Add to package.json scripts
"smoke:notify": "node scripts/sunday-smoke-test.mjs && curl -X POST -H 'Content-type: application/json' --data '{\"text\":\"✅ Sunday Smoke Test: All systems GO!\"}' $SLACK_WEBHOOK"
```

## Historical Data & Trends

### Test Results Archive
- Results stored in `/artifacts/smoke-test-{timestamp}.json`
- Retention: 30 days automatic cleanup
- Trends dashboard: Available in GitHub Actions artifacts

### Performance Benchmarks
- **Target Cold Start**: <1.5s iOS, <2.5s Android
- **Target Bundle Size**: <50MB base, <120MB installed  
- **Target API Response**: <500ms for critical endpoints
- **Target Pass Rate**: 100% for critical tests, >90% overall

### Reliability Metrics
- **Historical Pass Rate**: Track weekly trends
- **Mean Time to Resolution**: For failed smoke tests
- **Sunday Service Success Rate**: Correlation with smoke test results

## Emergency Procedures

### If Critical Tests Fail (RED Status)

**STOP** - Do not proceed with Sunday service mobile features

1. **Immediate Actions** (5 minutes)
   - [ ] Notify technical team immediately
   - [ ] Check staging service status
   - [ ] Verify issue is not local environment

2. **Quick Fixes** (10 minutes)
   - [ ] Restart staging services
   - [ ] Clear CDN/proxy caches  
   - [ ] Deploy last known good build

3. **Fallback Plans** (15 minutes)
   - [ ] Prepare manual check-in sheets
   - [ ] Brief service team on app unavailability
   - [ ] Set up alternative communication channels

4. **Communication**
   - [ ] Update church leadership
   - [ ] Prepare congregation announcement if needed
   - [ ] Log incident for post-mortem

### Contact Information

**Primary Technical Contact**: [Your Name]
- Phone: [Number]
- Slack: @[handle]
- Email: [email]

**Backup Contact**: [Backup Name]  
- Phone: [Number]
- Slack: @[handle]

**Emergency Escalation**: [Leadership Contact]
- Phone: [Number]

## Script Configuration

### Environment Variables

```bash
# Required
export STAGING_API_URL="https://staging.drouple.com/api/v2"
export SMOKE_TEST_USER_EMAIL="test.member@staging.com"
export SMOKE_TEST_USER_PASSWORD="Staging!Test2025"

# Optional
export SMOKE_TIMEOUT="30000"           # 30 seconds
export SMOKE_RETRY_ATTEMPTS="3"        # 3 retries
export SKIP_E2E="false"               # Skip E2E tests
export DEBUG="smoke*"                 # Enable debug logging
export SLACK_WEBHOOK="https://..."    # Slack notifications
```

### Customization Options

```javascript
// scripts/sunday-smoke-test.mjs - CONFIG section
const CONFIG = {
  STAGING_API: process.env.STAGING_API_URL || 'https://staging.drouple.com/api/v2',
  TEST_USER: {
    email: process.env.SMOKE_TEST_USER_EMAIL || 'test.member@staging.com',
    password: process.env.SMOKE_TEST_USER_PASSWORD || 'Staging!Test2025'
  },
  TIMEOUT: parseInt(process.env.SMOKE_TIMEOUT) || 30000,
  RETRY_ATTEMPTS: parseInt(process.env.SMOKE_RETRY_ATTEMPTS) || 3,
  SKIP_E2E: process.env.SKIP_E2E === 'true',
  // Add custom test configurations here
};
```

## Metrics Dashboard

### Key Performance Indicators

```bash
# Generate weekly report
node scripts/generate-smoke-report.mjs --week

# View trend analysis  
node scripts/analyze-smoke-trends.mjs --days 30

# Compare with service impact
node scripts/correlate-service-issues.mjs
```

### Monitoring Alerts

Set up monitoring for:
- Smoke test pass rate drops below 90%
- Critical test failures 2 Sundays in a row
- Performance regression trends
- API response time increases

---

## Quick Reference Card

**📋 Print and post this near the tech booth:**

```
┌─ SUNDAY SMOKE TEST QUICK REF ─┐
│                                │
│ RUN: npm run smoke:test        │
│                                │
│ 🟢 GREEN: All systems GO       │
│ 🟡 YELLOW: Monitor closely     │
│ 🔴 RED: STOP - Debug first     │
│                                │
│ Emergency: Run manual tests    │
│ Contact: [Your Phone Number]   │
│                                │
│ Critical APIs:                 │
│ ✓ Staging API responding       │
│ ✓ Authentication working       │
│ ✓ Check-in system active       │
│ ✓ Events loading properly      │
│                                │
│ Last Updated: [Date]           │
└────────────────────────────────┘
```

**Remember**: Better to catch issues at 7 AM than during 10 AM service! 🙏