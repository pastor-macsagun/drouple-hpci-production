# Testing Documentation for HPCI-ChMS

## Overview

HPCI-ChMS employs a comprehensive testing strategy with multiple layers of automated tests to ensure system reliability, security, and functionality. Our test suite includes unit tests, integration tests, end-to-end tests, and specialized tests for security, accessibility, and performance.

## Table of Contents

- [Test Architecture](#test-architecture)
- [Running Tests](#running-tests)
- [Test Categories](#test-categories)
- [Writing Tests](#writing-tests)
- [Test Data & Fixtures](#test-data--fixtures)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Test Architecture

```
tests/
├── unit/                 # Unit tests for business logic
│   ├── rbac.matrix.test.ts
│   ├── tenancy.scope.test.ts
│   ├── services.crud.test.ts
│   ├── lifegroups.crud.test.ts
│   ├── events.rsvp.test.ts
│   ├── pathways.flow.test.ts
│   ├── members.profile.test.ts
│   ├── messages.crud.test.ts
│   └── rate-limit.test.ts
├── e2e/                  # End-to-end tests
│   ├── fixtures/         # Test fixtures and helpers
│   │   └── auth.ts       # Authentication fixtures
│   ├── auth-redirects.spec.ts
│   ├── navigation.spec.ts
│   ├── services-checkin.spec.ts
│   ├── lifegroups.spec.ts
│   ├── events.spec.ts
│   ├── pathways.spec.ts
│   ├── tenancy-isolation.spec.ts
│   ├── security-headers.spec.ts
│   ├── csv-exports.spec.ts
│   └── accessibility.spec.ts
├── api/                  # API contract tests
│   └── contracts.test.ts
└── helpers/              # Test utilities
    └── db-connectivity.test.ts
```

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install E2E test browser drivers
npx playwright install

# Seed test database
npm run seed
```

### Test Commands

```bash
# Run all tests
npm test

# Unit tests
npm run test:unit                 # Run once
npm run test:unit:watch          # Watch mode
npm run test:unit:coverage       # With coverage report

# E2E tests
npm run test:e2e                 # Headless mode
npm run test:e2e:ui             # Interactive UI mode
npm run test:e2e:debug          # Debug mode

# Specific test file
npm run test:unit -- tests/unit/rbac.matrix.test.ts
npx playwright test tests/e2e/auth-redirects.spec.ts

# Run tests by tag
npx playwright test --grep @auth
npx playwright test --grep @critical
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:unit:coverage

# View HTML coverage report
open coverage/index.html
```

## Test Categories

### 1. Unit Tests (Vitest)

Unit tests validate individual functions and business logic in isolation.

#### RBAC Matrix Tests
- **File**: `tests/unit/rbac.matrix.test.ts`
- **Coverage**: Role-based access control permissions
- **Key Tests**:
  - Permission hierarchy validation
  - Role-specific access rights
  - Super admin override capabilities
  - Edge cases and error handling

#### Tenancy Scope Tests
- **File**: `tests/unit/tenancy.scope.test.ts` (new addition for security fixes)
- **Coverage**: Repository guard functions and tenant isolation  
- **Key Tests**:
  - Empty church access returns zero results (critical security fix)
  - Field name support for both `tenantId` and `localChurchId`
  - Super admin can access all churches
  - Regular users can only access their assigned church
  - Error handling for missing user context

#### Auth Redirect Tests  
- **File**: `e2e/role-based-redirects-fix.spec.ts` (new addition for security fixes)
- **Coverage**: Role-based landing page routing
- **Key Tests**:
  - Each role lands on correct page after login
  - Unauthorized access properly redirected 
  - Super admin can access all role pages
  - Middleware enforces access control
  
#### Tenant Isolation E2E Tests
- **File**: `e2e/validation-tenancy.spec.ts`  
- **Coverage**: End-to-end tenant isolation verification
- **Key Tests**:
  - Manila admin cannot see Cebu data
  - Cebu admin cannot see Manila data
  - Cross-tenant service access blocked
  - Super admin can view all church data

#### Entity CRUD Tests
- **Files**: `*.crud.test.ts`
- **Coverage**: Create, Read, Update, Delete operations
- **Entities**: Services, LifeGroups, Events, Members, Messages
- **Validates**:
  - Input validation
  - Required fields
  - Data relationships
  - Soft delete functionality
  - Audit fields (createdAt, updatedAt)

#### Business Logic Tests
- **Pathways Flow**: Enrollment, progress tracking, completion
- **Events RSVP**: Capacity management, waitlist, payments
- **Rate Limiting**: Request throttling, window management

### 2. End-to-End Tests (Playwright)

E2E tests validate complete user workflows through the actual UI.

#### Authentication & Authorization
```typescript
test('should redirect to role-specific dashboard', async ({ page }) => {
  // Admin → /admin
  // Leader → /leader
  // Member → /dashboard
})
```

#### Feature Workflows
- **Check-In Flow**: Service selection → Check-in → Confirmation
- **RSVP Flow**: Event view → RSVP → Waitlist (if full)
- **LifeGroup Join**: Browse → Request → Approval → Membership
- **Pathway Progress**: Enroll → Complete steps → Certificate

#### Security Tests
- **Headers Validation**: CSP, X-Frame-Options, HSTS
- **XSS Prevention**: Input sanitization, output encoding
- **CSRF Protection**: Token validation
- **Cookie Security**: HttpOnly, Secure, SameSite

#### Accessibility Tests
- **WCAG 2.1 Compliance**: Level AA standards
- **Keyboard Navigation**: Tab order, focus management
- **Screen Reader**: ARIA labels, live regions
- **Color Contrast**: Minimum ratios met

### 3. API Contract Tests

Validate API endpoints follow consistent patterns.

```typescript
// Response format validation
const SuccessResponseSchema = z.object({
  success: z.boolean(),
  data: z.any(),
  message: z.string().optional(),
  meta: z.object({
    timestamp: z.string(),
    version: z.string().optional(),
  }).optional(),
})

// Pagination validation
const PaginationSchema = z.object({
  page: z.number().min(1),
  limit: z.number().min(1).max(100),
  total: z.number().min(0),
  totalPages: z.number().min(0),
})
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserRole as Role } from '@prisma/client'

describe('Service CRUD Operations', () => {
  let mockService: any
  
  beforeEach(() => {
    mockService = {
      id: 'service1',
      name: 'Sunday Service',
      date: new Date('2025-01-26'),
      localChurchId: 'manila1',
    }
  })
  
  describe('Create Service', () => {
    it('should create service with valid data', () => {
      const result = createService(mockService)
      expect(result).toMatchObject({
        id: expect.any(String),
        name: mockService.name,
      })
    })
    
    it('should require admin role', () => {
      const userRole = Role.MEMBER
      expect(() => createService(mockService, userRole)).toThrow('Unauthorized')
    })
  })
})
```

### E2E Test Example

```typescript
import { test, expect } from './fixtures/auth'

test.describe('Check-In Flow @checkin', () => {
  test('member can check in to service', async ({ page, memberAuth }) => {
    await page.goto('/checkin')
    
    // Select service
    await page.getByRole('button', { name: /sunday service/i }).click()
    
    // Confirm check-in
    await page.getByRole('button', { name: /check in/i }).click()
    
    // Verify success
    await expect(page.getByText(/checked in successfully/i)).toBeVisible()
  })
})
```

## Test Data & Fixtures

### Database Seeding

The `npm run seed` command creates deterministic test data:

```typescript
// Test Users
- superadmin@test.com (SUPER_ADMIN)
- admin.manila@test.com (ADMIN - Manila)
- admin.cebu@test.com (ADMIN - Cebu)
- leader.manila@test.com (LEADER - Manila)
- member1@test.com to member10@test.com (MEMBER)

// Test Churches
- HPCI Manila (ID: clxtest002)
- HPCI Cebu (ID: clxtest003)
```

### Authentication Fixtures

```typescript
// tests/e2e/fixtures/auth.ts
export const test = base.extend({
  superAdminAuth: async ({ page }, use) => {
    await loginAs(page, 'superadmin@test.com')
    await use(page)
  },
  
  churchAdminAuth: async ({ page }, use) => {
    await loginAs(page, 'admin.manila@test.com')
    await use(page)
  },
  
  leaderAuth: async ({ page }, use) => {
    await loginAs(page, 'leader.manila@test.com')
    await use(page)
  },
  
  memberAuth: async ({ page }, use) => {
    await loginAs(page, 'member1@test.com')
    await use(page)
  },
})
```

### Mock Data Patterns

```typescript
// Consistent ID patterns
const mockIds = {
  services: 'srv_[uuid]',
  lifegroups: 'lg_[uuid]',
  events: 'evt_[uuid]',
  pathways: 'pw_[uuid]',
  users: 'usr_[uuid]',
}

// Date helpers
const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
```

## CI/CD Integration

### GitHub Actions Configuration

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit:coverage
      - uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: coverage/

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run seed
      - run: npm run test:e2e:ci
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Test Reports

- **Unit Test Coverage**: HTML report in `coverage/`
- **E2E Test Report**: HTML report in `playwright-report/`
- **GitHub Artifacts**: 30-day retention for test reports

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```bash
# Reset database and re-seed
npm run db:reset
npm run seed
```

#### 2. Playwright Browser Issues
```bash
# Re-install browsers
npx playwright install --force
```

#### 3. Port Conflicts
```bash
# Check if port 3000 is in use
lsof -i :3000
# Kill process if needed
kill -9 [PID]
```

#### 4. Test Timeouts
```typescript
// Increase timeout for slow operations
test('slow operation', async ({ page }) => {
  test.setTimeout(60000) // 60 seconds
  // test code
})
```

#### 5. Flaky Tests
```typescript
// Add retries for flaky tests
test('potentially flaky', async ({ page }) => {
  test.info().annotations.push({ type: 'flaky', description: 'Network dependent' })
  // Add explicit waits
  await page.waitForLoadState('networkidle')
  // test code
})
```

### Debug Mode

```bash
# Run specific test in debug mode
npx playwright test --debug tests/e2e/auth-redirects.spec.ts

# Run with verbose logging
DEBUG=pw:api npx playwright test

# Run with video recording
npx playwright test --video=on
```

### Test Isolation

Each test should be independent:

```typescript
test.beforeEach(async ({ page }) => {
  // Reset to known state
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
})

test.afterEach(async ({ page }) => {
  // Clean up test data if needed
})
```

## Best Practices

1. **Test Naming**: Use descriptive names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests clearly
3. **DRY Principle**: Use fixtures and helpers to avoid duplication
4. **Test Data**: Use deterministic, predictable test data
5. **Isolation**: Tests should not depend on each other
6. **Coverage**: Aim for >80% code coverage
7. **Performance**: Keep unit tests fast (<100ms each)
8. **Accessibility**: Include a11y tests for all new features
9. **Security**: Test authorization and input validation
10. **Documentation**: Comment complex test logic

## Test Metrics

### Current Coverage (as of Jan 2025)
- **Unit Tests**: 316/319 passing (99.1%)
- **E2E Tests**: 11 comprehensive test suites
- **Code Coverage**: ~80% (target)
- **Test Execution Time**: ~2 minutes (full suite)

### Test Categories by Priority

| Priority | Category | Frequency |
|----------|----------|-----------|
| P0 | Auth, RBAC, Tenancy | Every commit |
| P1 | CRUD Operations | Every PR |
| P2 | UI Workflows | Every PR |
| P3 | Accessibility | Weekly |
| P4 | Performance | Before release |

## Contributing

When adding new features:

1. Write unit tests first (TDD approach)
2. Add E2E test for user workflow
3. Update seed data if needed
4. Ensure all tests pass locally
5. Include test results in PR description

## Local Full-System Validation

### Overview

The local validation system provides comprehensive end-to-end testing of the complete HPCI-ChMS application in a local development environment. This validation covers all critical system functions including authentication, authorization, multi-tenancy, CRUD operations, and security.

### Running Full-System Validation

```bash
# Prerequisites
npm install
npx playwright install
npm run seed
npm run dev

# Run validation script
npx tsx validate-system.ts
```

### Validation Coverage

The full-system validation tests:

1. **Authentication & RBAC** - All role logins and permission enforcement
2. **Multi-Tenant Isolation** - Manila/Cebu church data separation
3. **CRUD Operations** - Create, read, update, delete across all entities
4. **Member Workflows** - Directory, profile, check-in, events access
5. **VIP Management** - First-timer logging and status tracking
6. **CSV Exports** - Data export functionality across admin interfaces
7. **Security Headers** - Comprehensive security policy validation
8. **Error Handling** - 404 pages and proper error boundaries
9. **Data Integrity** - Duplicate prevention and constraint validation

### Automated Screenshot Collection

The validation system automatically captures screenshots at key validation points:

```typescript
// Screenshots captured during validation
- Super Admin login and dashboard
- Manila/Cebu admin isolation verification
- Member workflow pages (directory, profile, check-in, events)
- VIP dashboard and functionality
- 404 error page handling
```

### Validation Report

Upon completion, the system generates:

- **LOCAL_VALIDATION_REPORT.md** - Comprehensive test results
- **test-artifacts/** - Screenshots and evidence files
- **Pass/Fail status** for each validation phase

### Multi-Role Testing Approach

The validation uses separate browser contexts for each role to ensure proper isolation:

```typescript
// Role-based testing patterns
const roleTests = [
  { email: 'admin.manila@test.com', expectedPath: '/admin', role: 'ADMIN' },
  { email: 'leader.manila@test.com', expectedPath: '/leader', role: 'LEADER' },
  { email: 'member1@test.com', expectedPath: '/dashboard', role: 'MEMBER' },
  { email: 'vip.manila@test.com', expectedPath: '/vip', role: 'VIP' }
]
```

### Evidence Collection

- All screenshots stored with timestamped filenames
- Test artifacts preserved for manual review
- Detailed logs of each validation phase
- Security header capture and analysis

### Integration with Development Workflow

The local validation can be run:
- Before production deployments
- After major feature implementations
- When validating security updates
- As part of release verification

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)