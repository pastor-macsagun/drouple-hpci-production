# Development Setup Guide

## Prerequisites

- **Node.js 18+** and npm
- **PostgreSQL database** (Neon recommended for serverless with pooling)
- **Git** for version control
- **Modern IDE** (VS Code recommended with TypeScript extensions)

## Quick Start

Drouple is now production-ready with enterprise-grade features. This guide will get you up and running with the full development environment including testing, monitoring, and debugging capabilities.

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/drouple.git
cd drouple
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

#### Required Database Configuration

You need a PostgreSQL database. We recommend using [Neon](https://neon.tech):

1. Create a free account at https://neon.tech
2. Create a new database
3. Copy the connection strings (both pooled and direct)

```env
# Production database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@your-db.neon.tech/dbname?sslmode=require&pgbouncer=true"
DATABASE_URL_UNPOOLED="postgresql://user:pass@your-db.neon.tech/dbname?sslmode=require"
```

#### Test Environment Setup

For running tests, create a `.env.test` file with a separate test database:

```env
# Test Database (Neon PostgreSQL - separate branch recommended)
DATABASE_URL="postgresql://test_user:pass@test-db.neon.tech/test_db?sslmode=require&pgbouncer=true"
DATABASE_URL_UNPOOLED="postgresql://test_user:pass@test-db.neon.tech/test_db?sslmode=require"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="test-secret-minimum-32-characters-long"

# Email Configuration (mock values for testing)
EMAIL_SERVER_HOST="smtp.resend.com"
EMAIL_SERVER_PORT="465"
EMAIL_SERVER_USER="resend"
EMAIL_SERVER_PASSWORD="test"
EMAIL_FROM="test@example.com"
RESEND_API_KEY="re_test"

# Rate Limiting (relaxed for testing)
RATE_LIMIT_ENABLED="true"
RATE_LIMIT_LOGIN_MAX="50"
RATE_LIMIT_API_MAX="1000"

# Testing Environment
NODE_ENV="test"
```

#### Email Configuration (Production)

For production email sending, sign up for [Resend](https://resend.com):

```env
EMAIL_SERVER_HOST="smtp.resend.com"
EMAIL_SERVER_PORT="465"
EMAIL_SERVER_USER="resend"
EMAIL_SERVER_PASSWORD="your-resend-api-key"
EMAIL_FROM="noreply@yourdomain.com"
RESEND_API_KEY="re_your_actual_api_key"
```

### 4. Database Setup

#### Schema Setup and Migration
```bash
# Push database schema (for development)
npx prisma db push

# Or use migrations (for production-like setup)
npx prisma migrate deploy
```

#### Seed Development Data
```bash
# Seed with deterministic test data (includes all roles and test users)
npm run seed
```

This creates:
- **Super Admin**: `superadmin@test.com`
- **Church Admins**: `admin.manila@test.com`, `admin.cebu@test.com`
- **VIP Team**: `vip.manila@test.com`, `vip.cebu@test.com`
- **Leaders**: `leader.manila@test.com`, `leader.cebu@test.com`
- **Members**: `member1@test.com` through `member10@test.com`
- Password for all test accounts: `Hpci!Test2025`

**Note**: In production, Super Admins create admin accounts using the password generation system. See [Admin Account Creation](./admin-invitation-workflow.md) for the production workflow.

#### Database Health Check
```bash
# Verify database connection and schema
npx prisma db pull
npx prisma generate
```

## Development Workflow

### Start Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000

### Quality Assurance Commands

```bash
# Full development verification (recommended before commits)
npm run build && npm run test:unit && npm run lint && npm run typecheck

# Individual commands
npm run test:unit              # Unit tests (662 tests)
npm run test:unit:watch        # Unit tests in watch mode
npm run test:unit:coverage     # Unit tests with coverage report
npm run test:e2e               # End-to-end tests
npm run test:e2e:ui            # E2E tests with Playwright UI
npm run test:all               # Run both unit and E2E tests
npm run typecheck              # TypeScript compilation
npm run lint                   # ESLint checks
npm run build                  # Production build verification
```

### Performance and Bundle Analysis

```bash
# Analyze bundle sizes and performance
npm run analyze

# Monitor bundle sizes during development
npm run build:analyze
```

### Development Testing Patterns

```bash
# Run specific test files
npm run test:unit -- src/path/to/test.ts

# Run tests matching pattern
npm run test:unit -- --testNamePattern="user creation"

# Debug failing tests
npm run test:unit:watch -- --testNamePattern="failing test"
```

## Advanced Development Features

### Error Monitoring (Sentry Integration)

For development error tracking:

```bash
# Set up Sentry (optional for development)
export SENTRY_DSN="your-dev-sentry-dsn"
export NEXT_PUBLIC_SENTRY_DSN="your-dev-sentry-dsn"
```

### Rate Limiting Configuration

```env
# Development rate limiting (in .env)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_LOGIN_MAX=10          # More lenient for development
RATE_LIMIT_API_MAX=200           # Higher limits for testing
```

### Bundle Analysis and Performance

```bash
# Generate bundle analysis report
npm run analyze

# Check bundle sizes meet production thresholds (<200KB)
npm run build:check
```

## Common Issues & Solutions

### Database Connection Errors

**Issue**: "Can't reach database server"

**Solutions**:
1. Verify DATABASE_URL format: `postgresql://user:pass@host.neon.tech/db?sslmode=require&pgbouncer=true`
2. Check Neon dashboard for database status
3. Ensure both pooled and unpooled URLs are configured
4. Test connection: `npx prisma db pull`

### Migration and Schema Issues

**Issue**: "Migration failed" or schema conflicts

**Solutions**:
```bash
# Reset and resync (development only - will lose data)
npx prisma migrate reset --skip-seed
npx prisma db push
npm run seed

# Or resolve specific migration
npx prisma migrate resolve --rolled-back <migration-name>
```

### Test Failures

**Issue**: Tests failing with database or authentication errors

**Solutions**:
```bash
# Verify test environment
echo $NODE_ENV  # Should be 'test' during tests

# Reset test database
NODE_ENV=test npx prisma migrate reset --skip-seed
NODE_ENV=test npm run seed

# Run tests with verbose output
npm run test:unit -- --verbose
```

### TypeScript and Build Errors

**Issue**: TypeScript compilation failures

**Solutions**:
```bash
# Check for type errors
npm run typecheck

# Clear Next.js cache
rm -rf .next
npm run build

# Regenerate Prisma client
npx prisma generate
```

### Performance Issues During Development

**Issue**: Slow response times or memory usage

**Solutions**:
- Enable database query logging: Add `log: ['query']` to Prisma client
- Check bundle sizes: `npm run analyze`
- Monitor memory usage with Node.js inspector
- Use connection pooling (pgbouncer=true)

## Development Best Practices

### Before Every Commit
```bash
# Full verification pipeline
npm run build && npm run test:unit && npm run lint && npm run typecheck
```

### Testing Strategy
- Write unit tests for business logic (currently 662 tests)
- Use E2E tests for critical user flows
- Follow TDD principles for new features
- Maintain 50%+ test coverage

### Security Development
- Never commit secrets (use .env files)
- Test RBAC enforcement locally
- Verify tenant isolation in multi-church scenarios
- Use the seeded test data for different user roles

## IDE Setup (VS Code)

Recommended extensions:
- **TypeScript and JavaScript Language Features** (built-in)
- **Prisma** - Database schema support
- **Tailwind CSS IntelliSense** - CSS utility completion
- **ESLint** - Linting integration
- **Playwright Test for VSCode** - E2E test debugging

## Next Steps

1. **Application Overview**: See [README.md](../README.md) for features and usage
2. **Development Patterns**: Review [CLAUDE.md](../CLAUDE.md) for architecture and patterns
3. **API Documentation**: Check [docs/api.md](./api.md) for server actions and schemas
4. **Testing Guide**: Read [docs/TESTING.md](./TESTING.md) for comprehensive testing strategies
5. **Production Deployment**: See [docs/production-deployment-guide.md](./production-deployment-guide.md) when ready

---

**Development Status**: ✅ Production-ready with 662 passing tests, comprehensive monitoring, and enterprise-grade infrastructure.