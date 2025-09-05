# Drouple - Church Management System Production Testing Suite

Comprehensive automated testing system for the production Drouple - Church Management System deployment at https://www.drouple.app.

## Overview

This testing suite validates:
- ✅ **Authentication flows** for all user roles
- ✅ **Role-based access control** (RBAC) enforcement  
- ✅ **Multi-tenant data isolation** between churches
- ✅ **Core functionality** (members, services, events, LifeGroups)
- ✅ **Critical user workflows** (check-in, RSVP, join requests)
- ✅ **Data integrity** and security measures

## Quick Start

### 1. Install Dependencies
```bash
cd scripts/production-testing
npm run install-deps
```

### 2. Run Full Test Suite
```bash
# Interactive mode (browser visible)
npx tsx run-production-tests.ts

# Headless mode (faster, no UI)
npx tsx run-production-tests.ts --headless
```

### 3. View Results
- **Screenshots**: `./screenshots/`
- **Videos**: `./videos/`
- **Reports**: `./reports/test-report-[timestamp].md`
- **Test Records**: `./test-records-[timestamp].json`

## Test Accounts

All accounts use password: `Hpci!Test2025`

| Role | Email | Church | Dashboard |
|------|--------|---------|-----------|
| Super Admin | `superadmin@test.com` | All | `/super` |
| Manila Admin | `admin.manila@test.com` | Manila | `/admin` |
| Cebu Admin | `admin.cebu@test.com` | Cebu | `/admin` |
| Manila Leader | `leader.manila@test.com` | Manila | `/leader` |
| Cebu Leader | `leader.cebu@test.com` | Cebu | `/leader` |
| Member 1 | `member1@test.com` | Manila | `/dashboard` |
| Member 2 | `member2@test.com` | Cebu | `/dashboard` |
| Member 3 | `member3@test.com` | Manila | `/dashboard` |

## Test Scenarios

### 🔐 Authentication Testing
- Login validation for all roles
- Proper dashboard redirects
- Session management
- Logout functionality

### 🏢 Multi-Tenant Isolation
- Manila admins see only Manila data
- Cebu admins see only Cebu data
- Cross-tenant access prevention
- Data segregation validation

### 👥 Member Management (Admin)
- Create new members
- Edit member details
- Role assignments
- Member activation/deactivation
- Search and pagination

### ⛪ Service Management (Admin)
- Create Sunday services
- Attendance tracking
- Service reports
- Check-in integration

### 🎉 Event Management (Admin)
- Create events with capacity limits
- RSVP functionality
- Waitlist management
- Event visibility controls

### 🤝 LifeGroup Management (Admin/Leader)
- Create LifeGroups
- Member assignments
- Attendance tracking
- Join request workflows

### ✅ Sunday Check-in (Member)
- Check-in functionality
- New believer tracking
- VIP assignment workflow
- Attendance recording

### 🎫 Event RSVP (Member)
- Event browsing
- RSVP submission
- Capacity limit handling
- Waitlist functionality

### 🙏 LifeGroup Join (Member)
- Browse available groups
- Submit join requests
- Request approval workflow
- Membership management

## Command Line Options

```bash
# Basic usage
npx tsx run-production-tests.ts

# Run in headless mode (faster)
npx tsx run-production-tests.ts --headless

# Skip automatic cleanup (for debugging)
npx tsx run-production-tests.ts --no-cleanup

# Test specific accounts only
npx tsx run-production-tests.ts --accounts "admin.manila@test.com,admin.cebu@test.com"

# Run specific scenarios
npx tsx run-production-tests.ts --scenarios "Authentication Flow,Member Management"

# Combination options
npx tsx run-production-tests.ts --headless --no-cleanup --accounts "member1@test.com"
```

## npm Scripts

```bash
# Run full test suite
npm run test

# Run in headless mode
npm run test:headless

# Run without cleanup
npm run test:no-cleanup

# Test admin accounts only
npm run test:admins

# Test authentication only
npm run test:auth

# Clean up leftover test data
npm run cleanup

# Install required dependencies
npm run install-deps
```

## Test Data Management

### Automatic Recording
All test data created during testing is automatically recorded:
- **Members** created through admin interface
- **Services** created for testing
- **Events** created with RSVP functionality
- **LifeGroups** created for join testing
- **Check-ins** performed by test members
- **RSVPs** submitted for events

### Automatic Cleanup
By default, all test data is automatically cleaned up after tests complete:
```bash
# Automatic cleanup (default)
npx tsx run-production-tests.ts

# Skip cleanup to inspect data
npx tsx run-production-tests.ts --no-cleanup
```

### Manual Cleanup
If tests fail or cleanup is skipped, use the generated cleanup script:
```bash
# Run generated cleanup script
npx tsx cleanup-test-run-[timestamp].ts

# Or use npm script to clean all
npm run cleanup
```

## Output Files

### Test Reports (`./reports/`)
Comprehensive markdown reports with:
- Test execution summary
- Pass/fail status for each scenario
- Performance metrics
- Screenshot references
- Error details

### Screenshots (`./screenshots/`)
Automatic screenshots captured at:
- Before/after login for each account
- After each critical action
- Error states and failures
- Final verification steps

### Videos (`./videos/`)
Full session recordings for each test account showing:
- Complete user interaction flows
- Browser navigation and clicks
- Form submissions and responses

### Test Records (`./test-records-[timestamp].json`)
JSON file containing:
- All created test data with IDs
- Test execution metadata
- Cleanup requirements
- Summary statistics

## Troubleshooting

### Common Issues

**Authentication Failures**
```bash
# Check if test accounts exist in production database
# Verify password hasn't changed
# Ensure NextAuth is properly configured
```

**Browser Launch Issues**
```bash
# Install Playwright browsers
npx playwright install

# Run in headless mode if UI issues
npx tsx run-production-tests.ts --headless
```

**Database Connection Errors**
```bash
# Verify DATABASE_URL environment variable
# Check network connectivity to production DB
# Ensure Prisma client is properly configured
```

**Test Data Cleanup Issues**
```bash
# Run manual cleanup
npm run cleanup

# Or clean specific records
npx tsx cleanup-test-run-[specific-timestamp].ts
```

### Debug Mode
For detailed debugging:
```bash
# Run with browser visible and no cleanup
npx tsx run-production-tests.ts --no-cleanup

# Check screenshots and videos for failure analysis
ls -la screenshots/ videos/
```

## Security Considerations

⚠️ **Production Environment**
- Uses real production database at https://www.drouple.app
- Test accounts must exist in production
- Creates real data that requires cleanup
- May impact production performance during testing

🔐 **Test Account Security**
- Test accounts use standard password: `Hpci!Test2025`
- Accounts should have minimal permissions
- Regular password rotation recommended
- Monitor test account usage in production

🧹 **Data Hygiene**
- Automatic cleanup prevents data pollution
- Manual cleanup scripts available as backup
- Test records tracked for audit purposes
- Regular production data backup recommended

## Architecture

### Core Components

1. **`prod-test-config.ts`** - Test configuration and scenarios
2. **`prod-test-runner.ts`** - Main test execution engine  
3. **`test-data-manager.ts`** - Test data tracking and cleanup
4. **`run-production-tests.ts`** - CLI orchestrator and entry point

### Test Flow

1. **Initialize** browser and test systems
2. **Authenticate** all test accounts
3. **Execute** scenarios per role
4. **Validate** multi-tenant isolation
5. **Record** all created test data
6. **Generate** comprehensive reports
7. **Cleanup** test data and sessions

### Data Flow

```
Test Account → Authentication → Role Dashboard → Feature Testing → Data Creation → Cleanup
     ↓              ↓              ↓              ↓              ↓            ↓
  Session       JWT Token     Role-Based      Test Actions    Record      Database
  Storage        Validation     Navigation      & Forms       Tracking     Cleanup
```

## Contributing

### Adding New Test Scenarios
1. Define scenario in `prod-test-config.ts`
2. Add test steps with proper selectors
3. Include cleanup procedures
4. Update documentation

### Adding New Test Accounts  
1. Create accounts in production database
2. Add to `TEST_ACCOUNTS` array
3. Verify role permissions
4. Test authentication flow

### Extending Data Recording
1. Add new record types to `TestRecord` interface
2. Implement creation methods in `TestDataManager`
3. Add cleanup procedures
4. Update report generation

## License

MIT License - See main project LICENSE file.