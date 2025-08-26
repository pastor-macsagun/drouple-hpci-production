# Development Setup Guide

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (we recommend Neon for serverless)
- Git

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/hpci-chms.git
cd hpci-chms
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
# Test Database (Neon PostgreSQL)
DATABASE_URL="postgresql://test_user:pass@test-db.neon.tech/test_db?sslmode=require&pgbouncer=true"
DATABASE_URL_UNPOOLED="postgresql://test_user:pass@test-db.neon.tech/test_db?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secure-random-string"

# Email (for testing, can use mock values)
EMAIL_SERVER_HOST="smtp.resend.com"
EMAIL_SERVER_PORT="465"
EMAIL_SERVER_USER="resend"
EMAIL_SERVER_PASSWORD="test"
EMAIL_FROM="test@example.com"
RESEND_API_KEY="re_test"
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

Run database migrations:

```bash
npx prisma migrate deploy
```

Seed the database with test data:

```bash
npm run seed
```

## Development Workflow

### Start Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000

### Run Tests

```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# All tests
npm run test:all
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

## Common Issues

### Database Connection Errors

If you see errors like "Can't reach database server":

1. Ensure your database URL is correct
2. Check that your database is running
3. Verify SSL mode settings (Neon requires `sslmode=require`)
4. For Neon, ensure you're using the pooled connection string for DATABASE_URL

### Migration Issues

If migrations fail:

1. Check database permissions
2. Ensure the database exists
3. Try resetting: `npx prisma migrate reset` (warning: this drops all data)

### Test Failures

If tests fail with database errors:

1. Ensure `.env.test` exists with valid test database credentials
2. Run migrations on test database: `NODE_ENV=test npx prisma migrate deploy`
3. Reset test data: `NODE_ENV=test npm run seed`

## Next Steps

See [README.md](../README.md) for application features and usage.